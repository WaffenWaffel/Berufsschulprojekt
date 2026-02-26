import express, { Request, Response } from 'express';

const app = express();
const PORT = 3001; // Vite nutzt meist 5173, also nehmen wir 3001

app.use(express.json());

app.get('/api/getGuelleDaten', (req: Request, res: Response) => {
  res.json([
    { KundenNr: 1, Kunde: "Nass", Menge: 500, Datum: "16.02.2025"},
    { KundenNr: 2, Kunde: "Albrecht", Menge: 300, Datum: "16.02.2025" }
  ]);
});

app.get('/api/getCustomer', (req: Request, res: Response) => {
  res.json([
    { KundenNr: 1, Name: "Nass", Vorname: "Roland", PLZ: "", Wohnort: "", Straße: "", HNr: ""},
    { KundenNr: 2, Name: "Albrecht", Vorname: "Wolfgang", PLZ: "", Wohnort: "", Straße: "", HNr: ""}
  ]);
});

app.get('/api/getAnalysis', (req: Request, res: Response) => {
  res.json([
    { ID: 1, Datum:"24.02.26"},
    { ID: 2, Datum:"31.02.26"}
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

app.post('/api/newCustomer', (req: Request, res: Response) => {
  const neuerKunde = req.body;

  console.log("Empfangene Daten:", neuerKunde);
  res.status(201).json({
    message: "Kunde erfolgreich empfangen",
    eintrag: neuerKunde
  })
})

app.post('/api/newAnalysis', (req: Request, res: Response) => {
  const neueAnalyse = req.body;

  console.log("Empfangene Daten:", neueAnalyse);
  res.status(201).json({
    message: "Analyse erfolgreich empfangen",
    eintrag: neueAnalyse
  })
})

app.post('/api/newRecord', (req: Request, res: Response) => {
  const neuerGuelleDatensatz = req.body;

  console.log("Empfangene Daten:", neuerGuelleDatensatz);
  res.status(201).json({
    message: "Datensatz erfolgreich empfangen",
    eintrag: neuerGuelleDatensatz
  })
})

app.post('/api/newDelivery', (req: Request, res: Response) => {
  const neuerLieferschein = req.body;

  console.log("Empfangene Daten:", neuerLieferschein);
  res.status(201).json({
    message: "Lieferscheindaten erfolgreich empfangen",
    eintrag: neuerLieferschein
  })
})

app.listen(PORT, () => {
  console.log(`🚀 Server läuft auf http://localhost:${PORT}`);
});