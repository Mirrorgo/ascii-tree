type ParseErrorType =
  | "missingDash"
  | "missingSpace"
  | "missingContent"
  | "invalidFormat"
  | "invalidIndentation"
  | "emptyNodeName"
  | "invalidFileNode"
  | "duplicateNodeName"
  | "emptyLine"
  | "invalidBranchSymbol" // ascii特有的错误类型
  | "orphanNode"; // ascii特有的错误类型
interface ParseError {
  type: ParseErrorType;
  location: {
    line: number;
    column: number;
  };
  token: string;
}

interface TreeNode {
  id: string;
  name: string;
  path: string;
  isTemp?: boolean;
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
  ParseErrorType,
};
