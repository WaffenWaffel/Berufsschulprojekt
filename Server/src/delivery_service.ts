import puppeteer from 'puppeteer';

// Deine festen Backend-Daten
const MY_COMPANY = {
  name: "Doppelbauer Bioenergie GbR",
  address: "Beispielstraße 1, 12345 Berlin",
  email: "logistik@beispiel.de"
};

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
  customerName: string;
  customerAddress: string;
  items: DeliveryItem[];
  analysis: AnalysisItem[];
}

export async function generateDeliveryNotePdf(data: DeliveryRequest): Promise<Buffer> {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const totalAmount = data.items.reduce((sum, item) => sum + item.menge, 0);

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
            Doppelbauer Bioenergie GbR
            <span>Dorfstr. 8a, 86733 Alerheim - Bühl</span>
          </div>
          <div style="font-size: 16pt; font-weight: bold;">Lieferschein</div>
        </div>

        <div class="recipient-section">
          <div>
            <strong>Empfänger:</strong><br><br>
            <div style="font-size: 11pt; font-weight: bold;">${data.customerName}</div>
            ${data.customerAddress.replace(',', '<br>')}
          </div>
          <div class="delivery-number">Lieferschein Nr. &nbsp; 001</div>
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
                ${data.items.map(i => i.menge).join('<br>')}
              </td>
              <td style="text-align: center;">
                ${data.items.map(() => 'cbm').join('<br>')}
              </td>
            </tr>
            <tr class="sum-row">
              <td style="text-align: right; padding-right: 20px;">Summe</td>
              <td style="text-align: center;">${totalAmount}</td>
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
            <strong>Doppelbauer Bioenergie GbR</strong><br>
            Dorfstr. 8a, 86733 Alerheim - Bühl<br>Ust.-IdNr. DE123456789
          </div>
          <div style="text-align: right;">
            <strong>Kontakt</strong><br>
            Siegfried Doppelbauer<br>Mobil: 0175-2973973<br>sdoppelbauer@gmx.de
          </div>
        </div>
      </body>
    </html>
  `;

  await page.setContent(htmlContent);
  const pdfBuffer = await page.pdf({ format: 'A4' });

  await browser.close();
  return Buffer.from(pdfBuffer);
}