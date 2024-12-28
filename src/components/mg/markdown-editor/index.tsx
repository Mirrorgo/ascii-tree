import { forwardRef, useImperativeHandle, useRef } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Undo2 } from "lucide-react";
import { Alert, AlertTitle } from "@/components/ui/alert";
import TextEditor, { TextEditorRef } from "./text-editor";
import { MarkdownParseError } from "@/typings";

export interface TextState {
  content: string;
  isValid: boolean;
  error: MarkdownParseError | null;
}

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
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

    const handleJumpToError = (lineNumber: number, column: number) => {
      editorRef.current?.jumpToPosition(lineNumber, column);
    };

    return (
      <div className="flex-1 flex flex-col h-full m-1">
        <TextEditor
          ref={editorRef}
          initialValue={value}
          onChange={onChange}
          className="w-full flex-1"
        />
        <div className="h-20">
          {!textState.isValid && textState.error && (
            <Alert
              variant="destructive"
              className="mt-2 flex justify-between items-center"
            >
              <div className="flex gap-3 items-center">
                <AlertTriangle className="h-5 w-5 mb-1" />
                <div>
                  <AlertTitle>
                    {(() => {
                      const { location, type } = textState.error;
                      return (
                        <>
                          {type} at{" "}
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
                        </>
                      );
                    })()}
                  </AlertTitle>
                  <div>{textState.error.content}</div>
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
