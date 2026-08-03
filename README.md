# Biogas-Verwaltung

Webanwendung für einen Biogasbetrieb: Gülle-Lieferscheine erfassen und als PDF
ausgeben, Futterauswertung und Waagedatensätze einsehen.

| Bereich | Technik |
| --- | --- |
| Client | React 19, Vite, TypeScript, Tailwind 4, shadcn/ui |
| Server | Express 5, Prisma 7, PostgreSQL |
| PDF / Excel | Puppeteer, ExcelJS |

## Voraussetzungen

- Node.js 20 oder neuer
- PostgreSQL (lokal oder als Dienst erreichbar)

## Einrichtung

**1. Abhängigkeiten installieren** (drei Ordner, jeder hat eine eigene `package.json`):

```bash
npm install
npm install --prefix Client
npm install --prefix Server
```

**2. Datenbankverbindung hinterlegen.** Datei `Server/.env` anlegen:

```
DATABASE_URL="postgresql://BENUTZER:PASSWORT@localhost:5432/biogas"
```

Die Datei ist in `.gitignore` und gehört nicht ins Repository.

**3. Datenbankschema anlegen:**

```bash
npm run db:migrate --prefix Server
```

**4. Starten** (Client und Server gleichzeitig):

```bash
npm run dev
```

- Client: http://localhost:5173
- Server: http://localhost:3001

## Nach einem `git pull`

Wenn sich `Server/prisma/schema.prisma` geändert hat, braucht es einen Schritt
von Hand — die Datenbank bekommt neue Spalten nicht von allein:

```bash
npm run db:migrate --prefix Server
```

Die passenden TypeScript-Typen erzeugt das Projekt selbst: `npm run dev` löst
über das `predev`-Script vorher `prisma generate` aus, ebenso jedes
`npm install` über `postinstall`. Der Prisma-Client unter
`node_modules/.prisma/client` wird aus dem Schema generiert und liegt bewusst
nicht im Repository — deshalb muss er nach jeder Schemaänderung neu entstehen.

Wird `db:migrate` vergessen, startet der Server zwar, liefert beim ersten
Zugriff auf die Datenbank aber einen Fehler über fehlende Spalten.

## Betriebe (Mandanten)

Alle fachlichen Daten gehören zu genau einem Betrieb. Ein Betrieb sieht
ausschließlich seine eigenen Kunden, Abgaben, Analysen und Lieferscheine;
jeder hat einen eigenen Lieferschein-Nummernkreis, der bei 1 beginnt, und
seinen eigenen Briefkopf auf dem PDF.

```bash
npm run betrieb:liste --prefix Server    # vorhandene Betriebe anzeigen
npm run betrieb:neu   --prefix Server -- "Name" "Straße" "PLZ" "Ort" [UstIdNr] [Ansprechpartner] [Telefon] [E-Mail]
```

Welcher Betrieb angezeigt wird, steuert vorerst `BETRIEB_ID` in `Server/.env`:

```
BETRIEB_ID=1
```

Das ist eine Übergangslösung, bis die Anmeldung eingebaut ist — danach ergibt
sich der Betrieb aus dem angemeldeten Benutzer. Der Entwurf dazu steht in
[docs/LOGIN-ENTWURF.md](docs/LOGIN-ENTWURF.md).

## Produktivbetrieb

