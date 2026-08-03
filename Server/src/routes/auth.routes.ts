import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { HttpError, asyncHandler, requireText } from '../lib/validation';
import { blindPruefen, passwortHashen, passwortPruefen, passwortRegelnPruefen } from '../lib/passwort';
import { sitzungAnlegen, sitzungBeenden } from '../lib/sitzung';

export const authRouter = Router();

/**
 * Bremse gegen Durchprobieren.
 *
 * Bewusst im Arbeitsspeicher: Bei einem Neustart ist die Sperre weg, das ist
 * für einen Betrieb mit wenigen Konten vertretbar und erspart eine Tabelle.
 * Gezählt wird je E-Mail, nicht je IP - sonst sperrt ein Hof sich selbst aus,
 * wenn alle über denselben Anschluss arbeiten.
 */
const MAX_VERSUCHE = 5;
const SPERRE_MINUTEN = 15;
const versuche = new Map<string, { anzahl: number; bis: number }>();

function gesperrtBis(schluessel: string): number | null {
    const eintrag = versuche.get(schluessel);
    if (!eintrag) return null;

    // bis === 0 heißt: es läuft nur der Zähler, es gibt noch keine Sperre.
    // Der Eintrag darf hier nicht entfernt werden, sonst beginnt die Zählung
    // bei jedem Versuch von vorn und die Bremse greift nie.
    if (eintrag.bis === 0) return null;

    if (eintrag.bis > Date.now()) return eintrag.bis;

    // Sperre ist abgelaufen - Zähler zurücksetzen
    versuche.delete(schluessel);
    return null;
}

function fehlversuchZaehlen(schluessel: string): void {
    const eintrag = versuche.get(schluessel) ?? { anzahl: 0, bis: 0 };
    eintrag.anzahl += 1;
    if (eintrag.anzahl >= MAX_VERSUCHE) {
        eintrag.bis = Date.now() + SPERRE_MINUTEN * 60 * 1000;
        eintrag.anzahl = 0;
    }
    versuche.set(schluessel, eintrag);
}

function versucheZuruecksetzen(schluessel: string): void {
    versuche.delete(schluessel);
}

/** Anmelden. */
authRouter.post('/anmelden', asyncHandler(async (req, res) => {
    const email = requireText(req.body?.Email, 'Email').toLowerCase();
    const passwort = requireText(req.body?.Passwort, 'Passwort');

    const sperre = gesperrtBis(email);
    if (sperre) {
        const minuten = Math.ceil((sperre - Date.now()) / 60000);
        throw new HttpError(
            429,
            `Zu viele Fehlversuche. Bitte in ${minuten} Minute(n) erneut versuchen.`
        );
    }

    const benutzer = await prisma.benutzer.findFirst({
        where: { email, aktiv: true },
        include: { betrieb: { select: { id: true, name: true } } },
    });

    // Immer dieselbe Meldung, egal ob E-Mail unbekannt oder Passwort falsch.
    // Sonst ließe sich herausfinden, welche Adressen im System existieren.
    const abweisen = () => {
        fehlversuchZaehlen(email);
        throw new HttpError(401, 'E-Mail oder Passwort ist falsch.');
    };

    if (!benutzer) {
        // Trotzdem rechnen, damit die Antwortzeit nichts verrät
        await blindPruefen(passwort);
        return abweisen();
    }

    if (!(await passwortPruefen(passwort, benutzer.passwortHash))) {
        return abweisen();
    }

    versucheZuruecksetzen(email);

    await prisma.benutzer.update({
        where: { id: benutzer.id },
        data: { letzterLogin: new Date() },
    });

    await sitzungAnlegen(res, benutzer.id);

    res.json({
        Name: benutzer.name,
        Email: benutzer.email,
        Rolle: benutzer.rolle,
        PasswortWechseln: benutzer.passwortWechseln,
        Betrieb: { id: benutzer.betrieb.id, Name: benutzer.betrieb.name },
    });
}));

/** Abmelden. Wirkt sofort, weil die Sitzung serverseitig gelöscht wird. */
authRouter.post('/abmelden', asyncHandler(async (req, res) => {
    await sitzungBeenden(req, res);
    res.json({ message: 'Abgemeldet.' });
}));

/**
 * Wer bin ich? Das Frontend fragt das beim Start, um zu entscheiden, ob die
 * Anmeldeseite oder die Anwendung angezeigt wird.
 */
authRouter.get('/ich', asyncHandler(async (req, res) => {
    if (!req.benutzer) throw new HttpError(401, 'Nicht angemeldet.');

    const betrieb = await prisma.betrieb.findUnique({
        where: { id: req.benutzer.betriebId },
        select: { id: true, name: true },
    });

    res.json({
        Name: req.benutzer.name,
        Email: req.benutzer.email,
        Rolle: req.benutzer.rolle,
        PasswortWechseln: req.benutzer.passwortWechseln,
        Betrieb: betrieb ? { id: betrieb.id, Name: betrieb.name } : null,
    });
}));

/** Eigenes Passwort ändern. */
authRouter.post('/passwortAendern', asyncHandler(async (req, res) => {
    if (!req.benutzer) throw new HttpError(401, 'Nicht angemeldet.');

    const alt = requireText(req.body?.Alt, 'Alt');
    const neu = requireText(req.body?.Neu, 'Neu');

    const regelFehler = passwortRegelnPruefen(neu);
    if (regelFehler) throw new HttpError(400, regelFehler);

    const benutzer = await prisma.benutzer.findUnique({ where: { id: req.benutzer.id } });
    if (!benutzer) throw new HttpError(401, 'Nicht angemeldet.');

    if (!(await passwortPruefen(alt, benutzer.passwortHash))) {
        throw new HttpError(400, 'Das bisherige Passwort ist falsch.');
    }

    await prisma.benutzer.update({
        where: { id: benutzer.id },
        data: { passwortHash: await passwortHashen(neu), passwortWechseln: false },
    });

    // Andere Sitzungen dieses Benutzers beenden - falls jemand mitgelesen hat,
    // ist er nach der Passwortänderung draußen.
    const cookieWert = req.headers.cookie ?? '';
    const aktuelleId = /sitzung=([^.;]+)/.exec(cookieWert)?.[1];
    await prisma.sitzung.deleteMany({
        where: { benutzerId: benutzer.id, ...(aktuelleId ? { id: { not: aktuelleId } } : {}) },
    });

    res.json({ message: 'Passwort geändert.' });
}));
