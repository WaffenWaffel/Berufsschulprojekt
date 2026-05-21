import { useEffect, useState } from "react";
import { ManageCustomer } from "@/components/guelleLieferscheine/manageCustomer";
import { ModeToggle } from "../mode-toggle";
import { GuelleInput } from "./createRecord";
import { columns, type GuelleDaten } from "./columns";
import { DataTable } from "../dataTable";
import { CreateDelivery } from "./createDelivery";
import { ManageAnalysis } from "./manageAnalysis";

async function getData(): Promise<GuelleDaten[]> {
  const response = await fetch('/api/getGuelleDaten');
  if (!response.ok){
    throw new Error ('Fehler beim Laden der Daten vom Server')
  }
  return response.json();
}

export function GuellePage() {
  const [data, setData] = useState<GuelleDaten[]>([]);
  const [loading, setLoading] = useState(true);
  
  // NEU: Zentraler Refresh-Trigger
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  // NEU: useEffect reagiert jetzt auf Änderungen des refreshKey
  useEffect(() => {
    // Optional: setLoading(true) falls du beim Neuladen einen Ladebildschirm willst
    getData().then((result) => {
      setData(result);
      setLoading(false);
    });
  }, [refreshKey]); 

  if (loading && data.length === 0) {
    return <div className="p-6">Lade GülleDaten...</div>;
  }

  return(
    <main className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gülle Lieferscheine</h1>
        </div>
        <ModeToggle />
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-xl border shadow-sm p-4">
             <DataTable 
               columns={columns} 
               data={data} 
               filterFields={[{key: "Kunde", label: "Kunde"}]} 
             />
          </div>

          <div className="flex flex-wrap gap-3 p-2 bg-slate-100/50 rounded-lg border border-dashed">
             <div className="flex items-center gap-2 mr-4">
                <span className="text-xs font-semibold uppercase text-slate-500">Stammdaten:</span>
             </div>
             {/* NEU: Wir geben onSuccess als Prop mit */}
             <ManageCustomer onSuccess={triggerRefresh} />
             <ManageAnalysis onSuccess={triggerRefresh} />
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="sticky top-6 space-y-6">
            {/* NEU: Hört auf refreshKey (Kunden laden) und feuert onSuccess (Tabelle aktualisieren) */}
            <GuelleInput refreshKey={refreshKey} onSuccess={triggerRefresh} />
            
            {/* Falls CreateDelivery auch Daten lädt/speichert, kannst du ihm die Props ebenfalls geben */}
            <CreateDelivery /> 
          </div>
        </div>
      </div>
    </main>
  )
}