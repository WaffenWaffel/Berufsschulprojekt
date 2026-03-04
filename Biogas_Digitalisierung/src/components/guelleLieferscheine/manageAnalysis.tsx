import { useEffect, useState } from "react"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CalendarIcon, Check, ChevronsUpDown, Trash2, PlusCircle } from "lucide-react"
import { format, parseISO } from "date-fns"
import { cn } from "@/lib/utils"
import type { Analyse } from "./columns"

export function ManageAnalysis() {
  const [open, setOpen] = useState(false);
  const [comboOpen, setComboOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<Date>();
  
  const [analysenListe, setAnalysenListe] = useState<Analyse[]>([]);
  const [selectedAnalyse, setSelectedAnalyse] = useState<Analyse | null>(null);

  const emptyForm = {
    Stickstoff: "",
    Amoniumstickstoff: "",
    Phosphat: "",
    Kalium: "",
  };

  const [formData, setFormData] = useState(emptyForm);

  // 1. Analysen laden
  const fetchAnalysen = async () => {
    try {
      const res = await fetch('/api/getAnalysis'); // Erstelle diesen Endpoint im Backend
      const data = await res.json();
      setAnalysenListe(data);
    } catch (err) {
      console.error("Fehler beim Laden:", err);
    }
  };

  useEffect(() => {
    if (open) fetchAnalysen();
  }, [open]);

  // 2. Auswahl-Logik
  const handleSelect = (analyse: Analyse | null) => {
    if (analyse) {
      setSelectedAnalyse(analyse);
      setFormData({
        Stickstoff: analyse.Stickstoff.toString(),
        Amoniumstickstoff: analyse.Amoniumstickstoff.toString(),
        Phosphat: analyse.Phosphat.toString(),
        Kalium: analyse.Kalium.toString(),
      });
      setDate(parseISO(analyse.Datum)); // Datum-String in Date-Objekt umwandeln
    } else {
      setSelectedAnalyse(null);
      setFormData(emptyForm);
      setDate(undefined);
    }
    setComboOpen(false);
  };

  // 3. Speichern / Update
  const handleSave = async () => {
    setLoading(true);
    const isUpdate = !!selectedAnalyse;
    const url = isUpdate ? `/api/updateAnalysis/${selectedAnalyse.id}` : '/api/newAnalysis';
    
    try {
      const response = await fetch(url, {
        method: isUpdate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Stickstoff: Number(formData.Stickstoff),
          Amoniumstickstoff: Number(formData.Amoniumstickstoff),
          Phosphat: Number(formData.Phosphat),
          Kalium: Number(formData.Kalium),
          Datum: date ? format(date, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
        }),
      });

      if (!response.ok) throw new Error("Fehler beim Speichern");
      setOpen(false);
      handleSelect(null);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 4. Löschen
  const handleDelete = async () => {
    if (!selectedAnalyse || !confirm("Analyse wirklich löschen?")) return;
    setLoading(true);
    try {
      await fetch(`/api/deleteAnalysis/${selectedAnalyse.id}`, { method: 'DELETE' });
      setOpen(false);
      handleSelect(null);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Analysen verwalten</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{selectedAnalyse ? "Analyse bearbeiten" : "Neue Analyse anlegen"}</DialogTitle>
          
          {/* Auswahl-Dropdown */}
          <div className="py-4">
            <FieldLabel>Bestehende Analyse wählen</FieldLabel>
            <Popover open={comboOpen} onOpenChange={setComboOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  {selectedAnalyse 
                    ? `Analyse vom ${format(parseISO(selectedAnalyse.Datum), "dd.MM.yyyy")}` 
                    : "Suche Datum oder 'Neu'..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Datum suchen..." />
                  <CommandList>
                    <CommandEmpty>Keine Analyse gefunden.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem onSelect={() => handleSelect(null)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        <span>+ Neue Analyse erstellen</span>
                      </CommandItem>
                      {analysenListe.map((a) => (
                        <CommandItem key={a.id} onSelect={() => handleSelect(a)}>
                          <Check className={cn("mr-2 h-4 w-4", selectedAnalyse?.id === a.id ? "opacity-100" : "opacity-0")} />
                          {format(parseISO(a.Datum), "dd.MM.yyyy")} (ID: {a.id})
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <FieldSet>
            <FieldGroup>
              <FieldDescription>Geben Sie die Analysewerte ein.</FieldDescription>
              
              <Field>
                <FieldLabel htmlFor="stickstoff">Gesamtstickstoff</FieldLabel>
                <Input id="stickstoff" type="number" value={formData.Stickstoff} onChange={(e) => setFormData({...formData, Stickstoff: e.target.value})} />
              </Field>

              <Field>
                <FieldLabel htmlFor="amoniumstickstoff">Amoniumstickstoff</FieldLabel>
                <Input id="amoniumstickstoff" type="number" value={formData.Amoniumstickstoff} onChange={(e) => setFormData({...formData, Amoniumstickstoff: e.target.value})} />
              </Field>

              <Field>
                <FieldLabel htmlFor="phosphat">Phosphat</FieldLabel>
                <Input id="phosphat" type="number" value={formData.Phosphat} onChange={(e) => setFormData({...formData, Phosphat: e.target.value})} />
              </Field>

              <Field>
                <FieldLabel htmlFor="kalium">Kalium</FieldLabel>
                <Input id="kalium" type="number" value={formData.Kalium} onChange={(e) => setFormData({...formData, Kalium: e.target.value})} />
              </Field>

              <Field>
                <FieldLabel>Datum der Analyse</FieldLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Datum wählen</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </Field>
            </FieldGroup>
          </FieldSet>
        </DialogHeader>

        <DialogFooter className="flex justify-between sm:justify-between w-full mt-4">
          {selectedAnalyse && (
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              <Trash2 className="mr-2 h-4 w-4" /> Löschen
            </Button>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Abbrechen</Button>
            <Button onClick={handleSave} disabled={loading}>
              {selectedAnalyse ? "Speichern" : "Erstellen"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}