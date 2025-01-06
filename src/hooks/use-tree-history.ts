import { useState, useCallback, useEffect } from "react";
import { treeToMarkdown } from "../helper/global";
import { INITIAL_TREE } from "../helper/constants";
import { HistoryEntry, TextState, TreeNode, TreeState } from "../typings";
import debounce from "@/lib/debounce";
import * as LZString from "lz-string";

export function useTreeHistory() {
  const [fileTree, setFileTree] = useState<TreeNode>(INITIAL_TREE);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isTreeLocked, setIsTreeLocked] = useState(false);

  // 组件外部定义 debounce 函数
  const updateUrl = debounce((tree: TreeNode) => {
    const compressed = LZString.compressToEncodedURIComponent(
      JSON.stringify(tree)
    );
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}?tree=${compressed}`
    );
  }, 500);

  // 在组件中使用
  useEffect(() => {
    updateUrl(fileTree);
  }, [fileTree]);

  // Initialize history
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
          error: null,
        },
      };
      setHistory([initialEntry]);
      setHistoryIndex(0);
    }
  }, []);

  const addToHistory = useCallback(
    (treeState: TreeState, textState: TextState) => {
      // 如果当前不在历史记录的末尾，需要裁剪掉后面的记录
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push({ tree: treeState, text: textState });

      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    },
    [history, historyIndex]
  );

  const canUndo = historyIndex > 0;
  const canRedo = history.length > 0 && historyIndex < history.length - 1;

  const undo = useCallback(() => {
    if (canUndo) {
      const prevState = history[historyIndex - 1];
      setFileTree(prevState.tree.tree);
      setSelectedNodeIds(prevState.tree.selectedNodeIds);
      setLastSelectedId(prevState.tree.lastSelectedId);
      setHistoryIndex(historyIndex - 1);
      setIsTreeLocked(false);
      return prevState.text;
    }
    return null;
  }, [history, historyIndex, canUndo]);

  const redo = useCallback(() => {
    if (canRedo) {
      const nextState = history[historyIndex + 1];
      setFileTree(nextState.tree.tree);
      setSelectedNodeIds(nextState.tree.selectedNodeIds);
      setLastSelectedId(nextState.tree.lastSelectedId);
      setHistoryIndex(historyIndex + 1);
      setIsTreeLocked(false);
      return nextState.text;
    }
    return null;
  }, [history, historyIndex, canRedo]);

  // Debug history state changes
  useEffect(() => {
    console.log({
      historyLength: history.length,
      historyIndex,
      canUndo,
      canRedo,
    });
  }, [history.length, historyIndex, canUndo, canRedo]);

  return {
    fileTree,
    setFileTree,
    selectedNodeIds,
    setSelectedNodeIds,
    lastSelectedId,
    setLastSelectedId,
    isTreeLocked,
    setIsTreeLocked,
    historyIndex,
    history,
    addToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
