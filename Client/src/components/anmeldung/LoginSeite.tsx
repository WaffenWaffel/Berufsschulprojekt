import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { apiFetch } from "@/lib/api"
import { FormMessage } from "@/components/guelleLieferscheine/FormMessage"
import type { AngemeldeterBenutzer } from "./types"

interface LoginSeiteProps {
  onAngemeldet: (benutzer: AngemeldeterBenutzer) => void
}

/**
 * Anmeldeseite (Entwurf A: zentrierte Karte).
 * Der Betrieb ergibt sich aus dem Benutzer und wird nach dem Anmelden
 * in der Kopfzeile angezeigt.
 */
export function LoginSeite({ onAngemeldet }: LoginSeiteProps) {
  const [email, setEmail] = useState("")
  const [passwort, setPasswort] = useState("")
  const [loading, setLoading] = useState(false)
  const [fehler, setFehler] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setFehler(null)
    setLoading(true)
    try {
      const benutzer = await apiFetch<AngemeldeterBenutzer>("/api/anmelden", {
        method: "POST",
        body: JSON.stringify({ Email: email, Passwort: passwort }),
      })
      onAngemeldet(benutzer)
    } catch (error) {
      setFehler(error instanceof Error ? error.message : "Anmeldung fehlgeschlagen.")
      setPasswort("")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-background p-6">
      <Card className="w-full max-w-sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <CardHeader>
            <CardTitle>Biogas-Verwaltung</CardTitle>
            <p className="text-sm text-muted-foreground">Bitte anmelden</p>
          </CardHeader>

          <CardContent className="space-y-4">
            <Field>
              <FieldLabel htmlFor="email">E-Mail</FieldLabel>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                required
                autoFocus
                placeholder="name@betrieb.de"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="passwort">Passwort</FieldLabel>
              <Input
                id="passwort"
                type="password"
                autoComplete="current-password"
                required
                value={passwort}
                onChange={(e) => setPasswort(e.target.value)}
              />
            </Field>

            <FormMessage fehler={fehler} />
          </CardContent>

          <CardFooter className="flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Wird geprüft..." : "Anmelden"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Passwort vergessen? Bitte den Betriebsinhaber ansprechen.
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  )
}
