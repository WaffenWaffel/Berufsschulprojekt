"use client"

import type { ColumnDef } from "@tanstack/react-table"

export type WaageDaten = {
    Ws_Nr: number;
    Datum: string;
    Uhrzeit: string;
    Kennzeichen1: string;
    Kennzeichen2: string;
    Netto_Gewicht: number;
    Sorte: string;
    Erzeuger_Name: string;
    Schlag_ID: number;
    Schlag_Name: string;
}

export const columns: ColumnDef<WaageDaten>[] = [
  {
    // Die Ws_Nr sicher in einen String umwandeln
    accessorFn: (row) => {
      return row && row.Ws_Nr !== undefined && row.Ws_Nr !== null 
        ? row.Ws_Nr.toString() 
        : ""; 
    },
    id: "Ws_Nr",
    header: "WS-Nr.",
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
    header: "Kennzeichen 1",
  },
  {
    accessorKey: "Kennzeichen2",
    header: "Kennzeichen 2",
  },
  {
    accessorKey: "Netto_Gewicht",
    header: "Netto (t)",
    cell: ({ row }) => {
      const value = row.getValue("Netto_Gewicht");
      const num = parseFloat(String(value));
      return isNaN(num) ? "0.00" : num.toFixed(2);
    }
  },
  {
    accessorKey: "Sorte",
    header: "Sorte",
  },
  {
    accessorKey: "Erzeuger_Name",
    header: "Erzeuger",
  },
  {
    // Auch hier: Schlag_ID sicher abfragen
    accessorFn: (row) => {
      return row && row.Schlag_ID !== undefined && row.Schlag_ID !== null 
        ? row.Schlag_ID.toString() 
        : "";
    },
    id: "Schlag_ID",
    header: "Schlag ID",
  },
  {
    accessorKey: "Schlag_Name",
    header: "Schlag Name",
  },
]