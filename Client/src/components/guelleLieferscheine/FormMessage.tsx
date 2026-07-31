import { AlertCircle, CheckCircle2 } from "lucide-react"

interface FormMessageProps {
  fehler?: string | null
  erfolg?: string | null
}

/**
 * Zeigt Rückmeldungen direkt im Formular an. Bis hierher landeten
 * Serverfehler nur in der Browser-Konsole und der Benutzer sah nicht,
 * warum das Speichern nicht funktioniert hat.
 */
export function FormMessage({ fehler, erfolg }: FormMessageProps) {
  if (!fehler && !erfolg) return null

  if (fehler) {
    return (
      <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{fehler}</span>
      </p>
    )
  }

  return (
    <p role="status" className="flex items-start gap-2 text-sm text-emerald-600 dark:text-emerald-400">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{erfolg}</span>
    </p>
  )
}
