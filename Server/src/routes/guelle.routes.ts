import { Router } from 'express';
import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { generateDeliveryNotePdf } from '../delivery_service';
import {
    HttpError,
    asyncHandler,
    formatDateOnly,
    optionalText,
    parseDateOnly,
    requireId,
    requireNonNegativeNumber,
    requirePositiveNumber,
    requireText,
} from '../lib/validation';

export const guelleRouter = Router();

// =========================================================================
// 1. GUELLE-ABGABEN (Bewegungsdaten)
// =========================================================================

guelleRouter.get('/getGuelleDaten', asyncHandler(async (_req, res) => {
    const abgaben = await prisma.guelleAbgabe.findMany({
        include: {
            kunde: true,
            lieferschein: { select: { nummer: true } },
        },
        // id als zweites Kriterium, damit die Reihenfolge bei mehreren
        // Abgaben am selben Tag stabil bleibt
        orderBy: [{ datum: 'desc' }, { id: 'desc' }],
    });

    res.json(abgaben.map(a => ({
        id: a.id,
        KundenNr: a.kunde.kundenNr,
        Kunde: `${a.kunde.name}, ${a.kunde.vorname}`,
        Menge: a.menge,
        Datum: formatDateOnly(a.datum),
        Bemerkung: a.bemerkung ?? '',
        Abgerechnet: a.abgerechnetAm !== null,
        LieferscheinNr: a.lieferschein?.nummer ?? null,
    })));
}));

guelleRouter.post('/newRecord', asyncHandler(async (req, res) => {
    const kundenNr = requireId(req.body?.KundenNr, 'KundenNr');
    const menge = requirePositiveNumber(req.body?.Menge, 'Menge');
    const datum = parseDateOnly(req.body?.Datum, 'Datum', true);
    const bemerkung = optionalText(req.body?.Bemerkung);

    const kunde = await prisma.guelleKunden.findUnique({ where: { kundenNr } });
    if (!kunde) {
        throw new HttpError(404, `Kunde mit der Kundennummer ${kundenNr} wurde nicht gefunden.`);
    }

    const neueAbgabe = await prisma.guelleAbgabe.create({
        data: { menge, datum, bemerkung, guelleKundeId: kunde.id },
    });

    res.status(201).json({ message: 'Datensatz erfolgreich gespeichert', eintrag: neueAbgabe });
}));

guelleRouter.put('/updateRecord/:id', asyncHandler(async (req, res) => {
    const id = requireId(req.params.id, 'id');
    const menge = requirePositiveNumber(req.body?.Menge, 'Menge');
    const datum = parseDateOnly(req.body?.Datum, 'Datum');
    const bemerkung = optionalText(req.body?.Bemerkung);

    const vorhanden = await prisma.guelleAbgabe.findUnique({
        where: { id },
        include: { lieferschein: { select: { nummer: true } } },
    });
    if (!vorhanden) throw new HttpError(404, 'Abgabe nicht gefunden.');
    if (vorhanden.abgerechnetAm) {
        throw new HttpError(
            409,
            `Diese Abgabe steht bereits auf Lieferschein Nr. ${vorhanden.lieferschein?.nummer} und kann nicht mehr geändert werden.`
        );
    }

    const aktualisiert = await prisma.guelleAbgabe.update({
        where: { id },
        data: { menge, datum, bemerkung },
    });

    res.json({ message: 'Datensatz erfolgreich aktualisiert', eintrag: aktualisiert });
}));

guelleRouter.delete('/deleteRecord/:id', asyncHandler(async (req, res) => {
    const id = requireId(req.params.id, 'id');

    const vorhanden = await prisma.guelleAbgabe.findUnique({
        where: { id },
        include: { lieferschein: { select: { nummer: true } } },
    });
    if (!vorhanden) throw new HttpError(404, 'Abgabe nicht gefunden.');
    if (vorhanden.abgerechnetAm) {
        throw new HttpError(
            409,
            `Diese Abgabe steht bereits auf Lieferschein Nr. ${vorhanden.lieferschein?.nummer} und kann nicht mehr gelöscht werden.`
        );
    }

    await prisma.guelleAbgabe.delete({ where: { id } });
    res.json({ message: 'Datensatz erfolgreich gelöscht' });
}));

