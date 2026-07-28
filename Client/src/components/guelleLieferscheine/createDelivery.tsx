import { useState } from "react"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"

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
import type { Analyse, GuelleKunde } from "./types"

interface CreateDeliveryProps {
  kunden: GuelleKunde[]
  analysen: Analyse[]
  /** Wird nach erfolgreicher Erstellung aufgerufen - die Abgaben gelten dann als abgerechnet. */
  onSuccess?: () => void
}

/** Formatiert YYYY-MM-DD als TT.MM.JJJJ. */
function datumAnzeigen(iso: string): string {
  const [jahr, monat, tag] = iso.split("-")
  return tag && monat && jahr ? `${tag}.${monat}.${jahr}` : iso
}

export function CreateDelivery({ kunden, analysen, onSuccess }: CreateDeliveryProps) {
  const [selectedKunde, setSelectedKunde] = useState<GuelleKunde | null>(null)
  const [selectedAnalysen, setSelectedAnalysen] = useState<Analyse[]>([])
  const [loading, setLoading] = useState(false)
  const [fehler, setFehler] = useState<string | null>(null)
  const [erfolg, setErfolg] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setFehler(null)
    setErfolg(null)

    if (!selectedKunde) return setFehler("Bitte einen Kunden auswählen.")

    setLoading(true)
    try {
      const response = await apiDownload("/api/newDelivery", {
        method: "POST",
        body: JSON.stringify({
          KundenNr: selectedKunde.KundenNr,
          // Leere Auswahl bedeutet: Server nimmt die aktuellste Analyse
          Analysen: selectedAnalysen.map((a) => a.id),
        }),
      })

      await blobHerunterladen(response, "Lieferschein.pdf")

      setSelectedAnalysen([])
      setSelectedKunde(null)
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
      <form onSubmit={handleSubmit}>
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
            <FieldDescription>
              Es kommen alle noch nicht abgerechneten Abgaben dieses Kunden auf den Schein.
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
          <Button type="submit" className="w-full" disabled={loading || !selectedKunde}>
            {loading ? "Erstellt..." : "Lieferschein erstellen"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
