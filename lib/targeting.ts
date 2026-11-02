import { api } from "@/lib/api";

/** Profil de ciblage du diffuseur : mêmes questions que l'app (inscription et confirmation). */
export interface Option { code: string; label: string; emoji?: string | null; }

export interface ProfileQuestion {
  key: string;
  type: "single" | "multi" | "ordered" | "boolean" | "scale";
  required: boolean;
  max: number | null;
  options: Option[];
  when: string | null;
  value?: unknown;
  source?: string | null;
  confirmed?: boolean;
  applies?: boolean;
}

export interface ProfileForm {
  complete: boolean;
  deadline: string | null;
  blocked_from_missions: boolean;
  questions: ProfileQuestion[];
}

export type Answers = Record<string, unknown>;

/** Questions posées avant la création du compte, listes du pays choisi. */
export async function fetchRegistrationQuestions(countryId: string, birthdate: string): Promise<ProfileQuestion[]> {
  const q = new URLSearchParams({ country_id: countryId, birthdate });
  const r = await api.get<{ questions: ProfileQuestion[] }>(`/register/questions?${q}`);
  return r.questions;
}

export const fetchProfileForm = () => api.get<ProfileForm>("/profile/targeting");

export const saveProfileForm = (answers: Answers, confirmWarnings = false) =>
  api.post<{ saved: boolean; warnings?: string[] }>("/profile/targeting", { answers, confirm_warnings: confirmWarnings });

export const QUESTION_TEXT: Record<string, [string, string]> = {
  gender: ["Tu es ?", "Pour te proposer les bonnes campagnes."],
  zone_type: ["Où vis-tu ?", "Le type de zone de ton quartier."],
  primary_lang: ["Ta langue principale ?", "Celle que tu parles le plus."],
  secondary_langs: ["Tes autres langues ?", "Choisis celles que tu parles aussi."],
  status_lang: ["La langue de tes Status ?", "Celle dans laquelle tu publies le plus souvent."],
  status: ["Que fais-tu aujourd’hui ?", "Ton activité principale."],
  sector: ["Dans quel secteur ?", "Ton secteur principal."],
  diploma: ["Ton diplôme le plus élevé ?", "Le dernier que tu as obtenu."],
  interests: ["Ce qui t’intéresse ?", "Choisis jusqu’à 5 sujets."],
  top3: ["Ton top 3 ?", "Touche-les dans l’ordre de préférence."],
  income: ["Tes revenus par mois ?", "Facultatif."],
  marital: ["Ta situation ?", "Pour les campagnes liées à la famille."],
  children: ["Tes enfants ?", "Pour les campagnes liées à la famille."],
  child_under5: ["Un enfant de moins de 5 ans ?", "Facultatif."],
  contact_count: ["Combien de contacts as-tu ?", "Une estimation suffit."],
  contacts: ["Qui voit tes Status ?", "Une estimation pour chaque groupe."],
  mobile_money: ["Ton Mobile Money principal ?", "Celui que tu utilises le plus."],
  operator: ["Ton opérateur principal ?", "Celui de ta SIM principale."],
  apps: ["Les applis que tu utilises ?", "Choisis les catégories, facultatif."],
};

export const WARNING_TEXT: Record<string, string> = {
  retired_young: "Tu as indiqué être retraité : c’est bien ça ?",
  private_public_sector: "Salarié du privé et administration publique ne vont pas ensemble d’habitude.",
  pupil_seniority: "Tu es élève et tu indiques plus de 3 ans dans un métier : c’est bien ça ?",
  manager_trainee: "Direction et stagiaire ne vont pas ensemble d’habitude.",
  student_diploma: "Ton diplôme semble plus élevé que le niveau que tu suis : c’est bien ça ?",
  public_manager_diploma: "Cadre de la fonction publique avec ce diplôme : c’est bien ça ?",
  field_sector: "Ta filière et ton secteur ne vont pas ensemble d’habitude : c’est bien ça ?",
};
