import puppeteer from 'puppeteer';

/**
 * Absenderdaten des ausstellenden Betriebs. Standen früher fest im Code -
 * seit der Mandantenfähigkeit kommen sie aus der Betrieb-Tabelle, damit jeder
 * Betrieb seinen eigenen Briefkopf bekommt.
 */
export interface BetriebsAbsender {
  name: string;
  strasse: string;
  plz: string;
  ort: string;
  ustIdNr?: string | null;
  ansprechpartner?: string | null;
  telefon?: string | null;
  email?: string | null;
}

interface DeliveryItem {
  menge: number;
  datum: string;
}

interface AnalysisItem {
    datum: string;
    gesamtStickstoff: number;
    amoniumStickstoff: number;
    phosphat: number;
    kalium: number;
  }

interface DeliveryRequest {
  betrieb: BetriebsAbsender;
  lieferscheinNummer: number;
  customerName: string;
  customerAddress: string;
  items: DeliveryItem[];
  analysis: AnalysisItem[];
}

export async function generateDeliveryNotePdf(data: DeliveryRequest): Promise<Buffer> {
  const htmlContent = buildDeliveryNoteHtml(data);

  // --no-sandbox wird in Container-Umgebungen (Docker, Render) benötigt,
  // dort läuft Chromium sonst nicht an.
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(htmlContent);
    const pdfBuffer = await page.pdf({ format: 'A4' });
    return Buffer.from(pdfBuffer);
  } finally {
    // auch bei einem Fehler schließen, sonst bleibt ein Chromium-Prozess übrig
    await browser.close();
  }
}

/**
 * Maskiert Text, der in das HTML des Lieferscheins eingesetzt wird. Betriebs-
 * und Kundendaten stammen aus der Datenbank; ohne Maskierung würde ein
 * Zeichen wie & oder < das Dokument zerlegen.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Mengen im deutschen Format ausgeben (Komma als Dezimaltrenner). */
