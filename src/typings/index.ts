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

export type {
  TreeNode,
  TextState,
  TreeState,
  HistoryEntry,
  MarkdownParseError,
};
