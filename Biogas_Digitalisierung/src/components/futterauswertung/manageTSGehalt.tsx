import { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Check, ChevronsUpDown, Save, RefreshCw, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { FutterDaten } from "./columns"

export function ManageTSGehalt() {
  const [comboOpen, setComboOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [schlaegeListe, setSchlaegeListe] = useState<FutterDaten[]>([]);
  const [selectedSchlag, setSelectedSchlag] = useState<FutterDaten | null>(null);
  const [tsGehalt, setTsGehalt] = useState("");

  // 1. Daten beim Mounten laden
  useEffect(() => {
    const fetchSchlaege = async () => {
      try {
        const res = await fetch('/api/getSchlagID');
        const data = await res.json();
        setSchlaegeListe(data);
      } catch (err) {
        console.error("Ladefehler:", err);
      }
    };
    fetchSchlaege();
  }, []);

  // 2. Auswahl-Logik
  const handleSelect = (schlag: FutterDaten | null) => {
    if (schlag) {
      setSelectedSchlag(schlag);
      setTsGehalt(schlag.TS_Gehlat?.toString() || "");
    } else {
      setSelectedSchlag(null);
      setTsGehalt("");
    }
    setComboOpen(false);
  };

  // 3. Speichern
  const handleSave = async () => {
    if (!selectedSchlag) return;
    setLoading(true);

    try {
      const response = await fetch(`/api/updateSchlag/${selectedSchlag.Schlag_ID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          TS_Gehlat: Number(tsGehalt),
        }),
      });

      if (!response.ok) throw new Error("Fehler beim Speichern");
      
      // Optional: Liste nach Speichern neu laden, um lokale Daten aktuell zu halten
      const res = await fetch('/api/getSchlagID');
      const updatedData = await res.json();
      setSchlaegeListe(updatedData);
      
      alert("Erfolgreich aktualisiert!");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>TS-Gehalt verwalten</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Schlag Auswahl */}
        <Field>
          <FieldLabel>Schlag</FieldLabel>
          <Popover open={comboOpen} onOpenChange={setComboOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between font-normal">
                {selectedSchlag 
                  ? `${selectedSchlag.Schlag_Name} (ID: ${selectedSchlag.Schlag_ID})` 
                  : "Schlag suchen..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
              <Command>
                <CommandInput placeholder="Name oder ID..." />
                <CommandList>
                  <CommandEmpty>Kein Schlag gefunden.</CommandEmpty>
                  <CommandGroup>
                    {schlaegeListe.map((s) => (
                      <CommandItem 
                        key={s.Schlag_ID} 
                        onSelect={() => handleSelect(s)}
                        value={`${s.Schlag_Name} ${s.Schlag_ID}`}
                      >
                        <Check className={cn("mr-2 h-4 w-4", selectedSchlag?.Schlag_ID === s.Schlag_ID ? "opacity-100" : "opacity-0")} />
                        <div className="flex flex-col">
                          <span>{s.Schlag_Name}</span>
                          <span className="text-xs text-muted-foreground">ID: {s.Schlag_ID} • {s.Sorte}</span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </Field>

        {/* Input Bereich */}
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="tsgehalt">Trockensubstanz (TS) in %</FieldLabel>
            <div className="relative">
              <Input 
                id="tsgehalt" 
                type="number" 
                step="0.01"
                placeholder="0.00"
                value={tsGehalt} 
                onChange={(e) => setTsGehalt(e.target.value)} 
                disabled={!selectedSchlag}
                className="pr-10"
              />
              <span className="absolute right-3 top-2.5 text-sm text-muted-foreground font-medium">%</span>
            </div>
          </Field>
        </FieldGroup>
      </CardContent>

      <CardFooter className="flex gap-3 pt-2">
        <Button 
          variant="ghost" 
          className="flex-1" 
          onClick={() => handleSelect(null)}
          disabled={!selectedSchlag || loading}
        >
          <XCircle className="mr-2 h-4 w-4" /> Abbrechen
        </Button>
        <Button 
          className="flex-1" 
          onClick={handleSave} 
          disabled={loading || !selectedSchlag || !tsGehalt}
        >
          {loading ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Speichern
        </Button>
      </CardFooter>
    </Card>
  );
}