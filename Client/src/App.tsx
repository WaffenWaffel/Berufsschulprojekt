import { useCallback, useEffect, useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeProvider } from "./components/theme-provider";

import { GuellePage } from "./components/guelleLieferscheine/guellePage";
import WaagePage from "./components/waagendatensaetze/waagePage";
import FutterPage from "./components/futterauswertung/futterPage";

import { LoginSeite } from "./components/anmeldung/LoginSeite";
import { PasswortWechseln } from "./components/anmeldung/PasswortWechseln";
import type { AngemeldeterBenutzer } from "./components/anmeldung/types";
import { apiFetch } from "@/lib/api";

export type TabId = "lieferscheine" | "auswertung" | "wagedaten";

export function App() {
  const [activeTab, setActiveTab] = useState<TabId>("lieferscheine");

  const [benutzer, setBenutzer] = useState<AngemeldeterBenutzer | null>(null);
  const [pruefeSitzung, setPruefeSitzung] = useState(true);

  /**
   * Beim Start fragen, ob noch eine gültige Sitzung besteht. 401 ist hier
   * der Normalfall und kein Fehler - dann erscheint die Anmeldeseite.
   */
  useEffect(() => {
    apiFetch<AngemeldeterBenutzer>("/api/ich", { versuche: 5 })
      .then(setBenutzer)
      .catch(() => setBenutzer(null))
      .finally(() => setPruefeSitzung(false));
  }, []);

  const abmelden = useCallback(async () => {
    try {
      await apiFetch("/api/abmelden", { method: "POST" });
    } finally {
      setBenutzer(null);
    }
  }, []);

  if (pruefeSitzung) {
    return (
      <ThemeProvider>
        <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
          Einen Moment...
        </div>
      </ThemeProvider>
    );
  }

  if (!benutzer) {
    return (
      <ThemeProvider>
        <LoginSeite onAngemeldet={setBenutzer} />
      </ThemeProvider>
    );
  }

  // Startpasswort muss zuerst ersetzt werden
  if (benutzer.PasswortWechseln) {
    return (
      <ThemeProvider>
        <PasswortWechseln
          onFertig={() => setBenutzer({ ...benutzer, PasswortWechseln: false })}
        />
      </ThemeProvider>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "auswertung":
        return <FutterPage />;
      case "wagedaten":
        return <WaagePage />;
      case "lieferscheine":
      default:
        return <GuellePage benutzer={benutzer} onAbmelden={abmelden} />;
    }
  };

  return (
    <ThemeProvider>
      <SidebarProvider>
        <div className="flex h-screen w-full">
          <AppSidebar setActiveTab={setActiveTab} activeTab={activeTab} />
          <SidebarTrigger />
          {renderContent()}
        </div>
      </SidebarProvider>
    </ThemeProvider>
  );
}

export default App;