// =========================================================================
// 2. KUNDEN-STAMMDATEN (GuelleKunden)
// =========================================================================

/** Einheitliches Mapping DB (camelCase) -> API (PascalCase). */
function kundeNachAussen(k: {
    kundenNr: number; name: string; vorname: string;
    plz: string; wohnort: string; strasse: string; hNr: string;
}) {
    return {
        KundenNr: k.kundenNr,
        Name: k.name,
        Vorname: k.vorname,
        PLZ: k.plz,
        Wohnort: k.wohnort,
        Strasse: k.strasse,
        HNr: k.hNr,
    };
}

/** Liest die Kundenfelder aus dem Request-Body und validiert sie. */
function kundeAusBody(body: any) {
    return {
        name: requireText(body?.Name, 'Name'),
        vorname: requireText(body?.Vorname, 'Vorname'),
        // PLZ bewusst als Text: führende Nullen (z.B. "01067") müssen erhalten bleiben
        plz: requireText(body?.PLZ, 'PLZ'),
        wohnort: requireText(body?.Wohnort, 'Wohnort'),
        strasse: requireText(body?.Strasse ?? body?.['Straße'], 'Strasse'),
        hNr: requireText(body?.HNr, 'HNr'),
    };
}

guelleRouter.get('/getCustomer', asyncHandler(async (_req, res) => {
    const kunden = await prisma.guelleKunden.findMany({
        orderBy: [{ name: 'asc' }, { vorname: 'asc' }],
    });
    res.json(kunden.map(kundeNachAussen));
}));

guelleRouter.post('/newCustomer', asyncHandler(async (req, res) => {
    const kundenNr = requireId(req.body?.KundenNr, 'KundenNr');
    const felder = kundeAusBody(req.body);

    const neuerKunde = await prisma.guelleKunden.create({
        data: { kundenNr, ...felder },
    });

    res.status(201).json({ message: 'Kunde erfolgreich angelegt', eintrag: kundeNachAussen(neuerKunde) });
}));

guelleRouter.put('/updateCustomer/:id', asyncHandler(async (req, res) => {
    const kundenNr = requireId(req.params.id, 'KundenNr');
    const felder = kundeAusBody(req.body);

    const vorhanden = await prisma.guelleKunden.findUnique({ where: { kundenNr } });
    if (!vorhanden) throw new HttpError(404, `Kunde mit der Kundennummer ${kundenNr} wurde nicht gefunden.`);

    const aktualisiert = await prisma.guelleKunden.update({
        where: { kundenNr },
        data: felder,
    });

    res.json({ message: 'Kunde erfolgreich aktualisiert', eintrag: kundeNachAussen(aktualisiert) });
}));

guelleRouter.delete('/deleteCustomer/:id', asyncHandler(async (req, res) => {
    const kundenNr = requireId(req.params.id, 'KundenNr');

    const kunde = await prisma.guelleKunden.findUnique({ where: { kundenNr } });
    if (!kunde) throw new HttpError(404, 'Kunde nicht gefunden.');

    // Reihenfolge zählt: erst die Abgaben (die auf Lieferscheine zeigen),
    // dann die Lieferscheine, zuletzt den Kunden selbst.
    await prisma.$transaction([
        prisma.guelleAbgabe.deleteMany({ where: { guelleKundeId: kunde.id } }),
        prisma.lieferschein.deleteMany({ where: { guelleKundeId: kunde.id } }),
        prisma.guelleKunden.delete({ where: { id: kunde.id } }),
    ]);

    res.json({ message: 'Kunde und alle zugehörigen Daten erfolgreich gelöscht' });
}));

// =========================================================================
// 3. ANALYSEN
// =========================================================================

function analyseNachAussen(a: {
    id: number; stickstoff: number; amoniumstickstoff: number;
    phosphat: number; kalium: number; datum: Date;
}) {
    return {
        id: a.id,
        Stickstoff: a.stickstoff,
        Amoniumstickstoff: a.amoniumstickstoff,
        Phosphat: a.phosphat,
        Kalium: a.kalium,
        Datum: formatDateOnly(a.datum),
    };
}

