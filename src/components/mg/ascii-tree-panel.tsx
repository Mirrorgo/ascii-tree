import { Check, ChevronDown, ChevronRight, Clipboard } from "lucide-react";
import { ResizablePanel } from "../ui/resizable";
import { Button } from "../ui/button";
import { Dispatch, RefObject, SetStateAction, useState } from "react";
import { ImperativePanelHandle } from "react-resizable-panels";
import { TreeNode } from "@/typings";

type AsciiTreePanelProps = {
  asciiTreeRef: RefObject<ImperativePanelHandle>;
  isAsciiTreeCollapse: boolean;
  setIsAsciiTreeCollapse: Dispatch<SetStateAction<boolean>>;
  showExplorerPanel: boolean;
  fileTree: TreeNode;
  generateAscii: (fileTree: TreeNode) => string;
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
        onClick={() => {
          if (isAsciiTreeCollapse) asciiTreeRef.current?.expand();
          else asciiTreeRef.current?.collapse();
          setIsAsciiTreeCollapse(!isAsciiTreeCollapse);
        }}
      >
        {!showExplorerPanel ? (
          <div className="w-6" />
        ) : isAsciiTreeCollapse ? (
          <ChevronRight />
        ) : (
          <ChevronDown />
        )}
        <div className="font-bold uppercase">ascii tree</div>
        <Button
          variant="outline"
          size="icon"
          onClick={(e) => {
            setCopied(true);
            setTimeout(() => {
              setCopied(false);
            }, 600);
            const ascii = generateAscii(fileTree);
            navigator.clipboard.writeText(ascii);
            e.stopPropagation();
          }}
        >
          {copied ? <Check /> : <Clipboard />}
        </Button>
      </div>
      <div
        className="flex-1 px-2 py-1 font-mono whitespace-pre overflow-auto"
        // style={{
        //   overflow: "overlay",
        // }}
      >
        {generateAscii(fileTree)}
      </div>
    </ResizablePanel>
  );
};

export default AsciiTreePanel;
