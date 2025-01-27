import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronsDownUp,
  FilePlus,
  FolderPlus,
  Github,
  Redo2,
  Settings,
  Share2,
  Trash2,
  Undo2,
} from "lucide-react";
import { TextEditorRef } from "./components/mg/markdown-editor/text-editor";
import { createNode, getNodesBetween, processNode } from "./helper/explorer";
import {
  generateAscii,
  isValidAsciiTree,
  parseAsciiTree,
} from "./helper/ascii-tree";
import TreeNodeComponent, { TreeNodeRef } from "./components/mg/tree-node";
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

import { INITIAL_TREE } from "./helper/constants";
import { TextState, TreeNode } from "./typings";
import ShortcutsDialog from "./components/mg/shortcuts";
import AsciiTreeParserDialog from "./components/mg/ascii-tree-parser-dialog";
import AsciiTreePanel from "./components/mg/ascii-tree-panel";
import MarkdownEditor, { EditorConfig } from "./components/mg/markdown-editor";
import { useTreeHistory } from "./hooks/use-tree-history";
import { useToast } from "./hooks/use-toast";
import { markdownToTree, treeToMarkdown } from "./helper/markdown.ts";

function App() {
  const { toast } = useToast();
  const {
    fileTree,
    setFileTree,
    selectedNodeIds,
    setSelectedNodeIds,
    lastSelectedId,
    setLastSelectedId,
    isTreeLocked,
    setIsTreeLocked,
    addToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useTreeHistory();

  useEffect(() => {
    const compressed = new URLSearchParams(window.location.search).get("tree");
    if (compressed) {
      const asciiTree = decodeURIComponent(compressed);
      if (isValidAsciiTree(asciiTree)) {
        try {
          resetEditorFromAsciiTree(asciiTree);
        } catch (error) {
          console.error("Error parsing ASCII tree:", error);
        }
      }
    }
  }, []);

  // 文本状态
  const [textState, setTextState] = useState<TextState>({
    content: treeToMarkdown(INITIAL_TREE),
    isValid: true,
    error: null,
  });

  const handleEditorChange = (value: string, config: EditorConfig) => {
    const { tree: newTree, error } = markdownToTree(value, fileTree, config); // 传入当前的 fileTree
    setTextState({
      content: value,
      isValid: true,
      error: null,
    });
    if (error) {
      setTextState((prev) => ({
        ...prev,
        isValid: false,
        error,
      }));
      setIsTreeLocked(true);
    } else if (newTree) {
      setFileTree(newTree);
      setIsTreeLocked(false);

      addToHistory(
        { tree: newTree, selectedNodeIds, lastSelectedId },
        { content: value, isValid: true, error: null }
      );
    }
  };

  const handleUndo = useCallback(() => {
    const prevTextState = undo();
    if (prevTextState) {
      setTextState(prevTextState);
    }
  }, [undo]);

  const handleRedo = useCallback(() => {
    const nextTextState = redo();
    if (nextTextState) {
      setTextState(nextTextState);
    }
  }, [redo]);

  const deleteNode = () => {
    if (selectedNodeIds.length === 0) return;
    const removeNodes = (
      nodes: TreeNode[],
      selectedIds: string[]
    ): TreeNode[] => {
      return nodes
        .filter((node) => !selectedIds.includes(node.id))
        .map((node) => {
          if (node.children) {
            return {
              ...node,
              children: removeNodes(node.children, selectedIds),
            };
          }
          return node;
        });
    };
    const newTree = removeNodes(fileTree, selectedNodeIds);

    setFileTree(newTree);
    setSelectedNodeIds([]);

    const newText = treeToMarkdown(newTree);
    setTextState({
      content: newText,
      isValid: true,
      error: null,
    });

    addToHistory(
      { tree: newTree, selectedNodeIds: [], lastSelectedId: null },
      { content: newText, isValid: true, error: null }
    );
    return;
  };

  const updateNode = (nodeId: string, newName: string) => {
    const updateTreeNode = (nodes: TreeNode[]): TreeNode[] =>
      nodes.map((node) => {
        if (node.id === nodeId) {
          return { ...node, name: newName }; // 更新当前节点
        }
        if (node.children) {
          return { ...node, children: updateTreeNode(node.children) }; // 递归更新子节点
        }
        return node; // 返回未改变的节点
      });

    const newTree = updateTreeNode(fileTree);
    setFileTree(newTree);

    const newText = treeToMarkdown(newTree);
    setTextState({
      content: newText,
      isValid: true,
      error: null,
    });

    addToHistory(
      { tree: newTree, selectedNodeIds, lastSelectedId },
      { content: newText, isValid: true, error: null }
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
    useState(false);

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
    if (!textState.isValid) return;
    const newText = treeToMarkdown(fileTree);
    addToHistory(
      { tree: fileTree, selectedNodeIds, lastSelectedId },
      { content: newText, isValid: true, error: null }
    );
    setTextState({
      content: newText,
      isValid: true,
      error: null,
    });
  }

  const [showResizeHandle, setShowResizeHandle] = useState(true);
  const [showExplorerPanel, setShowExplorerPanel] = useState(true);

  const editorRef = useRef<TextEditorRef>(null);

  const asciiTreeTextAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const [asciiParseError, setAsciiParseError] = useState<string | null>(null);

  const resetEditorFromAsciiTree = (asciiText: string) => {
    const newTree = parseAsciiTree(asciiText);

    // Convert the tree to markdown format
    const markdownText = treeToMarkdown(newTree);

    // Update the file tree state
    setFileTree(newTree);

    // Update the text state
    setTextState({
      content: markdownText,
      isValid: true,
      error: null,
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
        error: null,
      }
    );

    // Close the dialog
    setIsAsciiTreeParserDialogOpen(false);

    // Reset tree lock state
    setIsTreeLocked(false);

    setAsciiParseError(null);
  };

  function handleParseAsciiTree(): void {
    const asciiText = asciiTreeTextAreaRef.current?.value;
    if (!asciiText) return;
    const validateResult = isValidAsciiTree(asciiText);

    if (validateResult.valid) {
      try {
        resetEditorFromAsciiTree(asciiText);
      } catch (error) {
        setAsciiParseError(
          error instanceof Error ? error.message : String(error)
        );
        console.error("Error parsing ASCII tree:", error);
      }
    } else {
      const err = validateResult.errors[0];
      const errMsg = `${err.type}: ${err.content}`;
      setAsciiParseError(errMsg);
    }
  }

  function handleReset(): void {
    setFileTree(INITIAL_TREE);
    const newText = treeToMarkdown(INITIAL_TREE);
    setTextState({
      content: newText,
      isValid: true,
      error: null,
    });
    setIsTreeLocked(false);
    addToHistory(
      { tree: INITIAL_TREE, selectedNodeIds: [], lastSelectedId: null },
      { content: newText, isValid: true, error: null }
    );
  }

  const handleAddFile = (fileName: string = "New File") => {
    console.log(selectedNodeIds, "111");
    if (selectedNodeIds.length > 1) return;
    let newTree: TreeNode[];
    if (selectedNodeIds.length === 0) {
      newTree = [...fileTree, createNode(fileName, false)];
    } else {
      let parentPath = "";
      const selectedNodeId = selectedNodeIds[0];
      const selectedNode = findNodeById(fileTree, selectedNodeId);
      if (selectedNode) {
        parentPath = selectedNode.name.endsWith("/")
          ? selectedNode.path
          : getParentPath(selectedNode.path);
      }
      const newNode = createNode(fileName, false, parentPath);
      treeRef.current?.expandNode(selectedNodeId);
      newTree = processNode(fileTree, selectedNodeId, newNode);
    }
    // 更新状态
    setFileTree(newTree);
    const newText = treeToMarkdown(newTree);
    setTextState({
      content: newText,
      isValid: true,
      error: null,
    });

    addToHistory(
      { tree: newTree, selectedNodeIds, lastSelectedId },
      { content: newText, isValid: true, error: null }
    );
    return;
  };

  const handleAddFolder = (folderName: string = "New Folder/") => {
    if (selectedNodeIds.length > 1) return;
    let newTree: TreeNode[];
    if (selectedNodeIds.length === 0) {
      newTree = [...fileTree, createNode(folderName, true)];
    } else {
      let parentPath = "";
      const selectedNodeId = selectedNodeIds[0];
      const selectedNode = findNodeById(fileTree, selectedNodeId);
      if (selectedNode) {
        parentPath = selectedNode.name.endsWith("/")
          ? selectedNode.path
          : getParentPath(selectedNode.path);
      }
      const newNode = createNode(folderName, false, parentPath);
      treeRef.current?.expandNode(selectedNodeId);
      newTree = processNode(fileTree, selectedNodeId, newNode);
    }
    // 更新状态
    setFileTree(newTree);
    const newText = treeToMarkdown(newTree);
    setTextState({
      content: newText,
      isValid: true,
      error: null,
    });

    addToHistory(
      { tree: newTree, selectedNodeIds, lastSelectedId },
      { content: newText, isValid: true, error: null }
    );
    return;
  };

  const treeRef = useRef<TreeNodeRef>(null);

  const handleShare = () => {
    const url = new URL(window.location.href);
    navigator.clipboard.writeText(url.href);
    toast({
      title: "Link Copied",
      description: "Link has been copied to clipboard",
      duration: 1000,
    });
  };

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
              TreeScii - ASCII Tree Generator
            </div>
            <Github className="cursor-pointer" />
          </a>
          <div className="space-x-4">
            <Button size="icon" variant="ghost" onClick={handleShare}>
              <Share2 />
            </Button>
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
        </div>
        <div className="flex justify-between">
          {/* global bar */}
          <div className="flex items-center">
            <Button
              variant="link"
              size="icon"
              onClick={handleUndo}
              disabled={!canUndo}
            >
              <Undo2 />
            </Button>
            <Button
              size="icon"
              variant="link"
              onClick={handleRedo}
              disabled={!canRedo}
            >
              <Redo2 />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="ml-3 font-bold"
              onClick={handleReset}
            >
              Reset
            </Button>
            <ShortcutsDialog />
          </div>
          <AsciiTreeParserDialog
            isAsciiTreeParserDialogOpen={isAsciiTreeParserDialogOpen}
            setIsAsciiTreeParserDialogOpen={setIsAsciiTreeParserDialogOpen}
            asciiParseError={asciiParseError}
            setAsciiParseError={setAsciiParseError}
            asciiTreeTextAreaRef={asciiTreeTextAreaRef}
            handleParseAsciiTree={handleParseAsciiTree}
          />
        </div>
      </div>
      {/* main */}
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel
          defaultSize={defaultSize}
          maxSize={maxSize}
          minSize={minSize}
        >
          <ResizablePanelGroup direction="vertical">
            {showExplorerPanel && (
              <>
                {/* 不加order会产生bug：from 库 readme */}
                <ResizablePanel
                  id="explorer"
                  order={1}
                  className="flex flex-col h-full"
                >
                  <div className="flex gap-2 justify-center">
                    <Button
                      size="icon"
                      className="w-8 h-8" // icon 本来是9，调小一点
                      onClick={() => handleAddFile()}
                      disabled={selectedNodeIds.length > 1 || isTreeLocked}
                    >
                      <FilePlus />
                    </Button>
                    <Button
                      size="icon"
                      className="w-8 h-8" // icon 本来是9，调小一点
                      onClick={() => handleAddFolder()}
                      disabled={selectedNodeIds.length > 1 || isTreeLocked}
                    >
                      <FolderPlus />
                    </Button>
                    <Button
                      size="icon"
                      className="w-8 h-8" // icon 本来是9，调小一点
                      disabled={isTreeLocked}
                      onClick={() => treeRef.current?.collapseAll()}
                    >
                      <ChevronsDownUp />
                    </Button>
                    <Button
                      size="icon"
                      className="w-8 h-8" // icon 本来是9，调小一点
                      variant="destructive"
                      onClick={deleteNode}
                      disabled={selectedNodeIds.length === 0 || isTreeLocked}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                  <div className="flex-1 overflow-auto min-h-0">
                    <TreeNodeComponent
                      ref={treeRef}
                      nodes={fileTree}
                      onUpdate={updateNode}
                      selectedNodeIds={selectedNodeIds}
                      onSelectNode={(id, ctrlKey, shiftKey) =>
                        handleNodeSelection(id, ctrlKey, shiftKey)
                      }
                      disabled={isTreeLocked}
                    />
                  </div>
                </ResizablePanel>
                <ResizableHandle withHandle={showResizeHandle} />
              </>
            )}
            <AsciiTreePanel
              asciiTreeRef={asciiTreeRef}
              isAsciiTreeCollapse={isAsciiTreeCollapse}
              setIsAsciiTreeCollapse={setIsAsciiTreeCollapse}
              showExplorerPanel={showExplorerPanel}
              fileTree={fileTree}
              generateAscii={generateAscii}
            />
          </ResizablePanelGroup>
        </ResizablePanel>
        <ResizableHandle withHandle={showResizeHandle} />
        <ResizablePanel>
          <MarkdownEditor
            ref={editorRef}
            value={textState.content}
            onChange={handleEditorChange}
            textState={textState}
            onUndo={handleUndo}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

export default App;

// 添加辅助函数
const findNodeById = (tree: TreeNode[], id: string): TreeNode | null => {
  tree.forEach((cur) => {
    if (cur.id === id) return cur;
    if (cur.children) {
      const found = findNodeById(cur.children, id);
      if (found) return found;
    }
  });
  return null;
};

const getParentPath = (path: string): string => {
  const parts = path.split("/");
  return parts.slice(0, -1).join("/");
};
