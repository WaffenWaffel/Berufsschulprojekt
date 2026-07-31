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

Wenn sich `Server/prisma/schema.prisma` geändert hat, reichen die vorhandenen
Dateien nicht aus — es fehlen sonst sowohl die Datenbankspalten als auch die
passenden TypeScript-Typen:

```bash
npm install --prefix Server        # erzeugt über postinstall den Prisma-Client neu
npm run db:migrate --prefix Server # wendet neue Migrationen an
```

Wird der erste Schritt vergessen, bricht der Server beim Start mit
TypeScript-Fehlern der Art `Property 'xyz' does not exist on type ...` ab. Der
Prisma-Client unter `node_modules/.prisma/client` wird aus dem Schema generiert
und liegt bewusst nicht im Repository.

## Nützliche Befehle

| Befehl | Wirkung |
| --- | --- |
| `npm run dev` | Client und Server zusammen starten |
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
kommen alle offenen Abgaben des gewählten Kunden auf den Schein und werden als
abgerechnet markiert — sie erscheinen dadurch auf keinem weiteren Schein mehr
und lassen sich nicht mehr ändern oder löschen. Die Lieferschein-Nummer wird
fortlaufend vergeben. Ohne ausgewählte Analyse wird die aktuellste abgedruckt.
