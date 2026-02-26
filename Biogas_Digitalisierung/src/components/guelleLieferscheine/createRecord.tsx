import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import {
  Field,
  FieldLabel,
} from "@/components/ui/field"

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

import type { GuelleKunden } from "./columns"

export function GuelleInput() {
  const [kunden, setKunden] = useState<GuelleKunden[]>([]);
  const [selectedKunde, setSelectedKunde] = useState<GuelleKunden | null>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [menge, setMenge] = useState("");

  useEffect(() => {
    fetch('/api/getCustomer')
      .then(res => res.json())
      .then(data => setKunden(data))
      .catch(err => console.error("Fehler beim Laden der Kunden:", err));
  }, []);

  const handleSave = async () => {
    if (!selectedKunde || !menge || !date) {
      alert("Bitte alle Felder ausfüllen!");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/newRecord', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          KundenNr: selectedKunde.KundenNr, // ID direkt vom Objekt
          Menge: Number(menge),
          Datum: format(date, "yyyy-MM-dd"),
        }),
      });

      if (!response.ok) throw new Error("Fehler beim Speichern");
      
      alert("Erfolgreich gespeichert!");
      // Reset
      setMenge("");
      setSelectedKunde(null);
    } catch (error) {
      console.error("Fehler beim POST:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-sm">
      <CardHeader>
        <CardTitle>Gülle Menge eingeben</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Field>
          <FieldLabel htmlFor="guelleMenge">Menge (m³)</FieldLabel>
          <Input 
            id="guelleMenge" 
            type="number" 
            placeholder="0" 
            value={menge} 
            onChange={(e) => setMenge(e.target.value)}
          />
        </Field>
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

        {/* Datum Feld */}
        <Field>
          <FieldLabel>Datum</FieldLabel>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Datum wählen</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={date} onSelect={setDate}/>
            </PopoverContent>
          </Popover>
        </Field>

      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={handleSave} disabled={loading}>
          {loading ? "Speichert..." : "Speichern"}
        </Button>
      </CardFooter>
    </Card>
  )
}