// "use client"

import type { ColumnDef } from "@tanstack/react-table"

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.

export type GuelleDaten = {
    KundenNr: Number;
    Kunde: String;
    Menge: Number;
    Datum: String;
}

export const columns: ColumnDef<GuelleDaten>[] = [
  {
    accessorKey: "KundenNr",
    header: "KundenNr",
  },
  {
    accessorKey: "Kunde",
    header: "Kunde",
  },
  {
    accessorKey: "Menge",
    header: "Menge in m³",
  },
  {
    accessorKey: "Datum",
    header: "Datum",
  }
]


export type GuelleKunden = {
  KundenNr: number;
  Name: string;
  Vorname: string;
  PLZ: number;
  Wohnort: string;
  Straße: string;
  HNr: string;
}

// export const columns: ColumnDef<KundenNr>[] = [
// {
//   accessorKey: "KundenNr",
//   header: "KundenNr",
// },
// {
//   accessorKey: "Kunde",
//   header: "Kunde",
// },
// {
//   accessorKey: "Menge",
//   header: "Menge in m³",
// },
// {
//   accessorKey: "Datum",
//   header: "Datum",
// }
// ]