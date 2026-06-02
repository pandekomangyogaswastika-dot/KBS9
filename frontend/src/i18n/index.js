import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import id from "@/i18n/locales/id.json";
import en from "@/i18n/locales/en.json";

const saved = typeof window !== "undefined" ? localStorage.getItem("kti_locale") : null;

i18n.use(initReactI18next).init({
  resources: { id: { translation: id }, en: { translation: en } },
  lng: saved || "id",
  fallbackLng: "id",
  interpolation: { escapeValue: false },
});

export default i18n;
