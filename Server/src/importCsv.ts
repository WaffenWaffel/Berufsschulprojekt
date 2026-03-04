import fs from 'fs';
import csv from 'csv-parser';
import { prisma } from "./lib/prisma";

// const prisma = new PrismaClient();

async function importCsv() {
  const results: any[] = [];
  const csvFilePath = './ExportWS27092025_1.csv'; 

  if (!fs.existsSync(csvFilePath)) {
    console.error("Datei nicht gefunden: " + csvFilePath);
    return;
  }

  fs.createReadStream(csvFilePath)
    .pipe(csv({ 
        separator: ';',
        // Dieser Block bereinigt die Spaltennamen (entfernt unsichtbare Zeichen & Leerzeichen)
        mapHeaders: ({ header }) => header.trim().replace(/^\uFEFF/, '') 
    }))
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      console.log(`${results.length} Zeilen geladen. Starte Import...`);

      if (results.length > 0) {
        // Schau dir jetzt mal die Keys im Terminal an:
        console.log("Verfügbare Spalten:", Object.keys(results[0]));
      }

      try {
        for (const row of results) {
          // Wir greifen jetzt flexibler auf die Daten zu
          const wsNummer = parseInt(row['WS-Nr.'] || row['WS-Nr'] || Object.values(row)[0] as string);
          
          if (isNaN(wsNummer)) {
            // Falls es immer noch undefined ist, loggen wir die ganze Zeile zur Diagnose
            console.warn(`Überspringe ungültige Zeile:`, row);
            continue; 
          }

          // 1. Erzeuger (Stammdaten)
          const erzeugerId = parseInt(row['Erzeuger ID']);
          const erzeuger = await prisma.erzeuger.upsert({
            where: { erzeugerId: erzeugerId },
            update: {},
            create: {
              erzeugerId: erzeugerId,
              name: (row['Erzeuger Name'] || "Unbekannt").trim(),
              ort: row['Erzeuger Ort']?.trim() || "",
              plz: row['Erzeuger PLZ']?.trim() || "",
              strasse: row['Erzeuger Straße']?.trim() || ""
            }
          });

          // 2. Schlag (Stammdaten)
          const schlagIdExt = parseInt(row['Schlag ID']);
          const schlag = await prisma.schlag.upsert({
            where: { schlagIdExt: schlagIdExt },
            update: {},
            create: {
              schlagIdExt: schlagIdExt,
              name: (row['Schlag Name'] || "Unbekannt").trim(),
              erzeugerId: erzeuger.id 
            }
          });

          // 3. Wägung
          const dateParts = (row['ZW Datum'] || "").split('.');
const dateObj = dateParts.length === 3 
  ? new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`)
  : new Date();

await prisma.waegung.upsert({
  where: { 
    wsNr: wsNummer // Hier wird geprüft, ob die Nummer schon existiert
  },
  update: {
    // Falls sie existiert, aktualisieren wir die Daten (optional)
    datum: dateObj,
    uhrzeit: (row['ZW Uhrzeit'] || "00:00").trim(),
    netto: parseFloat(row['Netto']?.replace(',', '.') || "0"),
    kennzeichen1: (row['1.Kennzeichen'] || row['Kennzeichen1'] || "").trim(),
    schlagId: schlag.id,
    sorteId: await getSorteId(row['Sorte Name'] || "Unbekannt")
  },
  create: {
    // Falls sie nicht existiert, neu anlegen
    wsNr: wsNummer,
    datum: dateObj,
    uhrzeit: (row['ZW Uhrzeit'] || "00:00").trim(),
    netto: parseFloat(row['Netto']?.replace(',', '.') || "0"),
    kennzeichen1: (row['1.Kennzeichen'] || row['Kennzeichen1'] || "").trim(),
    schlagId: schlag.id,
    sorteId: await getSorteId(row['Sorte Name'] || "Unbekannt")
  }
});

console.log(`✓ WS-Nr ${wsNummer} verarbeitet (Update/Create)`);
        }
      } catch (err) {
        console.error("Fehler während des Imports:", err);
      } finally {
        console.log('--- Import-Prozess beendet ---');
        await prisma.$disconnect();
        process.exit(0);
      }
    });
}

// Hilfsfunktion für Sorten (Silomais etc.)
async function getSorteId(name: string) {
  const cleanName = name.trim();
  
  // Wir suchen erst, ob es die Sorte gibt
  const existingSorte = await prisma.sorte.findUnique({
    where: { name: cleanName }
  });

  if (existingSorte) return existingSorte.id;

  // Wenn nicht, legen wir sie neu an
  const neueSorte = await prisma.sorte.create({
    data: { 
      name: cleanName,
      // Falls sorteId ein Pflichtfeld ist, das NICHT autoincrement ist:
      // Wir nehmen einen Zeitstempel oder Zufallszahl, damit sie unique bleibt.
      // Falls es autoincrement ist -> Zeile einfach löschen!
      sorteId: Math.floor(Math.random() * 1000000) 
    }
  });
  
  return neueSorte.id;
}

importCsv();