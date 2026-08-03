import type { NextFunction, Request, Response } from 'express';
import { prisma } from './prisma';
import { HttpError } from './validation';

/**
 * Betriebskontext (Mandant).
 *
 * Alle fachlichen Daten hängen an genau einem Betrieb. Jede Abfrage muss
 * danach filtern, sonst sieht ein Betrieb die Daten des anderen.
 *
 * Solange es keine Anmeldung gibt, kommt der aktive Betrieb aus der
 * Umgebungsvariable BETRIEB_ID. Sobald die Anmeldung steht, liefert dieselbe
 * Middleware den Wert aus der Sitzung - die Aufrufstellen in den Routen
 * ändern sich dann nicht mehr.
 */

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        interface Request {
            betriebId: number;
        }
    }
}

const AUS_UMGEBUNG = Number(process.env.BETRIEB_ID) || 1;

/** Hängt den aktiven Betrieb an jede Anfrage. */
export function betriebKontext(req: Request, _res: Response, next: NextFunction) {
    req.betriebId = AUS_UMGEBUNG;
    next();
}

/**
 * Prüft beim Start, ob der eingestellte Betrieb existiert, und weist darauf
 * hin, dass die Zuordnung vorläufig ist. Ohne diesen Hinweis wäre nur schwer
 * zu erkennen, warum die Anwendung keine Daten anzeigt.
 */
export async function betriebPruefen(): Promise<void> {
    const betrieb = await prisma.betrieb.findUnique({ where: { id: AUS_UMGEBUNG } });

    if (!betrieb) {
        const vorhandene = await prisma.betrieb.findMany({
            select: { id: true, name: true },
            orderBy: { id: 'asc' },
        });
        console.warn(
            `\n⚠  Betrieb mit der ID ${AUS_UMGEBUNG} existiert nicht. Die Anwendung zeigt keine Daten an.\n` +
            (vorhandene.length
                ? `   Vorhanden: ${vorhandene.map(b => `${b.id} = ${b.name}`).join(', ')}\n` +
                  `   Passenden Wert als BETRIEB_ID in Server/.env eintragen.\n`
                : `   Es ist noch kein Betrieb angelegt. Anlegen mit: npm run betrieb:neu\n`)
        );
        return;
    }

    console.log(
        `🏢 Aktiver Betrieb: ${betrieb.name} (ID ${betrieb.id}) ` +
        `— vorläufig über BETRIEB_ID, bis die Anmeldung eingebaut ist.`
    );
}

/**
 * Lädt den Betrieb der aktuellen Anfrage. Wird für die Absenderdaten auf
 * Lieferschein und Excel-Export gebraucht.
 */
export async function betriebLaden(betriebId: number) {
    const betrieb = await prisma.betrieb.findUnique({ where: { id: betriebId } });
    if (!betrieb) {
        throw new HttpError(
            500,
            `Der eingestellte Betrieb (ID ${betriebId}) existiert nicht. Bitte BETRIEB_ID prüfen.`
        );
    }
    return betrieb;
}
