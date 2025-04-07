import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Check, Clipboard, ExternalLink } from "lucide-react";
import { Button } from "../ui/button";
import { useTranslation } from "react-i18next";
import AiIcon from "../icon/AiIcon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

const MarkdownWorkflow = () => {
  const [copied, setCopied] = useState(false);
  const { t } = useTranslation();

  const getPromptText = () => {
    return t("aiDialog.markdown.promptText");
  };

  const promptText = getPromptText();

  const handleCopyClick = () => {
    navigator.clipboard.writeText(promptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 600);
  };

  return (
    <div className="space-y-4 mt-2">
      <div className="text-sm">
        <div className="mb-4 relative">
          <div
            className="float-right ml-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-md"
            style={{ width: "180px" }}
          >
            <div className="flex items-start gap-1 text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
              {t("aiDialog.markdown.whyRecommend")}
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-200">
              {t("aiDialog.markdown.recommendReason")}
            </div>
          </div>

          <div>
            <p>{t("aiDialog.workflow")}</p>
            <div className="mt-2">
              {t("aiDialog.markdown.step1")}{" "}
              <a
                href="https://www.cici.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline inline-flex items-center"
              >
                cici.com <ExternalLink size={12} className="ml-1" />
              </a>{" "}
              {t("aiDialog.markdown.step1Cont")}
              <br />
              {t("aiDialog.markdown.step2")}
              <br />
              3.{" "}
              <span className="text-amber-600 font-medium">
                {t("aiDialog.checkContent")}
              </span>
              {t("aiDialog.checkContentReason")}
            </div>
          </div>
          <div style={{ clear: "both" }}></div>
        </div>

        <div className="relative">
          <div className="absolute top-2 right-4">
            <Button
              size="icon"
              variant="ghost"
              onClick={handleCopyClick}
              className="h-8 w-8"
              aria-label={
                copied ? t("aiDialog.copied") : t("aiDialog.copyPrompt")
              }
              title={copied ? t("aiDialog.copied") : t("aiDialog.copyPrompt")}
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Clipboard className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-md overflow-auto max-h-80">
            <pre className="whitespace-pre-wrap">{promptText}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};

const AsciiWorkflow = () => {
  const [copied, setCopied] = useState(false);
  const { t } = useTranslation();

  const getPromptText = () => {
    return t("aiDialog.ascii.promptText");
  };

  const promptText = getPromptText();

  const handleCopyClick = () => {
    navigator.clipboard.writeText(promptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 600);
  };

  return (
    <div className="space-y-4 mt-2">
      <div className="text-sm">
        <p className="mb-4">
          {t("aiDialog.workflow")}
          <br />
          {t("aiDialog.ascii.step1")}{" "}
          <a
            href="https://www.cici.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline inline-flex items-center"
          >
            cici.com <ExternalLink size={12} className="ml-1" />
          </a>{" "}
          {t("aiDialog.ascii.step1Cont")}
          <br />
          {t("aiDialog.ascii.step2")}
          <br />
          3.{" "}
          <span className="text-amber-600 font-medium">
            {t("aiDialog.checkContent")}
          </span>
          {t("aiDialog.checkContentReason")}
        </p>
        <div className="relative">
          <div className="absolute top-2 right-4">
            <Button
              size="icon"
              variant="ghost"
              onClick={handleCopyClick}
              className="h-8 w-8"
              aria-label={
                copied ? t("aiDialog.copied") : t("aiDialog.copyPrompt")
              }
              title={copied ? t("aiDialog.copied") : t("aiDialog.copyPrompt")}
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Clipboard className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-md overflow-auto max-h-80">
            <pre className="whitespace-pre-wrap">{promptText}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};

const AiDialog = () => {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          aria-label={t("aiDialog.toolTitle")}
          title={t("aiDialog.toolTitle")}
        >
          <AiIcon size={18} />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex justify-center items-center gap-4 mb-4">
            <div>{t("aiDialog.toolTitle")}</div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="markdown" className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="markdown" className="flex items-center gap-1">
              <span className="relative">
                {t("aiDialog.tabs.markdown")}
                <span className="absolute left-full ml-2 top-0">👍</span>
              </span>
            </TabsTrigger>
            <TabsTrigger value="ascii">{t("aiDialog.tabs.ascii")}</TabsTrigger>
          </TabsList>

          <TabsContent value="markdown">
            <MarkdownWorkflow />
          </TabsContent>

          <TabsContent value="ascii">
            <AsciiWorkflow />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AiDialog;
