import { useTranslation } from "react-i18next";

// Pilih nilai terlokalisasi dari field bilingual {id, en} (atau string biasa).
export function useContentLocale() {
  const { i18n } = useTranslation();
  const lang = i18n.language && i18n.language.startsWith("en") ? "en" : "id";
  const L = (field) => {
    if (field === null || field === undefined) return "";
    if (typeof field === "string" || typeof field === "number") return field;
    return field[lang] ?? field.id ?? field.en ?? "";
  };
  return { lang, L };
}
