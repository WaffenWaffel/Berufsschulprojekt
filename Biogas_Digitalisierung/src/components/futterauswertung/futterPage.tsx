import { ModeToggle } from "../mode-toggle";
import { columns, type FutterDaten } from "./columns"
import { DataTable } from "../dataTable";
import { useEffect, useState } from "react";

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

    return(
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          <header className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold">WaageDaten</h1>
            <ModeToggle />
          </header>

          {/* <div className="grid grid-cols-1 lg:grid-cols-4 gap-6"> */}
          <div>
            {/* Linke Spalte: Tabelle (nimmt 3/4 des Platzes ein) */}
            <div className="lg:col-span-3">
              {/* <Card className="p-4">
                <h2 className="text-lg font-semibold mb-4">Datensätze</h2>
                <div className="container mx-auto py-10"> */}
                  <DataTable columns={columns} data={data} filterFields={[
                    {key: "Schlag_ID", label: "Schlag_ID"},
                    {key: "Name", label: "Name"},
                    ]}/>
                {/* </div>
              </Card> */}
            </div>
          </div>
        </main>
    )
}