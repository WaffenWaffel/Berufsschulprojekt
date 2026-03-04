import express, { Request, Response } from 'express';
import { generateDeliveryNotePdf } from './delivery_service';
import { generateExcel } from './yield_service';
// import { PrismaClient } from '@prisma/client'; // Auskommentiert für Testzwecke

// const prisma = new PrismaClient();
const app = express();
const PORT = 3001;

app.use(express.json());

// ==========================================
// 1. GUELLE-DATENSÄTZE (Bewegungsdaten)
// ==========================================
app.get('/api/getGuelleDaten', (req: Request, res: Response) => {
    // BEISPIELDATEN
    res.json([
        { KundenNr: 1, Kunde: "Nass", Menge: 500, Datum: "16.02.2025" },
        { KundenNr: 2, Kunde: "Albrecht", Menge: 300, Datum: "16.02.2025" }
    ]);
});

app.post('/api/newRecord', (req: Request, res: Response) => {
    const neuerGuelleDatensatz = req.body;
    console.log("Neuer Gülle-Datensatz empfangen:", neuerGuelleDatensatz);
    res.status(201).json({ message: "Datensatz empfangen", eintrag: neuerGuelleDatensatz });
});

// ==========================================
// 2. GUELLE-KUNDEN (Stammdaten)
// ==========================================
app.get('/api/getCustomer', (req: Request, res: Response) => {
    // BEISPIELDATEN
    res.json([
        { KundenNr: 1, Name: "Nass", Vorname: "Roland", PLZ: 86733, Wohnort: "Alerheim", Straße: "Dorfstraße", HNr: "8" },
        { KundenNr: 2, Name: "Albrecht", Vorname: "Wolfgang", PLZ: 86733, Wohnort: "Möttingen", Straße: "Hauptstr.", HNr: "12" }
    ]);
});

app.post('/api/newCustomer', async (req: Request, res: Response) => {
    const data = req.body;
    /* DB-CODE:
    const neuerKunde = await prisma.guelleKunden.create({ data: {
        kundenNr: Number(data.KundenNr),
        name: data.Name,
        vorname: data.Vorname,
        plz: Number(data.PLZ),
        wohnort: data.Wohnort,
        strasse: data.Straße,
        hNr: data.HNr
    }}); */
    res.status(201).json({ message: "Kunde empfangen", eintrag: data });
});

app.put('/api/updateCustomer/:id', async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    /* DB-CODE:
    const updated = await prisma.guelleKunden.update({
        where: { kundenNr: Number(id) },
        data: { name: data.Name, ... }
    }); */
    console.log(`Update Kunde ${id}`);
    res.json({ success: true, updated: data });
});

app.delete('/api/deleteCustomer/:id', async (req, res) => {
    const { id } = req.params;
    /* DB-CODE:
    await prisma.guelleKunden.delete({ where: { kundenNr: Number(id) } }); */
    res.json({ message: "Kunde erfolgreich gelöscht" });
});

// ==========================================
// 3. ANALYSEN (Eigenständig)
// ==========================================
app.get('/api/getAnalysis', (req: Request, res: Response) => {
    // BEISPIELDATEN
    res.json([
        { id: 1, Stickstoff: 4.5, Amoniumstickstoff: 2.1, Phosphat: 1.8, Kalium: 5.2, Datum: "2026-02-24" },
        { id: 2, Stickstoff: 4.8, Amoniumstickstoff: 2.3, Phosphat: 2.0, Kalium: 5.5, Datum: "2026-03-01" }
    ]);
});

app.post('/api/newAnalysis', async (req: Request, res: Response) => {
    const data = req.body;
    /* DB-CODE:
    const neueAnalyse = await prisma.analyse.create({ data: {
        stickstoff: Number(data.Stickstoff),
        amoniumstickstoff: Number(data.Amoniumstickstoff),
        ... datum: new Date(data.Datum)
    }}); */
    res.status(201).json({ message: "Analyse empfangen", eintrag: data });
});

app.put('/api/updateAnalysis/:id', async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    /* DB-CODE:
    const updated = await prisma.analyse.update({
        where: { id: Number(id) },
        data: { stickstoff: Number(data.Stickstoff), ... }
    }); */
    res.json({ message: "Analyse aktualisiert" });
});

app.delete('/api/deleteAnalysis/:id', async (req, res) => {
    const { id } = req.params;
    /* DB-CODE:
    await prisma.analyse.delete({ where: { id: Number(id) } }); */
    res.json({ message: "Analyse gelöscht" });
});

