/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Sorte` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "GuelleAbgabe" (
    "id" SERIAL NOT NULL,
    "datum" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "menge" DOUBLE PRECISION NOT NULL,
    "bemerkung" TEXT,
    "guelleKundeId" INTEGER NOT NULL,

    CONSTRAINT "GuelleAbgabe_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Sorte_name_key" ON "Sorte"("name");

-- AddForeignKey
ALTER TABLE "GuelleAbgabe" ADD CONSTRAINT "GuelleAbgabe_guelleKundeId_fkey" FOREIGN KEY ("guelleKundeId") REFERENCES "GuelleKunden"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
