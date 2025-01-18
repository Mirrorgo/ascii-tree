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
  useState,
} from "react";
import { ImperativePanelHandle } from "react-resizable-panels";
import { TreeNode } from "@/typings";
import { Toggle } from "../ui/toggle";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";

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

  // 处理ASCII内容
  const processAsciiContent = (rawAscii: string) => {
    return showTrailingSlash
      ? rawAscii
      : rawAscii
          .split("\n")
          .map((line) => (line.endsWith("/") ? line.slice(0, -1) : line))
          .join("\n");
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
      className="flex flex-col h-full"
    >
      <div
        className="mt-1 px-2 flex justify-between items-center cursor-pointer"
        onClick={handlePanelToggle}
      >
        {!showExplorerPanel ? (
          <div className="w-6" />
        ) : isAsciiTreeCollapse ? (
          <ChevronRight />
        ) : (
          <ChevronDown />
        )}
        <div className="font-bold uppercase translate-x-4">ascii</div>
        <div className="-mr-2">
          <Toggle
            size="sm"
            onClick={handleToggleToolbar}
            pressed={isToolbarVisible}
          >
            <Settings2 />
          </Toggle>
          <Toggle size="sm" pressed={false} onClick={handleCopyClick}>
            {copied ? <Check /> : <Clipboard />}
          </Toggle>
        </div>
      </div>

      {isToolbarVisible && (
        <div className="flex justify-around">
          <div className="flex items-center space-x-1">
            <Switch
              id="trailing-slash"
              className="scale-90"
              checked={showTrailingSlash}
              onCheckedChange={setShowTrailingSlash}
            />
            <Label htmlFor="trailing-slash">Trailing / </Label>
          </div>
          <div className="flex items-center space-x-1">
            <Switch
              id="coloring"
              className="scale-90"
              checked={isAsciiColored}
              onCheckedChange={setIsAsciiColored}
            />
            <Label htmlFor="coloring">Color</Label>
          </div>
        </div>
      )}

      <div
        className={`flex-1 px-2 py-1 font-mono whitespace-pre ${
          isAsciiTreeCollapse ? "overflow-hidden" : "overflow-auto"
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
    </ResizablePanel>
  );
};

// 用于渲染单行ASCII文本的组件,主要是着色
const AsciiLine = ({
  line,
  showTrailingSlash,
  isAsciiColored,
}: {
  line: string;
  showTrailingSlash: boolean;
  isAsciiColored: boolean;
}) => {
  const match = line.match(/(.*?[└├]── )?(.+?)(\/?$)/);

  if (!match) {
    return <div>{line}</div>;
  }

  const [, prefix = "", name, slash = ""] = match;

  return (
    <div>
      {prefix}
      <span
        className={
          isAsciiColored && slash === "/" ? "text-blue-700" : undefined
        }
      >
        {name}
      </span>
      {showTrailingSlash ? slash : ""}
    </div>
  );
};

export default AsciiTreePanel;
