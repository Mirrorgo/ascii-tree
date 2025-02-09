import { useTranslation } from "react-i18next";
import { Button } from "../ui/button";
import { Languages } from "lucide-react";

function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const switchLanguage = () => {
    const currentLanguage = i18n.language;
    i18n.changeLanguage(currentLanguage === "en" ? "zh" : "en");
  };
  return (
    <Button size="icon" variant="ghost" onClick={switchLanguage}>
      <Languages />
    </Button>
  );
}

export default LanguageSwitcher;
