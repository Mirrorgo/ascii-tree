import { TreeNode } from "@/typings";

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

function treeToMarkdown(node: TreeNode, level = 0): string {
  const indent = "  ".repeat(level);
  let result = `${indent}- ${node.name}\n`;

  if (node.children && node.children.length > 0) {
    result += node.children
      .map((child) => treeToMarkdown(child, level + 1))
      .join("");
  }

  return result;
}
function markdownToTree(text: string): {
  tree: TreeNode | null;
  error: string | null;
} {
  try {
    const lines = text.split("\n").filter((line) => line.trim());
    // 创建一个临时的根节点
    const tempRoot: TreeNode = { id: "root", name: "root", children: [] };
    const stack: { node: TreeNode; level: number }[] = [
      { node: tempRoot, level: -1 },
    ];

    lines.forEach((line, index) => {
      const match = line.match(/^(\s*)-\s+(.+)$/);
      if (!match) {
        throw `Invalid line format at line ${index + 1}`;
      }

      const level = match[1].length / 2;
      const name = match[2];

      while (stack.length > 1 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }

      const newNode: TreeNode = {
        id: generateId(),
        name,
        children: [],
      };

      const parent = stack[stack.length - 1].node;
      if (!parent.children) parent.children = [];
      parent.children.push(newNode);
      stack.push({ node: newNode, level });
    });

    // 如果第一个节点就是我们要的根节点，直接返回它
    if (tempRoot.children && tempRoot.children.length === 1) {
      return { tree: tempRoot.children[0], error: null };
    } else {
      // 如果有多个顶级节点，创建一个新的根节点包含它们
      return {
        tree: {
          id: "root",
          name: "root",
          children: tempRoot.children,
        },
        error: null,
      };
    }
  } catch (error) {
    return { tree: null, error: error as string };
  }
}

export { generateId, treeToMarkdown, markdownToTree };
