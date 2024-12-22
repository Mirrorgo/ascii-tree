type TreeNode = {
  id: string;
  name: string;
  children?: TreeNode[];
};

interface TreeState {
  tree: TreeNode;
  selectedNodeIds: string[];
  lastSelectedId: string | null;
}

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export { generateId };
export type { TreeNode, TreeState };
