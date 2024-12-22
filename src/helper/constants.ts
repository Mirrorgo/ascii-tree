import { TreeNode } from "./global";

const ASCII_TREE_TEMPLATE = `root
├── folder1
│   ├── file1
│   └── file2
└── folder2
    ├── file3
    └── file4`;

const INITIAL_TREE: TreeNode = {
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
export { ASCII_TREE_TEMPLATE, INITIAL_TREE };
