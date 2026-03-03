import { ModeToggle } from "../mode-toggle";
import { columns, type FutterDaten } from "./columns"
import { DataTable } from "../dataTable";
import { useEffect, useState } from "react";
import { ManageTSGehalt } from "./manageTSGehalt";
import { ExportExcelButton } from "./exportButton";

async function getData(): Promise<FutterDaten[]> {
  // Fetch data from your API here.
  return [
    {
        Schlag_ID: 94,
        Schlag_Name: "Am Aussiedlerhof",
        Vorname: "Friedrich",
        Name: "Ebert",
        Größe: 2.86,
        Ertrag: 144.14,
        Feuchtmasse: 50.40,
        TS_Gehlat: 39.48,
        Trockenmasse: 569.06,
        Trockenmasse_pro_ha: 198.97,
        Sorte: "Mais",
    },
    // ...
  ]
}
 

export default function FutterPage() {
  const [data, setData] = useState<FutterDaten[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getData().then((result) => {
      setData(result);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="p-6">Lade Waagedaten...</div>;
  }

  return (
    <main className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">WaageDaten</h1>
          <p className="text-muted-foreground text-sm">Verwalten Sie Ihre Schläge und exportieren Sie Berichte.</p>
        </div>
        
        {/* Buttons auf der rechten Seite gruppiert */}
        <div className="flex items-center gap-3">
          <ExportExcelButton />
          <ModeToggle />
        </div>
      </header>

      <div className="space-y-8">
        {/* Tabellen Bereich */}
        <section className="w-full">
          <DataTable 
            columns={columns} 
            data={data} 
            filterFields={[
              {key: "Schlag_ID", label: "Schlag_ID"},
              {key: "Name", label: "Name"},
            ]}
          />
        </section>

        {/* Unterer Bereich: Formular links */}
        <section className="flex justify-start items-start">
          <div className="w-full max-w-md">
             {/* ManageSchlagTSCard wird hier linksbündig gerendert */}
            <ManageTSGehalt/>
          </div>
        </section>
      </div>
    </main>
  );
}