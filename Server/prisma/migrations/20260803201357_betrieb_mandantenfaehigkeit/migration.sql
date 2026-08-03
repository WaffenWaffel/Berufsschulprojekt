-- Mandantenfähigkeit: alle fachlichen Daten hängen künftig an einem Betrieb.
--
-- Reihenfolge ist hier entscheidend. Prisma würde "betriebId INTEGER NOT NULL"
-- direkt anfügen, was an jeder Tabelle mit Bestandsdaten scheitert. Deshalb:
-- Betrieb anlegen, Spalte nullable ergänzen, vorhandene Zeilen zuordnen und
-- erst dann auf NOT NULL setzen.

-- 1. Mandantentabelle
CREATE TABLE "Betrieb" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "strasse" TEXT NOT NULL,
    "plz" TEXT NOT NULL,
    "ort" TEXT NOT NULL,
    "ustIdNr" TEXT,
    "ansprechpartner" TEXT,
    "telefon" TEXT,
    "email" TEXT,
    "aktiv" BOOLEAN NOT NULL DEFAULT true,
    "erstelltAm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Betrieb_pkey" PRIMARY KEY ("id")
);

-- 2. Bestandsbetrieb aus den bisher fest im Code hinterlegten Firmendaten.
--    Nur einfügen, wenn überhaupt Daten vorhanden sind - auf einer leeren
--    Datenbank soll kein Beispielbetrieb entstehen.
INSERT INTO "Betrieb" ("name", "strasse", "plz", "ort", "ustIdNr", "ansprechpartner", "telefon", "email")
SELECT 'Doppelbauer Bioenergie GbR', 'Dorfstr. 8a', '86733', 'Alerheim - Bühl',
       'DE123456789', 'Siegfried Doppelbauer', '0175-2973973', 'sdoppelbauer@gmx.de'
WHERE EXISTS (SELECT 1 FROM "GuelleKunden")
   OR EXISTS (SELECT 1 FROM "Analyse")
   OR EXISTS (SELECT 1 FROM "Erzeuger");

-- 3. Spalten zunächst nullable ergänzen
ALTER TABLE "Erzeuger"     ADD COLUMN "betriebId" INTEGER;
ALTER TABLE "Schlag"       ADD COLUMN "betriebId" INTEGER;
ALTER TABLE "Sorte"        ADD COLUMN "betriebId" INTEGER;
ALTER TABLE "Waegung"      ADD COLUMN "betriebId" INTEGER;
ALTER TABLE "GuelleKunden" ADD COLUMN "betriebId" INTEGER;
ALTER TABLE "GuelleAbgabe" ADD COLUMN "betriebId" INTEGER;
ALTER TABLE "Analyse"      ADD COLUMN "betriebId" INTEGER;
ALTER TABLE "Lieferschein" ADD COLUMN "betriebId" INTEGER;

-- 4. Alle vorhandenen Zeilen dem ersten Betrieb zuordnen
UPDATE "Erzeuger"     SET "betriebId" = (SELECT MIN("id") FROM "Betrieb") WHERE "betriebId" IS NULL;
UPDATE "Schlag"       SET "betriebId" = (SELECT MIN("id") FROM "Betrieb") WHERE "betriebId" IS NULL;
UPDATE "Sorte"        SET "betriebId" = (SELECT MIN("id") FROM "Betrieb") WHERE "betriebId" IS NULL;
UPDATE "Waegung"      SET "betriebId" = (SELECT MIN("id") FROM "Betrieb") WHERE "betriebId" IS NULL;
UPDATE "GuelleKunden" SET "betriebId" = (SELECT MIN("id") FROM "Betrieb") WHERE "betriebId" IS NULL;
UPDATE "GuelleAbgabe" SET "betriebId" = (SELECT MIN("id") FROM "Betrieb") WHERE "betriebId" IS NULL;
UPDATE "Analyse"      SET "betriebId" = (SELECT MIN("id") FROM "Betrieb") WHERE "betriebId" IS NULL;
UPDATE "Lieferschein" SET "betriebId" = (SELECT MIN("id") FROM "Betrieb") WHERE "betriebId" IS NULL;

