import express, { Request, Response } from 'express';
import 'dotenv/config';

import { guelleRouter } from './routes/guelle.routes';
import { generateExcel } from './yield_service';
import { errorHandler } from './lib/validation';
import { schlagTestDaten, waageTestDaten } from './testdaten';

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(express.json());

// Alle Endpunkte der Seite "Gülle Lieferscheine"
app.use('/api', guelleRouter);

// ==========================================
// FUTTERDATEN / WAAGE
// Noch Testdaten - siehe Hinweis in testdaten.ts
// ==========================================
app.get('/api/getSchlagID', (_req: Request, res: Response) => {
    res.json(schlagTestDaten);
});

app.get('/api/getWaageDaten', (_req: Request, res: Response) => {
    res.json(waageTestDaten);
});

app.put('/api/updateSchlag/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    // "TS_Gehlat" ist ein Tippfehler im bestehenden Frontend-Vertrag,
    // wird hier weiter akzeptiert bis die Futter-Seite umgebaut ist.
    const tsGehalt = req.body?.TS_Gehalt ?? req.body?.TS_Gehlat;
    // TODO: noch nicht persistiert - schreibt bewusst nur ins Log,
    // solange die Waage-Seite nicht an die Datenbank angebunden ist.
    console.log(`Update TS-Gehalt für Schlag ${id} auf ${tsGehalt}%`);
    res.json({ success: true, updatedValue: tsGehalt, persistiert: false });
});

// ==========================================
// EXCEL EXPORT
// ==========================================
app.get('/api/exportExcel', async (_req: Request, res: Response) => {
    try {
        await generateExcel(schlagTestDaten, res);
    } catch (error) {
        console.error('Excel Export fehlgeschlagen:', error);
        res.status(500).send('Excel Export fehlgeschlagen');
    }
});

// Zentrale Fehlerbehandlung - muss nach allen Routen registriert werden
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`🚀 Server läuft auf http://localhost:${PORT}`);
});
