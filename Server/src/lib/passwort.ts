import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from 'crypto';

/**
 * scrypt als Promise. Bewusst von Hand statt über promisify: Die Variante mit
 * Optionen ist eine eigene Überladung, die promisify nicht trifft.
 */
function scryptAsync(
    passwort: string,
    salt: Buffer,
    keylen: number,
    optionen: ScryptOptions
): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        scrypt(passwort, salt, keylen, optionen, (fehler, ergebnis) => {
            if (fehler) reject(fehler);
            else resolve(ergebnis);
        });
    });
}

/**
 * Passwort-Hashing mit scrypt aus der Node-Standardbibliothek.
 *
 * Bewusst ohne zusätzliche Abhängigkeit: argon2 und bcrypt müssen beim
 * Installieren nativ übersetzt werden, was auf einem kleinen Server gern
 * fehlschlägt. scrypt ist ebenfalls speicherhart, in Node eingebaut und für
 * diesen Einsatzzweck ausreichend.
 *
 * Gespeichert wird ein selbstbeschreibendes Format, damit sich die Parameter
 * später erhöhen lassen, ohne bestehende Hashes ungültig zu machen:
 *
 *   scrypt$N$r$p$salt$hash        (salt und hash base64)
 */

// 2^16 Runden brauchen rund 67 MB Arbeitsspeicher je Anmeldung.
const N = 65536;
const R = 8;
const P = 1;
const KEYLEN = 64;
const MAXMEM = 160 * 1024 * 1024;

async function ableiten(passwort: string, salt: Buffer, n: number, r: number, p: number): Promise<Buffer> {
    return await scryptAsync(passwort.normalize('NFKC'), salt, KEYLEN, {
        N: n, r, p, maxmem: MAXMEM,
    });
}

/** Erzeugt den zu speichernden Hash-String. */
export async function passwortHashen(passwort: string): Promise<string> {
    const salt = randomBytes(16);
    const hash = await ableiten(passwort, salt, N, R, P);
    return `scrypt$${N}$${R}$${P}$${salt.toString('base64')}$${hash.toString('base64')}`;
}

/**
 * Prüft ein Passwort gegen einen gespeicherten Hash.
 * Der Vergleich läuft zeitkonstant, damit die Antwortzeit nichts verrät.
 */
export async function passwortPruefen(passwort: string, gespeichert: string): Promise<boolean> {
    try {
        const [verfahren, n, r, p, saltB64, hashB64] = gespeichert.split('$');
        if (verfahren !== 'scrypt') return false;

        const salt = Buffer.from(saltB64, 'base64');
        const erwartet = Buffer.from(hashB64, 'base64');
        const berechnet = await ableiten(passwort, salt, Number(n), Number(r), Number(p));

        if (berechnet.length !== erwartet.length) return false;
        return timingSafeEqual(berechnet, erwartet);
    } catch {
        // Beschädigter oder unbekannter Hash gilt als nicht passend
        return false;
    }
}

/**
 * Wird bei unbekannter E-Mail durchlaufen, damit eine fehlgeschlagene
 * Anmeldung immer gleich lange dauert. Ohne das verrät die Antwortzeit,
 * ob es das Konto überhaupt gibt.
 */
const BLIND_HASH = `scrypt$${N}$${R}$${P}$${randomBytes(16).toString('base64')}$${randomBytes(KEYLEN).toString('base64')}`;

export async function blindPruefen(passwort: string): Promise<void> {
    await passwortPruefen(passwort, BLIND_HASH);
}

/** Mindestanforderung an ein neues Passwort. */
export function passwortRegelnPruefen(passwort: string): string | null {
    if (typeof passwort !== 'string' || passwort.length < 12) {
        return 'Das Passwort muss mindestens 12 Zeichen lang sein.';
    }
    if (passwort.length > 200) {
        return 'Das Passwort darf höchstens 200 Zeichen lang sein.';
    }
    return null;
}
