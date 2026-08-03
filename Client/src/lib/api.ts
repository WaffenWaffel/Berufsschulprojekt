/**
 * Basis-URL der API. Leer, wenn Frontend und Backend unter derselben Domain
 * laufen (Entwicklung über den Vite-Proxy).
 */
export const API_BASE = import.meta.env.VITE_API_URL ?? "";

/**
 * Fehler einer API-Anfrage.
 *
 * `erreichbar` unterscheidet zwei sehr verschiedene Fälle:
 * - false: Das Backend war nicht ansprechbar (läuft noch nicht, abgestürzt).
 *   Solche Anfragen darf man gefahrlos wiederholen.
 * - true: Der Server hat geantwortet und die Anfrage abgelehnt, z.B. wegen
 *   einer Validierung. Ein erneuter Versuch würde dasselbe Ergebnis liefern.
 */
export class ApiError extends Error {
  status: number;
  erreichbar: boolean;

  constructor(message: string, status: number, erreichbar: boolean) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.erreichbar = erreichbar;
  }
}

/**
 * Baut aus einer fehlgeschlagenen Antwort einen ApiError.
 *
 * Das Backend antwortet im Fehlerfall immer mit { error: "..." } - diesen Text
 * zeigen wir dem Benutzer. Fehlt er bei einem 5xx, kam die Antwort nicht vom
 * Backend selbst, sondern vom Entwicklungs-Proxy, der das Backend nicht
 * erreicht hat (leerer Körper, Status 500).
 */
async function fehlerAuswerten(response: Response): Promise<ApiError> {
  let meldung: string | null = null;
  try {
    const daten = await response.json();
    if (daten?.error) meldung = daten.error;
  } catch {
    // Antwort war kein JSON - dann bleibt meldung null
  }

  if (meldung) return new ApiError(meldung, response.status, true);

  const proxyProblem = response.status >= 500;
  return new ApiError(
    proxyProblem
      ? "Der Server ist nicht erreichbar. Läuft das Backend?"
      : `Server antwortete mit Status ${response.status}.`,
    response.status,
    !proxyProblem
  );
}

interface ApiOptions extends RequestInit {
  /**
   * Anzahl der Versuche, wenn das Backend nicht erreichbar ist. Nur für
   * lesende Anfragen sinnvoll - ein wiederholtes POST würde doppelt anlegen.
   * Standard 1, also kein Wiederholen.
   */
  versuche?: number;
}

async function einmalAnfragen(pfad: string, options: RequestInit): Promise<Response> {
  try {
    return await fetch(`${API_BASE}${pfad}`, {
      ...options,
      // Sitzungscookie mitschicken
      credentials: "include",
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch {
    // fetch wirft nur bei Netzwerkproblemen, nicht bei HTTP-Fehlerstatus
    throw new ApiError("Der Server ist nicht erreichbar. Läuft das Backend?", 0, false);
  }
}

/**
 * fetch-Wrapper für JSON-Endpunkte: setzt die Basis-URL und den Content-Type
 * und wirft bei Fehlern einen ApiError mit der Meldung des Servers.
 */
export async function apiFetch<T = unknown>(
  pfad: string,
  { versuche = 1, ...options }: ApiOptions = {}
): Promise<T> {
  for (let versuch = 1; ; versuch++) {
    try {
      const response = await einmalAnfragen(pfad, options);
      if (!response.ok) throw await fehlerAuswerten(response);

      if (response.status === 204) return undefined as T;
      return (await response.json()) as T;
    } catch (fehler) {
      const nichtErreichbar = fehler instanceof ApiError && !fehler.erreichbar;
      if (!nichtErreichbar || versuch >= versuche) throw fehler;
      // Backend startet vermutlich noch (ts-node prüft beim Start die Typen).
      // Kurz warten und erneut versuchen, statt sofort einen Fehler zu zeigen.
      await new Promise((r) => setTimeout(r, 600 * versuch));
    }
  }
}

/**
 * Wie apiFetch, liefert aber die rohe Response - für Downloads (PDF, Excel),
 * bei denen wir den Body als Blob und den Dateinamen aus dem Header brauchen.
 */
export async function apiDownload(
  pfad: string,
  options: RequestInit = {}
): Promise<Response> {
  const response = await fetch(`${API_BASE}${pfad}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw await fehlerAuswerten(response);
  }
  return response;
}

/** Holt den Dateinamen aus dem Content-Disposition-Header, mit Rückfallwert. */
export function dateinameAusHeader(response: Response, fallback: string): string {
  const header = response.headers.get("Content-Disposition") ?? "";
  const treffer = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(header);
  return treffer ? decodeURIComponent(treffer[1]) : fallback;
}

/** Startet den Browser-Download für einen empfangenen Blob. */
export async function blobHerunterladen(response: Response, fallbackName: string) {
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = dateinameAusHeader(response, fallbackName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
