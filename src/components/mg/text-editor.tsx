import {
  useState,
  useRef,
  useEffect,
  ChangeEvent,
  KeyboardEvent,
  FC,
} from "react";

interface ListItemMatch {
  index: number;
  indent: string;
  marker: string;
  content: string;
}

interface EditorProps {
  initialValue?: string;
  onChange?: (value: string) => void;
  className?: string;
  placeholder?: string;
}

const TextEditor: FC<EditorProps> = ({
  initialValue = "",
  onChange,
  className = "",
  placeholder = "开始输入... (支持Alt+↑↓移动行，Tab/Shift+Tab调整列表层级，- 创建列表)",
}) => {
  const [content, setContent] = useState<string>(initialValue);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const parseListItem = (line: string): ListItemMatch | null => {
    const match = line.match(/^(\s*)(- )(.*)/);
    if (!match) return null;

    return {
      index: 0, // Will be set by caller
      indent: match[1],
      marker: match[2],
      content: match[3],
    };
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd, value } = textarea;
    const lines: string[] = value.split("\n");
    const currentLineIndex =
      value.substring(0, selectionStart).split("\n").length - 1;
    const currentLine = lines[currentLineIndex];

    // Alt + Arrow Up/Down for line movement
    if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
      e.preventDefault();

      if (e.key === "ArrowUp" && currentLineIndex > 0) {
        const newLines = [...lines];
        [newLines[currentLineIndex - 1], newLines[currentLineIndex]] = [
          newLines[currentLineIndex],
          newLines[currentLineIndex - 1],
        ];

        updateContent(newLines.join("\n"), () => {
          const newPosition =
            selectionStart - lines[currentLineIndex - 1].length - 1;
          textarea.setSelectionRange(newPosition, newPosition);
        });
      }

      if (e.key === "ArrowDown" && currentLineIndex < lines.length - 1) {
        const newLines = [...lines];
        [newLines[currentLineIndex], newLines[currentLineIndex + 1]] = [
          newLines[currentLineIndex + 1],
          newLines[currentLineIndex],
        ];

        updateContent(newLines.join("\n"), () => {
          const newPosition =
            selectionStart + lines[currentLineIndex + 1].length + 1;
          textarea.setSelectionRange(newPosition, newPosition);
        });
      }
    }

    // Handle Tab and Shift+Tab for list indentation
    if (e.key === "Tab") {
      e.preventDefault();

      const listItem = parseListItem(currentLine);
      if (listItem) {
        listItem.index = currentLineIndex;

        if (e.shiftKey) {
          // Unindent: Remove two spaces if they exist at the start
          if (listItem.indent.length >= 2) {
            const newIndent = listItem.indent.slice(2);
            lines[
              currentLineIndex
            ] = `${newIndent}${listItem.marker}${listItem.content}`;

            updateContent(lines.join("\n"), () => {
              const newPosition = selectionStart - 2;
              textarea.setSelectionRange(newPosition, newPosition);
            });
          }
        } else {
          // Indent: Add two spaces at the start
          const newIndent = listItem.indent + "  ";
          lines[
            currentLineIndex
          ] = `${newIndent}${listItem.marker}${listItem.content}`;

          updateContent(lines.join("\n"), () => {
            const newPosition = selectionStart + 2;
            textarea.setSelectionRange(newPosition, newPosition);
          });
        }
      }
    }

    // Handle Enter key for list continuation
    if (e.key === "Enter") {
      const listItem = parseListItem(currentLine);
      if (listItem) {
        e.preventDefault();
        const newContent =
          value.substring(0, selectionStart) +
          "\n" +
          listItem.indent +
          "- " +
          value.substring(selectionEnd);

        updateContent(newContent, () => {
          const newPosition = selectionStart + listItem.indent.length + 3;
          textarea.setSelectionRange(newPosition, newPosition);
        });
      }
    }
  };

  const updateContent = (newValue: string, callback?: () => void) => {
    setContent(newValue);
    onChange?.(newValue);
    if (callback) {
      setTimeout(callback, 0);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    updateContent(e.target.value);
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className={`w-full h-64 p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-base ${className}`}
        placeholder={placeholder}
      />
    </div>
  );
};

export default TextEditor;
