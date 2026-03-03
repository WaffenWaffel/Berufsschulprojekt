/*
  Warnings:

  - You are about to drop the column `datum` on the `Schlag` table. All the data in the column will be lost.
  - You are about to drop the column `ertragTo` on the `Schlag` table. All the data in the column will be lost.
  - You are about to drop the column `feuchtmasse` on the `Schlag` table. All the data in the column will be lost.
  - You are about to drop the column `ort` on the `Schlag` table. All the data in the column will be lost.
  - You are about to drop the column `schlagIdExternal` on the `Schlag` table. All the data in the column will be lost.
  - You are about to drop the column `schlagName` on the `Schlag` table. All the data in the column will be lost.
  - You are about to drop the column `sorte` on the `Schlag` table. All the data in the column will be lost.
  - You are about to drop the column `trockenmasse` on the `Schlag` table. All the data in the column will be lost.
  - You are about to drop the column `trockenmasseProHa` on the `Schlag` table. All the data in the column will be lost.
  - You are about to drop the column `tsGehalt` on the `Schlag` table. All the data in the column will be lost.
  - You are about to drop the column `vorname` on the `Schlag` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[schlagIdExt]` on the table `Schlag` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `erzeugerId` to the `Schlag` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schlagIdExt` to the `Schlag` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Schlag_schlagIdExternal_key";

-- AlterTable
ALTER TABLE "Schlag" DROP COLUMN "datum",
DROP COLUMN "ertragTo",
DROP COLUMN "feuchtmasse",
DROP COLUMN "ort",
DROP COLUMN "schlagIdExternal",
DROP COLUMN "schlagName",
DROP COLUMN "sorte",
DROP COLUMN "trockenmasse",
DROP COLUMN "trockenmasseProHa",
DROP COLUMN "tsGehalt",
DROP COLUMN "vorname",
ADD COLUMN     "erzeugerId" INTEGER NOT NULL,
ADD COLUMN     "schlagIdExt" INTEGER NOT NULL,
ALTER COLUMN "groesseHa" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Erzeuger" (
    "id" SERIAL NOT NULL,
    "erzeugerId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "strasse" TEXT,
    "ort" TEXT,
    "plz" TEXT,

    CONSTRAINT "Erzeuger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sorte" (
    "id" SERIAL NOT NULL,
    "sorteId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Sorte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Waegung" (
    "id" SERIAL NOT NULL,
    "wsNr" INTEGER NOT NULL,
    "datum" TIMESTAMP(3) NOT NULL,
    "uhrzeit" TEXT NOT NULL,
    "netto" DOUBLE PRECISION NOT NULL,
    "kennzeichen1" TEXT,
    "kennzeichen2" TEXT,
    "tsGehalt" DOUBLE PRECISION,
    "schlagId" INTEGER NOT NULL,
    "sorteId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Waegung_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuelleKunden" (
    "id" SERIAL NOT NULL,
    "kundenNr" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "vorname" TEXT NOT NULL,
    "plz" INTEGER NOT NULL,
    "wohnort" TEXT NOT NULL,
    "strasse" TEXT NOT NULL,
    "hNr" TEXT NOT NULL,

    CONSTRAINT "GuelleKunden_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Analyse" (
    "id" SERIAL NOT NULL,
    "stickstoff" DOUBLE PRECISION NOT NULL,
    "amoniumstickstoff" DOUBLE PRECISION NOT NULL,
    "phosphat" DOUBLE PRECISION NOT NULL,
    "kalium" DOUBLE PRECISION NOT NULL,
    "datum" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Analyse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Erzeuger_erzeugerId_key" ON "Erzeuger"("erzeugerId");

-- CreateIndex
CREATE UNIQUE INDEX "Sorte_sorteId_key" ON "Sorte"("sorteId");

-- CreateIndex
CREATE UNIQUE INDEX "Waegung_wsNr_key" ON "Waegung"("wsNr");

-- CreateIndex
CREATE UNIQUE INDEX "GuelleKunden_kundenNr_key" ON "GuelleKunden"("kundenNr");

-- CreateIndex
CREATE UNIQUE INDEX "Schlag_schlagIdExt_key" ON "Schlag"("schlagIdExt");

-- AddForeignKey
ALTER TABLE "Schlag" ADD CONSTRAINT "Schlag_erzeugerId_fkey" FOREIGN KEY ("erzeugerId") REFERENCES "Erzeuger"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Waegung" ADD CONSTRAINT "Waegung_schlagId_fkey" FOREIGN KEY ("schlagId") REFERENCES "Schlag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Waegung" ADD CONSTRAINT "Waegung_sorteId_fkey" FOREIGN KEY ("sorteId") REFERENCES "Sorte"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