function analyseAusBody(body: any) {
    return {
        stickstoff: requireNonNegativeNumber(body?.Stickstoff, 'Stickstoff'),
        amoniumstickstoff: requireNonNegativeNumber(body?.Amoniumstickstoff, 'Amoniumstickstoff'),
        phosphat: requireNonNegativeNumber(body?.Phosphat, 'Phosphat'),
        kalium: requireNonNegativeNumber(body?.Kalium, 'Kalium'),
        datum: parseDateOnly(body?.Datum, 'Datum', true),
    };
}

guelleRouter.get('/getAnalysis', asyncHandler(async (_req, res) => {
    const analysen = await prisma.analyse.findMany({
        orderBy: [{ datum: 'desc' }, { id: 'desc' }],
    });
    res.json(analysen.map(analyseNachAussen));
}));

guelleRouter.post('/newAnalysis', asyncHandler(async (req, res) => {
    const neueAnalyse = await prisma.analyse.create({ data: analyseAusBody(req.body) });
    res.status(201).json({ message: 'Analyse erfolgreich gespeichert', eintrag: analyseNachAussen(neueAnalyse) });
}));

guelleRouter.put('/updateAnalysis/:id', asyncHandler(async (req, res) => {
    const id = requireId(req.params.id, 'id');
    const daten = analyseAusBody(req.body);

    const vorhanden = await prisma.analyse.findUnique({ where: { id } });
    if (!vorhanden) throw new HttpError(404, 'Analyse nicht gefunden.');

    const aktualisiert = await prisma.analyse.update({ where: { id }, data: daten });
    res.json({ message: 'Analyse erfolgreich aktualisiert', eintrag: analyseNachAussen(aktualisiert) });
}));

guelleRouter.delete('/deleteAnalysis/:id', asyncHandler(async (req, res) => {
    const id = requireId(req.params.id, 'id');

    const vorhanden = await prisma.analyse.findUnique({
        where: { id },
        include: { lieferscheine: { select: { lieferscheinId: true } } },
    });
    if (!vorhanden) throw new HttpError(404, 'Analyse nicht gefunden.');
    if (vorhanden.lieferscheine.length > 0) {
        throw new HttpError(
            409,
            `Diese Analyse ist auf ${vorhanden.lieferscheine.length} Lieferschein(en) abgedruckt und kann nicht gelöscht werden.`
        );
    }

    await prisma.analyse.delete({ where: { id } });
    res.json({ message: 'Analyse erfolgreich gelöscht' });
}));

// =========================================================================
// 4. LIEFERSCHEIN (PDF)
// =========================================================================

/** Formuliert den gewählten Zeitraum für Fehlermeldungen. */
function beschreibeZeitraum(von: Date | null, bis: Date | null): string {
    const deutsch = (d: Date) => formatDateOnly(d).split('-').reverse().join('.');
    if (von && bis) return `zwischen dem ${deutsch(von)} und dem ${deutsch(bis)}`;
    if (von) return `ab dem ${deutsch(von)}`;
    if (bis) return `bis zum ${deutsch(bis)}`;
    return 'derzeit';
}

