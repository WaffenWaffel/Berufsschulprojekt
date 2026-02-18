import { ModeToggle } from "../mode-toggle";
import { columns, type WaageDaten } from "./columns"
import { DataTable } from "../dataTable";
import { useEffect, useState } from "react";

async function getData(): Promise<WaageDaten[]> {
  // Fetch data from your API here.
  return [
    {
      WS_Nr: 9409,
      Kennzeichen1: "DON DO 315",
      Kennzeichen2: "WAGNER MULDE",
      EW_Gewicht: 19.2,
      ZW_Gewicht: 33.24,
      Netto_Gewicht: 14.04,
      Datum: "17.9.2025",
      Uhrzeit: "07:42",
      Sorte: "Silomais",
      Warenfluss: "Wareneingang",
      Erzeuger_Name: "Doppelbauer Siegfried",
      Schlag_ID: 53,
      Schlag_Name: "Goldacker am Bullenstall"
    },
    {
      WS_Nr: 9410,
      Kennzeichen1: "DON DO 315",
      Kennzeichen2: "WAGNER MULDE",
      EW_Gewicht: 19.2,
      ZW_Gewicht: 33.24,
      Netto_Gewicht: 14.04,
      Datum: "17.9.2025",
      Uhrzeit: "07:42",
      Sorte: "Silomais",
      Warenfluss: "Wareneingang",
      Erzeuger_Name: "Doppelbauer Siegfried",
      Schlag_ID: 53,
      Schlag_Name: "Goldacker am Bullenstall"
    },
    {
      WS_Nr: 9411,
      Kennzeichen1: "DON DO 315",
      Kennzeichen2: "WAGNER MULDE",
      EW_Gewicht: 19.2,
      ZW_Gewicht: 33.24,
      Netto_Gewicht: 14.04,
      Datum: "17.9.2025",
      Uhrzeit: "07:42",
      Sorte: "Silomais",
      Warenfluss: "Wareneingang",
      Erzeuger_Name: "Doppelbauer Siegfried",
      Schlag_ID: 53,
      Schlag_Name: "Goldacker am Bullenstall"
    },
    {
      WS_Nr: 9412,
      Kennzeichen1: "DON DO 315",
      Kennzeichen2: "WAGNER MULDE",
      EW_Gewicht: 19.2,
      ZW_Gewicht: 33.24,
      Netto_Gewicht: 14.04,
      Datum: "17.9.2025",
      Uhrzeit: "07:42",
      Sorte: "Weizen",
      Warenfluss: "Wareneingang",
      Erzeuger_Name: "Doppelbauer Siegfried",
      Schlag_ID: 53,
      Schlag_Name: "Goldacker am Bullenstall"
    },
    // ...
  ]
}


export default function WaagePage() {
  const [data, setData] = useState<WaageDaten[]>([]);
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
                    {key: "Kennzeichen1", label: "Kennzeichen1"},
                    {key: "Datum", label: "Datum"},
                    {key: "Sorte", label: "Sorte"},
                    {key: "Schlag_ID", label: "Schlag_ID"},
                    ]}/>
                {/* </div>
              </Card> */}
            </div>
          </div>
        </main>
    )
}