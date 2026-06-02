/**
 * StyledText — public renderer for styled-bilingual field values.
 * Value shape: { id, en, _style: { color, font, size } }
 * Falls back gracefully to plain text if no _style present.
 */

const COLOR_MAP = {
  white:   "rgba(255,255,255,0.95)",
  dim:     "rgba(255,255,255,0.70)",
  faint:   "rgba(255,255,255,0.40)",
  violet:  "#7C68E1",
  "violet-light": "#A78BFA",
  teal:    "#2DE2B6",
  amber:   "#F5BE6C",
  coral:   "#FF6B8A",
};

const FONT_MAP = {
  sans:    "var(--font-sans, 'Space Grotesk', sans-serif)",
  display: "var(--font-display, 'Syne', sans-serif)",
  mono:    "var(--font-mono-kti, 'Space Mono', monospace)",
};

const SIZE_MAP = {
  sm:   "0.875rem",
  base: "1rem",
  lg:   "1.125rem",
  xl:   "1.25rem",
  "2xl": "1.5rem",
};

export function resolveStyle(styleToken = {}) {
  const css = {};
  if (styleToken.color && COLOR_MAP[styleToken.color]) css.color = COLOR_MAP[styleToken.color];
  if (styleToken.font  && FONT_MAP[styleToken.font])   css.fontFamily = FONT_MAP[styleToken.font];
  if (styleToken.size  && SIZE_MAP[styleToken.size])   css.fontSize = SIZE_MAP[styleToken.size];
  return css;
}

/**
 * StyledText component.
 * @param {object} props
 * @param {{ id: string, en: string, _style?: object } | string} props.value
 * @param {string} props.lang - "id" or "en"
 * @param {string} [props.as] - HTML tag, default "span"
 * @param {string} [props.className]
 * @param {object} [props.style] - additional inline styles
 */
export default function StyledText({ value, lang = "id", as: Tag = "span", className, style, ...rest }) {
  if (!value) return null;

  // Plain string fallback
  if (typeof value === "string") {
    return <Tag className={className} style={style} {...rest}>{value}</Tag>;
  }

  const text = lang.startsWith("en") ? (value.en || value.id || "") : (value.id || value.en || "");
  const tokenStyle = resolveStyle(value._style || {});
  const merged = { ...tokenStyle, ...style };

  return (
    <Tag className={className} style={Object.keys(merged).length ? merged : undefined} {...rest}>
      {text}
    </Tag>
  );
}
