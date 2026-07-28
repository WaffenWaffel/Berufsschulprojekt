import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { format, parseISO } from "date-fns"
import { de } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { apiFetch } from "@/lib/api"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import { Field, FieldLabel } from "@/components/ui/field"

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { KundenCombobox } from "./KundenCombobox"
import { FormMessage } from "./FormMessage"
import type { GuelleKunde } from "./types"

interface GuelleInputProps {
  kunden: GuelleKunde[]
  onSuccess?: () => void
}

/** Formular zum Erfassen einer neuen Gülle-Abgabe. */
export function GuelleInput({ kunden, onSuccess }: GuelleInputProps) {
  const [selectedKunde, setSelectedKunde] = useState<GuelleKunde | null>(null)
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [menge, setMenge] = useState("")
  const [bemerkung, setBemerkung] = useState("")
  const [loading, setLoading] = useState(false)
  const [fehler, setFehler] = useState<string | null>(null)
  const [erfolg, setErfolg] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setFehler(null)
    setErfolg(null)

    if (!selectedKunde) return setFehler("Bitte einen Kunden auswählen.")
    if (!date) return setFehler("Bitte ein Datum auswählen.")

    const mengeZahl = Number(menge)
    if (!Number.isFinite(mengeZahl) || mengeZahl <= 0) {
      return setFehler("Die Menge muss größer als 0 sein.")
    }

    setLoading(true)
    try {
      await apiFetch("/api/newRecord", {
        method: "POST",
        body: JSON.stringify({
          KundenNr: selectedKunde.KundenNr,
          Menge: mengeZahl,
          Datum: format(date, "yyyy-MM-dd"),
          Bemerkung: bemerkung,
        }),
      })

      setMenge("")
      setBemerkung("")
      setSelectedKunde(null)
      setErfolg("Abgabe gespeichert.")
      onSuccess?.()
    } catch (error) {
      setFehler(error instanceof Error ? error.message : "Speichern fehlgeschlagen.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mx-auto w-full max-w-sm">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Gülle Menge eingeben</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field>
            <FieldLabel htmlFor="guelleMenge">Menge (m³)</FieldLabel>
            <Input
              id="guelleMenge"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0"
              value={menge}
              onChange={(e) => setMenge(e.target.value)}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="guelleKunde">Kunde</FieldLabel>
            <KundenCombobox
              id="guelleKunde"
              kunden={kunden}
              selected={selectedKunde}
              onSelect={setSelectedKunde}
            />
          </Field>

          <Field>
            <FieldLabel>Datum</FieldLabel>
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

          <Field>
            <FieldLabel htmlFor="guelleBemerkung">Bemerkung (optional)</FieldLabel>
            <Textarea
              id="guelleBemerkung"
              rows={2}
              placeholder="z.B. Fahrer, Fass, Besonderheiten"
              value={bemerkung}
              onChange={(e) => setBemerkung(e.target.value)}
            />
          </Field>

          <FormMessage fehler={fehler} erfolg={erfolg} />
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Speichert..." : "Speichern"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

interface EditRecordDialogProps {
  eintrag: { id: number; Menge: number; Datum: string; Bemerkung: string } | null
  onClose: () => void
  onSuccess: () => void
}

/** Dialog zum Bearbeiten einer bereits erfassten, noch offenen Abgabe. */
export function EditRecordDialog({ eintrag, onClose, onSuccess }: EditRecordDialogProps) {
  const [menge, setMenge] = useState("")
  const [date, setDate] = useState<Date | undefined>()
  const [bemerkung, setBemerkung] = useState("")
  const [loading, setLoading] = useState(false)
  const [fehler, setFehler] = useState<string | null>(null)
  const [geladeneId, setGeladeneId] = useState<number | null>(null)

  // Formular mit dem gewählten Eintrag befüllen, sobald ein anderer ankommt
  if (eintrag && eintrag.id !== geladeneId) {
    setGeladeneId(eintrag.id)
    setMenge(String(eintrag.Menge))
    setDate(parseISO(eintrag.Datum))
    setBemerkung(eintrag.Bemerkung)
    setFehler(null)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!eintrag) return
    setFehler(null)

    if (!date) return setFehler("Bitte ein Datum auswählen.")
    const mengeZahl = Number(menge)
    if (!Number.isFinite(mengeZahl) || mengeZahl <= 0) {
      return setFehler("Die Menge muss größer als 0 sein.")
    }

    setLoading(true)
    try {
      await apiFetch(`/api/updateRecord/${eintrag.id}`, {
        method: "PUT",
        body: JSON.stringify({
          Menge: mengeZahl,
          Datum: format(date, "yyyy-MM-dd"),
          Bemerkung: bemerkung,
        }),
      })
      setGeladeneId(null)
      onSuccess()
      onClose()
    } catch (error) {
      setFehler(error instanceof Error ? error.message : "Speichern fehlgeschlagen.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={eintrag !== null} onOpenChange={(offen) => !offen && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Abgabe bearbeiten</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field>
            <FieldLabel htmlFor="editMenge">Menge (m³)</FieldLabel>
            <Input
              id="editMenge"
              type="number"
              step="0.01"
              min="0.01"
              value={menge}
              onChange={(e) => setMenge(e.target.value)}
            />
          </Field>

          <Field>
            <FieldLabel>Datum</FieldLabel>
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

          <Field>
            <FieldLabel htmlFor="editBemerkung">Bemerkung</FieldLabel>
            <Textarea
              id="editBemerkung"
              rows={2}
              value={bemerkung}
              onChange={(e) => setBemerkung(e.target.value)}
            />
          </Field>

          <FormMessage fehler={fehler} />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Speichert..." : "Speichern"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
