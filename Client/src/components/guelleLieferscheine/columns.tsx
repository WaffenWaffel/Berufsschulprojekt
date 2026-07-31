import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LockOpen, Pencil, Trash2 } from "lucide-react"
import type { GuelleDaten } from "./types"

export type { GuelleDaten, GuelleKunde, Analyse } from "./types"

/** Formatiert YYYY-MM-DD für die Anzeige als TT.MM.JJJJ. */
function datumAnzeigen(iso: string): string {
  const [jahr, monat, tag] = iso.split("-")
  return tag && monat && jahr ? `${tag}.${monat}.${jahr}` : iso
}

interface ColumnOptions {
  onEdit: (eintrag: GuelleDaten) => void
  onDelete: (eintrag: GuelleDaten) => void
  onReopen: (eintrag: GuelleDaten) => void
}

/** Spalten-ID des Jahresfilters, wird auch in guellePage verwendet. */
export const JAHR_FILTER_KEY = "Datum"

/**
 * Spalten der Abgaben-Tabelle. Als Funktion, damit die Aktionsspalte
 * die Handler der Seite erreichen kann.
 */
export function createColumns({ onEdit, onDelete, onReopen }: ColumnOptions): ColumnDef<GuelleDaten>[] {
  return [
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
      header: () => <div className="text-right">Menge in m³</div>,
      cell: ({ row }) => (
        <div className="text-right tabular-nums">
          {row.original.Menge.toLocaleString("de-DE", { minimumFractionDigits: 2 })}
        </div>
      ),
    },
    {
      accessorKey: "Datum",
      header: "Datum",
      cell: ({ row }) => datumAnzeigen(row.original.Datum),
      // Filtert auf das Jahr im YYYY-MM-DD-String, gespeist aus dem
      // Auswahlfeld über der Tabelle.
      filterFn: (row, columnId, jahr) =>
        !jahr || String(row.getValue(columnId)).startsWith(`${jahr}-`),
    },
    {
      accessorKey: "Bemerkung",
      header: "Bemerkung",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.Bemerkung || "—"}</span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) =>
        row.original.Abgerechnet ? (
          <Badge variant="secondary">LS {row.original.LieferscheinNr}</Badge>
        ) : (
          <Badge variant="outline">offen</Badge>
        ),
    },
    {
      id: "aktionen",
      header: () => <span className="sr-only">Aktionen</span>,
      cell: ({ row }) => {
        const eintrag = row.original
        // Abgerechnete Abgaben stehen auf einem gedruckten Lieferschein und
        // dürfen nicht mehr verändert werden - das lehnt auch der Server ab.
        // Sie lassen sich aber gezielt wieder freischalten.
        const gesperrt = eintrag.Abgerechnet
        const titel = gesperrt
          ? `Steht auf Lieferschein Nr. ${eintrag.LieferscheinNr} — zum Ändern zuerst freischalten`
          : undefined

        return (
          <div className="flex justify-end gap-1">
            {gesperrt && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title={`Freischalten (steht auf Lieferschein Nr. ${eintrag.LieferscheinNr})`}
                onClick={() => onReopen(eintrag)}
              >
                <LockOpen className="h-4 w-4" />
                <span className="sr-only">Freischalten</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={gesperrt}
              title={titel ?? "Bearbeiten"}
              onClick={() => onEdit(eintrag)}
            >
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Bearbeiten</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              disabled={gesperrt}
              title={titel ?? "Löschen"}
              onClick={() => onDelete(eintrag)}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Löschen</span>
            </Button>
          </div>
        )
      },
    },
  ]
}
