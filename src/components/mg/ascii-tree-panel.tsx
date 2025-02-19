import {
  Check,
  ChevronDown,
  ChevronRight,
  Clipboard,
  Settings2,
} from "lucide-react";
import { ResizablePanel } from "../ui/resizable";
import {
  Dispatch,
  MouseEvent,
  RefObject,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import { ImperativePanelHandle } from "react-resizable-panels";
import { TreeNode } from "@/typings";
import { Toggle } from "../ui/toggle";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { useTranslation } from "react-i18next";

type AsciiTreePanelProps = {
  asciiTreeRef: RefObject<ImperativePanelHandle>;
  isAsciiTreeCollapse: boolean;
  setIsAsciiTreeCollapse: Dispatch<SetStateAction<boolean>>;
  showExplorerPanel: boolean;
  fileTree: TreeNode[];
  generateAscii: (fileTree: TreeNode[]) => string;
};

const AsciiTreePanel = ({
  asciiTreeRef,
  isAsciiTreeCollapse,
  setIsAsciiTreeCollapse,
  showExplorerPanel,
  fileTree,
  generateAscii,
}: AsciiTreePanelProps) => {
  const [copied, setCopied] = useState(false);
  const [showTrailingSlash, setShowTrailingSlash] = useState(true);
  const [isAsciiColored, setIsAsciiColored] = useState(true);
  const [isToolbarVisible, setIsToolbarVisible] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { t } = useTranslation();

  // 处理ASCII内容
  const processAsciiContent = (rawAscii: string) => {
    const lines = rawAscii.split("\n");
    const processLine = (rawLine: string) => {
      const commentMatch = rawLine.match(/^(.*?)#(.*)$/);
      if (!commentMatch) {
        const trimmed = rawLine.trim();
        const isFolder = trimmed.endsWith("/");
        const nameWithoutSlash = isFolder ? trimmed.slice(0, -1) : trimmed;
        return `${nameWithoutSlash}${showTrailingSlash && isFolder ? "/" : ""}`;
      } else {
        const [, name, comment] = commentMatch;
        const trimmed = name.trim();
        const isFolder = trimmed.endsWith("/");
        const nameWithoutSlash = isFolder ? trimmed.slice(0, -1) : trimmed;
        return `${nameWithoutSlash}${
          showTrailingSlash && isFolder ? "/" : ""
        } #${comment}`;
      }
    };
    return lines.map((cur) => processLine(cur)).join("\n");
  };

  const rawAscii = generateAscii(fileTree);

  const handleCopyClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    navigator.clipboard.writeText(processAsciiContent(rawAscii));
    setCopied(true);
    setTimeout(() => setCopied(false), 600);
  };

  const handleToggleToolbar = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setIsToolbarVisible(!isToolbarVisible);
  };

  const handlePanelToggle = () => {
    if (isAsciiTreeCollapse) {
      asciiTreeRef.current?.expand();
    } else {
      asciiTreeRef.current?.collapse();
    }
    setIsAsciiTreeCollapse(!isAsciiTreeCollapse);
  };

  useEffect(() => {
    setIsTransitioning(true);
  }, [isAsciiTreeCollapse]);

  return (
    <ResizablePanel
      ref={asciiTreeRef}
      order={2}
      id="ascii-tree"
      minSize={30}
      collapsible
      collapsedSize={9}
      onCollapse={() => setIsAsciiTreeCollapse(true)}
      onExpand={() => setIsAsciiTreeCollapse(false)}
      onTransitionEnd={() => setIsTransitioning(false)}
      className="flex flex-col h-full transition-all duration-300 ease-in-out overflow-hidden"
    >
      <div
        className="mt-1 px-3 flex justify-between items-center"
        role="button"
        aria-expanded={!isAsciiTreeCollapse}
        onClick={handlePanelToggle}
      >
        {!showExplorerPanel ? (
          <div className="w-6" />
        ) : isAsciiTreeCollapse ? (
          <ChevronRight />
        ) : (
          <ChevronDown />
        )}
        <div className="font-bold uppercase translate-x-4">{t("ascii")}</div>
        <div className="-mr-2">
          <Toggle
            size="sm"
            onClick={handleToggleToolbar}
            pressed={isToolbarVisible}
            className={`${isAsciiTreeCollapse ? "invisible" : "visible"}`}
          >
            <Settings2 />
          </Toggle>
          <Toggle size="sm" pressed={false} onClick={handleCopyClick}>
            {copied ? <Check /> : <Clipboard />}
          </Toggle>
        </div>
      </div>

      {!isAsciiTreeCollapse && isToolbarVisible && (
        <div className="flex justify-around">
          <div className="flex items-center space-x-1">
            <Switch
              id="trailing-slash"
              className="scale-90"
              checked={showTrailingSlash}
              onCheckedChange={setShowTrailingSlash}
            />
            <Label htmlFor="trailing-slash">{t("trailingSlash")}</Label>
          </div>
          <div className="flex items-center space-x-1">
            <Switch
              id="coloring"
              className="scale-90"
              checked={isAsciiColored}
              onCheckedChange={setIsAsciiColored}
            />
            <Label htmlFor="coloring">{t("color")}</Label>
          </div>
        </div>
      )}

      {!isAsciiTreeCollapse && (
        <div
          className={`flex-1 px-2 py-1 font-mono whitespace-pre ${
            isTransitioning ? "overflow-hidden" : "overflow-auto"
          }`}
        >
          {rawAscii.split("\n").map((line, index) => (
            <AsciiLine
              key={index}
              line={line}
              showTrailingSlash={showTrailingSlash}
              isAsciiColored={isAsciiColored}
            />
          ))}
        </div>
      )}
    </ResizablePanel>
  );
};

interface AsciiLineProps {
  line: string;
  showTrailingSlash: boolean;
  isAsciiColored: boolean;
}
// 用于渲染单行ASCII文本的组件,主要是着色
const AsciiLine: React.FC<AsciiLineProps> = ({
  line,
  showTrailingSlash,
  isAsciiColored,
}) => {
  // 提取前缀和内容，例如 "├── "、"└── "等结构
  const lineMatch = line.match(/(.*?[└├]── )?(.*)/);
  if (!lineMatch) {
    return <div>{line}</div>;
  }

  const [, prefix = "", content] = lineMatch;

  // 尝试提取注释（# 之后的部分）
  const commentMatch = content.match(/^(.*?)#(.*)$/);

  // 渲染文件或文件夹名称（去除尾部斜杠、控制颜色等）
  const renderName = (rawName: string) => {
    const trimmed = rawName.trim();
    const isFolder = trimmed.endsWith("/");
    const nameWithoutSlash = isFolder ? trimmed.slice(0, -1) : trimmed;

    return (
      <>
        <span
          className={isAsciiColored && isFolder ? "text-blue-700" : undefined}
        >
          {nameWithoutSlash}
        </span>
        {showTrailingSlash && isFolder && "/"}
      </>
    );
  };

  // 无注释的情况
  if (!commentMatch) {
    return (
      <div>
        {prefix}
        {renderName(content)}
      </div>
    );
  }

  // 有注释的情况
  const [, name, comment] = commentMatch;
  return (
    <div>
      {prefix}
      {renderName(name)}{" "}
      <span className={isAsciiColored ? "text-gray-500" : ""}>#{comment}</span>
    </div>
  );
};

export default AsciiTreePanel;
