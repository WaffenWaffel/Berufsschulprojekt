import { createHash, randomBytes } from 'crypto';
import type { Request, Response } from 'express';
import { prisma } from './prisma';

/**
 * Serverseitige Sitzungen.
 *
 * Der Browser bekommt nur "<id>.<geheimnis>" in einem httpOnly-Cookie.
 * Gespeichert wird ausschließlich der Hash des Geheimnisses - wer die
 * Datenbank liest, etwa über ein Backup, kann damit keine Sitzung übernehmen.
 *
 * Gegenüber einem JWT hat das den Vorteil, dass Abmelden sofort wirkt: Die
 * Sitzung wird gelöscht und ist damit ungültig, statt bis zum Ablauf weiter
 * akzeptiert zu werden.
 */

export const COOKIE_NAME = 'sitzung';
const LAUFZEIT_STUNDEN = 12;

function hashen(geheimnis: string): string {
    return createHash('sha256').update(geheimnis).digest('hex');
}

/** Liest ein Cookie aus dem Anfrage-Header. Erspart die Abhängigkeit cookie-parser. */
export function cookieLesen(req: Request, name: string): string | null {
    const kopf = req.headers.cookie;
    if (!kopf) return null;
    for (const teil of kopf.split(';')) {
        const index = teil.indexOf('=');
        if (index === -1) continue;
        if (teil.slice(0, index).trim() === name) {
            return decodeURIComponent(teil.slice(index + 1).trim());
        }
    }
    return null;
}

function cookieOptionen() {
    return {
        httpOnly: true,                                  // für JavaScript unsichtbar
        secure: process.env.NODE_ENV === 'production',   // nur über HTTPS
        sameSite: 'lax' as const,                        // schützt gegen fremde Seiten
        path: '/',
        maxAge: LAUFZEIT_STUNDEN * 60 * 60 * 1000,
    };
}

/** Legt eine Sitzung an und setzt das Cookie. */
export async function sitzungAnlegen(res: Response, benutzerId: number): Promise<void> {
    const id = randomBytes(16).toString('hex');
    const geheimnis = randomBytes(32).toString('hex');

    await prisma.sitzung.create({
        data: {
            id,
            tokenHash: hashen(geheimnis),
            benutzerId,
            laeuftAb: new Date(Date.now() + LAUFZEIT_STUNDEN * 60 * 60 * 1000),
        },
    });

    res.cookie(COOKIE_NAME, `${id}.${geheimnis}`, cookieOptionen());
}

export interface AngemeldeterBenutzer {
    id: number;
    name: string;
    email: string;
    rolle: 'INHABER' | 'MITARBEITER';
    betriebId: number;
    passwortWechseln: boolean;
}

/**
 * Prüft das Cookie und liefert den angemeldeten Benutzer, sonst null.
 * Abgelaufene Sitzungen werden dabei gleich entfernt.
 */
export async function sitzungPruefen(req: Request): Promise<AngemeldeterBenutzer | null> {
    const wert = cookieLesen(req, COOKIE_NAME);
    if (!wert) return null;

    const [id, geheimnis] = wert.split('.');
    if (!id || !geheimnis) return null;

    const sitzung = await prisma.sitzung.findUnique({
        where: { id },
        include: { benutzer: true },
    });
    if (!sitzung) return null;

    if (sitzung.tokenHash !== hashen(geheimnis)) return null;

    if (sitzung.laeuftAb < new Date()) {
        await prisma.sitzung.delete({ where: { id } }).catch(() => undefined);
        return null;
    }

    // Gesperrte Konten fliegen sofort raus, auch mit gültiger Sitzung
    if (!sitzung.benutzer.aktiv) return null;

    // Zeitstempel nur gelegentlich schreiben, sonst ein Schreibvorgang je Anfrage
    const alter = Date.now() - sitzung.letzterZugriff.getTime();
    if (alter > 5 * 60 * 1000) {
        await prisma.sitzung
            .update({ where: { id }, data: { letzterZugriff: new Date() } })
            .catch(() => undefined);
    }

    return {
        id: sitzung.benutzer.id,
        name: sitzung.benutzer.name,
        email: sitzung.benutzer.email,
        rolle: sitzung.benutzer.rolle,
        betriebId: sitzung.benutzer.betriebId,
        passwortWechseln: sitzung.benutzer.passwortWechseln,
    };
}

/** Beendet die Sitzung des Aufrufers. */
export async function sitzungBeenden(req: Request, res: Response): Promise<void> {
    const wert = cookieLesen(req, COOKIE_NAME);
    const id = wert?.split('.')[0];
    if (id) {
        await prisma.sitzung.delete({ where: { id } }).catch(() => undefined);
    }
    res.clearCookie(COOKIE_NAME, { ...cookieOptionen(), maxAge: undefined });
}

/** Entfernt abgelaufene Sitzungen. Wird beim Start aufgerufen. */
export async function abgelaufeneAufraeumen(): Promise<number> {
    const { count } = await prisma.sitzung.deleteMany({
        where: { laeuftAb: { lt: new Date() } },
    });
    return count;
}
