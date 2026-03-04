import { ModeToggle } from "../mode-toggle";
import { columns, type WaageDaten } from "./columns"
import { DataTable } from "../dataTable";
import { useEffect, useState, useCallback } from "react";

// API-Aufruf zum Abrufen der Waagedaten vom Backend
async function fetchWaageDaten(): Promise<WaageDaten[]> {
  // Wir ändern den Endpunkt auf /api/getWaageDaten
  const response = await fetch('/api/getWaageDaten'); 
  if (!response.ok) {
    throw new Error('Fehler beim Laden der Waagedaten');
  }
  return response.json();
}

export default function WaagePage() {
  const [data, setData] = useState<WaageDaten[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Funktion zum Laden der Daten (memoisiert mit useCallback)
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetchWaageDaten();
      setData(result);
      setError(null);
    } catch (err) {
      setError("Verbindung zum Server fehlgeschlagen. Läuft das Backend auf Port 3001?");
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading && data.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg animate-pulse">Lade Waagedaten...</div>
      </div>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">WaageDaten</h1>
          <p className="text-muted-foreground text-sm">Übersicht aller gewogenen Lieferungen aus der CSV.</p>
        </div>
        <ModeToggle />
      </header>

      {error && (
        <div className="bg-destructive/15 border border-destructive text-destructive px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <div className="w-full">
          <DataTable 
            columns={columns} 
            data={data} 
            filterFields={[
              { key: "Kennzeichen1", label: "Kennzeichen" },
              { key: "Datum", label: "Datum" },
              { key: "Sorte", label: "Sorte" },
              { key: "Schlag_ID", label: "Schlag ID" },
            ]}
          />
        </div>
      </div>
    </main>
  );
}