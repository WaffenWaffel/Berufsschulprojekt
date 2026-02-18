// "use client"

import type { ColumnDef } from "@tanstack/react-table"
// import { Button } from "../ui/button";
// import { ArrowUpDown } from "lucide-react"

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.

export type FutterDaten = {
    Schlag_ID: Number;
    Schlag_Name: String;
    Vorname: String;
    Name: String;
    Größe: Number;
    Ertrag: Number;
    Feuchtmasse: Number;
    TS_Gehlat: Number;
    Trockenmasse: Number;
    Trockenmasse_pro_ha: Number;
    Sorte: String;
}

export const columns: ColumnDef<FutterDaten>[] = [
  {
    accessorKey: "Schlag_ID",
    header: "Schlag_ID",
  },
  {
    accessorKey: "Schlag_Name",
    header: "Schlag_Name",
  },
  {
    accessorKey: "Vorname",
    header: "Vorname",
  },
  {
    accessorKey: "Name",
    header: "Name",
  },
  {
    accessorKey: "Größe",
    header: "Größe",
  },
  {
    accessorKey: "Ertrag",
    header: "Ertrag",
  },
  {
    accessorKey: "Feuchtmasse",
    header: "Feuchtmasse",
  },
  {
    accessorKey: "TS_Gehlat",
    header: "TS_Gehlat",
  },
  {
    accessorKey: "Trockenmasse",
    header: "Trockenmasse",
  },
  {
    accessorKey: "Trochenmasse_pro_ha",
    header: "Trochenmasse_pro_ha",
  },
  {
    accessorKey: "Sorte",
    header: "Sorte",
  },
]