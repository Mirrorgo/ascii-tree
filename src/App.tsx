import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronRight,
  Clipboard,
  Github,
  Redo2,
  Settings,
  Trash2,
  Undo2,
  WandSparkles,
} from "lucide-react";
import TextEditor, { TextEditorRef } from "./components/mg/text-editor";
import { Alert, AlertTitle } from "./components/ui/alert";
import { generateId, initialTree, TreeNode, TreeState } from "./helper/global";
import { getNodesBetween } from "./helper/explorer";
import {
  generateAscii,
  isValidAsciiTree,
  parseAsciiTree,
} from "./helper/ascii-tree";
import TreeNodeComponent from "./components/mg/tree-node";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "./components/ui/resizable";
import { ImperativePanelHandle } from "react-resizable-panels";
import { useResponsivePanel } from "./hooks/use-responsive-panel";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "./components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./components/ui/dialog";
import { Textarea } from "./components/ui/textarea";
import { ASCII_TREE_TEMPLATE } from "./helper/constants";

interface TextState {
  content: string;
  isValid: boolean;
  error?: string;
}

interface HistoryEntry {
  tree: TreeState;
  text: TextState;
}

// 新增的转换函数
function treeToMarkdown(node: TreeNode, level = 0): string {
  const indent = "  ".repeat(level);
  let result = `${indent}- ${node.name}\n`;

  if (node.children && node.children.length > 0) {
    result += node.children
      .map((child) => treeToMarkdown(child, level + 1))
      .join("");
  }

  return result;
}

function markdownToTree(text: string): {
  tree: TreeNode | null;
  error: string | null;
} {
  try {
    const lines = text.split("\n").filter((line) => line.trim());
    // 创建一个临时的根节点
    const tempRoot: TreeNode = { id: "root", name: "root", children: [] };
    const stack: { node: TreeNode; level: number }[] = [
      { node: tempRoot, level: -1 },
    ];

    lines.forEach((line, index) => {
      const match = line.match(/^(\s*)-\s+(.+)$/);
      if (!match) {
        throw `Invalid line format at line ${index + 1}`;
      }

      const level = match[1].length / 2;
      const name = match[2];

      while (stack.length > 1 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }

      const newNode: TreeNode = {
        id: generateId(),
        name,
        children: [],
      };

      const parent = stack[stack.length - 1].node;
      if (!parent.children) parent.children = [];
      parent.children.push(newNode);
      stack.push({ node: newNode, level });
    });

    // 如果第一个节点就是我们要的根节点，直接返回它
    if (tempRoot.children && tempRoot.children.length === 1) {
      return { tree: tempRoot.children[0], error: null };
    } else {
      // 如果有多个顶级节点，创建一个新的根节点包含它们
      return {
        tree: {
          id: "root",
          name: "root",
          children: tempRoot.children,
        },
        error: null,
      };
    }
  } catch (error) {
    return { tree: null, error: error as string };
  }
}

