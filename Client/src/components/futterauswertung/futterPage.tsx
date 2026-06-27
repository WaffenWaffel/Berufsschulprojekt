import { ModeToggle } from "../mode-toggle";
import { columns, type FutterDaten } from "./columns"
import { DataTable } from "../dataTable";
import { useEffect, useState, useCallback } from "react";
import { ManageTSGehalt } from "./manageTSGehalt";
import { ExportExcelButton } from "./exportButton";

// API-Aufruf zum Abrufen der Waagedaten
async function fetchWaageDaten(): Promise<FutterDaten[]> {
  const response = await fetch('/api/getSchlagID');
  if (!response.ok) {
    throw new Error('Netzwerk-Antwort war nicht ok');
  }
  return response.json();
}

export default function FutterPage() {
  const [data, setData] = useState<FutterDaten[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Funktion zum Laden/Aktualisieren der Daten
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetchWaageDaten();
      setData(result);
      setError(null);
    } catch (err) {
      setError("Die Daten konnten nicht geladen werden.");
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading && data.length === 0) {
    return <div className="p-6 text-center">Lade Waagedaten...</div>;
  }

  return (
    <main className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">WaageDaten</h1>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Der Excel-Button triggert deinen API-Export-Endpunkt */}
          <ExportExcelButton />
          <ModeToggle />
        </div>
      </header>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="space-y-8">
        {/* Tabellen Bereich */}
        <section className="w-full">
          <DataTable 
            columns={columns} 
            data={data} 
            filterFields={[
              {key: "Schlag_ID", label: "Schlag_ID"},
              {key: "Schlag_Name", label: "Schlag_Name"},
            ]}
          />
        </section>

        {/* Unterer Bereich: Formular links */}
        <section className="flex justify-start items-start">
          <div className="w-full max-w-md">
            {/* Wir übergeben loadData als Callback, damit das Formular 
              die Tabelle nach dem Speichern aktualisieren kann 
            */}
            <ManageTSGehalt onUpdateSuccess={loadData} />
          </div>
        </section>
      </div>
    </main>
  );
}