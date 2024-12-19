import { TreeNode } from "./global";

const generateAscii = (
  node: TreeNode,
  prefix = "",
  isLast = true,
  isRoot = true
): string => {
  let result = "";

  if (isRoot) {
    result = node.name + "\n";
    prefix = "";
  } else {
    result = prefix + (isLast ? "└── " : "├── ") + node.name + "\n";
  }

  if (node.children && node.children.length > 0) {
    node.children.forEach((child, index) => {
      let newPrefix;
      if (isRoot) {
        newPrefix = prefix;
      } else {
        newPrefix = prefix + (isLast ? "    " : "│   ");
      }
      const isLastChild = index === node.children!.length - 1;
      result += generateAscii(child, newPrefix, isLastChild, false);
    });
  }

  return result;
};

export { generateAscii };
