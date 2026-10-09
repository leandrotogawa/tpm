const DONUT_SPRINKLES: Record<string, string> = {
  Oreo: `
    <circle cx="34" cy="32" r="3" fill="#FFFDF9" opacity=".92"/>
    <circle cx="66" cy="30" r="2.6" fill="#FFFDF9" opacity=".9"/>
    <circle cx="73" cy="54" r="2.8" fill="#FFFDF9" opacity=".85"/>
    <circle cx="28" cy="60" r="2.6" fill="#FFFDF9" opacity=".88"/>
    <circle cx="55" cy="72" r="3" fill="#FFFDF9" opacity=".9"/>
    <circle cx="46" cy="24" r="2.2" fill="#FFFDF9" opacity=".85"/>`,
  Paçoca: `
    <circle cx="34" cy="32" r="2.4" fill="#7A4E22" opacity=".85"/>
    <circle cx="66" cy="30" r="2" fill="#7A4E22" opacity=".85"/>
    <circle cx="73" cy="54" r="2.2" fill="#FFFDF9" opacity=".7"/>
    <circle cx="28" cy="60" r="2" fill="#7A4E22" opacity=".85"/>
    <circle cx="55" cy="72" r="2.3" fill="#FFFDF9" opacity=".7"/>`,
  "M&M": `
    <circle cx="34" cy="32" r="3" fill="#C8792E"/>
    <circle cx="66" cy="30" r="2.8" fill="#FBF3EA"/>
    <circle cx="73" cy="54" r="3" fill="#8C2A2A"/>
    <circle cx="28" cy="60" r="2.8" fill="#E3B57C"/>
    <circle cx="55" cy="72" r="3" fill="#FBF3EA"/>
    <circle cx="45" cy="24" r="2.4" fill="#8C2A2A"/>`,
  Chocolate: `
    <ellipse cx="42" cy="30" rx="10" ry="4" fill="#FFFFFF" opacity=".14"/>
    <circle cx="70" cy="55" r="2.2" fill="#C8792E" opacity=".7"/>
    <circle cx="30" cy="58" r="2" fill="#C8792E" opacity=".6"/>`,
};

const DONUT_SPRINKLES_GENERIC = `
  <circle cx="34" cy="32" r="2.6" fill="#FFFDF9" opacity=".85"/>
  <circle cx="66" cy="30" r="2.4" fill="#FFFDF9" opacity=".8"/>
  <circle cx="73" cy="54" r="2.6" fill="#FFFDF9" opacity=".8"/>
  <circle cx="28" cy="60" r="2.4" fill="#FFFDF9" opacity=".8"/>
  <circle cx="55" cy="72" r="2.6" fill="#FFFDF9" opacity=".8"/>`;

const DEFAULT_DONUT_COLOR = "#4A2A1D";

export function DonutIcon({ nome, cor }: { nome: string; cor?: string | null }) {
  const fill = cor || DEFAULT_DONUT_COLOR;
  const sprinkles = DONUT_SPRINKLES[nome] ?? DONUT_SPRINKLES_GENERIC;
  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="40" fill={fill} />
      <circle cx="50" cy="50" r="15" fill="#FFFDF9" />
      <g dangerouslySetInnerHTML={{ __html: sprinkles }} />
    </svg>
  );
}

const FATIA_COLORS: Record<string, { base: string; layer: string; top: string }> = {
  Ninho: { base: "#EFCB8E", layer: "#FFF7EC", top: "#FFFDF9" },
  Nutella: { base: "#5C3A22", layer: "#3E2415", top: "#8C5A32" },
};

function shade(hex: string, amount: number) {
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function CakeIcon({ nome, cor }: { nome: string; cor?: string | null }) {
  const knownName = nome.replace(/^Fatia\s+/i, "");
  const preset = FATIA_COLORS[knownName];
  const base = preset?.base ?? cor ?? "#5C3A22";
  const layer = preset?.layer ?? shade(base, 60);
  const top = preset?.top ?? shade(base, 90);
  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="50" cy="84" rx="30" ry="5" fill="#4A2A1D" opacity=".12" />
      <path d="M22 80 L50 26 L78 80 Z" fill={base} />
      <path d="M27.6 68.4 L72.4 68.4 L78 80 L22 80 Z" fill={layer} />
      <path d="M50 26 q9 -6 13 3 q-6 5 -13 2z" fill={top} />
    </svg>
  );
}

export function CupIcon() {
  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect x="46" y="6" width="6" height="16" rx="3" fill="#4A2A1D" />
      <ellipse cx="50" cy="24" rx="19" ry="8" fill="#FFFDF9" />
      <path
        d="M31 28 h38 l-5 44a6 6 0 0 1-6 5H42a6 6 0 0 1-6-5z"
        fill="#6B0E0E"
      />
      <path d="M33 37 h34 l-1.4 8H34.4z" fill="#C8792E" />
    </svg>
  );
}
