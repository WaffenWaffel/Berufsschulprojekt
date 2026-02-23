import express, { Request, Response } from 'express';

const app = express();
const PORT = 3001; // Vite nutzt meist 5173, also nehmen wir 3001

app.use(express.json());

app.get('/api/guelleDaten', (req: Request, res: Response) => {
  console.log("here")
  res.json([
    { KundenNr: 1, Kunde: "Nass", Menge: 500, Datum: "16.02.2025"},
    { KundenNr: 2, Kunde: "Albrecht", Menge: 300, Datum: "16.02.2025" }
  ]);
});

// app.use(express.json());

// interface GuelleKunden{
//   KundenNr: number;
//   Name: string;
//   Vorname: string;
//   PLZ: number;
//   Wohnort: string;
//   Straße: string;
//   HNr: string;
// }

app.post('/api/neuerKunde', (req: Request, res: Response) => {
  const neuerKunde = req.body;

  console.log("Empfangene Daten:", neuerKunde);
  res.status(201).json({
    message: "Kunde erfolgreich empfangen",
    eintrag: neuerKunde
  })
})

app.post('/api/neueAnalyse', (req: Request, res: Response) => {
  const neueAnalyse = req.body;

  console.log("Empfangene Daten:", neueAnalyse);
  res.status(201).json({
    message: "Analyse erfolgreich empfangen",
    eintrag: neueAnalyse
  })
})

app.listen(PORT, () => {
  console.log(`🚀 Server läuft auf http://localhost:${PORT}`);
});