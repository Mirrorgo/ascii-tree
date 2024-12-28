import { forwardRef, useImperativeHandle, useRef } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Undo2 } from "lucide-react";
import { Alert, AlertTitle } from "@/components/ui/alert";
import TextEditor, { TextEditorRef } from "./text-editor";

// 类型定义
export interface TextState {
  content: string;
  isValid: boolean;
  error?: string;
}

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  textState: TextState;
  onUndo: () => void;
}

export interface MarkdownEditorRef {
  jumpToLine: (lineNumber: number) => void;
}

const MarkdownEditor = forwardRef<MarkdownEditorRef, MarkdownEditorProps>(
  ({ value, onChange, textState, onUndo }, ref) => {
    const editorRef = useRef<TextEditorRef>(null);

    // 暴露给父组件的方法
    useImperativeHandle(ref, () => ({
      jumpToLine: (lineNumber: number) => {
        editorRef.current?.jumpToLine(lineNumber);
      },
    }));

    const handleJumpToLine = (lineNumber: number) => {
      editorRef.current?.jumpToLine(lineNumber);
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
          {!textState.isValid && (
            <Alert
              variant="destructive"
              className="mt-2 flex justify-between items-center"
            >
              <div className="flex gap-3 items-center">
                <AlertTriangle className="h-5 w-5 mb-1" />
                <div>
                  <AlertTitle>Parse Error</AlertTitle>
                  <div>
                    {textState.error?.split(/line (\d+)/).map((part, index) => {
                      if (index % 2 === 1) {
                        // 这是行号部分
                        return (
                          <Button
                            key={index}
                            variant="link"
                            size="sm"
                            className="px-1 h-auto text-destructive text-sm underline"
                            onClick={() => handleJumpToLine(parseInt(part))}
                          >
                            {`line ${part}`}
                          </Button>
                        );
                      }
                      return part;
                    })}
                  </div>
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
