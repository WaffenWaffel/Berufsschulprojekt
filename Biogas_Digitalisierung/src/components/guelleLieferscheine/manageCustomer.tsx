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
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Check, ChevronsUpDown, Trash2, UserPlus } from "lucide-react"
import { cn } from "@/lib/utils"

// Typ-Definition passend zu deiner DB
interface GuelleKunden {
  KundenNr: string | number;
  Name: string;
  Vorname: string;
  PLZ: string | number;
  Wohnort: string;
  Straße: string;
  HNr: string;
}

export function ManageCustomer() {
  const [open, setOpen] = useState(false);
  const [comboOpen, setComboOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [kundenListe, setKundenListe] = useState<GuelleKunden[]>([]);
  const [selectedKunde, setSelectedKunde] = useState<GuelleKunden | null>(null);

  const emptyForm = {
    KundenNr: "",
    Name: "",
    Vorname: "",
    PLZ: "",
    Wohnort: "",
    Straße: "",
    HNr: ""
  };

  const [formData, setFormData] = useState(emptyForm);

  // 1. Kunden laden
  const fetchKunden = async () => {
    const res = await fetch('/api/getCustomer');
    const data = await res.json();
    setKundenListe(data);
  };

  useEffect(() => {
    if (open) fetchKunden();
  }, [open]);

  // 2. Auswahl-Logik
  const handleSelect = (kunde: GuelleKunden | null) => {
    if (kunde) {
      setSelectedKunde(kunde);
      setFormData({
        KundenNr: kunde.KundenNr.toString(),
        Name: kunde.Name,
        Vorname: kunde.Vorname || "",
        PLZ: kunde.PLZ.toString(),
        Wohnort: kunde.Wohnort,
        Straße: kunde.Straße,
        HNr: kunde.HNr
      });
    } else {
      setSelectedKunde(null);
      setFormData(emptyForm);
    }
    setComboOpen(false);
  };

  // 3. Speichern / Update
  const handleSave = async () => {
    setLoading(true);
    const isUpdate = !!selectedKunde;
    const url = isUpdate ? `/api/updateCustomer/${formData.KundenNr}` : '/api/newCustomer';
    
    try {
      const response = await fetch(url, {
        method: isUpdate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          KundenNr: Number(formData.KundenNr),
          PLZ: Number(formData.PLZ)
        }),
      });

      if (!response.ok) throw new Error("Fehler beim Speichern");
      
      setOpen(false);
      handleSelect(null); // Reset
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 4. Löschen
  const handleDelete = async () => {
    if (!selectedKunde || !confirm("Kunde wirklich löschen?")) return;
    
    setLoading(true);
    try {
      await fetch(`/api/deleteCustomer/${selectedKunde.KundenNr}`, { method: 'DELETE' });
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
        <Button variant="outline">Kunden verwalten</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{selectedKunde ? "Kunde bearbeiten" : "Neuen Kunden anlegen"}</DialogTitle>
          
          {/* Kunden-Auswahl Dropdown */}
          <div className="py-4">
            <FieldLabel>Existierenden Kunden wählen</FieldLabel>
            <Popover open={comboOpen} onOpenChange={setComboOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  {selectedKunde ? `${selectedKunde.Name} (${selectedKunde.KundenNr})` : "Suche oder 'Neu anlegen'..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Name suchen..." />
                  <CommandList>
                    <CommandEmpty>Kein Kunde gefunden.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem onSelect={() => handleSelect(null)}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        <span>+ Neuen Kunden anlegen</span>
                      </CommandItem>
                      {kundenListe.map((k) => (
                        <CommandItem key={k.KundenNr} onSelect={() => handleSelect(k)}>
                          <Check className={cn("mr-2 h-4 w-4", selectedKunde?.KundenNr === k.KundenNr ? "opacity-100" : "opacity-0")} />
                          {k.Name}, {k.Vorname} ({k.KundenNr})
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
              <FieldDescription>
                {selectedKunde ? "Bearbeite die Daten des Kunden." : "Alle Felder müssen für einen neuen Kunden ausgefüllt werden."}
              </FieldDescription>
              
              <Field>
                <FieldLabel htmlFor="kundenNr">KundenNr</FieldLabel>
                <Input 
                  id="kundenNr" type="number" 
                  value={formData.KundenNr} 
                  disabled={!!selectedKunde} // ID darf beim Bearbeiten oft nicht geändert werden
                  onChange={(e) => setFormData({...formData, KundenNr: e.target.value})} 
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="kundenName">Name</FieldLabel>
                <Input id="kundenName" value={formData.Name} onChange={(e) => setFormData({...formData, Name: e.target.value})} />
              </Field>
                <Field>
                    <FieldLabel htmlFor="kundenNachname">Vorname</FieldLabel>
                    <Input 
                    id="kundenNachname" 
                    type="text" 
                    placeholder="Max" 
                    value={formData.Vorname} 
                    onChange={(e) => setFormData({...formData, Vorname: e.target.value})} 
                    />
                </Field>
                <Field>
                    <FieldLabel htmlFor="plz">Postleitzahl</FieldLabel>
                    <Input 
                    id="plz" 
                    type="number" 
                    placeholder="86733" 
                    value={formData.PLZ} 
                    onChange={(e) => setFormData({...formData, PLZ: e.target.value})} 
                    />
                </Field>
                <Field>
                    <FieldLabel htmlFor="wohnort">Wohnort</FieldLabel>
                    <Input 
                    id="wohnort" 
                    type="text" 
                    placeholder="Alerheim" 
                    value={formData.Wohnort} 
                    onChange={(e) => setFormData({...formData, Wohnort: e.target.value})} 
                    />
                </Field>
                <Field>
                    <FieldLabel htmlFor="straße">Straße</FieldLabel>
                    <Input 
                    id="straße" 
                    type="text" 
                    placeholder="Dorfstraße" 
                    value={formData.Straße} 
                    onChange={(e) => setFormData({...formData, Straße: e.target.value})} 
                    />
                </Field>
                <Field>
                    <FieldLabel htmlFor="hnr">Hausnummer</FieldLabel>
                    <Input 
                    id="hnr" 
                    type="text" 
                    placeholder="8" 
                    value={formData.HNr} 
                    onChange={(e) => setFormData({...formData, HNr: e.target.value})} 
                    />
                </Field>

            </FieldGroup>
          </FieldSet>
        </DialogHeader>

        <DialogFooter className="flex justify-between sm:justify-between w-full">
          {selectedKunde && (
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              <Trash2 className="mr-2 h-4 w-4" /> Löschen
            </Button>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Abbrechen</Button>
            <Button onClick={handleSave} disabled={loading}>
              {selectedKunde ? "Speichern" : "Erstellen"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}