import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { apiFetch } from "@/lib/api"
import { FormMessage } from "@/components/guelleLieferscheine/FormMessage"

interface PasswortWechselnProps {
  onFertig: () => void
}

/**
 * Wird angezeigt, solange der Benutzer noch mit dem vergebenen Startpasswort
 * arbeitet. Erst danach ist die Anwendung erreichbar.
 */
export function PasswortWechseln({ onFertig }: PasswortWechselnProps) {
  const [alt, setAlt] = useState("")
  const [neu, setNeu] = useState("")
  const [wiederholung, setWiederholung] = useState("")
  const [loading, setLoading] = useState(false)
  const [fehler, setFehler] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setFehler(null)

    if (neu !== wiederholung) {
      return setFehler("Die beiden neuen Passwörter stimmen nicht überein.")
    }
    if (neu.length < 12) {
      return setFehler("Das neue Passwort muss mindestens 12 Zeichen lang sein.")
    }

    setLoading(true)
    try {
      await apiFetch("/api/passwortAendern", {
        method: "POST",
        body: JSON.stringify({ Alt: alt, Neu: neu }),
      })
      onFertig()
    } catch (error) {
      setFehler(error instanceof Error ? error.message : "Ändern fehlgeschlagen.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-background p-6">
      <Card className="w-full max-w-sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <CardHeader>
            <CardTitle>Passwort festlegen</CardTitle>
            <p className="text-sm text-muted-foreground">
              Du bist mit einem vergebenen Startpasswort angemeldet. Bitte lege
              jetzt dein eigenes fest.
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            <Field>
              <FieldLabel htmlFor="alt">Bisheriges Passwort</FieldLabel>
              <Input
                id="alt"
                type="password"
                autoComplete="current-password"
                required
                autoFocus
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="neu">Neues Passwort</FieldLabel>
              <Input
                id="neu"
                type="password"
                autoComplete="new-password"
                required
                minLength={12}
                value={neu}
                onChange={(e) => setNeu(e.target.value)}
              />
              <FieldDescription>
                Mindestens 12 Zeichen. Länge schützt mehr als Sonderzeichen.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="wiederholung">Neues Passwort wiederholen</FieldLabel>
              <Input
                id="wiederholung"
                type="password"
                autoComplete="new-password"
                required
                value={wiederholung}
                onChange={(e) => setWiederholung(e.target.value)}
              />
            </Field>

            <FormMessage fehler={fehler} />
          </CardContent>

          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Wird gespeichert..." : "Passwort speichern"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  )
}
