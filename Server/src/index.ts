import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

import { guelleRouter } from './routes/guelle.routes';
import { generateExcel } from './yield_service';
import { errorHandler } from './lib/validation';
import { schlagTestDaten, waageTestDaten } from './testdaten';

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// Hinter einem Reverse Proxy (nginx, Caddy) steht die echte Client-IP im
// X-Forwarded-For-Header. Ohne diese Zeile sieht Express nur den Proxy.
app.set('trust proxy', 1);

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

// ==========================================
// CLIENT (Produktion)
// ==========================================
// In der Entwicklung liefert Vite das Frontend aus und leitet /api hierher
// weiter. In Produktion gibt es keinen Vite-Prozess mehr - dann übernimmt
// Express den gebauten Client, damit Frontend und API unter derselben
// Domain laufen und keine CORS-Regeln nötig sind.
const clientDist = path.resolve(__dirname, '../../Client/dist');

if (fs.existsSync(path.join(clientDist, 'index.html'))) {
    app.use(express.static(clientDist));

    // Alles, was keine API-Route war, beantwortet die Einstiegsseite. React
    // übernimmt dann das Routing im Browser. Unbekannte /api-Pfade sollen
    // aber weiterhin einen ehrlichen 404 liefern statt HTML.
    app.use((req: Request, res: Response) => {
        if (req.path.startsWith('/api/')) {
            return res.status(404).json({ error: `Unbekannter Endpunkt: ${req.path}` });
        }
        res.sendFile(path.join(clientDist, 'index.html'));
    });
} else {
    console.warn(
        `Kein Client-Build unter ${clientDist} gefunden. ` +
        'In der Entwicklung ist das normal (Vite liefert das Frontend aus). ' +
        'Für den Produktivbetrieb vorher "npm run build" ausführen.'
    );
}

// Zentrale Fehlerbehandlung - muss nach allen Routen registriert werden
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`🚀 Server läuft auf Port ${PORT}`);
});
