const initialTree: TreeNode = {
  id: "root",
  name: "root",
  children: [
    {
      id: "1",
      name: "folder1",
      children: [
        {
          id: "2",
          name: "file1",
        },
        {
          id: "3",
          name: "file2",
        },
      ],
    },
    {
      id: "4",
      name: "folder2",
      children: [
        {
          id: "5",
          name: "file3",
        },
        {
          id: "6",
          name: "file4",
        },
      ],
    },
  ],
};

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

export { generateId, initialTree };
export type { TreeNode, TreeState };
