// "use client"

import type { ColumnDef } from "@tanstack/react-table"
// import { Button } from "../ui/button";
// import { ArrowUpDown } from "lucide-react"

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.

"use client"


export type FutterDaten = {
    Schlag_ID: number;
    Schlag_Name: string;
    Vorname: string;
    Name: string;
    Größe: number;
    Ertrag: number;
    Feuchtmasse: number;
    TS_Gehlat: number;
    Trockenmasse: number;
    Trockenmasse_pro_ha: number; // Hier war ein Tippfehler im Namen
    Sorte: string;
}

export const columns: ColumnDef<FutterDaten>[] = [
  {
    // Fix für den Filter: Wir nutzen eine accessorFn, um die ID als String zurückzugeben
    // So kann die Suche Text-Vergleiche durchführen (z.B. Suche nach "9")
    accessorFn: (row) => row.Schlag_ID.toString(),
    id: "Schlag_ID", 
    header: "Schlag ID",
  },
  {
    accessorKey: "Schlag_Name",
    header: "Schlag Name",
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
    header: "Größe (ha)",
  },
  {
    accessorKey: "Ertrag",
    header: "Ertrag (t)",
  },
  {
    accessorKey: "Feuchtmasse",
    header: "Feuchtmasse",
  },
  {
    accessorKey: "TS_Gehlat",
    header: "TS %",
  },
  {
    accessorKey: "Trockenmasse",
    header: "Trockenmasse",
  },
  {
    accessorKey: "Trockenmasse_pro_ha", // Korrigierter Key (mit 'k')
    header: "TM / ha",
  },
  {
    accessorKey: "Sorte",
    header: "Sorte",
  },
]