// ==========================================
// 4. LIEFERSCHEIN (PDF)
// ==========================================
app.post('/api/newDelivery', async (req: Request, res: Response) => {
    try {
        const databaseData = { Name: "Nass", Vorname: "Roland", PLZ: "86733", Wohnort: "Alerheim", Straße: "Dorfstraße", HNr: "8" };
        const customerData = {
            customerName: databaseData.Name + " " + databaseData.Vorname,
            customerAddress: `${databaseData.Straße} ${databaseData.HNr}, ${databaseData.PLZ} ${databaseData.Wohnort}`,
            items: [{ menge: 125, datum: "27.02.26" }],
            analysis: [{ datum: "27.02.26", gesamtStickstoff: 4.6, amoniumStickstoff: 2.8, phosphat: 2.35, kalium: 6.68 }]
        };

        const pdfBuffer = await generateDeliveryNotePdf(customerData);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=lieferschein.pdf');
        res.send(pdfBuffer);
    } catch (error) {
        res.status(500).send('Fehler bei der PDF-Erstellung');
    }
});

// ==========================================
// 5. FUTTERDATEN / WAAGE (CSV-BASIERT)
// ==========================================
app.get('/api/getSchlagID', (req: Request, res: Response) => {
    // BEISPIELDATEN (gemappt auf deine CSV-Struktur)
    res.json([
      {
        Schlag_ID: 95,
        Schlag_Name: "Hinterm Wald",
        Vorname: "Karl",
        Name: "Bauer",
        Größe: 3.15,
        Ertrag: 158.72,
        Feuchtmasse: 52.10,
        TS_Gehlat: 38.95,
        Trockenmasse: 618.22,
        Trockenmasse_pro_ha: 196.26,
        Sorte: "Mais"
    },
    {
        Schlag_ID: 96,
        Schlag_Name: "Sonnenfeld",
        Vorname: "Johann",
        Name: "Schmid",
        Größe: 2.74,
        Ertrag: 139.85,
        Feuchtmasse: 48.90,
        TS_Gehlat: 40.12,
        Trockenmasse: 560.88,
        Trockenmasse_pro_ha: 204.73,
        Sorte: "Mais"
    },
    {
        Schlag_ID: 97,
        Schlag_Name: "Am Mühlbach",
        Vorname: "Georg",
        Name: "Weber",
        Größe: 3.42,
        Ertrag: 171.30,
        Feuchtmasse: 55.20,
        TS_Gehlat: 37.80,
        Trockenmasse: 647.51,
        Trockenmasse_pro_ha: 189.33,
        Sorte: "Mais"
    },
    {
        Schlag_ID: 98,
        Schlag_Name: "Unterfeld",
        Vorname: "Martin",
        Name: "Hofmann",
        Größe: 2.95,
        Ertrag: 150.44,
        Feuchtmasse: 51.35,
        TS_Gehlat: 39.02,
        Trockenmasse: 587.00,
        Trockenmasse_pro_ha: 198.98,
        Sorte: "Mais"
    },
    {
        Schlag_ID: 99,
        Schlag_Name: "Kreuzacker",
        Vorname: "Lukas",
        Name: "Gruber",
        Größe: 3.08,
        Ertrag: 162.90,
        Feuchtmasse: 53.60,
        TS_Gehlat: 38.40,
        Trockenmasse: 626.54,
        Trockenmasse_pro_ha: 203.42,
        Sorte: "Mais"
    },
    {
        Schlag_ID: 100,
        Schlag_Name: "Weinbergfeld",
        Vorname: "Thomas",
        Name: "Maier",
        Größe: 2.63,
        Ertrag: 134.22,
        Feuchtmasse: 47.75,
        TS_Gehlat: 41.05,
        Trockenmasse: 551.02,
        Trockenmasse_pro_ha: 209.52,
        Sorte: "Mais"
    },
    {
        Schlag_ID: 101,
        Schlag_Name: "Am Kirchweg",
        Vorname: "Stefan",
        Name: "Lang",
        Größe: 3.27,
        Ertrag: 168.45,
        Feuchtmasse: 54.10,
        TS_Gehlat: 37.95,
        Trockenmasse: 639.87,
        Trockenmasse_pro_ha: 195.68,
        Sorte: "Mais"
    },
    {
        Schlag_ID: 102,
        Schlag_Name: "Nordacker",
        Vorname: "Andreas",
        Name: "Seidel",
        Größe: 2.81,
        Ertrag: 142.66,
        Feuchtmasse: 49.85,
        TS_Gehlat: 40.30,
        Trockenmasse: 574.78,
        Trockenmasse_pro_ha: 204.55,
        Sorte: "Mais"
    },
    {
        Schlag_ID: 103,
        Schlag_Name: "Am Birkenrain",
        Vorname: "Michael",
        Name: "Fischer",
        Größe: 3.36,
        Ertrag: 175.12,
        Feuchtmasse: 56.00,
        TS_Gehlat: 36.90,
        Trockenmasse: 646.19,
        Trockenmasse_pro_ha: 192.33,
        Sorte: "Mais"
    },
    {
        Schlag_ID: 104,
        Schlag_Name: "Südhang",
        Vorname: "Daniel",
        Name: "Krüger",
        Größe: 2.69,
        Ertrag: 137.58,
        Feuchtmasse: 48.20,
        TS_Gehlat: 40.75,
        Trockenmasse: 560.42,
        Trockenmasse_pro_ha: 208.33,
        Sorte: "Mais"
    }
    ]);
});