guelleRouter.post('/newDelivery', asyncHandler(async (req, res) => {
    const kundenNr = requireId(req.body?.KundenNr, 'KundenNr');

    // Analysen sind optional. Wird nichts übergeben, nimmt der Lieferschein
    // die aktuellste Analyse.
    const rohAnalysen = req.body?.Analysen;
    if (rohAnalysen !== undefined && !Array.isArray(rohAnalysen)) {
        throw new HttpError(400, '"Analysen" muss eine Liste von IDs sein.');
    }
    const analysenIds: number[] = Array.isArray(rohAnalysen)
        ? [...new Set(rohAnalysen.map((wert: unknown) => requireId(wert, 'Analyse-ID')))]
        : [];

    // Zeitraum ist optional. Ohne Angabe kommen wie bisher alle offenen
    // Abgaben des Kunden auf den Schein.
    const von = req.body?.Von ? parseDateOnly(req.body.Von, 'Von') : null;
    const bis = req.body?.Bis ? parseDateOnly(req.body.Bis, 'Bis') : null;
    if (von && bis && von > bis) {
        throw new HttpError(400, '"Von" darf nicht nach "Bis" liegen.');
    }

    const kunde = await prisma.guelleKunden.findUnique({ where: { kundenNr } });
    if (!kunde) throw new HttpError(404, 'Kunde nicht gefunden.');

    // Nur was noch nicht abgerechnet ist, kommt auf den Schein.
    const offeneAbgaben = await prisma.guelleAbgabe.findMany({
        where: {
            guelleKundeId: kunde.id,
            abgerechnetAm: null,
            ...(von || bis
                ? { datum: { ...(von && { gte: von }), ...(bis && { lte: bis }) } }
                : {}),
        },
        orderBy: [{ datum: 'asc' }, { id: 'asc' }],
    });
    if (offeneAbgaben.length === 0) {
        // Der Zeitraum muss in der Meldung stehen, sonst ist unklar, warum
        // nichts gefunden wurde.
        const zeitraum = beschreibeZeitraum(von, bis);
        throw new HttpError(
            400,
            `Für diesen Kunden gibt es ${zeitraum} keine offenen Abgaben.`
        );
    }

    let analysen;
    if (analysenIds.length > 0) {
        analysen = await prisma.analyse.findMany({
            where: { id: { in: analysenIds } },
            orderBy: [{ datum: 'desc' }, { id: 'desc' }],
        });
        if (analysen.length !== analysenIds.length) {
            const gefunden = new Set(analysen.map(a => a.id));
            const fehlend = analysenIds.filter(id => !gefunden.has(id));
            throw new HttpError(404, `Analyse(n) nicht gefunden: ${fehlend.join(', ')}`);
        }
    } else {
        const neueste = await prisma.analyse.findFirst({ orderBy: [{ datum: 'desc' }, { id: 'desc' }] });
        analysen = neueste ? [neueste] : [];
    }

    // Lieferschein anlegen und die Abgaben als abgerechnet markieren.
    // Beides in einer Transaktion, damit keine Abgabe ohne Schein markiert wird.
    const abgabeIds = offeneAbgaben.map(a => a.id);
    const lieferschein = await prisma.$transaction(async (tx) => {
        const letzter = await tx.lieferschein.findFirst({
            orderBy: { nummer: 'desc' },
            select: { nummer: true },
        });
        const naechsteNummer = (letzter?.nummer ?? 0) + 1;

        const erstellt = await tx.lieferschein.create({
            data: {
                nummer: naechsteNummer,
                guelleKundeId: kunde.id,
                analysen: { create: analysen.map(a => ({ analyseId: a.id })) },
            },
        });

        await tx.guelleAbgabe.updateMany({
            where: { id: { in: abgabeIds } },
            data: { abgerechnetAm: new Date(), lieferscheinId: erstellt.id },
        });

        return erstellt;
    });

    // PDF erst nach der Transaktion erzeugen - Puppeteer braucht mehrere
    // Sekunden und darf keine Datenbank-Transaktion offen halten.
    let pdfBuffer: Buffer;
    try {
        pdfBuffer = await generateDeliveryNotePdf({
            lieferscheinNummer: lieferschein.nummer,
            customerName: `${kunde.vorname} ${kunde.name}`,
            customerAddress: `${kunde.strasse} ${kunde.hNr}, ${kunde.plz} ${kunde.wohnort}`,
            items: offeneAbgaben.map(a => ({
                menge: a.menge,
                datum: formatDateOnly(a.datum).split('-').reverse().join('.'),
            })),
            analysis: analysen.map(a => ({
                datum: formatDateOnly(a.datum).split('-').reverse().join('.'),
                gesamtStickstoff: a.stickstoff,
                amoniumStickstoff: a.amoniumstickstoff,
                phosphat: a.phosphat,
                kalium: a.kalium,
            })),
        });
    } catch (fehler) {
        // PDF fehlgeschlagen: Abrechnung zurücknehmen, sonst wären die Abgaben
        // als abgerechnet markiert, ohne dass je ein Schein existiert hat.
        await prisma.$transaction([
            prisma.guelleAbgabe.updateMany({
                where: { id: { in: abgabeIds } },
                data: { abgerechnetAm: null, lieferscheinId: null },
            }),
            prisma.lieferschein.delete({ where: { id: lieferschein.id } }),
        ]);
        throw fehler;
    }

    const dateiname = `Lieferschein_${lieferschein.nummer}_${kunde.name.replace(/[^\w-]/g, '_')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${dateiname}"`);
    // Ohne diesen Header kommt der Dateiname im Browser nicht an (CORS/Fetch)
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    res.send(pdfBuffer);
}));

