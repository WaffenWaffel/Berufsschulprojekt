import { useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeProvider } from "./components/theme-provider";
import { GuelleInput } from "./components/guelleLieferscheine/guelleInput";

import { GuellePage } from "./components/guelleLieferscheine/guellePage";
import   WaagePage from "./components/waagendatensaetze/waagePage";
import  FutterPage  from "./components/futterauswertung/futterPage";

export type TabId = "lieferscheine" | "auswertung" | "wagedaten";

export function App() {

  const [activeTab, setActiveTab] = useState<TabId>("lieferscheine");
  const renderContent = () => {
    switch (activeTab) {
      case "lieferscheine":
        return <GuellePage />;
      case "auswertung":
        return <FutterPage />;
      case "wagedaten":
        return <WaagePage />;
      default:
        return <GuelleInput />;
    }
  };

  return( 
  <ThemeProvider>
    <SidebarProvider>
      <div className="flex h-screen w-full">
      <AppSidebar setActiveTab={setActiveTab} activeTab={activeTab} />
        <SidebarTrigger />

        {renderContent()}
      </div>
    </SidebarProvider>
  </ThemeProvider>
    )
}

export default App;