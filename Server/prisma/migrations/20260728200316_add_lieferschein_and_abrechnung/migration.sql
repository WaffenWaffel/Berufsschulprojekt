-- AlterTable
ALTER TABLE "Analyse" ALTER COLUMN "datum" SET DATA TYPE DATE;

-- AlterTable
ALTER TABLE "GuelleAbgabe" ADD COLUMN     "abgerechnetAm" TIMESTAMP(3),
ADD COLUMN     "lieferscheinId" INTEGER,
ALTER COLUMN "datum" SET DATA TYPE DATE;

-- AlterTable
ALTER TABLE "GuelleKunden" ALTER COLUMN "plz" SET DATA TYPE TEXT;

-- CreateTable
CREATE TABLE "Lieferschein" (
    "id" SERIAL NOT NULL,
    "nummer" INTEGER NOT NULL,
    "erstelltAm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guelleKundeId" INTEGER NOT NULL,

    CONSTRAINT "Lieferschein_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LieferscheinAnalyse" (
    "lieferscheinId" INTEGER NOT NULL,
    "analyseId" INTEGER NOT NULL,

    CONSTRAINT "LieferscheinAnalyse_pkey" PRIMARY KEY ("lieferscheinId","analyseId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Lieferschein_nummer_key" ON "Lieferschein"("nummer");

-- CreateIndex
CREATE INDEX "GuelleAbgabe_guelleKundeId_abgerechnetAm_idx" ON "GuelleAbgabe"("guelleKundeId", "abgerechnetAm");

-- AddForeignKey
ALTER TABLE "GuelleAbgabe" ADD CONSTRAINT "GuelleAbgabe_lieferscheinId_fkey" FOREIGN KEY ("lieferscheinId") REFERENCES "Lieferschein"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lieferschein" ADD CONSTRAINT "Lieferschein_guelleKundeId_fkey" FOREIGN KEY ("guelleKundeId") REFERENCES "GuelleKunden"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LieferscheinAnalyse" ADD CONSTRAINT "LieferscheinAnalyse_lieferscheinId_fkey" FOREIGN KEY ("lieferscheinId") REFERENCES "Lieferschein"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LieferscheinAnalyse" ADD CONSTRAINT "LieferscheinAnalyse_analyseId_fkey" FOREIGN KEY ("analyseId") REFERENCES "Analyse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