function App() {
  const [fileTree, setFileTree] = useState<TreeNode>(initialTree);

  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);

  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

  // const { toast } = useToast();

  const [copied, setCopied] = useState(false);

  // 文本状态
  const [textState, setTextState] = useState<TextState>({
    content: treeToMarkdown(initialTree),
    isValid: true,
  });

  // 历史记录状态
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isTreeLocked, setIsTreeLocked] = useState(false);

  // 初始化历史记录
  useEffect(() => {
    if (history.length === 0) {
      const initialEntry: HistoryEntry = {
        tree: {
          tree: fileTree,
          selectedNodeIds,
          lastSelectedId,
        },
        text: {
          content: treeToMarkdown(fileTree),
          isValid: true,
        },
      };
      setHistory([initialEntry]);
      setHistoryIndex(0);
    }
  }, []);

  // 添加新的历史记录
  const addToHistory = useCallback(
    (treeState: TreeState, textState: TextState) => {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push({ tree: treeState, text: textState });
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    },
    [history, historyIndex]
  );

  // 更新文本编辑器变更处理
  const handleEditorChange = (value: string) => {
    setTextState({
      content: value,
      isValid: true,
    });

    const { tree, error } = markdownToTree(value);
    if (error) {
      setTextState((prev) => ({
        ...prev,
        isValid: false,
        error,
      }));
      setIsTreeLocked(true);
    } else if (tree) {
      const newTree = { ...tree, id: fileTree.id };
      setFileTree(newTree);
      setIsTreeLocked(false);

      addToHistory(
        { tree: newTree, selectedNodeIds, lastSelectedId },
        { content: value, isValid: true }
      );
    }
  };

  // 添加撤销/重做功能
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setFileTree(prevState.tree.tree);
      setSelectedNodeIds(prevState.tree.selectedNodeIds);
      setLastSelectedId(prevState.tree.lastSelectedId);
      setTextState(prevState.text);
      setHistoryIndex((prev) => prev - 1);
      setIsTreeLocked(false);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setFileTree(nextState.tree.tree);
      setSelectedNodeIds(nextState.tree.selectedNodeIds);
      setLastSelectedId(nextState.tree.lastSelectedId);
      setTextState(nextState.text);
      setHistoryIndex((prev) => prev + 1);
      setIsTreeLocked(false);
    }
  };

  const addChildNode = () => {
    if (selectedNodeIds.length > 1) return;

    let newTree: TreeNode;
    if (selectedNodeIds.length === 0) {
      const newNode: TreeNode = {
        id: generateId(),
        name: "New Node",
      };
      newTree = {
        ...fileTree,
        children: [...(fileTree.children || []), newNode],
      };
    } else {
      const addNodeToParent = (node: TreeNode): TreeNode => {
        if (node.id === selectedNodeIds[0]) {
          return {
            ...node,
            children: [
              ...(node.children || []),
              {
                id: generateId(),
                name: "New Node",
              },
            ],
          };
        }
        if (node.children) {
          return {
            ...node,
            children: node.children.map(addNodeToParent),
          };
        }
        return node;
      };
      newTree = addNodeToParent(fileTree);
    }

    setFileTree(newTree);
    const newText = treeToMarkdown(newTree);
    setTextState({
      content: newText,
      isValid: true,
    });

    addToHistory(
      { tree: newTree, selectedNodeIds, lastSelectedId },
      { content: newText, isValid: true }
    );
  };

  const addSiblingNode = () => {
    if (selectedNodeIds.length > 1) return;
    if (selectedNodeIds.length === 0) return;

    const selectedNodeId = selectedNodeIds[0];
    if (!selectedNodeId || selectedNodeId === "root") return;

    const addSibling = (node: TreeNode): TreeNode => {
      if (node.children?.some((child) => child.id === selectedNodeId)) {
        return {
          ...node,
          children: [
            ...node.children,
            {
              id: generateId(),
              name: "New Node",
            },
          ],
        };
      }
      if (node.children) {
        return {
          ...node,
          children: node.children.map(addSibling),
        };
      }
      return node;
    };

    const newTree = addSibling(fileTree);
    setFileTree(newTree);

    const newText = treeToMarkdown(newTree);
    console.log("new text", newText);

    setTextState({
      content: newText,
      isValid: true,
    });

    addToHistory(
      { tree: newTree, selectedNodeIds, lastSelectedId },
      { content: newText, isValid: true }
    );
  };
  const deleteNode = () => {
    if (selectedNodeIds.includes("root")) return;
    if (selectedNodeIds.length === 0) return;

    const removeNodes = (node: TreeNode): TreeNode => {
      if (node.children) {
        const filteredChildren = node.children
          .filter((child) => !selectedNodeIds.includes(child.id))
          .map(removeNodes);

        return {
          ...node,
          children: filteredChildren,
        };
      }
      return node;
    };

    const newTree = removeNodes(fileTree);
    setFileTree(newTree);
    setSelectedNodeIds([]); // 删除后清除选中状态

    // 添加这些代码
    const newText = treeToMarkdown(newTree);
    setTextState({
      content: newText,
      isValid: true,
    });

    addToHistory(
      { tree: newTree, selectedNodeIds: [], lastSelectedId: null },
      { content: newText, isValid: true }
    );
  };

  const updateNode = (nodeId: string, newName: string) => {
    const updateTreeNode = (node: TreeNode): TreeNode => {
      if (node.id === nodeId) {
        return { ...node, name: newName };
      }
      if (node.children) {
        return {
          ...node,
          children: node.children.map(updateTreeNode),
        };
      }
      return node;
    };

    const newTree = updateTreeNode(fileTree);
    setFileTree(newTree);

    // 添加这些代码
    const newText = treeToMarkdown(newTree);
    setTextState({
      content: newText,
      isValid: true,
    });

    addToHistory(
      { tree: newTree, selectedNodeIds, lastSelectedId },
      { content: newText, isValid: true }
    );
  };

  const handleNodeSelection = (
    id: string,
    ctrlKey: boolean,
    shiftKey: boolean
  ) => {
    if (ctrlKey) {
      // Ctrl+点击的逻辑保持不变
      setSelectedNodeIds((prev) =>
        prev.includes(id)
          ? prev.filter((nodeId) => nodeId !== id)
          : [...prev, id]
      );
      setLastSelectedId(id);
    } else if (shiftKey && lastSelectedId) {
      // Shift+点击：选择范围
      const nodesBetween = getNodesBetween(fileTree, lastSelectedId, id);
      setSelectedNodeIds(nodesBetween);
    } else {
      // 普通点击：选择单个
      setSelectedNodeIds([id]);
      setLastSelectedId(id);
    }
  };
  const [isAsciiTreeParserDialogOpen, setIsAsciiTreeParserDialogOpen] =
    useState(true);

  useEffect(() => {
    if (isAsciiTreeParserDialogOpen) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // 撤销
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // 重做
      else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "Z") {
        // 检查 Ctrl+Shift+Z 时，e.key 会变成大写的 "Z"
        e.preventDefault();
        handleRedo();
      }
      // 格式化 Markdown
      else if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleFormatMarkdownList();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    handleUndo,
    handleRedo,
    handleFormatMarkdownList,
    isAsciiTreeParserDialogOpen,
  ]); // 注意添加依赖

  const asciiTreeRef = useRef<ImperativePanelHandle>(null);
  const [isAsciiTreeCollapse, setIsAsciiTreeCollapse] = useState(false);

  const { defaultSize, maxSize, minSize } = useResponsivePanel();

  function handleFormatMarkdownList() {
    const newText = treeToMarkdown(fileTree);
    addToHistory(
      { tree: fileTree, selectedNodeIds, lastSelectedId },
      { content: newText, isValid: true }
    );
    setTextState({
      content: newText,
      isValid: true,
    });
  }

  const [showResizeHandle, setShowResizeHandle] = useState(true);

  const [showExplorerPanel, setShowExplorerPanel] = useState(true);

  const editorRef = useRef<TextEditorRef>(null);

  const handleJumpToLine = useCallback((lineNumber: number) => {
    // 这个方法需要通过 props 传给 TextEditor
    editorRef.current?.jumpToLine(lineNumber);
  }, []);

  const asciiTreeTextAreaRef = useRef<HTMLTextAreaElement | null>(null);

  function handleParseAsciiTree(): void {
    const asciiText = asciiTreeTextAreaRef.current?.value;
    if (!asciiText) return;

    if (isValidAsciiTree(asciiText)) {
      try {
        const newTree = parseAsciiTree(asciiText);

        // Convert the tree to markdown format
        const markdownText = treeToMarkdown(newTree);

        // Update the file tree state
        setFileTree(newTree);

        // Update the text state
        setTextState({
          content: markdownText,
          isValid: true,
        });

        // Clear any existing selections
        setSelectedNodeIds([]);
        setLastSelectedId(null);

        // Add to history
        addToHistory(
          {
            tree: newTree,
            selectedNodeIds: [],
            lastSelectedId: null,
          },
          {
            content: markdownText,
            isValid: true,
          }
        );

        // Close the dialog
        setIsAsciiTreeParserDialogOpen(false);

        // Reset tree lock state
        setIsTreeLocked(false);
      } catch (error) {
        console.error("Error parsing ASCII tree:", error);
        // You might want to show an error message to the user here
      }
    }
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="w-full border-b px-2 mt-2 mb-2">
        <div className="flex justify-between items-center">
          <a
            className="flex items-center"
            target="_blank"
            href="https://github.com/Mirrorgo/ascii-tree/"
          >
            <div className="font-bold text-xl mr-2">
              ASCII folder structure diagrams
            </div>
            <Github className="cursor-pointer" />
          </a>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon">
                <Settings />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>View</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                className="cursor-pointer"
                checked={showExplorerPanel}
                onCheckedChange={(checked) => {
                  setShowExplorerPanel(checked);
                  if (!checked) {
                    setIsAsciiTreeCollapse(false);
                  }
                }}
              >
                Show Explorer Panel
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                className="cursor-pointer"
                checked={showResizeHandle}
                onClick={() => setShowResizeHandle(!showResizeHandle)}
              >
                Show Resize Handles
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                className="cursor-pointer"
                disabled={!textState.isValid}
                onClick={handleFormatMarkdownList}
              >
                {/* <DropdownMenuShortcut>⇧⌥F</DropdownMenuShortcut> */}
                <div className="flex items-baseline gap-2">
                  <div>Format Markdown List</div>
                  <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex justify-between">
          {/* global bar */}
          <div className="flex">
            <Button
              variant="link"
              size="icon"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
            >
              <Undo2 />
            </Button>
            <Button
              size="icon"
              variant="link"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
            >
              <Redo2 />
            </Button>
          </div>
          <Dialog
            open={isAsciiTreeParserDialogOpen}
            onOpenChange={setIsAsciiTreeParserDialogOpen}
          >
            <DialogTrigger>
              <Button variant="link" className="font-bold">
                Generate From Existing ASCII Tree
                <WandSparkles />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Paste ASCII Tree</DialogTitle>
                <DialogDescription>
                  <Textarea
                    className="text-black"
                    ref={asciiTreeTextAreaRef}
                    rows={10}
                    placeholder={ASCII_TREE_TEMPLATE}
                  />
                </DialogDescription>
                <DialogFooter>
                  <Button onClick={() => handleParseAsciiTree()}>OK</Button>
                </DialogFooter>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      {/* main */}

      <ResizablePanelGroup direction="horizontal" className="">
        <ResizablePanel
          defaultSize={defaultSize}
          maxSize={maxSize}
          minSize={minSize}
        >
          <ResizablePanelGroup direction="vertical">
            {showExplorerPanel && (
              <>
                {/* 不加order会产生bug：from 库 readme */}
                <ResizablePanel id="explorer" order={1}>
                  <div className="flex gap-2 justify-center">
                    <Button
                      size="sm"
                      onClick={addChildNode}
                      disabled={selectedNodeIds.length > 1}
                    >
                      Add Child
                    </Button>
                    <Button
                      size="sm"
                      onClick={addSiblingNode}
                      disabled={
                        selectedNodeIds.length !== 1 ||
                        selectedNodeIds.includes("root")
                      }
                    >
                      Add Sibling
                    </Button>
                    <Button
                      size="icon"
                      className="w-8 h-8" // icon 本来是9，调小一点
                      variant="destructive"
                      onClick={deleteNode}
                      disabled={
                        selectedNodeIds.length === 0 ||
                        selectedNodeIds.includes("root")
                      }
                    >
                      <Trash2 />
                    </Button>
                  </div>
                  <TreeNodeComponent
                    node={fileTree}
                    onUpdate={updateNode}
                    selectedNodeIds={selectedNodeIds}
                    onSelectNode={(id, ctrlKey, shiftKey) =>
                      handleNodeSelection(id, ctrlKey, shiftKey)
                    }
                    disabled={isTreeLocked}
                  />
                </ResizablePanel>
                <ResizableHandle withHandle={showResizeHandle} />
              </>
            )}
            <ResizablePanel
              ref={asciiTreeRef}
              order={2}
              id="ascii-tree"
              minSize={30}
              collapsible
              collapsedSize={9}
              onCollapse={() => setIsAsciiTreeCollapse(true)}
              onExpand={() => setIsAsciiTreeCollapse(false)}
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
              <div className="flex-1 px-2 py-1 font-mono whitespace-pre">
                {generateAscii(fileTree)}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
        <ResizableHandle withHandle={showResizeHandle} />
        <ResizablePanel>
          <div className="flex-1 flex flex-col h-full m-1">
            <TextEditor
              ref={editorRef}
              initialValue={textState.content}
              onChange={handleEditorChange}
              className="w-full flex-1 "
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
                        {textState.error
                          ?.split(/line (\d+)/)
                          .map((part, index) => {
                            if (index % 2 === 1) {
                              // 这是行号
                              return (
                                <Button
                                  key={index}
                                  variant="link"
                                  size="sm"
                                  className="px-1 h-auto text-destructive text-sm underline"
                                  onClick={() =>
                                    handleJumpToLine(parseInt(part))
                                  }
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
                  <Button
                    variant={"destructive"}
                    size="icon"
                    onClick={handleUndo}
                  >
                    <Undo2 />
                  </Button>
                </Alert>
              )}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

export default App;
