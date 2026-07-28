import { useCallback, useEffect, useMemo, useState } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { ManageCustomer } from "./manageCustomer";
import { ManageAnalysis } from "./manageAnalysis";
import { EditRecordDialog, GuelleInput } from "./createRecord";
import { CreateDelivery } from "./createDelivery";
import { createColumns } from "./columns";
import { FormMessage } from "./FormMessage";
import { DataTable } from "../dataTable";
import { ModeToggle } from "../mode-toggle";
import { apiFetch } from "@/lib/api";
import type { Analyse, GuelleDaten, GuelleKunde } from "./types";

export function GuellePage() {
  const [abgaben, setAbgaben] = useState<GuelleDaten[]>([]);
  const [kunden, setKunden] = useState<GuelleKunde[]>([]);
  const [analysen, setAnalysen] = useState<Analyse[]>([]);

  const [loading, setLoading] = useState(true);
  const [ladeFehler, setLadeFehler] = useState<string | null>(null);
  const [aktionsFehler, setAktionsFehler] = useState<string | null>(null);

  const [bearbeiten, setBearbeiten] = useState<GuelleDaten | null>(null);
  const [loeschen, setLoeschen] = useState<GuelleDaten | null>(null);

  // Alle drei Listen zentral laden - vorher holte sich jede Unterkomponente
  // die Kundenliste einzeln, teils dreimal parallel.
  const datenLaden = useCallback(async () => {
    setLadeFehler(null);
    try {
      const [neueAbgaben, neueKunden, neueAnalysen] = await Promise.all([
        apiFetch<GuelleDaten[]>("/api/getGuelleDaten"),
        apiFetch<GuelleKunde[]>("/api/getCustomer"),
        apiFetch<Analyse[]>("/api/getAnalysis"),
      ]);
      setAbgaben(neueAbgaben);
      setKunden(neueKunden);
      setAnalysen(neueAnalysen);
    } catch (error) {
      setLadeFehler(
        error instanceof Error ? error.message : "Daten konnten nicht geladen werden."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    datenLaden();
  }, [datenLaden]);

  const handleDelete = async () => {
    if (!loeschen) return;
    setAktionsFehler(null);
    try {
      await apiFetch(`/api/deleteRecord/${loeschen.id}`, { method: "DELETE" });
      setLoeschen(null);
      datenLaden();
    } catch (error) {
      setAktionsFehler(
        error instanceof Error ? error.message : "Löschen fehlgeschlagen."
      );
      setLoeschen(null);
    }
  };

  const columns = useMemo(
    () => createColumns({ onEdit: setBearbeiten, onDelete: setLoeschen }),
    []
  );

  if (loading) {
    return <main className="flex-1 p-6">Lade Gülledaten...</main>;
  }

  return (
    <main className="flex-1 overflow-y-auto bg-background p-6">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Gülle Lieferscheine</h1>
        <ModeToggle />
      </header>

      {ladeFehler && (
        <div className="mb-6 rounded-lg border border-destructive/50 p-4">
          <FormMessage fehler={`${ladeFehler} Läuft der Server?`} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="space-y-6 lg:col-span-3">
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            {aktionsFehler && (
              <div className="mb-4">
                <FormMessage fehler={aktionsFehler} />
              </div>
            )}
            <DataTable
              columns={columns}
              data={abgaben}
              filterFields={[{ key: "Kunde", label: "Kunde" }]}
              renderFooter={(gefiltert) => {
                const summe = gefiltert.reduce((wert, zeile) => wert + zeile.Menge, 0);
                const offen = gefiltert
                  .filter((zeile) => !zeile.Abgerechnet)
                  .reduce((wert, zeile) => wert + zeile.Menge, 0);
                return (
                  <TableRow>
                    <TableCell colSpan={2}>
                      Gesamt ({gefiltert.length} Einträge)
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {summe.toLocaleString("de-DE", { minimumFractionDigits: 2 })} m³
                    </TableCell>
                    <TableCell colSpan={4} className="text-muted-foreground">
                      davon offen:{" "}
                      {offen.toLocaleString("de-DE", { minimumFractionDigits: 2 })} m³
                    </TableCell>
                  </TableRow>
                );
              }}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed bg-muted/40 p-3">
            <span className="text-xs font-semibold uppercase text-muted-foreground">
              Stammdaten:
            </span>
            <ManageCustomer onSuccess={datenLaden} />
            <ManageAnalysis onSuccess={datenLaden} />
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-6">
            <GuelleInput kunden={kunden} onSuccess={datenLaden} />
            <CreateDelivery kunden={kunden} analysen={analysen} onSuccess={datenLaden} />
          </div>
        </div>
      </div>

      <EditRecordDialog
        eintrag={bearbeiten}
        onClose={() => setBearbeiten(null)}
        onSuccess={datenLaden}
      />

      <AlertDialog open={loeschen !== null} onOpenChange={(offen) => !offen && setLoeschen(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Abgabe wirklich löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              {loeschen && (
                <>
                  {loeschen.Menge.toLocaleString("de-DE")} m³ für {loeschen.Kunde} vom{" "}
                  {loeschen.Datum.split("-").reverse().join(".")} werden dauerhaft
                  entfernt. Das lässt sich nicht rückgängig machen.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Löschen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
