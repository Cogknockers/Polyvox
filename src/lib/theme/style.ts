import { mapPaletteToThemeVars, type PaletteShades } from "./mapping";

const STYLE_ID = "polyvox-user-theme";

function toCssVars(vars: Record<string, string>) {
  return Object.entries(vars)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join("\n");
}

export function buildThemeCss(palette: PaletteShades) {
  const { light, dark } = mapPaletteToThemeVars(palette);

  return `:root {\n${toCssVars(light)}\n}\n\n.dark {\n${toCssVars(dark)}\n}`;
}

export function applyThemeStyle(palette: PaletteShades) {
  const css = buildThemeCss(palette);
  let styleEl = document.getElementById(STYLE_ID) as HTMLStyleElement | null;

  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = STYLE_ID;
    document.head.appendChild(styleEl);
  }

  styleEl.textContent = css;
}

export function clearThemeStyle() {
  const styleEl = document.getElementById(STYLE_ID);
  if (styleEl?.parentNode) {
    styleEl.parentNode.removeChild(styleEl);
  }
}
