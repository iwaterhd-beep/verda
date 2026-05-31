export type PortalTheme = "light" | "dark";

export const PORTAL_THEME_STORAGE_KEY = "verda-portal-theme";
export const PORTAL_THEME_CHANGE_EVENT = "verda-portal-theme-change";

export function getStoredPortalTheme(): PortalTheme {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem(PORTAL_THEME_STORAGE_KEY);
  return stored === "light" ? "light" : "dark";
}

export function dispatchPortalThemeChange(theme: PortalTheme) {
  window.dispatchEvent(
    new CustomEvent(PORTAL_THEME_CHANGE_EVENT, { detail: theme }),
  );
}

/** Early paint: remove html.dark before React hydrates (portal layout script). */
export const PORTAL_THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${PORTAL_THEME_STORAGE_KEY}");if(t==="light"){document.documentElement.classList.remove("dark");}}catch(e){}})();`;
