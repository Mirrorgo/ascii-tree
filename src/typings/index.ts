type MarkdownParseError = {
  content: string;
  type: string;
  location: {
    line: number;
    column: number;
  };
};

interface TreeNode {
  id: string;
  name: string;
  path: string;
  children?: TreeNode[];
}

interface TextState {
  content: string;
  isValid: boolean;
  error: MarkdownParseError | null;
}

interface TreeState {
  tree: TreeNode;
  selectedNodeIds: string[];
  lastSelectedId: string | null;
}

interface HistoryEntry {
  tree: TreeState;
  text: TextState;
}

// 为了解析过程中的节点匹配使用
interface ParsedNode {
  name: string;
  path: string;
  children?: ParsedNode[];
}

export type {
  TreeNode,
  TextState,
  TreeState,
  HistoryEntry,
  MarkdownParseError,
  ParsedNode,
};
