-- CreateTable
CREATE TABLE "Schlag" (
    "id" SERIAL NOT NULL,
    "schlagIdExternal" INTEGER NOT NULL,
    "schlagName" TEXT NOT NULL,
    "vorname" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ort" TEXT,
    "groesseHa" DOUBLE PRECISION NOT NULL,
    "ertragTo" DOUBLE PRECISION NOT NULL,
    "feuchtmasse" DOUBLE PRECISION NOT NULL,
    "tsGehalt" DOUBLE PRECISION NOT NULL,
    "trockenmasse" DOUBLE PRECISION NOT NULL,
    "trockenmasseProHa" DOUBLE PRECISION NOT NULL,
    "sorte" TEXT NOT NULL DEFAULT 'Mais',
    "datum" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Schlag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Schlag_schlagIdExternal_key" ON "Schlag"("schlagIdExternal");
