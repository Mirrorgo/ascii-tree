import { TreeNode } from "@/typings";
import { nanoid } from "nanoid";

function generateNodePath(parentPath: string, name: string): string {
  return parentPath ? `${parentPath}${name}` : name;
}

// 可以自定义长度，默认是 21 位
function generateId(size: number = 12) {
  return nanoid(size); // 使用较短的长度，因为我们有路径作为辅助标识
}

const removeNodes = (nodes: TreeNode[], selectedIds: string[]): TreeNode[] => {
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
const removeTrailingSlash = (str: string) => str.replace(/\/$/, "");

export { generateId, generateNodePath, removeTrailingSlash, removeNodes };
