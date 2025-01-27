interface ParseError {
  content: string;
  type: string;
  location: {
    line: number;
    column: number;
  };
}

interface TreeNode {
  id: string;
  name: string;
  path: string;
  comment?: string;
  children?: TreeNode[];
}

/**
 * Represents a tree node structure used during parsing,
 * which is similar to `TreeNode` but does not include the `id` field.
 */
interface ParsedNode {
  name: string;
  path: string;
  comment?: string;
  children?: ParsedNode[];
}

interface TextState {
  content: string;
  isValid: boolean;
  error: ParseError | null;
}

interface TreeState {
  tree: TreeNode[];
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
  ParseError,
  ParsedNode,
};
