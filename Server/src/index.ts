import express, { Request, Response } from 'express';
import { generateDeliveryNotePdf } from './delivery_service'; // Deine Funktion von oben
import { generateExcel } from './yield_service';

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

app.put('/api/updateCustomer/:id', async (req, res) => {
  const { id } = req.params; // Die ID aus der URL
  const { Name, Vorname, PLZ, Wohnort, Straße, HNr } = req.body;

  // try {
  //   const updatedKunde = await prisma.kunde.update({
  //     where: { kundenNr: Number(id) },
  //     data: {
  //       name: Name,
  //       vorname: Vorname,
  //       plz: Number(PLZ),
  //       wohnort: Wohnort,
  //       straße: Straße,
  //       hnr: HNr,
  //     },
  //   });
  //   res.json(updatedKunde);
  // } catch (error) {
  //   console.error("Update Fehler:", error);
  //   res.status(500).json({ error: "Kunde konnte nicht aktualisiert werden" });
  // }
});

app.delete('/api/deleteCustomer/:id', async (req, res) => {
  const { id } = req.params;

  // try {
  //   await prisma.kunde.delete({
  //     where: { kundenNr: Number(id) },
  //   });
  //   res.json({ message: "Kunde erfolgreich gelöscht" });
  // } catch (error) {
  //   console.error("Delete Fehler:", error);
  //   res.status(500).json({ error: "Kunde konnte nicht gelöscht werden" });
  // }
});

app.get('/api/getAnalysis', (req: Request, res: Response) => {
  res.json([
    { ID: 1, Datum:"24.02.26"},
    { ID: 2, Datum:"31.02.26"}
  ]);
});

// UPDATE: Analyse bearbeiten
app.put('/api/updateAnalysis/:id', async (req, res) => {
  const { id } = req.params;
  const { Stickstoff, Amoniumstickstoff, Phosphat, Kalium, Datum } = req.body;

  // try {
  //   const updatedAnalysis = await prisma.analyse.update({
  //     where: { id: Number(id) },
  //     data: {
  //       stickstoff: Number(Stickstoff),
  //       amoniumstickstoff: Number(Amoniumstickstoff),
  //       phosphat: Number(Phosphat),
  //       kalium: Number(Kalium),
  //       datum: new Date(Datum), // Wichtig: String zu Date umwandeln
  //     },
  //   });
  //   res.json(updatedAnalysis);
  // } catch (error) {
  //   console.error("Update Fehler:", error);
  //   res.status(500).json({ error: "Analyse konnte nicht aktualisiert werden" });
  // }
});

