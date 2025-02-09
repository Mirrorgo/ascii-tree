import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Info, Undo2 } from "lucide-react";
import { Alert, AlertTitle } from "@/components/ui/alert";
import TextEditor, { TextEditorRef } from "./text-editor";
import { ParseErrorType, TextState } from "@/typings";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";

type EditorConfig = {
  autoSlash: boolean;
};

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string, config: EditorConfig) => void;
  textState: TextState;
  onUndo: () => void;
}

export interface MarkdownEditorRef {
  jumpToPosition: (lineNumber: number, column: number) => void;
}

const MarkdownEditor = forwardRef<MarkdownEditorRef, MarkdownEditorProps>(
  ({ value, onChange, textState, onUndo }, ref) => {
    const editorRef = useRef<TextEditorRef>(null);

    useImperativeHandle(ref, () => ({
      jumpToPosition: (lineNumber: number, column: number) => {
        editorRef.current?.jumpToPosition(lineNumber, column);
      },
    }));

    const [config, setConfig] = useState<EditorConfig>({
      autoSlash: true,
    });

    const handleJumpToError = (lineNumber: number, column: number) => {
      editorRef.current?.jumpToPosition(lineNumber, column);
    };

    useEffect(() => {
      onChange(value, config);
    }, [config.autoSlash]);
    const { t } = useTranslation();
    const getErrorInfo = (type: ParseErrorType) => {
      return {
        title: t(`parseError.markdown.${type}.title`),
        content: t(`parseError.markdown.${type}.content`),
      };
    };

    return (
      <div className="flex-1 flex flex-col h-full m-1 relative">
        <div className="absolute top-2 right-5 flex items-center space-x-2 z-10 bg-background">
          <Switch
            id="auto-slash"
            checked={config.autoSlash}
            onCheckedChange={() =>
              setConfig((prev) => ({ ...prev, autoSlash: !prev.autoSlash }))
            }
          />
          <Label htmlFor="auto-slash">{t("editor.autoSlash")}</Label>
          <div
            title={t("editor.autoSlashTooltip")}
            className="cursor-pointer rounded"
          >
            <Info size={16} strokeWidth={2} />
          </div>
        </div>

        <TextEditor
          ref={editorRef}
          initialValue={value}
          onChange={(val) => onChange(val, config)}
          className="w-full flex-1"
        />
        <div className="h-20 overflow-auto mb-1">
          {!textState.isValid && textState.error && (
            <Alert
              variant="destructive"
              className="mt-2 flex justify-between items-center"
            >
              <div className="flex gap-3 items-center">
                <AlertTriangle className="h-5 w-5 mb-1" />
                <div>
                  {(() => {
                    const { location, type } = textState.error;
                    const { content, title } = getErrorInfo(type);
                    return (
                      <>
                        <AlertTitle>
                          {title}{" "}
                          <Button
                            variant="link"
                            size="sm"
                            className="px-1 h-auto text-destructive text-sm underline"
                            onClick={() =>
                              handleJumpToError(location.line, location.column)
                            }
                          >
                            {`[Ln ${location.line}, Col ${location.column}]`}
                          </Button>
                        </AlertTitle>
                        <div>{content}</div>
                      </>
                    );
                  })()}
                </div>
              </div>
              <Button variant="destructive" size="icon" onClick={onUndo}>
                <Undo2 />
              </Button>
            </Alert>
          )}
        </div>
      </div>
    );
  }
);

MarkdownEditor.displayName = "MarkdownEditor";

export default MarkdownEditor;

export type { EditorConfig };