-- 5. Jetzt ist die Spalte überall befüllt und kann zur Pflicht werden
ALTER TABLE "Erzeuger"     ALTER COLUMN "betriebId" SET NOT NULL;
ALTER TABLE "Schlag"       ALTER COLUMN "betriebId" SET NOT NULL;
ALTER TABLE "Sorte"        ALTER COLUMN "betriebId" SET NOT NULL;
ALTER TABLE "Waegung"      ALTER COLUMN "betriebId" SET NOT NULL;
ALTER TABLE "GuelleKunden" ALTER COLUMN "betriebId" SET NOT NULL;
ALTER TABLE "GuelleAbgabe" ALTER COLUMN "betriebId" SET NOT NULL;
ALTER TABLE "Analyse"      ALTER COLUMN "betriebId" SET NOT NULL;
ALTER TABLE "Lieferschein" ALTER COLUMN "betriebId" SET NOT NULL;

-- 6. Bisher global eindeutige Felder werden je Betrieb eindeutig.
--    Ohne diesen Schritt könnte ein zweiter Betrieb keinen Lieferschein Nr. 1
--    anlegen und keine Sorte "Silomais" führen.
DROP INDEX "Erzeuger_erzeugerId_key";
DROP INDEX "Lieferschein_nummer_key";
DROP INDEX "Schlag_schlagIdExt_key";
DROP INDEX "Sorte_name_key";
DROP INDEX "Sorte_sorteId_key";
DROP INDEX "Waegung_wsNr_key";

CREATE INDEX "Analyse_betriebId_idx" ON "Analyse"("betriebId");
CREATE INDEX "Erzeuger_betriebId_idx" ON "Erzeuger"("betriebId");
CREATE UNIQUE INDEX "Erzeuger_betriebId_erzeugerId_key" ON "Erzeuger"("betriebId", "erzeugerId");
CREATE INDEX "GuelleAbgabe_betriebId_idx" ON "GuelleAbgabe"("betriebId");
CREATE INDEX "GuelleKunden_betriebId_idx" ON "GuelleKunden"("betriebId");
CREATE INDEX "Lieferschein_betriebId_idx" ON "Lieferschein"("betriebId");
CREATE UNIQUE INDEX "Lieferschein_betriebId_nummer_key" ON "Lieferschein"("betriebId", "nummer");
CREATE INDEX "Schlag_betriebId_idx" ON "Schlag"("betriebId");
CREATE UNIQUE INDEX "Schlag_betriebId_schlagIdExt_key" ON "Schlag"("betriebId", "schlagIdExt");
CREATE INDEX "Sorte_betriebId_idx" ON "Sorte"("betriebId");
CREATE UNIQUE INDEX "Sorte_betriebId_sorteId_key" ON "Sorte"("betriebId", "sorteId");
CREATE UNIQUE INDEX "Sorte_betriebId_name_key" ON "Sorte"("betriebId", "name");
CREATE INDEX "Waegung_betriebId_idx" ON "Waegung"("betriebId");
CREATE UNIQUE INDEX "Waegung_betriebId_wsNr_key" ON "Waegung"("betriebId", "wsNr");

-- 7. Fremdschlüssel
ALTER TABLE "Erzeuger"     ADD CONSTRAINT "Erzeuger_betriebId_fkey"     FOREIGN KEY ("betriebId") REFERENCES "Betrieb"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Schlag"       ADD CONSTRAINT "Schlag_betriebId_fkey"       FOREIGN KEY ("betriebId") REFERENCES "Betrieb"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Sorte"        ADD CONSTRAINT "Sorte_betriebId_fkey"        FOREIGN KEY ("betriebId") REFERENCES "Betrieb"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Waegung"      ADD CONSTRAINT "Waegung_betriebId_fkey"      FOREIGN KEY ("betriebId") REFERENCES "Betrieb"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GuelleKunden" ADD CONSTRAINT "GuelleKunden_betriebId_fkey" FOREIGN KEY ("betriebId") REFERENCES "Betrieb"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GuelleAbgabe" ADD CONSTRAINT "GuelleAbgabe_betriebId_fkey" FOREIGN KEY ("betriebId") REFERENCES "Betrieb"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Analyse"      ADD CONSTRAINT "Analyse_betriebId_fkey"      FOREIGN KEY ("betriebId") REFERENCES "Betrieb"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Lieferschein" ADD CONSTRAINT "Lieferschein_betriebId_fkey" FOREIGN KEY ("betriebId") REFERENCES "Betrieb"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
