// import { useState } from "react";
import { ManageCustomer } from "@/components/guelleLieferscheine/manageCustomer";
import { ModeToggle } from "../mode-toggle";
import { GuelleInput } from "./createRecord";
import { columns, type GuelleDaten } from "./columns";
import { useEffect, useState } from "react";
import { DataTable } from "../dataTable";
import { CreateDelivery } from "./createDelivery";
import { ManageAnalysis } from "./manageAnalysis";

async function getData(): Promise<GuelleDaten[]> {
  // Fetch data from your API here.
  const response = await fetch('/api/getGuelleDaten');

  if (!response.ok){
    throw new Error ('Fehler beim Laden der Daten vom Server')
  }

  return response.json();
}

export function GuellePage() {
  const [data, setData] = useState<GuelleDaten[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getData().then((result) => {
      setData(result);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="p-6">Lade GülleDaten...</div>;
  }

    return(
      <main className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
      {/* 1. Header Bereich */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gülle Lieferscheine</h1>
          {/* <p className="text-sm text-muted-foreground">Übersicht und Verwaltung der Abholungen</p> */}
        </div>
        <ModeToggle />
      </header>

      {/* 2. Haupt-Grid (3:1 Aufteilung) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Linke Seite: Tabelle & Stammdaten-Buttons */}
        <div className="lg:col-span-3 space-y-6">
          {/* Tabelle */}
          <div className="bg-white rounded-xl border shadow-sm p-4">
             <DataTable 
               columns={columns} 
               data={data} 
               filterFields={[{key: "Kunde", label: "Kunde"}]} 
             />
          </div>

          {/* Stammdaten Buttons unter der Tabelle */}
          <div className="flex flex-wrap gap-3 p-2 bg-slate-100/50 rounded-lg border border-dashed">
             <div className="flex items-center gap-2 mr-4">
                <span className="text-xs font-semibold uppercase text-slate-500">Stammdaten:</span>
             </div>
             <ManageCustomer />
             <ManageAnalysis />
          </div>
        </div>

        {/* Rechte Seite: Eingabe & Lieferschein erstellen (Sidebar) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="sticky top-6 space-y-6">
            <GuelleInput />
            <CreateDelivery />
          </div>
        </div>

      </div>
    </main>
    )
}