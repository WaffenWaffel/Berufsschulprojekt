import type { NextFunction, Request, Response } from 'express';
import { prisma } from './prisma';
import { HttpError } from './validation';
import { sitzungPruefen, type AngemeldeterBenutzer } from './sitzung';

/**
 * Betriebskontext (Mandant) und Anmeldung.
 *
 * Alle fachlichen Daten hängen an genau einem Betrieb. Jede Abfrage in den
 * Routen filtert nach req.betriebId - woher dieser Wert kommt, entscheidet
 * sich hier an einer einzigen Stelle.
 */

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        interface Request {
            betriebId: number;
            benutzer?: AngemeldeterBenutzer;
        }
    }
}

/**
 * Setzt Benutzer und Betrieb aus der Sitzung. Läuft vor allen Routen und
 * weist noch niemanden ab - das übernimmt anmeldungErforderlich, damit die
 * Anmelderoute selbst offen bleibt.
 */
export async function betriebKontext(req: Request, _res: Response, next: NextFunction) {
    try {
        const benutzer = await sitzungPruefen(req);
        if (benutzer) {
            req.benutzer = benutzer;
            req.betriebId = benutzer.betriebId;
        }
        next();
    } catch (fehler) {
        next(fehler);
    }
}

/** Schützt alle Routen, die einen angemeldeten Benutzer voraussetzen. */
export function anmeldungErforderlich(req: Request, _res: Response, next: NextFunction) {
    if (!req.benutzer) {
        return next(new HttpError(401, 'Nicht angemeldet.'));
    }
    next();
}

/** Schützt Routen, die nur der Inhaber ausführen darf. */
export function nurInhaber(req: Request, _res: Response, next: NextFunction) {
    if (!req.benutzer) return next(new HttpError(401, 'Nicht angemeldet.'));
    if (req.benutzer.rolle !== 'INHABER') {
        return next(new HttpError(403, 'Dafür fehlt dir die Berechtigung. Bitte den Betriebsinhaber fragen.'));
    }
    next();
}

/**
 * Lädt den Betrieb der aktuellen Anfrage. Wird für die Absenderdaten auf
 * Lieferschein und Excel-Export gebraucht.
 */
export async function betriebLaden(betriebId: number) {
    const betrieb = await prisma.betrieb.findUnique({ where: { id: betriebId } });
    if (!betrieb) {
        throw new HttpError(500, `Der Betrieb (ID ${betriebId}) existiert nicht.`);
    }
    return betrieb;
}

/** Hinweis beim Start, falls noch niemand angelegt wurde. */
export async function startpruefung(): Promise<void> {
    const [betriebe, benutzer] = await Promise.all([
        prisma.betrieb.count(),
        prisma.benutzer.count(),
    ]);

    if (betriebe === 0) {
        console.warn(
            '\n⚠  Es ist noch kein Betrieb angelegt. Niemand kann sich anmelden.\n' +
            '   Anlegen mit: npm run betrieb:neu -- "Name" "Straße" "PLZ" "Ort"\n'
        );
        return;
    }
    if (benutzer === 0) {
        console.warn(
            '\n⚠  Es ist noch kein Benutzer angelegt. Niemand kann sich anmelden.\n' +
            '   Anlegen mit: npm run benutzer:neu -- <BetriebId> "E-Mail" "Name" INHABER\n'
        );
        return;
    }

    console.log(`🔐 ${benutzer} Benutzer in ${betriebe} Betrieb(en) — Anmeldung aktiv.`);
}
