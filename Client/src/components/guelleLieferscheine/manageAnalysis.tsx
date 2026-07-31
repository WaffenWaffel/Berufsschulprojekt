import { useEffect, useState } from "react"
import {
  Field,
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
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CalendarIcon, Check, ChevronsUpDown, PlusCircle, Trash2 } from "lucide-react"
import { format, parseISO } from "date-fns"
import { de } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { apiFetch } from "@/lib/api"
import { FormMessage } from "./FormMessage"
import type { Analyse } from "./types"

interface ManageAnalysisProps {
  onSuccess?: () => void
}

const leeresFormular = {
  Stickstoff: "",
  Amoniumstickstoff: "",
  Phosphat: "",
  Kalium: "",
}

export function ManageAnalysis({ onSuccess }: ManageAnalysisProps) {
  const [open, setOpen] = useState(false)
  const [comboOpen, setComboOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fehler, setFehler] = useState<string | null>(null)
  const [date, setDate] = useState<Date | undefined>()
  const [analysenListe, setAnalysenListe] = useState<Analyse[]>([])
  const [selectedAnalyse, setSelectedAnalyse] = useState<Analyse | null>(null)
  const [formData, setFormData] = useState(leeresFormular)

  const fetchAnalysen = async () => {
    try {
      setAnalysenListe(await apiFetch<Analyse[]>("/api/getAnalysis"))
    } catch (error) {
      setFehler(error instanceof Error ? error.message : "Analysen konnten nicht geladen werden.")
    }
  }

  useEffect(() => {
    if (open) fetchAnalysen()
  }, [open])

  const handleSelect = (analyse: Analyse | null) => {
    setFehler(null)
    if (analyse) {
      setSelectedAnalyse(analyse)
      setFormData({
        Stickstoff: String(analyse.Stickstoff),
        Amoniumstickstoff: String(analyse.Amoniumstickstoff),
        Phosphat: String(analyse.Phosphat),
        Kalium: String(analyse.Kalium),
      })
      setDate(parseISO(analyse.Datum))
    } else {
      setSelectedAnalyse(null)
      setFormData(leeresFormular)
      setDate(undefined)
    }
    setComboOpen(false)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setFehler(null)

    if (!date) return setFehler("Bitte ein Datum für die Analyse auswählen.")

    setLoading(true)
    const istUpdate = selectedAnalyse !== null
    const pfad = istUpdate ? `/api/updateAnalysis/${selectedAnalyse.id}` : "/api/newAnalysis"

    try {
      await apiFetch(pfad, {
        method: istUpdate ? "PUT" : "POST",
        body: JSON.stringify({
          Stickstoff: Number(formData.Stickstoff),
          Amoniumstickstoff: Number(formData.Amoniumstickstoff),
          Phosphat: Number(formData.Phosphat),
          Kalium: Number(formData.Kalium),
          Datum: format(date, "yyyy-MM-dd"),
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
    if (!selectedAnalyse) return
    setFehler(null)
    setLoading(true)
    try {
      await apiFetch(`/api/deleteAnalysis/${selectedAnalyse.id}`, { method: "DELETE" })
      setOpen(false)
      handleSelect(null)
      onSuccess?.()
    } catch (error) {
      setFehler(error instanceof Error ? error.message : "Löschen fehlgeschlagen.")
    } finally {
      setLoading(false)
    }
  }

  const naehrstoffFelder = [
    { key: "Stickstoff", label: "Gesamtstickstoff" },
    { key: "Amoniumstickstoff", label: "Amoniumstickstoff" },
    { key: "Phosphat", label: "Phosphat" },
    { key: "Kalium", label: "Kalium" },
  ] as const

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Analysen verwalten</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {selectedAnalyse ? "Analyse bearbeiten" : "Neue Analyse anlegen"}
          </DialogTitle>
          <DialogDescription>
            Die Werte werden in kg/cbm auf dem Lieferschein abgedruckt.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <FieldLabel>Bestehende Analyse wählen</FieldLabel>
          <Popover open={comboOpen} onOpenChange={setComboOpen}>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" className="w-full justify-between font-normal">
                <span className="truncate">
                  {selectedAnalyse
                    ? `Analyse vom ${format(parseISO(selectedAnalyse.Datum), "dd.MM.yyyy")}`
                    : "Suche Datum oder 'Neu'..."}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
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
                      <CommandItem
                        key={a.id}
                        value={format(parseISO(a.Datum), "dd.MM.yyyy")}
                        onSelect={() => handleSelect(a)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedAnalyse?.id === a.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {format(parseISO(a.Datum), "dd.MM.yyyy")}
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
              {naehrstoffFelder.map(({ key, label }) => (
                <Field key={key}>
                  <FieldLabel htmlFor={key}>{label} (kg/cbm)</FieldLabel>
                  <Input
                    id={key}
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData[key]}
                    onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                  />
                </Field>
              ))}

              <Field>
                <FieldLabel>Datum der Analyse</FieldLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "dd.MM.yyyy") : <span>Datum wählen</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={date} onSelect={setDate} locale={de} />
                  </PopoverContent>
                </Popover>
              </Field>

              <FormMessage fehler={fehler} />
            </FieldGroup>
          </FieldSet>

          <DialogFooter className="mt-6 w-full justify-between sm:justify-between">
            {selectedAnalyse ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" disabled={loading}>
                    <Trash2 className="mr-2 h-4 w-4" /> Löschen
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Analyse wirklich löschen?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Die Analyse vom{" "}
                      {format(parseISO(selectedAnalyse.Datum), "dd.MM.yyyy")} wird
                      gelöscht. Analysen, die bereits auf einem Lieferschein stehen,
                      lehnt der Server ab.
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
                {loading ? "Speichert..." : selectedAnalyse ? "Speichern" : "Erstellen"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
