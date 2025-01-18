import { TreeNode } from "@/typings";
import { generateId } from "./global";

const generateAscii = (nodes: TreeNode[]) => {
  const asciiText = nodes
    .map((node) => generateAsciiFromSingleNode(node))
    .join("");
  return asciiText;
};

const generateAsciiFromSingleNode = (
  node: TreeNode,
  prefix = "",
  isLast = true,
  isRoot = true
): string => {
  let result = "";

  const displayName = node.name;

  if (isRoot) {
    result = displayName + "\n";
    prefix = "";
  } else {
    result = prefix + (isLast ? "└── " : "├── ") + displayName + "\n";
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
      result += generateAsciiFromSingleNode(
        child,
        newPrefix,
        isLastChild,
        false
      );
    });
  }

  return result;
};

function parseAsciiTree(asciiText: string): TreeNode[] {
  const lines = asciiText.split("\n").filter((line) => line.trim());
  const roots: TreeNode[] = [];
  const stack: { node: TreeNode; level: number }[] = [];

  lines.forEach((line) => {
    // 修正后的正则表达式：
    // 使用 '─'（U+2500）代替 '-', 确保匹配 '├── ' 和 '└── '
    const regex = /^((?:│   |    )*)(?:[├└]─{2,}\s+)(.*)$/;
    const match = line.match(regex);

    if (match) {
      const indentBlocks = match[1];
      const name = match[2].trim();

      // 计算缩进块的数量，每个 "│   " 或 "    " 块代表一级缩进
      const indentBlockPattern = /(?:│   |    )/g;
      const indentMatches = indentBlocks.match(indentBlockPattern);
      const numIndent = indentMatches ? indentMatches.length : 0;

      // 当前节点的层级为缩进块数 +1（因为有分支符号）
      const level = numIndent + 1;

      const isFolder = name.endsWith("/");

      const newNode: TreeNode = {
        id: generateId(),
        name: name,
        path: "",
        // children 仅在有子节点时添加
      };

      // 找到正确的父节点：栈中最后一个层级 < 当前层级的节点
      while (stack.length > 0 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }

      if (stack.length === 0) {
        throw new Error(`Cannot find parent for node: ${name}`);
      }

      const parent = stack[stack.length - 1].node;
      const parentPath = parent.path.endsWith("/")
        ? parent.path
        : `${parent.path}/`;
      const path = isFolder
        ? `${parentPath}${name.slice(0, -1)}/`
        : `${parentPath}${name}`;

      newNode.path = path;

      if (!parent.children) {
        parent.children = [];
      }

      parent.children.push(newNode);

      // 将新节点推入栈
      stack.push({ node: newNode, level });
    } else {
      // 如果没有分支符号，认为是根节点
      const name = line.trim();
      const isFolder = name.endsWith("/");
      const newNode: TreeNode = {
        id: generateId(),
        name: isFolder ? name : name,
        path: isFolder ? name.slice(0, -1) + "/" : name,
        // children 未设置，默认为 undefined
      };
      roots.push(newNode);
      stack.length = 0; // 清空栈
      stack.push({ node: newNode, level: 0 });
    }
  });

  // 递归遍历树，为有子节点的节点名称和路径添加斜杠 "/"
  const processNode = (node: TreeNode) => {
    if (node.children && node.children.length > 0 && !node.name.endsWith("/")) {
      node.name += "/";
      if (!node.path.endsWith("/")) {
        node.path += "/";
      }
    }

    if (node.children) {
      node.children.forEach((child) => processNode(child));
    }
  };

  // 处理所有根节点
  roots.forEach((root) => processNode(root));

  return roots;
}

function isValidAsciiTree(text: string): boolean {
  const lines = text.split("\n").filter((line) => line.trim());
  if (lines.length === 0) return false;

  // 1. Validate root node - consider trailing slash in validation
  const rootLine = lines[0].trim().replace(/\/$/, "");
  if (
    rootLine.includes("│") ||
    rootLine.includes("├") ||
    rootLine.includes("└") ||
    rootLine.includes("─")
  ) {
    return false; // Root node should not contain branch symbols
  }

  // 用栈来跟踪每个层级的节点名称集合，防止同级重复名称
  const nameStack: Set<string>[] = [];
  nameStack.push(new Set([rootLine]));

  // 初始化缩进堆栈，表示当前的缩进层级
  const indentStack: number[] = [0];

  // 2. Validate subsequent lines
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];

    const regex = /^((?:│   |    )*)(?:[├└]── )(.+)$/;
    const match = line.match(regex);

    if (!match) {
      // Handle new root nodes or invalid lines as before
      // ...
      return false; // For simplicity, assuming no additional root nodes
    }

    const indentBlocks = match[1];
    const nodeName = match[2].trim();

    const indentBlockPattern = /(?:│   |    )/g;
    const indentMatches = indentBlocks.match(indentBlockPattern);
    const numIndent = indentMatches ? indentMatches.length : 0;

    const level = numIndent + 1;

    // 检查缩进级别是否合理（不能跳级）
    const lastIndentLevel = indentStack[indentStack.length - 1];
    if (level > lastIndentLevel + 1) {
      return false; // 缩进级别跳跃，返回 false
    }

    // 调整堆栈
    while (
      indentStack.length > 0 &&
      level <= indentStack[indentStack.length - 1]
    ) {
      indentStack.pop();
      nameStack.pop();
    }

    if (indentStack.length === 0) {
      return false; // 无法找到父节点，返回 false
    }

    // 检查当前层级是否有重复的节点名称
    const currentLevelNodes = nameStack[nameStack.length - 1];
    if (currentLevelNodes.has(nodeName)) {
      return false; // 同级节点名称重复，返回 false
    }
    currentLevelNodes.add(nodeName);

    // 添加新的层级
    indentStack.push(level);
    nameStack.push(new Set());
  }

  return true;
}

export { generateAscii, parseAsciiTree, isValidAsciiTree };
