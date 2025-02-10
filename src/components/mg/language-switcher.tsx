import { useTranslation } from "react-i18next";
import { Button } from "../ui/button";
import { Languages } from "lucide-react";
import { useEffect } from "react";

function LanguageSwitcher() {
  const { i18n } = useTranslation();
  useEffect(() => {
    // Check localStorage first
    const savedLanguage = localStorage.getItem("preferred-language");
    if (savedLanguage) {
      i18n.changeLanguage(savedLanguage);
    } else {
      // Detect system language
      const systemLanguage = navigator.language.toLowerCase().startsWith("zh")
        ? "zh"
        : "en";
      i18n.changeLanguage(systemLanguage);
    }
  }, [i18n]);
  const switchLanguage = () => {
    const newLanguage = i18n.language === "en" ? "zh" : "en";
    localStorage.setItem("preferred-language", newLanguage);
    i18n.changeLanguage(newLanguage);
  };
  return (
    <Button size="icon" variant="ghost" onClick={switchLanguage}>
      <Languages />
    </Button>
  );
}

export default LanguageSwitcher;
