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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
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
import { apiFetch } from "@/lib/api"
import { FormMessage } from "./FormMessage"
import type { GuelleKunde } from "./types"

interface ManageCustomerProps {
  onSuccess?: () => void
}

const leeresFormular = {
  KundenNr: "",
  Name: "",
  Vorname: "",
  PLZ: "",
  Wohnort: "",
  Strasse: "",
  HNr: "",
}

export function ManageCustomer({ onSuccess }: ManageCustomerProps) {
  const [open, setOpen] = useState(false)
  const [comboOpen, setComboOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fehler, setFehler] = useState<string | null>(null)
  const [kundenListe, setKundenListe] = useState<GuelleKunde[]>([])
  const [selectedKunde, setSelectedKunde] = useState<GuelleKunde | null>(null)
  const [formData, setFormData] = useState(leeresFormular)

  const fetchKunden = async () => {
    try {
      setKundenListe(await apiFetch<GuelleKunde[]>("/api/getCustomer"))
    } catch (error) {
      setFehler(error instanceof Error ? error.message : "Kunden konnten nicht geladen werden.")
    }
  }

  useEffect(() => {
    if (open) fetchKunden()
  }, [open])

  const handleSelect = (kunde: GuelleKunde | null) => {
    setFehler(null)
    if (kunde) {
      setSelectedKunde(kunde)
      setFormData({
        KundenNr: String(kunde.KundenNr),
        Name: kunde.Name,
        Vorname: kunde.Vorname ?? "",
        PLZ: kunde.PLZ,
        Wohnort: kunde.Wohnort,
        Strasse: kunde.Strasse,
        HNr: kunde.HNr,
      })
    } else {
      setSelectedKunde(null)
      setFormData(leeresFormular)
    }
    setComboOpen(false)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setFehler(null)
    setLoading(true)

    const istUpdate = selectedKunde !== null
    const pfad = istUpdate
      ? `/api/updateCustomer/${formData.KundenNr}`
      : "/api/newCustomer"

    try {
      await apiFetch(pfad, {
        method: istUpdate ? "PUT" : "POST",
        body: JSON.stringify({
          ...formData,
          KundenNr: Number(formData.KundenNr),
          // PLZ bleibt Text, damit führende Nullen erhalten bleiben
          PLZ: formData.PLZ.trim(),
        }),
      })

      setOpen(false)
      handleSelect(null)
      onSuccess?.()
    } catch (error) {
      setFehler(error instanceof Error ? error.message : "Speichern fehlgeschlagen.")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedKunde) return
    setFehler(null)
    setLoading(true)
    try {
      await apiFetch(`/api/deleteCustomer/${selectedKunde.KundenNr}`, { method: "DELETE" })
      setOpen(false)
      handleSelect(null)
      onSuccess?.()
    } catch (error) {
      setFehler(error instanceof Error ? error.message : "Löschen fehlgeschlagen.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Kunden verwalten</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {selectedKunde ? "Kunde bearbeiten" : "Neuen Kunden anlegen"}
          </DialogTitle>
          <DialogDescription>
            {selectedKunde
              ? "Bearbeite die Daten des ausgewählten Kunden."
              : "Alle Felder müssen für einen neuen Kunden ausgefüllt werden."}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <FieldLabel>Existierenden Kunden wählen</FieldLabel>
          <Popover open={comboOpen} onOpenChange={setComboOpen}>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" className="w-full justify-between font-normal">
                <span className="truncate">
                  {selectedKunde
                    ? `${selectedKunde.Name} (${selectedKunde.KundenNr})`
                    : "Suche oder 'Neu anlegen'..."}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
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
                      <CommandItem
                        key={k.KundenNr}
                        value={`${k.Name} ${k.Vorname} ${k.KundenNr}`}
                        onSelect={() => handleSelect(k)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedKunde?.KundenNr === k.KundenNr ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {k.Name}, {k.Vorname} ({k.KundenNr})
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <form onSubmit={handleSubmit}>
          <FieldSet>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="kundenNr">KundenNr</FieldLabel>
                <Input
                  id="kundenNr"
                  type="number"
                  min="1"
                  required
                  value={formData.KundenNr}
                  // Beim Bearbeiten ist die Kundennummer der Schlüssel und nicht änderbar
                  disabled={selectedKunde !== null}
                  onChange={(e) => setFormData({ ...formData, KundenNr: e.target.value })}
                />
                {selectedKunde && (
                  <FieldDescription>
                    Die Kundennummer kann nachträglich nicht geändert werden.
                  </FieldDescription>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="kundenName">Name</FieldLabel>
                <Input
                  id="kundenName"
                  required
                  placeholder="Mustermann"
                  value={formData.Name}
                  onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="kundenVorname">Vorname</FieldLabel>
                <Input
                  id="kundenVorname"
                  required
                  placeholder="Max"
                  value={formData.Vorname}
                  onChange={(e) => setFormData({ ...formData, Vorname: e.target.value })}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="plz">Postleitzahl</FieldLabel>
                <Input
                  id="plz"
                  // Text statt number: führende Nullen (z.B. 01067) gehen sonst verloren
                  inputMode="numeric"
                  pattern="[0-9]{4,5}"
                  required
                  placeholder="86733"
                  value={formData.PLZ}
                  onChange={(e) => setFormData({ ...formData, PLZ: e.target.value })}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="wohnort">Wohnort</FieldLabel>
                <Input
                  id="wohnort"
                  required
                  placeholder="Alerheim"
                  value={formData.Wohnort}
                  onChange={(e) => setFormData({ ...formData, Wohnort: e.target.value })}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="strasse">Straße</FieldLabel>
                <Input
                  id="strasse"
                  required
                  placeholder="Dorfstraße"
                  value={formData.Strasse}
                  onChange={(e) => setFormData({ ...formData, Strasse: e.target.value })}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="hnr">Hausnummer</FieldLabel>
                <Input
                  id="hnr"
                  required
                  placeholder="8"
                  value={formData.HNr}
                  onChange={(e) => setFormData({ ...formData, HNr: e.target.value })}
                />
              </Field>

              <FormMessage fehler={fehler} />
            </FieldGroup>
          </FieldSet>

          <DialogFooter className="mt-6 w-full justify-between sm:justify-between">
            {selectedKunde ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" disabled={loading}>
                    <Trash2 className="mr-2 h-4 w-4" /> Löschen
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Kunde wirklich löschen?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {selectedKunde.Name}, {selectedKunde.Vorname} wird gelöscht -
                      zusammen mit allen erfassten Abgaben und Lieferscheinen dieses
                      Kunden. Das lässt sich nicht rückgängig machen.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Löschen</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <span />
            )}

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Speichert..." : selectedKunde ? "Speichern" : "Erstellen"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
