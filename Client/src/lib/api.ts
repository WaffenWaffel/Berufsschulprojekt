/**
 * Basis-URL der API. Leer, wenn Frontend und Backend unter derselben Domain
 * laufen (Entwicklung über den Vite-Proxy).
 */
export const API_BASE = import.meta.env.VITE_API_URL ?? "";

/**
 * Liest die Fehlermeldung aus der Antwort des Servers.
 * Das Backend antwortet im Fehlerfall mit { error: "..." } - diesen Text
 * wollen wir dem Benutzer zeigen statt eines generischen "Fehler beim Speichern".
 */
async function fehlermeldungLesen(response: Response): Promise<string> {
  try {
    const daten = await response.json();
    if (daten?.error) return daten.error;
  } catch {
    // Antwort war kein JSON (z.B. Proxy-Fehlerseite) - Standardtext verwenden
  }
  return `Server antwortete mit Status ${response.status}.`;
}

/**
 * fetch-Wrapper für JSON-Endpunkte: setzt die Basis-URL und den Content-Type
 * und wirft bei Fehlern eine Exception mit der Meldung des Servers.
 */
export async function apiFetch<T = unknown>(
  pfad: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${pfad}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(await fehlermeldungLesen(response));
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
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
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(await fehlermeldungLesen(response));
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