// =========================================================================
// 5. FREISCHALTEN (Abrechnung zurücknehmen)
// =========================================================================
//
// Ein Lieferschein ist ein gedrucktes Dokument. Wird eine Position
// nachträglich freigegeben, stimmt das Papier nicht mehr mit den Daten
// überein. Der Schein selbst wird deshalb nie gelöscht - er bleibt mit seiner
// Nummer bestehen und wird als storniert markiert, sobald er keine Positionen
// mehr hat. So bleibt die Nummernfolge lückenlos nachvollziehbar.

/** Markiert einen Lieferschein als storniert, wenn er keine Positionen mehr hat. */
async function stornoPruefen(tx: Prisma.TransactionClient, lieferscheinId: number) {
    const verbleibend = await tx.guelleAbgabe.count({ where: { lieferscheinId } });
    if (verbleibend === 0) {
        await tx.lieferschein.update({
            where: { id: lieferscheinId },
            data: { storniertAm: new Date() },
        });
        return true;
    }
    return false;
}

/** Einzelne Abgabe wieder freigeben. */
guelleRouter.put('/reopenRecord/:id', asyncHandler(async (req, res) => {
    const id = requireId(req.params.id, 'id');

    const abgabe = await prisma.guelleAbgabe.findUnique({
        where: { id },
        include: { lieferschein: { select: { id: true, nummer: true } } },
    });
    if (!abgabe) throw new HttpError(404, 'Abgabe nicht gefunden.');
    if (!abgabe.abgerechnetAm) {
        throw new HttpError(400, 'Diese Abgabe ist nicht abgerechnet und daher bereits offen.');
    }

    const lieferscheinId = abgabe.lieferscheinId;
    const nummer = abgabe.lieferschein?.nummer;

    const storniert = await prisma.$transaction(async (tx) => {
        await tx.guelleAbgabe.update({
            where: { id },
            data: { abgerechnetAm: null, lieferscheinId: null },
        });
        return lieferscheinId ? stornoPruefen(tx, lieferscheinId) : false;
    });

    res.json({
        message: storniert
            ? `Abgabe freigeschaltet. Lieferschein Nr. ${nummer} hat dadurch keine Positionen mehr und wurde als storniert markiert.`
            : `Abgabe freigeschaltet. Sie stand auf Lieferschein Nr. ${nummer}.`,
        freigegeben: 1,
        lieferscheinNr: nummer ?? null,
        lieferscheinStorniert: storniert,
    });
}));

/** Alle Positionen eines Lieferscheins wieder freigeben. */
guelleRouter.put('/reopenDelivery/:nummer', asyncHandler(async (req, res) => {
    // Bewusst die Lieferschein-Nummer, nicht die interne ID: Die Nummer steht
    // auf dem Papier und ist das, was die Oberfläche kennt.
    const nummer = requireId(req.params.nummer, 'nummer');

    const lieferschein = await prisma.lieferschein.findUnique({
        where: { nummer },
        include: { _count: { select: { positionen: true } } },
    });
    if (!lieferschein) throw new HttpError(404, `Lieferschein Nr. ${nummer} nicht gefunden.`);
    if (lieferschein._count.positionen === 0) {
        throw new HttpError(400, `Lieferschein Nr. ${nummer} hat keine Positionen mehr.`);
    }

    const anzahl = await prisma.$transaction(async (tx) => {
        const { count } = await tx.guelleAbgabe.updateMany({
            where: { lieferscheinId: lieferschein.id },
            data: { abgerechnetAm: null, lieferscheinId: null },
        });
        await tx.lieferschein.update({
            where: { id: lieferschein.id },
            data: { storniertAm: new Date() },
        });
        return count;
    });

    res.json({
        message: `Lieferschein Nr. ${nummer} zurückgenommen, ${anzahl} Abgabe(n) wieder offen.`,
        freigegeben: anzahl,
        lieferscheinNr: nummer,
        lieferscheinStorniert: true,
    });
}));
