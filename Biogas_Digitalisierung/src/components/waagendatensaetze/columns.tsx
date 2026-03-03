// "use client"

import type { ColumnDef } from "@tanstack/react-table"

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.

export type WaageDaten = {
    Ws_Nr: number;
    Datum: String;
    Uhrzeit: String;
    Kennzeichen1: String;
    Kennzeichen2: String;
    Netto_Gewicht: Number;
    Sorte: String;
    Erzeuger_Name: String;
    Schlag_ID: Number;
    Schlag_Name: String;
}

export const columns: ColumnDef<WaageDaten>[] = [
  {
    accessorKey: "Ws_Nr",
    header: "Ws_Nr",
  },
  {
    accessorKey: "Datum",
    header: "Datum",
  },
  {
    accessorKey: "Uhrzeit",
    header: "Uhrzeit",
  },
  {
    accessorKey: "Kennzeichen1",
    header: "Kennzeichen1",
  },
  {
    accessorKey: "Kennzeichen2",
    header: "Kennzeichen2",
  },
  {
    accessorKey: "Netto_Gewicht",
    header: "Netto_Gewicht",
  },
  {
    accessorKey: "Sorte",
    header: "Sorte",
  },
  {
    accessorKey: "Erzeuger_Name",
    header: "Erzeuger_Name",
  },
  {
    accessorKey: "Schlag_ID",
    header: "Schlag_ID",
  },
  {
    accessorKey: "Schlag_Name",
    header: "Schlag_Name",
  },
]