-- CreateEnum
CREATE TYPE "Rolle" AS ENUM ('INHABER', 'MITARBEITER');

-- CreateTable
CREATE TABLE "Benutzer" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "passwortHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rolle" "Rolle" NOT NULL DEFAULT 'MITARBEITER',
    "aktiv" BOOLEAN NOT NULL DEFAULT true,
    "passwortWechseln" BOOLEAN NOT NULL DEFAULT false,
    "erstelltAm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "letzterLogin" TIMESTAMP(3),
    "betriebId" INTEGER NOT NULL,

    CONSTRAINT "Benutzer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sitzung" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "laeuftAb" TIMESTAMP(3) NOT NULL,
    "erstelltAm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "letzterZugriff" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "benutzerId" INTEGER NOT NULL,

    CONSTRAINT "Sitzung_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Benutzer_betriebId_idx" ON "Benutzer"("betriebId");

-- CreateIndex
CREATE UNIQUE INDEX "Benutzer_betriebId_email_key" ON "Benutzer"("betriebId", "email");

-- CreateIndex
CREATE INDEX "Sitzung_benutzerId_idx" ON "Sitzung"("benutzerId");

-- CreateIndex
CREATE INDEX "Sitzung_laeuftAb_idx" ON "Sitzung"("laeuftAb");

-- AddForeignKey
ALTER TABLE "Benutzer" ADD CONSTRAINT "Benutzer_betriebId_fkey" FOREIGN KEY ("betriebId") REFERENCES "Betrieb"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sitzung" ADD CONSTRAINT "Sitzung_benutzerId_fkey" FOREIGN KEY ("benutzerId") REFERENCES "Benutzer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

