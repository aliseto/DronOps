export const THEME_STORAGE_KEY = "dronops-theme";
export type Theme = "dark" | "light" | "print";

/**
 * Inline, pre-hydration script string. Applies the stored theme before first
 * paint so there's no flash of the default (dark) theme for light users.
 * Injected via <script dangerouslySetInnerHTML> in the root layout <head>.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t==='light'||t==='dark'||t==='print'){document.documentElement.dataset.theme=t;}}catch(e){}})();`;
