import { useMemo, useState } from "react"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { CalendarIcon, X } from "lucide-react"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
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

import { Button } from "@/components/ui/button"
import { apiDownload, blobHerunterladen } from "@/lib/api"
import { KundenCombobox } from "./KundenCombobox"
import { FormMessage } from "./FormMessage"
import type { Analyse, GuelleDaten, GuelleKunde } from "./types"

interface CreateDeliveryProps {
  kunden: GuelleKunde[]
  analysen: Analyse[]
  /** Alle Abgaben - dient nur der Vorschau, welche Positionen auf den Schein kommen. */
  abgaben: GuelleDaten[]
  /** Wird nach erfolgreicher Erstellung aufgerufen - die Abgaben gelten dann als abgerechnet. */
  onSuccess?: () => void
}

/** Formatiert YYYY-MM-DD als TT.MM.JJJJ. */
function datumAnzeigen(iso: string): string {
  const [jahr, monat, tag] = iso.split("-")
  return tag && monat && jahr ? `${tag}.${monat}.${jahr}` : iso
}

export function CreateDelivery({ kunden, analysen, abgaben, onSuccess }: CreateDeliveryProps) {
  const [selectedKunde, setSelectedKunde] = useState<GuelleKunde | null>(null)
  const [selectedAnalysen, setSelectedAnalysen] = useState<Analyse[]>([])
  const [von, setVon] = useState<Date | undefined>()
  const [bis, setBis] = useState<Date | undefined>()
  const [loading, setLoading] = useState(false)
  const [fehler, setFehler] = useState<string | null>(null)
  const [erfolg, setErfolg] = useState<string | null>(null)

  const vonIso = von ? format(von, "yyyy-MM-dd") : null
  const bisIso = bis ? format(bis, "yyyy-MM-dd") : null
  const zeitraumUngueltig = vonIso !== null && bisIso !== null && vonIso > bisIso

  /**
   * Vorschau der Positionen. Dieselbe Bedingung wie im Backend: offene
   * Abgaben des Kunden, optional auf den Zeitraum eingegrenzt. So sieht man
   * vor dem Erstellen, was auf dem Schein landet.
   */
  const betroffen = useMemo(() => {
    if (!selectedKunde) return []
    return abgaben.filter(
      (a) =>
        a.KundeId === selectedKunde.id &&
        !a.Abgerechnet &&
        (!vonIso || a.Datum >= vonIso) &&
        (!bisIso || a.Datum <= bisIso)
    )
  }, [abgaben, selectedKunde, vonIso, bisIso])

  const summe = betroffen.reduce((wert, a) => wert + a.Menge, 0)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setFehler(null)
    setErfolg(null)

    if (!selectedKunde) return setFehler("Bitte einen Kunden auswählen.")
    if (zeitraumUngueltig) return setFehler('"Von" darf nicht nach "Bis" liegen.')

    setLoading(true)
    try {
      const response = await apiDownload("/api/newDelivery", {
        method: "POST",
        body: JSON.stringify({
          KundeId: selectedKunde.id,
          // Leere Auswahl bedeutet: Server nimmt die aktuellste Analyse
          Analysen: selectedAnalysen.map((a) => a.id),
          // Leerer Zeitraum bedeutet: alle offenen Abgaben
          ...(vonIso && { Von: vonIso }),
          ...(bisIso && { Bis: bisIso }),
        }),
      })

      await blobHerunterladen(response, "Lieferschein.pdf")

      setSelectedAnalysen([])
      setSelectedKunde(null)
      setVon(undefined)
      setBis(undefined)
      setErfolg("Lieferschein erstellt und heruntergeladen.")
      onSuccess?.()
    } catch (error) {
      setFehler(error instanceof Error ? error.message : "Lieferschein konnte nicht erstellt werden.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mx-auto w-full max-w-sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <CardHeader>
          <CardTitle>Lieferschein erstellen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field>
            <FieldLabel htmlFor="lieferscheinKunde">Kunde</FieldLabel>
            <KundenCombobox
              id="lieferscheinKunde"
              kunden={kunden}
              selected={selectedKunde}
              onSelect={setSelectedKunde}
            />
          </Field>

          <Field>
            <FieldLabel>Zeitraum (optional)</FieldLabel>
            <div className="flex items-center gap-2">
              <DatumFeld wert={von} setzen={setVon} platzhalter="Von" />
              <span className="text-muted-foreground">–</span>
              <DatumFeld wert={bis} setzen={setBis} platzhalter="Bis" />
            </div>
            <FieldDescription>
              {zeitraumUngueltig
                ? '"Von" liegt nach "Bis".'
                : selectedKunde
                  ? betroffen.length > 0
                    ? `${betroffen.length} offene ${betroffen.length === 1 ? "Abgabe" : "Abgaben"}, ${summe.toLocaleString("de-DE", { minimumFractionDigits: 2 })} m³ kommen auf den Schein.`
                    : "Für diesen Kunden gibt es im gewählten Zeitraum keine offenen Abgaben."
                  : "Ohne Zeitraum kommen alle noch nicht abgerechneten Abgaben auf den Schein."}
            </FieldDescription>
          </Field>

          <Field>
            <FieldLabel>Analysen</FieldLabel>
            <Combobox
              items={analysen}
              multiple
              value={selectedAnalysen}
              onValueChange={setSelectedAnalysen}
            >
              <ComboboxChips>
                <ComboboxValue>
                  {selectedAnalysen.map((item) => (
                    <ComboboxChip key={item.id}>{datumAnzeigen(item.Datum)}</ComboboxChip>
                  ))}
                </ComboboxValue>
                <ComboboxChipsInput placeholder="Analysen hinzufügen" />
              </ComboboxChips>

              <ComboboxContent>
                <ComboboxEmpty>Keine Analysen gefunden.</ComboboxEmpty>
                <ComboboxList>
                  {(item: Analyse) => (
                    <ComboboxItem key={item.id} value={item}>
                      {datumAnzeigen(item.Datum)}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
            <FieldDescription>
              Ohne Auswahl wird die aktuellste Analyse abgedruckt.
            </FieldDescription>
          </Field>

          <FormMessage fehler={fehler} erfolg={erfolg} />
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            className="w-full"
            disabled={loading || !selectedKunde || zeitraumUngueltig || betroffen.length === 0}
          >
            {loading ? "Erstellt..." : "Lieferschein erstellen"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

interface DatumFeldProps {
  wert: Date | undefined
  setzen: (datum: Date | undefined) => void
  platzhalter: string
}

/** Datumsauswahl mit Möglichkeit, die Auswahl wieder zu leeren. */
function DatumFeld({ wert, setzen, platzhalter }: DatumFeldProps) {
  return (
    <div className="relative flex-1">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "w-full justify-start pr-8 text-left font-normal",
              !wert && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
            <span className="truncate">
              {wert ? format(wert, "dd.MM.yyyy") : platzhalter}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar mode="single" selected={wert} onSelect={setzen} locale={de} />
        </PopoverContent>
      </Popover>
      {wert && (
        <button
          type="button"
          onClick={() => setzen(undefined)}
          title={`${platzhalter} leeren`}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
          <span className="sr-only">{platzhalter} leeren</span>
        </button>
      )}
    </div>
  )
}