// DELETE: Analyse löschen
app.delete('/api/deleteAnalysis/:id', async (req, res) => {
  const { id } = req.params;

  // try {
  //   await prisma.analyse.delete({
  //     where: { id: Number(id) },
  //   });
  //   res.json({ message: "Analyse erfolgreich gelöscht" });
  // } catch (error) {
  //   res.status(500).json({ error: "Fehler beim Löschen der Analyse" });
  // }
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

// app.post('/api/newDelivery', (req: Request, res: Response) => {
//   const neuerLieferschein = req.body;

//   console.log("Empfangene Daten:", neuerLieferschein);
//   res.status(201).json({
//     message: "Lieferscheindaten erfolgreich empfangen",
//     eintrag: neuerLieferschein
//   })
// })

app.post('/api/newDelivery', async (req: Request, res: Response) => {
  try {
    // 1. Daten vom Frontend entgegennehmen
    // const customerData = req.body; 
    const neuerLieferschein = req.body;

  console.log("Empfangene Daten:", neuerLieferschein);
    const databaseData = {
      KundenNr: 1, 
      Name: "Nass", 
      Vorname: "Roland", 
      PLZ: "86733", 
      Wohnort: "Alerheim", 
      Straße: "Dorfstraße", 
      HNr: "8"
    },

    customerData = {
      customerName: databaseData.Name + " " + databaseData.Vorname,
      customerAddress: `${databaseData.Straße} ${databaseData.HNr}, ${databaseData.PLZ} ${databaseData.Wohnort}`,
      items: [{
        menge: 125,
        datum: "27.02.26",
      }],
      analysis: [{
        datum: "27.02.26",
        gesamtStickstoff: 4.6,
        amoniumStickstoff: 2.8,
        phosphat: 2.35,
        kalium: 6.68
      },{
        datum: "30.02.26",
        gesamtStickstoff: 4.6,
        amoniumStickstoff: 2.8,
        phosphat: 2.35,
        kalium: 6.68
      }]
    }

    // 2. PDF generieren (Buffer erhalten)
    const pdfBuffer = await generateDeliveryNotePdf(customerData);

    // 3. Header setzen
    res.setHeader('Content-Type', 'application/pdf');
    
    // 'attachment' erzwingt Download, 'inline' zeigt es im Browser an
    res.setHeader('Content-Disposition', 'attachment; filename=lieferschein.pdf');

    // 4. Den Buffer senden
    res.send(pdfBuffer);

  } catch (error) {
    console.error('PDF Fehler:', error);
    res.status(500).send('Fehler bei der PDF-Erstellung');
  }
})

// export type FutterDaten = {
//   Schlag_ID: Number;
//   Schlag_Name: String;
//   Vorname: String;
//   Name: String;
//   Größe: Number;
//   Ertrag: Number;
//   Feuchtmasse: Number;
//   TS_Gehlat: Number;
//   Trockenmasse: Number;
//   Trockenmasse_pro_ha: Number;
//   Sorte: String;
// }

app.get('/api/getSchlagID', (req: Request, res: Response) => {
  res.json([
    { Schlag_ID: 94,
      Schlag_Name: "Am Aussiedlerhof",
      Vorname: "Friedrich",
      Name: "Ebert",
      Größe: 2.86,
      Ertrag: 144.14,
      Feuchtmasse: 50.40,
      TS_Gehlat: 39.48,
      Trockenmasse: 569.06,
      Trockenmasse_pro_ha: 198.97,
      Sorte: "Mais",
    },
    { Schlag_ID: 95,
      Schlag_Name: "Am Aussiedlerhof",
      Vorname: "Friedrich",
      Name: "Ebert",
      Größe: 2.86,
      Ertrag: 144.14,
      Feuchtmasse: 50.40,
      TS_Gehlat: 39.48,
      Trockenmasse: 569.06,
      Trockenmasse_pro_ha: 198.97,
      Sorte: "Mais",}
  ]);
});

app.post('/api/newTsGehalt', (req: Request, res: Response) => {
  const neuerGuelleDatensatz = req.body;

  console.log("Empfangene Daten:", neuerGuelleDatensatz);
  res.status(201).json({
    message: "Datensatz erfolgreich empfangen",
    eintrag: neuerGuelleDatensatz
  })
})

app.put('/api/updateSchlag/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { TS_Gehlat } = req.body; // Wir behalten deinen Typo "Gehlat" bei, damit es zum Frontend passt

  // Validierung
  if (TS_Gehlat === undefined || isNaN(Number(TS_Gehlat))) {
    return res.status(400).json({ error: "Ungültiger TS-Gehalt Wert" });
  }

  console.log(`Update für Schlag ${id}: Neuer TS-Gehalt ist ${TS_Gehlat}%`);

  /* DATENBANK-LOGIK HIER:
     Beispiel mit SQL:
     db.query('UPDATE schlaege SET TS_Gehlat = ? WHERE Schlag_ID = ?', [TS_Gehlat, id]);
  */

  res.json({ 
    success: true, 
    message: `Schlag ${id} erfolgreich aktualisiert.`,
    updatedValue: TS_Gehlat 
  });
});

app.get('/api/exportExcel', async (req: Request, res: Response) => {
  try {
    // 1. Daten holen (die gleiche Logik wie in getSchlagID)
    const data = [
       { 
         Schlag_ID: 94, 
         Schlag_Name: "am Aussiedlerhof", 
         Vorname: "Friedrich", 
         Name: "Ebert", 
         Größe: 2.86, 
         Ertrag: 144.14, 
         Feuchtmasse: 50.40, 
         TS_Gehlat: 39.48, 
         Trockenmasse: 569.06, 
         Trockenmasse_pro_ha: 198.97, 
         Sorte: "Mais" 
       },
       // ... weitere Datensätze
    ];

    // 2. Excel erstellen und senden
    await generateExcel(data, res);
    
  } catch (error) {
    res.status(500).send("Excel Export fehlgeschlagen");
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server läuft auf http://localhost:${PORT}`);
});