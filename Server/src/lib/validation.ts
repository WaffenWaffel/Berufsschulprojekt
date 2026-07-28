import type { NextFunction, Request, Response } from 'express';

/**
 * Fehler mit HTTP-Statuscode. Wird von den Validierungs-Helfern geworfen und
 * vom zentralen Error-Handler in eine saubere JSON-Antwort übersetzt.
 */
export class HttpError extends Error {
    constructor(public status: number, message: string) {
        super(message);
    }
}

/** Pflichtfeld: nicht leerer Text. */
export function requireText(value: unknown, feld: string): string {
    if (typeof value !== 'string' || value.trim() === '') {
        throw new HttpError(400, `Das Feld "${feld}" darf nicht leer sein.`);
    }
    return value.trim();
}

/** Pflichtfeld: Zahl größer als 0 (z.B. Mengen). */
export function requirePositiveNumber(value: unknown, feld: string): number {
    const zahl = Number(value);
    if (!Number.isFinite(zahl) || zahl <= 0) {
        throw new HttpError(400, `Das Feld "${feld}" muss eine Zahl größer als 0 sein.`);
    }
    return zahl;
}

/** Pflichtfeld: Zahl ab 0 (z.B. Analysewerte, die auch 0 sein dürfen). */
export function requireNonNegativeNumber(value: unknown, feld: string): number {
    const zahl = Number(value);
    if (!Number.isFinite(zahl) || zahl < 0) {
        throw new HttpError(400, `Das Feld "${feld}" muss eine Zahl ab 0 sein.`);
    }
    return zahl;
}

/** Pflichtfeld: ganze Zahl größer als 0 (z.B. Kundennummer, IDs aus der URL). */
export function requireId(value: unknown, feld: string): number {
    const zahl = Number(value);
    if (!Number.isInteger(zahl) || zahl <= 0) {
        throw new HttpError(400, `"${feld}" muss eine ganze Zahl größer als 0 sein.`);
    }
    return zahl;
}

/**
 * Datum im Format YYYY-MM-DD.
 *
 * Bewusst auf UTC-Mitternacht festgenagelt: Die Spalten sind in der Datenbank
 * als DATE angelegt (reines Kalenderdatum). Ohne das "Z" würde Node den String
 * je nach Zeitzone des Servers interpretieren und der 01.03. könnte als 28.02.
 * in der Datenbank landen.
 */
export function parseDateOnly(value: unknown, feld: string, fallbackHeute = false): Date {
    if (value === undefined || value === null || value === '') {
        if (fallbackHeute) return parseDateOnly(new Date().toISOString().slice(0, 10), feld);
        throw new HttpError(400, `Das Feld "${feld}" darf nicht leer sein.`);
    }
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new HttpError(400, `"${feld}" muss ein Datum im Format JJJJ-MM-TT sein.`);
    }
    const datum = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(datum.getTime())) {
        throw new HttpError(400, `"${value}" ist kein gültiges Datum.`);
    }
    return datum;
}

/** Gegenstück zu parseDateOnly: DATE-Spalte als YYYY-MM-DD ausgeben. */
export function formatDateOnly(datum: Date): string {
    return datum.toISOString().slice(0, 10);
}

/** Optionale Notiz: leerer Text wird zu null. */
export function optionalText(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const text = value.trim();
    return text === '' ? null : text;
}

/**
 * Nimmt async-Handlern das try/catch ab: Ein abgelehntes Promise landet
 * automatisch beim Error-Handler.
 */
export function asyncHandler(
    handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
    return (req: Request, res: Response, next: NextFunction) => {
        handler(req, res, next).catch(next);
    };
}

/**
 * Zentraler Error-Handler. Übersetzt HttpError und die relevanten
 * Prisma-Fehlercodes in passende Statuscodes statt pauschal 500 zu senden.
 */
export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
    if (err instanceof HttpError) {
        return res.status(err.status).json({ error: err.message });
    }

    // P2002 = Unique-Constraint verletzt, P2025 = Datensatz nicht gefunden
    if (err?.code === 'P2002') {
        const feld = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : 'Wert';
        return res.status(409).json({ error: `Dieser ${feld} existiert bereits.` });
    }
    if (err?.code === 'P2025') {
        return res.status(404).json({ error: 'Datensatz nicht gefunden.' });
    }

    console.error('Unerwarteter Serverfehler:', err);
    return res.status(500).json({ error: 'Interner Serverfehler.' });
}
