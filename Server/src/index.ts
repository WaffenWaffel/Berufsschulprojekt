import express, { Request, Response } from 'express';

const app = express();
const PORT = 3001; // Vite nutzt meist 5173, also nehmen wir 3001

app.use(express.json());

app.get('/api/waagedaten', (req: Request, res: Response) => {
  res.json([
    { KundenNr: 1, Kunde: "Nass", Menge: 500, Datum: "16.02.2025"},
    { KundenNr: 2, Kunde: "Albrecht", Menge: 300, Datum: "16.02.2025" }
  ]);
});

app.listen(PORT, () => {
  console.log(`🚀 Server läuft auf http://localhost:${PORT}`);
});