function mengeFormatiert(wert: number): string {
  return wert.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Baut das HTML des Lieferscheins. Bewusst von der PDF-Erzeugung getrennt,
 * damit sich der Inhalt ohne laufenden Browser prüfen lässt.
 */
export function buildDeliveryNoteHtml(data: DeliveryRequest): string {
  // Fließkomma-Summen runden (0.1 + 0.2 = 0.30000000000000004)
  const totalAmount = Math.round(data.items.reduce((sum, item) => sum + item.menge, 0) * 100) / 100;
  const nummerFormatiert = String(data.lieferscheinNummer).padStart(3, '0');
  const b = data.betrieb;
  const anschrift = `${b.strasse}, ${b.plz} ${b.ort}`;
  // Nur ausgeben, was gepflegt ist - sonst stehen leere Zeilen auf dem Schein
  const zeile = (text?: string | null) => (text ? `${escapeHtml(text)}<br>` : '');

  // HTML Template mit deinen festen und den dynamischen Daten
  const analysisHtml = data.analysis.map((an, index) => `
    <div class="analysis-card">
      <div class="analysis-title">Biogasgärrest ${data.analysis.length > 1 ? (index + 1) : ''}</div>
      <div class="analysis-date">nach Analyse vom ${an.datum}</div>
      <table class="analysis-table">
        <tr><td>Gesamtstickstoff</td><td>${an.gesamtStickstoff.toLocaleString('de-DE')}</td><td>kg/cbm</td></tr>
        <tr><td>Amoniumstickstoff</td><td>${an.amoniumStickstoff.toLocaleString('de-DE')}</td><td>kg/cbm</td></tr>
        <tr><td>Phosphat</td><td>${an.phosphat.toLocaleString('de-DE')}</td><td>kg/cbm</td></tr>
        <tr><td>Kalium</td><td>${an.kalium.toLocaleString('de-DE')}</td><td>kg/cbm</td></tr>
      </table>
    </div>
  `).join('');

  const htmlContent = `
    <html>
      <head>
        <style>
          body { font-family: "Helvetica", "Arial", sans-serif; font-size: 10pt; line-height: 1.3; padding: 40px; color: #333; }
          
          /* Header & Firmendaten */
          .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .my-company { font-weight: bold; font-size: 13pt; }
          .my-company span { display: block; font-weight: normal; font-size: 9pt; color: #666; font-style: italic; }
          
          .recipient-section { margin-bottom: 40px; display: flex; justify-content: space-between; align-items: flex-start; }
          .delivery-number { font-weight: bold; border: 1px solid #000; padding: 5px 15px; }

          /* NEU: Grid für die Analysen */
          .analysis-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; /* Zwei Spalten */
            gap: 20px; 
            margin-bottom: 30px; 
          }
          .analysis-card { border: 0px solid #eee; }
          .analysis-title { font-weight: bold; font-size: 10pt; text-decoration: underline; }
          .analysis-date { font-style: italic; font-size: 9pt; margin-bottom: 5px; }
          .analysis-table { width: 100%; font-size: 9pt; border-collapse: collapse; }
          .analysis-table td { padding: 1px 0; }
          .analysis-table td:nth-child(2) { text-align: right; padding-right: 10px; font-weight: bold; }

          /* Haupttabelle */
          .main-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid #000; }
          .main-table th { background-color: #d9e1f2; border: 1px solid #000; padding: 6px; text-align: left; }
          .main-table td { border-left: 1px solid #000; border-right: 1px solid #000; padding: 6px; }
          .row-content { min-height: 120px; vertical-align: top; }
          .sum-row { font-weight: bold; border-top: 1px solid #000; background-color: #f9f9f9; }

          /* Footer & Unterschrift */
          .footer { position: absolute; bottom: 40px; left: 40px; right: 40px; border-top: 0.5px solid #999; padding-top: 10px; font-size: 8pt; display: flex; justify-content: space-between; color: #555; }
          .signature-area { margin-top: 40px; }
          .signature-line { border-top: 1px solid #000; width: 200px; margin-top: 40px; font-size: 9pt; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="my-company">
            ${escapeHtml(b.name)}
            <span>${escapeHtml(anschrift)}</span>
          </div>
          <div style="font-size: 16pt; font-weight: bold;">Lieferschein</div>
        </div>

        <div class="recipient-section">
          <div>
            <strong>Empfänger:</strong><br><br>
            <div style="font-size: 11pt; font-weight: bold;">${escapeHtml(data.customerName)}</div>
            ${escapeHtml(data.customerAddress).replace(',', '<br>')}
          </div>
          <div class="delivery-number">Lieferschein Nr. &nbsp; ${nummerFormatiert}</div>
        </div>

        <div class="analysis-grid">
          ${analysisHtml}
        </div>

        <table class="main-table">
          <thead>
            <tr>
              <th style="width: 60%;">Gärrestabholung</th>
              <th style="width: 20%; text-align: center;">Anzahl</th>
              <th style="width: 20%; text-align: center;">Einheit</th>
            </tr>
          </thead>
          <tbody>
            <tr class="row-content">
              <td>
                ${data.items.map(i => `Abholung am ${i.datum}`).join('<br>')}
              </td>
              <td style="text-align: center;">
                ${data.items.map(i => mengeFormatiert(i.menge)).join('<br>')}
              </td>
              <td style="text-align: center;">
                ${data.items.map(() => 'cbm').join('<br>')}
              </td>
            </tr>
            <tr class="sum-row">
              <td style="text-align: right; padding-right: 20px;">Summe</td>
              <td style="text-align: center;">${mengeFormatiert(totalAmount)}</td>
              <td style="text-align: center;">cbm</td>
            </tr>
          </tbody>
        </table>

        <div class="signature-area">
          <p>Waren ordnungsgemäß erhalten</p>
          <div class="signature-line">Unterschrift</div>
        </div>

        <div class="footer">
          <div>
            <strong>${escapeHtml(b.name)}</strong><br>
            ${escapeHtml(anschrift)}<br>${b.ustIdNr ? 'Ust.-IdNr. ' + escapeHtml(b.ustIdNr) : ''}
          </div>
          <div style="text-align: right;">
            <strong>Kontakt</strong><br>
            ${zeile(b.ansprechpartner)}${b.telefon ? 'Mobil: ' + escapeHtml(b.telefon) + '<br>' : ''}${escapeHtml(b.email ?? '')}
          </div>
        </div>
      </body>
    </html>
  `;

  return htmlContent;
}