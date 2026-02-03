export type Role = "ADMIN" | "UVOZNIK" | "DOBAVLJAC";

export function homeByRole(uloga?: Role) {
  if (uloga === "UVOZNIK") return "/uvoznik/dobavljaci";
  if (uloga === "DOBAVLJAC") return "/dobavljac/proizvod";
  if (uloga === "ADMIN") return "/"; 
  return "/";
}