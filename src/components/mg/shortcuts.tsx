import { Alert, AlertDescription } from "@/components/ui/alert";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Command, Keyboard } from "lucide-react";
import { Button } from "../ui/button";
import { useTranslation } from "react-i18next";

const Shortcuts = () => {
  const [isMac, setIsMac] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    // Check if user is on macOS
    const checkPlatform = () => {
      const platform = navigator.platform.toLowerCase();
      setIsMac(platform.includes("mac"));
    };

    checkPlatform();
  }, []);

  const getModifierKey = () => {
    return isMac ? "Command" : "Ctrl";
  };

  return (
    <div className="space-y-4 mt-2">
      <div className="space-y-2 justify-items-center">
        <h3 className="font-medium">{t("shortcuts.global")}</h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm justify-items-center">
          <div>{getModifierKey()} + Z</div>
          <div>{t("shortcuts.undo")}</div>
          <div>{getModifierKey()} + Shift + Z</div>
          <div>{t("shortcuts.redo")}</div>
          <div>{getModifierKey()} + S</div>
          <div>{t("shortcuts.formatMarkdown")}</div>
          <div>{getModifierKey()} + K</div>
          <div>{t("shortcuts.showKeyboardShortcuts")}</div>
        </div>
      </div>

      <div className="space-y-2 justify-items-center">
        <h3 className="font-medium">{t("shortcuts.explorerPanel")}</h3>
        <Alert className="mt-4 text-muted-foreground">
          <AlertDescription>
            {t("shortcuts.proTip", { modifier: getModifierKey() })}
          </AlertDescription>
        </Alert>
      </div>

      <div className="space-y-2 justify-items-center">
        <h3 className="font-medium">{t("shortcuts.markdownListPanel")}</h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm justify-items-center">
          <div>Alt + ↑</div>
          <div>{t("shortcuts.moveLineUp")}</div>
          <div>Alt + ↓</div>
          <div>{t("shortcuts.moveLineDown")}</div>
          <div>Tab</div>
          <div>{t("shortcuts.increaseIndent")}</div>
          <div>Shift + Tab</div>
          <div>{t("shortcuts.decreaseIndent")}</div>
          <div>-</div>
          <div>{t("shortcuts.createListItem")}</div>
        </div>
      </div>
    </div>
  );
};

const ShortcutsDialog = () => {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="ml-4">
          <Keyboard />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex justify-center items-center gap-4">
            <div>{t("shortcuts.title")}</div>
            <div className="flex items-center gap-1 font-normal text-base">
              <Command size={16} />K
            </div>
          </DialogTitle>

          <DialogDescription>
            <Shortcuts />
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default ShortcutsDialog;