Für den Betrieb auf einem eigenen Server (Hetzner o.ä.) siehe
[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — Serverempfehlung, Einrichtung
Schritt für Schritt, Updates und Backups.

Kurzfassung: `npm run build` baut Client und Server, `npm start` startet den
Server, der dann auch das gebaute Frontend ausliefert. Ein separater
Vite-Prozess ist in Produktion nicht nötig.

**Achtung:** Die Anwendung hat keine Zugriffskontrolle. Ohne vorgelagerten
Passwortschutz gehören keine echten Kundendaten ins offene Internet.

## Nützliche Befehle

| Befehl | Wirkung |
| --- | --- |
| `npm run dev` | Client und Server zusammen starten (erzeugt den Prisma-Client vorher neu) |
| `npm run dev:client` / `npm run dev:server` | nur eine Seite starten |
| `npm run db:migrate --prefix Server` | ausstehende Migrationen anwenden |
| `npm run db:studio --prefix Server` | Prisma Studio zum Betrachten der Daten |
| `npm run import-csv --prefix Server` | Waagedaten aus CSV importieren |
| `npm run build` | Client für die Produktion bauen |

## Aufbau

```
Client/src/components/
  guelleLieferscheine/   Seite "Gülle Lieferscheine"
  futterauswertung/      Seite "Futterauswertung"
  waagendatensaetze/     Seite "Waagendatensätze"
  ui/                    shadcn/ui-Komponenten
Server/src/
  index.ts               Express-App, Einstiegspunkt
  routes/                Routen nach Themengebiet
  lib/                   Prisma-Client, Validierung
  delivery_service.ts    Lieferschein-PDF (Puppeteer)
  yield_service.ts       Excel-Export (ExcelJS)
Server/prisma/
  schema.prisma          Datenmodell
  migrations/            Änderungsverlauf des Schemas
```

## Stand der Bereiche

| Seite | Datenbank | Anmerkung |
| --- | --- | --- |
| Gülle Lieferscheine | ja | vollständig: Kunden, Analysen, Abgaben, Lieferscheine |
| Futterauswertung | nein | liefert noch Testdaten aus `Server/src/testdaten.ts` |
| Waagendatensätze | nein | liefert noch Testdaten; Tabellen und CSV-Import existieren bereits |

## Lieferscheine

Eine erfasste Abgabe ist zunächst **offen**. Beim Erstellen eines Lieferscheins
kommen die offenen Abgaben des gewählten Kunden auf den Schein und werden als
abgerechnet markiert — sie erscheinen dadurch auf keinem weiteren Schein mehr
und lassen sich nicht mehr ändern oder löschen. Die Lieferschein-Nummer wird
fortlaufend vergeben. Ohne ausgewählte Analyse wird die aktuellste abgedruckt.

**Zeitraum.** Über die Felder *Von* und *Bis* lässt sich einschränken, welche
Abgaben auf den Schein kommen — etwa für eine quartalsweise Abrechnung. Bleiben
beide leer, werden wie bisher alle offenen Abgaben abgerechnet. Unter den
Feldern steht jeweils, wie viele Abgaben und wie viel m³ der aktuellen Auswahl
entsprechen; gibt es keine Treffer, ist der Button gesperrt.

**Freischalten.** Eine abgerechnete Abgabe lässt sich über das Schloss-Symbol in
der Tabelle wieder öffnen. Weil der Lieferschein zu diesem Zeitpunkt bereits
gedruckt sein kann, weist der Dialog ausdrücklich darauf hin, dass Papier und
gespeicherte Daten danach auseinanderlaufen. Zur Auswahl stehen:

- **Nur diese Abgabe** — gibt eine einzelne Position wieder frei
- **Ganzen Lieferschein zurücknehmen** — gibt alle Positionen des Scheins frei
  (erscheint nur, wenn der Schein mehr als eine Position hat)

Freigegebene Abgaben sind wieder änderbar und kommen auf den nächsten Schein.
Ein Lieferschein wird nie gelöscht: Verliert er alle Positionen, bleibt seine
Nummer erhalten und er wird als storniert vermerkt, damit die Nummernfolge
lückenlos nachvollziehbar bleibt.

## Tabelle filtern

Über der Abgaben-Tabelle stehen ein Textfeld für den Kunden und eine Auswahl
für das Jahr. Beide wirken zusammen, und die Summenzeile am Ende der Tabelle
rechnet immer nur die sichtbaren Zeilen zusammen. Die Jahresliste entsteht
automatisch aus den vorhandenen Datensätzen.
