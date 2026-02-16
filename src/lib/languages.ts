export type TargetLanguage = "spanish" | "french" | "italian" | "english";

export interface LanguageConfig {
  id: TargetLanguage;
  label: string;
  flag: string;
  nativeName: string;
  speechLang: string; // BCP 47 for TTS/STT
  greeting: string;
  congratsMessage: string;
  welcomeBack: string;
  goodbye: string;
}

export const LANGUAGES: Record<TargetLanguage, LanguageConfig> = {
  spanish: {
    id: "spanish",
    label: "Spanish",
    flag: "🇪🇸",
    nativeName: "Español",
    speechLang: "es-ES",
    greeting: "¡Hola!",
    congratsMessage: "¡Felicidades!",
    welcomeBack: "¡Bienvenido!",
    goodbye: "¡Hasta luego!",
  },
  french: {
    id: "french",
    label: "French",
    flag: "🇫🇷",
    nativeName: "Français",
    speechLang: "fr-FR",
    greeting: "Bonjour !",
    congratsMessage: "Félicitations !",
    welcomeBack: "Bienvenue !",
    goodbye: "Au revoir !",
  },
  italian: {
    id: "italian",
    label: "Italian",
    flag: "🇮🇹",
    nativeName: "Italiano",
    speechLang: "it-IT",
    greeting: "Ciao!",
    congratsMessage: "Congratulazioni!",
    welcomeBack: "Benvenuto!",
    goodbye: "Arrivederci!",
  },
  english: {
    id: "english",
    label: "English",
    flag: "🇬🇧",
    nativeName: "English",
    speechLang: "en-US",
    greeting: "Hello!",
    congratsMessage: "Congratulations!",
    welcomeBack: "Welcome back!",
    goodbye: "Goodbye!",
  },
};

export const LANGUAGE_LIST = Object.values(LANGUAGES);

export function getLanguageConfig(lang: string): LanguageConfig {
  return LANGUAGES[lang as TargetLanguage] || LANGUAGES.spanish;
}
