import { AlertTriangle, WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROJECT_TEMPLATES } from "@/helper/constants";
import { Dispatch, MutableRefObject, SetStateAction, useEffect } from "react";
import { useTranslation } from "react-i18next";

interface AsciiTreeParserDialogProps {
  isAsciiTreeParserDialogOpen: boolean;
  setIsAsciiTreeParserDialogOpen: Dispatch<SetStateAction<boolean>>;
  asciiParseError: string | null;
  setAsciiParseError: Dispatch<SetStateAction<string | null>>;
  asciiTreeTextAreaRef: MutableRefObject<HTMLTextAreaElement | null>;
  handleParseAsciiTree: () => void;
}

const AsciiTreeParserDialog = ({
  isAsciiTreeParserDialogOpen,
  setIsAsciiTreeParserDialogOpen,
  asciiParseError,
  setAsciiParseError,
  asciiTreeTextAreaRef,
  handleParseAsciiTree,
}: AsciiTreeParserDialogProps) => {
  // 处理模板变化
  const handleTemplateChange = (value: keyof typeof PROJECT_TEMPLATES) => {
    if (asciiTreeTextAreaRef.current) {
      asciiTreeTextAreaRef.current.value = PROJECT_TEMPLATES[value].template;
    }
  };

  // 初始化默认模板
  useEffect(() => {
    if (asciiTreeTextAreaRef.current) {
      asciiTreeTextAreaRef.current.value = PROJECT_TEMPLATES.basic.template;
    }
  }, [asciiTreeTextAreaRef]);
  const { t } = useTranslation();

  return (
    <Dialog
      open={isAsciiTreeParserDialogOpen}
      onOpenChange={(open) => {
        setIsAsciiTreeParserDialogOpen(open);
        if (!open) {
          setAsciiParseError(null); // 关闭对话框时清除错误
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="link" className="font-bold">
          {t("generate_from_existing_ascii_tree")}
          <WandSparkles className="ml-1 h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="mb-2">{t("paste_ascii_tree")}</DialogTitle>
          <DialogDescription>
            <div className="space-y-4 text-foreground">
              <Select onValueChange={handleTemplateChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("select_project_template")} />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PROJECT_TEMPLATES).map(([key, { name }]) => (
                    <SelectItem key={key} value={key}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Textarea
                className="text-foreground font-mono"
                ref={asciiTreeTextAreaRef}
                rows={15}
                placeholder={t("paste_ascii_tree_placeholder")}
              />

              {asciiParseError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>{t("error")}</AlertTitle>
                  <div>{asciiParseError}</div>
                </Alert>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={handleParseAsciiTree}>{t("ok")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AsciiTreeParserDialog;
