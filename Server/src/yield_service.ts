import ExcelJS from 'exceljs';
import { Response } from 'express';

export async function generateExcel(data: any[], res: Response) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Mais 2025');

  // --- STYLING & KONFIGURATION ---
  const boldStyle = { font: { bold: true } };
  const centerStyle: Partial<ExcelJS.Alignment> = { horizontal: 'center' };
  const borderStyle: Partial<ExcelJS.Borders> = {
    bottom: { style: 'thin' }
  };

  // Spaltenbreiten definieren (basierend auf Screenshot)
  worksheet.columns = [
    { width: 5 },  // A
    { width: 15 }, // B (Schlag ID / Name)
    { width: 25 }, // C (Ort / Vom...)
    { width: 25 }, // D (Schlag)
    { width: 10 }, // E (Größe ha)
    { width: 10 }, // F (Summe / Mais)
    { width: 10 }, // G
    { width: 12 }, // H (Ertrag to FM)
    { width: 10 }, // I (to/FM ha)
    { width: 10 }, // J (TS Gehalt)
    { width: 12 }, // K (dz/TM Gesamt)
    { width: 12 }, // L (dz/TM ha)
  ];

  // --- HEADER BEREICH ---
  // Zeile 2: Firmenname
  worksheet.mergeCells('C2:H2');
  worksheet.getCell('C2').value = 'Doppelbauer Bioenergie GbR, Dorfstr. 8a, 86733 Alerheim-Bühl';
  worksheet.getCell('C2').font = { size: 14, bold: true };

  // Zeile 4: Titel & Datum
  worksheet.getCell('B4').value = 'Mais 2025';
  worksheet.getCell('B4').font = { bold: true, size: 12 };
  worksheet.getCell('C4').value = 'Vom 17.09 - 20.09.2025';

  // Zeile 6/7: Tabellen-Header
  const headerRow = worksheet.getRow(6);
  headerRow.values = [
    '', 'Schlag ID', 'Name', 'Ort', 'Schlag', 'Größe', '', 'Summe', 'Ertrag to', 'to/FM', 'TS', 'dz/TM', 'dz/TM'
  ];
  const subHeaderRow = worksheet.getRow(7);
  subHeaderRow.values = [
    '', '', '', '', '', 'ha', '', '', 'FM/Gesamt', 'ha', 'Gehalt', 'Gesamt', 'ha'
  ];
  
  [headerRow, subHeaderRow].forEach(row => {
    row.font = { bold: true };
    row.alignment = centerStyle;
  });

  // Trennlinie unter Header
  subHeaderRow.border = borderStyle;

  // --- DATEN RENDERN ---
  let currentRow = 9;
  let lastFarmer = "";
  let farmerSumFM = 0;

  data.forEach((item, index) => {
    // Wenn Landwirt wechselt (und es nicht der erste ist), Summenzeile einfügen
    if (lastFarmer !== "" && lastFarmer !== item.Name) {
      worksheet.getCell(`G${currentRow}`).value = farmerSumFM.toLocaleString('de-DE', {minimumFractionDigits: 2});
      worksheet.getCell(`G${currentRow}`).font = { bold: true };
      farmerSumFM = 0;
      currentRow++;
    }

    const row = worksheet.getRow(currentRow);
    row.values = [
      '',
      item.Schlag_ID,
      `${item.Name} ${item.Vorname}`,
      item.Ort || "Wörnitzostheim", // Fallback falls Ort fehlt
      item.Schlag_Name,
      item.Größe,
      item.Sorte,
      '', // Summen-Spalte
      item.Ertrag,
      item.Feuchtmasse,
      item.TS_Gehlat, // Deine Typo-Variable
      item.Trockenmasse,
      item.Trockenmasse_pro_ha
    ];

    farmerSumFM += item.Ertrag;
    lastFarmer = item.Name;
    currentRow++;
  });

  // Letzte Summe für den letzten Landwirt
  worksheet.getCell(`G${currentRow}`).value = farmerSumFM;
  worksheet.getCell(`G${currentRow}`).font = { bold: true };

  // --- EXPORT ---
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    'attachment; filename=' + 'Erntebericht_2025.xlsx'
  );

  await workbook.xlsx.write(res);
  res.end();
}