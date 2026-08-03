export type AngemeldeterBenutzer = {
  Name: string;
  Email: string;
  Rolle: "INHABER" | "MITARBEITER";
  PasswortWechseln: boolean;
  Betrieb: { id: number; Name: string } | null;
};
