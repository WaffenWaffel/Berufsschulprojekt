import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";

export function ExportExcelButton() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Wir rufen den neuen Backend-Endpoint auf
      const response = await fetch('/api/exportExcel', {
        method: 'GET',
      });

      if (!response.ok) throw new Error("Export fehlgeschlagen");

      // Den Stream als Blob empfangen
      const blob = await response.blob();
      
      // Einen temporären Link erstellen, um den Download im Browser auszulösen
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Erntebericht_Mais_2025.xlsx`; // Dateiname
      document.body.appendChild(a);
      a.click();
      
      // Aufräumen
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error("Fehler beim Excel-Export:", error);
      alert("Der Export konnte nicht erstellt werden.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      onClick={handleExport} 
      disabled={isExporting}
      className="bg-green-600 text-white hover:bg-green-700 hover:text-white border-none"
    >
      {isExporting ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      {isExporting ? "Wird erstellt..." : "Excel Export"}
    </Button>
  );
}