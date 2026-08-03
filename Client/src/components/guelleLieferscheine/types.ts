/** Datentypen der Seite "Gülle Lieferscheine", passend zu den API-Antworten. */

export type GuelleDaten = {
  id: number;
  KundeId: number;
  Kunde: string;
  Menge: number;
  Datum: string; // YYYY-MM-DD
  Bemerkung: string;
  Abgerechnet: boolean;
  LieferscheinNr: number | null;
};

export type GuelleKunde = {
  id: number;
  Name: string;
  Vorname: string;
  /** Text, damit führende Nullen erhalten bleiben (z.B. "01067"). */
  PLZ: string;
  Wohnort: string;
  Strasse: string;
  HNr: string;
};

export type Analyse = {
  id: number;
  Stickstoff: number;
  Amoniumstickstoff: number;
  Phosphat: number;
  Kalium: number;
  Datum: string; // YYYY-MM-DD
};

export type Betrieb = {
  id: number;
  Name: string;
  Strasse: string;
  PLZ: string;
  Ort: string;
};
