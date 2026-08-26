export type UserRole =
  | "inconnu"
  | "medecin"
  | "medecin_distingue"
  | "co_gerant"
  | "gerant";

export const ROLE_LABELS: Record<UserRole, string> = {
  inconnu: "Inconnu",
  medecin: "Médecin",
  medecin_distingue: "Médecin Distingué",
  co_gerant: "Co-Gérant Médecin",
  gerant: "Gérant Médecin",
};

// Ordre hiérarchique croissant
const ORDER: UserRole[] = [
  "inconnu",
  "medecin",
  "medecin_distingue",
  "co_gerant",
  "gerant",
];

export function roleLevel(role: UserRole): number {
  return ORDER.indexOf(role);
}

export function hasAtLeast(role: UserRole, min: UserRole): boolean {
  return roleLevel(role) >= roleLevel(min);
}

export function isAdmin(role: UserRole): boolean {
  return role === "gerant" || role === "co_gerant";
}

export function canPostFlex(role: UserRole): boolean {
  return hasAtLeast(role, "medecin");
}

// Rôles qu'un admin donné a le droit d'assigner (cf. fonction SQL admin_set_role,
// qui est la source de vérité réelle — ceci ne sert qu'à filtrer l'UI)
export function assignableRoles(callerRole: UserRole): UserRole[] {
  if (callerRole === "gerant") {
    return ["inconnu", "medecin", "medecin_distingue", "co_gerant"];
  }
  if (callerRole === "co_gerant") {
    return ["inconnu", "medecin", "medecin_distingue"];
  }
  return [];
}
