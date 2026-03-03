import fs from 'fs';
import csv from 'csv-parser';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function importCsv() {
  const results: any[] = [];

  // Pfad zur CSV (muss im Server-Ordner liegen oder Pfad anpassen)
  const csvFilePath = './ExportWS27092025_1.csv'; 

  if (!fs.existsSync(csvFilePath)) {
    console.error("Datei nicht gefunden: " + csvFilePath);
    return;
  }

  fs.createReadStream(csvFilePath)
    .pipe(csv({ separator: ';' }))
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      console.log(`${results.length} Zeilen geladen. Starte Import...`);

      for (const row of results) {
        try {
          const wsNummer = parseInt(row['WS-Nr.']);
          if (isNaN(wsNummer)) continue;

          // 1. Erzeuger (Stammdaten)
          const erzeugerId = parseInt(row['Erzeuger ID']);
          const erzeuger = await prisma.erzeuger.upsert({
            where: { erzeugerId: erzeugerId },
            update: {},
            create: {
              erzeugerId: erzeugerId,
              name: row['Erzeuger Name'].trim(),
              ort: row['Erzeuger Ort']?.trim(),
              plz: row['Erzeuger PLZ']?.trim(),
              strasse: row['Erzeuger Straße']?.trim()
            }
          });

          // 2. Schlag (Stammdaten)
          const schlagIdExt = parseInt(row['Schlag ID']);
          const schlag = await prisma.schlag.upsert({
            where: { schlagIdExt: schlagIdExt },
            update: {},
            create: {
              schlagIdExt: schlagIdExt,
              name: row['Schlag Name'].trim(),
              erzeugerId: erzeuger.id // Verknüpfung zum Erzeuger
            }
          });

          // 3. Wägung (Bewegungsdaten)
          // Datum umwandeln (CSV: 17.09.2025 -> ISO Date)
          const dateParts = row['ZW Datum'].split('.');
          const dateObj = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);

          await prisma.waegung.create({
            data: {
              wsNr: wsNummer,
              datum: dateObj,
              uhrzeit: row['ZW Uhrzeit'].trim(),
              netto: parseFloat(row['Netto'].replace(',', '.')) || 0,
              kennzeichen: row['1.Kennzeichen']?.trim(),
              schlagId: schlag.id,
              // Wir brauchen noch eine Sorte ID aus der CSV
              sorteId: await getSorteId(row['Sorte Name']) 
            }
          });

        } catch (error) {
          console.error(`Fehler bei Zeile ${row['WS-Nr.']}:`, error);
        }
      }
      console.log('Import abgeschlossen!');
      await prisma.$disconnect();
    });
}

// Hilfsfunktion für Sorten (Silomais etc.)
async function getSorteId(name: string) {
  const sorte = await prisma.sorte.upsert({
    where: { name: name.trim() },
    update: {},
    create: { name: name.trim(), sorteId: 1 } // sorteId müsste man idealerweise aus CSV ziehen
  });
  return sorte.id;
}

importCsv();