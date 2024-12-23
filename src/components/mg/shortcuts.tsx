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

const Shortcuts = () => {
  const [isMac, setIsMac] = useState(false);

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
        <h3 className="font-medium">Global Shortcuts</h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm justify-items-center">
          <div>{getModifierKey()} + Z</div>
          <div>Undo last action</div>
          <div>{getModifierKey()} + Shift + Z</div>
          <div>Redo last action</div>
          <div>{getModifierKey()} + S</div>
          <div>Format markdown list</div>
          <div>{getModifierKey()} + K</div>
          <div>Show keyboard shortcuts</div>
        </div>
      </div>

      <div className="space-y-2 justify-items-center">
        <h3 className="font-medium">Explorer Panel</h3>
        <Alert className="mt-4 text-muted-foreground ">
          <AlertDescription>
            Pro tip: You can select multiple nodes by holding {getModifierKey()}{" "}
            while clicking, or select a range using Shift.
          </AlertDescription>
        </Alert>
      </div>

      <div className="space-y-2 justify-items-center">
        <h3 className="font-medium">Markdown List Panel</h3>
        {/* <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm"> */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm justify-items-center">
          <div>Alt + ↑</div>
          <div>Move line up</div>
          <div>Alt + ↓</div>
          <div>Move line down</div>
          <div>Tab</div>
          <div>Increase indent level</div>
          <div>Shift + Tab</div>
          <div>Decrease indent level</div>
          <div>Enter (on list item)</div>
          <div>Continue list</div>
          <div>- (at line start)</div>
          <div>Create list item</div>
        </div>
      </div>
    </div>
  );
};

const ShortcutsDialog = () => {
  const [open, setOpen] = useState(false);

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
            <div>Keyboard Shortcuts</div>
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
