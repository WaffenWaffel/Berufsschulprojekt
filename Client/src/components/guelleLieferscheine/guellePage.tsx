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
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import type { AngemeldeterBenutzer } from "../anmeldung/types";
import { apiFetch } from "@/lib/api";
import type { Analyse, Betrieb, GuelleDaten, GuelleKunde } from "./types";

interface GuellePageProps {
  benutzer: AngemeldeterBenutzer;
  onAbmelden: () => void;
}

export function GuellePage({ benutzer, onAbmelden }: GuellePageProps) {
  const [abgaben, setAbgaben] = useState<GuelleDaten[]>([]);
  const [kunden, setKunden] = useState<GuelleKunde[]>([]);
  const [analysen, setAnalysen] = useState<Analyse[]>([]);
  const [betrieb, setBetrieb] = useState<Betrieb | null>(null);

  const [loading, setLoading] = useState(true);
  const [ladeFehler, setLadeFehler] = useState<string | null>(null);
  const [aktionsFehler, setAktionsFehler] = useState<string | null>(null);

  const [bearbeiten, setBearbeiten] = useState<GuelleDaten | null>(null);
  const [loeschen, setLoeschen] = useState<GuelleDaten | null>(null);
  const [freischalten, setFreischalten] = useState<GuelleDaten | null>(null);

  // Alle drei Listen zentral laden - vorher holte sich jede Unterkomponente
  // die Kundenliste einzeln, teils dreimal parallel.
  const datenLaden = useCallback(async () => {
    setLadeFehler(null);
    try {
      // versuche > 1: Beim Start von "npm run dev" ist Vite schneller bereit
      // als das Backend (ts-node prüft erst die Typen). Ohne Wiederholung
      // zeigt die Seite dann sofort einen Fehler, obwohl der Server nur noch
      // ein paar Sekunden braucht. Nur beim Lesen - Schreibvorgänge werden
      // bewusst nicht wiederholt.
      const [neueAbgaben, neueKunden, neueAnalysen, neuerBetrieb] = await Promise.all([
        apiFetch<GuelleDaten[]>("/api/getGuelleDaten", { versuche: 5 }),
        apiFetch<GuelleKunde[]>("/api/getCustomer", { versuche: 5 }),
        apiFetch<Analyse[]>("/api/getAnalysis", { versuche: 5 }),
        apiFetch<Betrieb>("/api/betrieb", { versuche: 5 }),
      ]);
      setAbgaben(neueAbgaben);
      setKunden(neueKunden);
      setAnalysen(neueAnalysen);
      setBetrieb(neuerBetrieb);
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

  /** Eine Abgabe oder den ganzen Lieferschein wieder freigeben. */
  const handleReopen = async (umfang: "abgabe" | "schein") => {
    if (!freischalten) return;
    setAktionsFehler(null);
    const pfad =
      umfang === "abgabe"
        ? `/api/reopenRecord/${freischalten.id}`
        : `/api/reopenDelivery/${freischalten.LieferscheinNr}`;
    try {
      await apiFetch(pfad, { method: "PUT" });
      setFreischalten(null);
      datenLaden();
    } catch (error) {
      setAktionsFehler(
        error instanceof Error ? error.message : "Freischalten fehlgeschlagen."
      );
      setFreischalten(null);
    }
  };

  const columns = useMemo(
    () =>
      createColumns({
        onEdit: setBearbeiten,
        onDelete: setLoeschen,
        onReopen: setFreischalten,
      }),
    []
  );

  // Jahre aus den vorhandenen Datumsangaben ableiten, neuestes zuerst
  const jahre = useMemo(() => {
    const gefunden = new Set(abgaben.map((a) => a.Datum.slice(0, 4)));
    return [...gefunden].sort().reverse();
  }, [abgaben]);

  // Wie viele Positionen hängen am selben Lieferschein? Für den Hinweistext.
  const positionenAmSchein = useMemo(() => {
    if (!freischalten?.LieferscheinNr) return 0;
    return abgaben.filter((a) => a.LieferscheinNr === freischalten.LieferscheinNr).length;
  }, [abgaben, freischalten]);

  if (loading) {
    return <main className="flex-1 p-6">Lade Gülledaten...</main>;
  }

  return (
    <main className="flex-1 overflow-y-auto bg-background p-6">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gülle Lieferscheine</h1>
          {/* Zeigt, wessen Daten gerade sichtbar sind */}
          {betrieb && (
            <p className="text-sm text-muted-foreground">{betrieb.Name}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {benutzer.Name}
          </span>
          <ModeToggle />
          <Button variant="outline" size="sm" onClick={onAbmelden}>
            <LogOut className="mr-2 h-4 w-4" />
            Abmelden
          </Button>
        </div>
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
              selectFields={[
                {
                  key: "Datum",
                  label: "Jahr",
                  options: jahre.map((jahr) => ({ value: jahr, label: jahr })),
                },
              ]}
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
            <CreateDelivery
              kunden={kunden}
              analysen={analysen}
              abgaben={abgaben}
              onSuccess={datenLaden}
            />
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

      <AlertDialog
        open={freischalten !== null}
        onOpenChange={(offen) => !offen && setFreischalten(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Abgerechnete Abgabe freischalten?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              {freischalten && (
                <div className="space-y-3">
                  <p>
                    Diese Abgabe ({freischalten.Menge.toLocaleString("de-DE")} m³ vom{" "}
                    {freischalten.Datum.split("-").reverse().join(".")}) steht bereits auf{" "}
                    <strong>Lieferschein Nr. {freischalten.LieferscheinNr}</strong>
                    {positionenAmSchein > 1 && ` zusammen mit ${positionenAmSchein - 1} weiteren Position(en)`}.
                  </p>
                  <p className="text-destructive">
                    Der bereits gedruckte Lieferschein stimmt danach nicht mehr mit den
                    gespeicherten Daten überein. Die freigeschaltete Abgabe erscheint auf
                    dem nächsten Lieferschein erneut.
                  </p>
                  <p>
                    Verliert ein Lieferschein dadurch alle Positionen, bleibt seine Nummer
                    erhalten und er wird als storniert vermerkt.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            {positionenAmSchein > 1 && (
              <AlertDialogAction
                onClick={() => handleReopen("schein")}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Ganzen Lieferschein zurücknehmen ({positionenAmSchein} Positionen)
              </AlertDialogAction>
            )}
            <AlertDialogAction onClick={() => handleReopen("abgabe")}>
              Nur diese Abgabe
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