app.put('/api/updateSchlag/:id', async (req, res) => {
    const { id } = req.params;
    const { TS_Gehlat } = req.body;
    /* DB-CODE (Normalisierte Tabellen):
    const updated = await prisma.waegung.updateMany({
        where: { schlagId: Number(id) },
        data: { tsGehalt: Number(TS_Gehlat) }
    }); */
    console.log(`Update TS-Gehalt für Schlag ${id} auf ${TS_Gehlat}%`);
    res.json({ success: true, updatedValue: TS_Gehlat });
});

// ==========================================
// 6. EXCEL EXPORT
// ==========================================
app.get('/api/exportExcel', async (req: Request, res: Response) => {
    try {
        const data = [{ 
            Schlag_ID: 94, Schlag_Name: "am Aussiedlerhof", Vorname: "Friedrich", Name: "Ebert", 
            Größe: 2.86, Ertrag: 144.14, Feuchtmasse: 50.40, TS_Gehlat: 39.48, Sorte: "Mais" 
        }];
        await generateExcel(data, res);
    } catch (error) {
        res.status(500).send("Excel Export fehlgeschlagen");
    }
});

// Endpunkt für die Waagedaten
app.get('/api/getWaageDaten', (req, res) => {
  /* CSV Logik vorerst deaktiviert
  const results = [];
  fs.createReadStream('waagedaten.csv')
    .pipe(csv({ separator: ';' }))
    .on('data', (data) => results.push(data))
    .on('end', () => res.json(results));
  */

  // Testdaten für das Frontend
  const testDaten = [
    {
      Ws_Nr: 1004,
      Datum: "05.03.2024",
      Uhrzeit: "10:20",
      Kennzeichen1: "DON-CD-456",
      Kennzeichen2: "Kipper-02",
      Netto_Gewicht: 14.25,
      Sorte: "Mais",
      Erzeuger_Name: "Bauer Agrar",
      Schlag_ID: 15,
      Schlag_Name: "Südacker"
    },
    {
      Ws_Nr: 1005,
      Datum: "05.03.2024",
      Uhrzeit: "11:45",
      Kennzeichen1: "DON-EF-321",
      Kennzeichen2: "Wanne-02",
      Netto_Gewicht: 13.90,
      Sorte: "Mais",
      Erzeuger_Name: "Schmid Hof",
      Schlag_ID: 18,
      Schlag_Name: "Birkenfeld"
    },
    {
      Ws_Nr: 1006,
      Datum: "06.03.2024",
      Uhrzeit: "07:40",
      Kennzeichen1: "DON-GH-654",
      Kennzeichen2: "Kipper-03",
      Netto_Gewicht: 16.10,
      Sorte: "Mais",
      Erzeuger_Name: "Landtechnik Mayer",
      Schlag_ID: 25,
      Schlag_Name: "Oberfeld"
    },
    {
      Ws_Nr: 1007,
      Datum: "06.03.2024",
      Uhrzeit: "09:10",
      Kennzeichen1: "DON-IJ-852",
      Kennzeichen2: "Wanne-07",
      Netto_Gewicht: 12.75,
      Sorte: "Mais",
      Erzeuger_Name: "Hofmeier Georg",
      Schlag_ID: 10,
      Schlag_Name: "Nordfeld"
    },
    {
      Ws_Nr: 1008,
      Datum: "06.03.2024",
      Uhrzeit: "13:30",
      Kennzeichen1: "DON-KL-741",
      Kennzeichen2: "Kipper-04",
      Netto_Gewicht: 17.20,
      Sorte: "Mais",
      Erzeuger_Name: "Meier Landwirtschaft",
      Schlag_ID: 22,
      Schlag_Name: "Am Hang"
    },
    {
      Ws_Nr: 1009,
      Datum: "07.03.2024",
      Uhrzeit: "08:05",
      Kennzeichen1: "DON-MN-963",
      Kennzeichen2: "Wanne-03",
      Netto_Gewicht: 11.95,
      Sorte: "Mais",
      Erzeuger_Name: "Bauer Agrar",
      Schlag_ID: 15,
      Schlag_Name: "Südacker"
    },
    {
      Ws_Nr: 1010,
      Datum: "07.03.2024",
      Uhrzeit: "10:50",
      Kennzeichen1: "DON-OP-159",
      Kennzeichen2: "Kipper-05",
      Netto_Gewicht: 14.80,
      Sorte: "Mais",
      Erzeuger_Name: "Schmid Hof",
      Schlag_ID: 18,
      Schlag_Name: "Birkenfeld"
    },
    {
      Ws_Nr: 1011,
      Datum: "07.03.2024",
      Uhrzeit: "14:15",
      Kennzeichen1: "DON-QR-357",
      Kennzeichen2: "Wanne-08",
      Netto_Gewicht: 15.60,
      Sorte: "Mais",
      Erzeuger_Name: "Landtechnik Mayer",
      Schlag_ID: 25,
      Schlag_Name: "Oberfeld"
    },
    {
      Ws_Nr: 1012,
      Datum: "08.03.2024",
      Uhrzeit: "07:25",
      Kennzeichen1: "DON-ST-258",
      Kennzeichen2: "Kipper-06",
      Netto_Gewicht: 13.35,
      Sorte: "Mais",
      Erzeuger_Name: "Hofmeier Georg",
      Schlag_ID: 10,
      Schlag_Name: "Nordfeld"
    },
    {
      Ws_Nr: 1013,
      Datum: "08.03.2024",
      Uhrzeit: "09:55",
      Kennzeichen1: "DON-UV-147",
      Kennzeichen2: "Wanne-09",
      Netto_Gewicht: 16.45,
      Sorte: "Mais",
      Erzeuger_Name: "Meier Landwirtschaft",
      Schlag_ID: 22,
      Schlag_Name: "Am Hang"
    },
    {
      Ws_Nr: 1014,
      Datum: "08.03.2024",
      Uhrzeit: "12:40",
      Kennzeichen1: "DON-WX-369",
      Kennzeichen2: "Kipper-07",
      Netto_Gewicht: 12.10,
      Sorte: "Mais",
      Erzeuger_Name: "Bauer Agrar",
      Schlag_ID: 15,
      Schlag_Name: "Südacker"
    },
    {
      Ws_Nr: 1015,
      Datum: "09.03.2024",
      Uhrzeit: "08:30",
      Kennzeichen1: "DON-YZ-951",
      Kennzeichen2: "Wanne-10",
      Netto_Gewicht: 14.95,
      Sorte: "Mais",
      Erzeuger_Name: "Schmid Hof",
      Schlag_ID: 18,
      Schlag_Name: "Birkenfeld"
    },
    {
      Ws_Nr: 1016,
      Datum: "09.03.2024",
      Uhrzeit: "11:05",
      Kennzeichen1: "DON-AA-222",
      Kennzeichen2: "Kipper-08",
      Netto_Gewicht: 17.05,
      Sorte: "Mais",
      Erzeuger_Name: "Landtechnik Mayer",
      Schlag_ID: 25,
      Schlag_Name: "Oberfeld"
    },
    {
      Ws_Nr: 1017,
      Datum: "09.03.2024",
      Uhrzeit: "14:50",
      Kennzeichen1: "DON-BB-333",
      Kennzeichen2: "Wanne-11",
      Netto_Gewicht: 13.60,
      Sorte: "Mais",
      Erzeuger_Name: "Hofmeier Georg",
      Schlag_ID: 10,
      Schlag_Name: "Nordfeld"
    },
    {
      Ws_Nr: 1018,
      Datum: "10.03.2024",
      Uhrzeit: "07:10",
      Kennzeichen1: "DON-CC-444",
      Kennzeichen2: "Kipper-09",
      Netto_Gewicht: 15.75,
      Sorte: "Mais",
      Erzeuger_Name: "Meier Landwirtschaft",
      Schlag_ID: 22,
      Schlag_Name: "Am Hang"
    },
    {
      Ws_Nr: 1019,
      Datum: "10.03.2024",
      Uhrzeit: "09:45",
      Kennzeichen1: "DON-DD-555",
      Kennzeichen2: "Wanne-12",
      Netto_Gewicht: 12.85,
      Sorte: "Mais",
      Erzeuger_Name: "Bauer Agrar",
      Schlag_ID: 15,
      Schlag_Name: "Südacker"
    },
    {
      Ws_Nr: 1020,
      Datum: "10.03.2024",
      Uhrzeit: "13:15",
      Kennzeichen1: "DON-EE-666",
      Kennzeichen2: "Kipper-10",
      Netto_Gewicht: 16.30,
      Sorte: "Mais",
      Erzeuger_Name: "Schmid Hof",
      Schlag_ID: 18,
      Schlag_Name: "Birkenfeld"
    },
    {
      Ws_Nr: 1021,
      Datum: "11.03.2024",
      Uhrzeit: "08:00",
      Kennzeichen1: "DON-FF-777",
      Kennzeichen2: "Wanne-13",
      Netto_Gewicht: 14.10,
      Sorte: "Mais",
      Erzeuger_Name: "Landtechnik Mayer",
      Schlag_ID: 25,
      Schlag_Name: "Oberfeld"
    },
    {
      Ws_Nr: 1022,
      Datum: "11.03.2024",
      Uhrzeit: "10:35",
      Kennzeichen1: "DON-GG-888",
      Kennzeichen2: "Kipper-11",
      Netto_Gewicht: 15.20,
      Sorte: "Mais",
      Erzeuger_Name: "Hofmeier Georg",
      Schlag_ID: 10,
      Schlag_Name: "Nordfeld"
    },
    {
      Ws_Nr: 1023,
      Datum: "11.03.2024",
      Uhrzeit: "15:00",
      Kennzeichen1: "DON-HH-999",
      Kennzeichen2: "Wanne-14",
      Netto_Gewicht: 13.45,
      Sorte: "Mais",
      Erzeuger_Name: "Meier Landwirtschaft",
      Schlag_ID: 22,
      Schlag_Name: "Am Hang"
    },
    {
      Ws_Nr: 1024,
      Datum: "12.03.2024",
      Uhrzeit: "07:30",
      Kennzeichen1: "DON-II-111",
      Kennzeichen2: "Kipper-12",
      Netto_Gewicht: 16.90,
      Sorte: "Mais",
      Erzeuger_Name: "Bauer Agrar",
      Schlag_ID: 15,
      Schlag_Name: "Südacker"
    },
    {
      Ws_Nr: 1025,
      Datum: "12.03.2024",
      Uhrzeit: "09:20",
      Kennzeichen1: "DON-JJ-222",
      Kennzeichen2: "Wanne-15",
      Netto_Gewicht: 12.60,
      Sorte: "Mais",
      Erzeuger_Name: "Schmid Hof",
      Schlag_ID: 18,
      Schlag_Name: "Birkenfeld"
    },
    {
      Ws_Nr: 1026,
      Datum: "12.03.2024",
      Uhrzeit: "13:40",
      Kennzeichen1: "DON-KK-333",
      Kennzeichen2: "Kipper-13",
      Netto_Gewicht: 15.95,
      Sorte: "Mais",
      Erzeuger_Name: "Landtechnik Mayer",
      Schlag_ID: 25,
      Schlag_Name: "Oberfeld"
    },
    {
      Ws_Nr: 1027,
      Datum: "13.03.2024",
      Uhrzeit: "08:25",
      Kennzeichen1: "DON-LL-444",
      Kennzeichen2: "Wanne-16",
      Netto_Gewicht: 14.70,
      Sorte: "Mais",
      Erzeuger_Name: "Hofmeier Georg",
      Schlag_ID: 10,
      Schlag_Name: "Nordfeld"
    },
    {
      Ws_Nr: 1028,
      Datum: "13.03.2024",
      Uhrzeit: "11:55",
      Kennzeichen1: "DON-MM-555",
      Kennzeichen2: "Kipper-14",
      Netto_Gewicht: 17.30,
      Sorte: "Mais",
      Erzeuger_Name: "Meier Landwirtschaft",
      Schlag_ID: 22,
      Schlag_Name: "Am Hang"
    }
  ];

  console.log("Sende Testdaten für WaagePage...");
  res.json(testDaten);
});

app.listen(PORT, () => {
    console.log(`🚀 Server läuft auf http://localhost:${PORT}`);
});