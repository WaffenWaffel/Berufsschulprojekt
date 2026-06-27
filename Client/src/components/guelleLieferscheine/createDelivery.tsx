import {
    Field, FieldLabel,
  } from "@/components/ui/field"

import {
    Combobox,
    ComboboxChip,
    ComboboxChips,
    ComboboxChipsInput,
    ComboboxContent,
    ComboboxEmpty,
    // ComboboxInput,
    ComboboxItem,
    ComboboxList,
    ComboboxValue,
  } from "@/components/ui/combobox"

import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
    } from "@/components/ui/card"

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

import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import type { Analysen, GuelleKunden } from "./columns"
import { cn } from "@/lib/utils"

// const kunden = ["Albrecht", "Nass"]
// const analysen = ["Dok1", "Dok2"]

export function CreateDelivery() {
  const [value, setValue] = useState<Analysen[]>([])
  const [kunden, setKunden] = useState<GuelleKunden[]>([]);
  const [analysen, setAnalysen] = useState<Analysen[]>([]);
  const [selectedKunde, setSelectedKunde] = useState<GuelleKunden | null>(null);
  const [open, setOpen] = useState(false);
  // const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/getCustomer')
      .then(res => res.json())
      .then(data => setKunden(data))
      .catch(err => console.error("Fehler beim Laden der Kunden:", err));
  }, []);

  useEffect(() => {
    fetch('/api/getAnalysis')
      .then(res => res.json())
      .then(data => setAnalysen(data))
      .catch(err => console.error("Fehler beim Laden der Analysen:", err));
  }, []);

  const handleSave = async () => {
    // 1. IDs aus den ausgewählten Analysen extrahieren
    // value ist z.B. [{id: 1, datum: "2024-01-01"}, {id: 5, datum: "2024-02-01"}]
    const analysenIds = value.map((a) => a.ID); // Ergebnis: [1, 5]
  
    // 2. Das Objekt für das Backend zusammenbauen
    const payload = {
      KundenNr: selectedKunde?.KundenNr, // Von der ersten Combobox
      Analysen: analysenIds              // Dein Array mit IDs [1, 5, ...]
    };
  
    // 3. Abschicken
    try {
      const response = await fetch('/api/newDelivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (response.ok) {
        const blob = await response.blob();
  
        // Einen temporären Link im Browser erstellen und "anklicken"
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "Lieferschein.pdf"; // Dateiname im Browser
        document.body.appendChild(a);
        a.click();
        
        // Aufräumen
        a.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Fehler beim Senden:", error);
    }
  };

    return(
        <Card className="mx-auto w-full max-w-sm" >
        <CardHeader>
            <CardTitle>Lieferschein Erstellen</CardTitle>
        </CardHeader>
        <CardContent>
          <Field>
          <FieldLabel>Kunde</FieldLabel>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
              >
                {selectedKunde 
                  ? `${selectedKunde.Name}, ${selectedKunde.Vorname}` 
                  : "Kunde wählen..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
              <Command>
                <CommandInput placeholder="Suche Kunde..." />
                <CommandList>
                  <CommandEmpty>Kein Kunde gefunden.</CommandEmpty>
                  <CommandGroup>
                    {kunden.map((kunde) => (
                      <CommandItem
                        key={kunde.KundenNr}
                        value={kunde.Name}
                        onSelect={() => {
                          setSelectedKunde(kunde)
                          setOpen(false)
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedKunde?.KundenNr === kunde.KundenNr ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {kunde.Name}, {kunde.Vorname}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          </Field>
          <Field>
            <FieldLabel>Analysen</FieldLabel>
            <Combobox 
              items={analysen} 
              multiple 
              value={value} // 'value' ist hier dein Array von Analyse-Objekten
              onValueChange={setValue}
            >
              <ComboboxChips>
                <ComboboxValue>
                  {value.map((item) => (
                    // Wir entfernen 'value={item}', da der Chip nur das Datum anzeigen soll
                    <ComboboxChip key={item.ID}>
                      {item.Datum}
                    </ComboboxChip>
                  ))}
                </ComboboxValue>
                <ComboboxChipsInput placeholder="Analysen hinzufügen" />
              </ComboboxChips>
              
              <ComboboxContent>
                <ComboboxEmpty>Keine Analysen gefunden.</ComboboxEmpty>
                <ComboboxList>
                  {(item: Analysen) => (
                    // Das Item behält 'value={item}', damit das Objekt beim Klick im State landet
                    <ComboboxItem key={item.ID} value={item}>
                      {item.Datum}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox> 
          </Field>
        </CardContent>
        <CardFooter>
        <Button className="w-full" onClick={handleSave} 
        // disabled={loading}
        >
          {/* {loading ? "Speichert..." : "Speichern"} */}
          {"Speichern"}
        </Button>
        </CardFooter>
    </Card>
    )
}