export type PortalTheme = "light" | "dark";

export const PORTAL_THEME_STORAGE_KEY = "verda-portal-theme";

export function getStoredPortalTheme(): PortalTheme {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem(PORTAL_THEME_STORAGE_KEY);
  return stored === "light" ? "light" : "dark";
}
