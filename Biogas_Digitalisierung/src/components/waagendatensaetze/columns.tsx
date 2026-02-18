// "use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "../ui/button";
import { ArrowUpDown } from "lucide-react"

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.

export type WaageDaten = {
    WS_Nr: Number;
    Kennzeichen1: String;
    Kennzeichen2: String;
    EW_Gewicht: Number;
    ZW_Gewicht: Number;
    Netto_Gewicht: Number;
    Datum: String;
    Uhrzeit: String;
    Sorte: String;
    Warenfluss: String;
    Erzeuger_Name: String;
    Schlag_ID: Number;
    Schlag_Name: String;
}

export const columns: ColumnDef<WaageDaten>[] = [
  {
    accessorKey: "WS_Nr",
    header: "WS_Nr",
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
    accessorKey: "EW_Gewicht",
    header: "EW_Gewicht",
  },
  {
    accessorKey: "ZW_Gewicht",
    header: "ZW_Gewicht",
  },
  {
    accessorKey: "Netto_Gewicht",
    header: "Netto_Gewicht",
  },
  {
    accessorKey: "Datum",
    header: "Datum",
  },
  {
    accessorKey: "Uhrzeit",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "Sorte",
    header: "Sorte",
  },
  {
    accessorKey: "Warenfluss",
    header: "Warenfluss",
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