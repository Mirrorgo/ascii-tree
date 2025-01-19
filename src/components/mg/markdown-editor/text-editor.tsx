import {
  useState,
  useRef,
  useEffect,
  ChangeEvent,
  KeyboardEvent,
  forwardRef,
  useImperativeHandle,
} from "react";

export interface TextEditorRef {
  jumpToPosition: (lineNumber: number, column: number) => void;
}

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

const TextEditor = forwardRef<TextEditorRef, EditorProps>(
  (
    {
      initialValue = "",
      onChange,
      className = "",
      placeholder = "\nStart typing... (Supports Alt+↑↓ to move lines, Tab/Shift+Tab to adjust indent level, - to create lists)",
    },
    ref
  ) => {
    const [content, setContent] = useState<string>(initialValue);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    // 踪输入法组合状态
    const isComposingRef = useRef(false);

    // 计算给定行列位置在整个文本中的索引位置
    const calculatePosition = (lineNumber: number, column: number): number => {
      const lines = content.split("\n");
      let position = 0;

      // 计算到目标行之前的所有字符数
      for (let i = 0; i < lineNumber - 1 && i < lines.length; i++) {
        position += lines[i].length + 1;
      }

      // 加上目标行的列位置
      if (lineNumber <= lines.length) {
        const targetLine = lines[lineNumber - 1];
        // 确保列位置不超过行长度
        position += Math.min(column - 1, targetLine.length);
      }

      return position;
    };

    // 暴露跳转方法给外部
    useImperativeHandle(ref, () => ({
      jumpToPosition(lineNumber: number, column: number) {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const position = calculatePosition(lineNumber, column);

        // 聚焦并设置光标位置
        textarea.focus();
        textarea.setSelectionRange(position, position);

        // 计算滚动位置
        const lineHeight = 20; // 预估的行高
        const padding = 40; // textarea 的 padding
        const visibleLines = Math.floor(textarea.clientHeight / lineHeight);
        const scrollPosition = Math.max(
          0,
          (lineNumber - Math.floor(visibleLines / 2)) * lineHeight - padding
        );

        // 滚动到目标位置，使光标尽量居中显示
        textarea.scrollTop = scrollPosition;
      },
    }));

    // 添加这个 useEffect 来监听 initialValue 的变化
    useEffect(() => {
      setContent(initialValue);
    }, [initialValue]);

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
      // 如果正在输入法组合状态，不处理任何快捷键
      if (isComposingRef.current) {
        return;
      }

      const textarea = textareaRef.current;
      if (!textarea) return;

      const { selectionStart, selectionEnd, value } = textarea;
      const lines: string[] = value.split("\n");

      // 获取选中区域所在的行
      const startLineIndex =
        value.substring(0, selectionStart).split("\n").length - 1;
      const endLineIndex =
        value.substring(0, selectionEnd).split("\n").length - 1;

      // Alt + Arrow Up/Down for line movement
      if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
        e.preventDefault();

        if (e.key === "ArrowUp" && startLineIndex > 0) {
          const newLines = [...lines];
          [newLines[startLineIndex - 1], newLines[startLineIndex]] = [
            newLines[startLineIndex],
            newLines[startLineIndex - 1],
          ];

          updateContent(newLines.join("\n"), () => {
            const newPosition =
              selectionStart - lines[startLineIndex - 1].length - 1;
            textarea.setSelectionRange(newPosition, newPosition);
          });
        }

        if (e.key === "ArrowDown" && startLineIndex < lines.length - 1) {
          const newLines = [...lines];
          [newLines[startLineIndex], newLines[startLineIndex + 1]] = [
            newLines[startLineIndex + 1],
            newLines[startLineIndex],
          ];

          updateContent(newLines.join("\n"), () => {
            const newPosition =
              selectionStart + lines[startLineIndex + 1].length + 1;
            textarea.setSelectionRange(newPosition, newPosition);
          });
        }
      }

      // Handle Tab and Shift+Tab for list indentation
      if (e.key === "Tab") {
        e.preventDefault();

        // 计算选中区域每一行的起始和结束位置
        let selectionStartOffset = 0;
        let selectionEndOffset = 0;
        const updatedLines = [...lines];

        for (let i = startLineIndex; i <= endLineIndex; i++) {
          const line = lines[i];
          const listItem = parseListItem(line);

          if (listItem) {
            if (e.shiftKey) {
              // 减少缩进
              if (listItem.indent.length >= 2) {
                const newIndent = listItem.indent.slice(2);
                updatedLines[
                  i
                ] = `${newIndent}${listItem.marker}${listItem.content}`;

                // 更新选区偏移量
                if (i === startLineIndex) selectionStartOffset -= 2;
                if (i === endLineIndex)
                  selectionEndOffset -= 2 * (endLineIndex - startLineIndex + 1);
              }
            } else {
              // 增加缩进
              const newIndent = listItem.indent + "  ";
              updatedLines[
                i
              ] = `${newIndent}${listItem.marker}${listItem.content}`;

              // 更新选区偏移量
              if (i === startLineIndex) selectionStartOffset += 2;
              if (i === endLineIndex)
                selectionEndOffset += 2 * (endLineIndex - startLineIndex + 1);
            }
          }
        }

        // 应用更新并调整选区
        updateContent(updatedLines.join("\n"), () => {
          const newSelectionStart = selectionStart + selectionStartOffset;
          const newSelectionEnd = selectionEnd + selectionEndOffset;
          textarea.setSelectionRange(newSelectionStart, newSelectionEnd);
        });
      }

      // Handle Enter key for list continuation
      if (e.key === "Enter") {
        const currentLine = lines[startLineIndex];
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

            // 计算新生成的列表项位置，考虑 padding
            const lineHeight =
              parseFloat(getComputedStyle(textarea).lineHeight) || 20;
            const currentLineIndex = newContent
              .substring(0, newPosition)
              .split("\n").length;

            // 考虑 padding，新行的实际位置需要加上顶部 padding
            const padding = 16; // p-4 = 16px
            const newLineTop = currentLineIndex * lineHeight + padding;

            // 获取 textarea 的可视区域范围\
            const visibleTop = textarea.scrollTop;
            const visibleBottom =
              visibleTop + textarea.clientHeight - padding * 2;

            // 只有当新列表项不在可视区域时才滚动
            // 为了更好的体验，我们在底部预留一行的空间
            if (newLineTop > visibleBottom - lineHeight) {
              // 滚动时确保新行在视野中间偏下的位置
              const targetScrollTop =
                newLineTop - textarea.clientHeight + lineHeight + padding * 2;
              textarea.scrollTop = Math.max(0, targetScrollTop);
            }
          });
        }
        // 对于非列表项的回车,不做任何处理,让浏览器处理默认行为
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
        textareaRef.current.setSelectionRange(
          textareaRef.current.value.length,
          textareaRef.current.value.length
        );
      }
    }, []);

    return (
      <textarea
        ref={textareaRef}
        value={content}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className={`p-4 resize-none rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-base ${className}`}
        placeholder={placeholder}
        onCompositionStart={() => {
          isComposingRef.current = true;
        }}
        onCompositionEnd={() => {
          isComposingRef.current = false;
        }}
      />
    );
  }
);

TextEditor.displayName = "TextEditor";

export default TextEditor;
