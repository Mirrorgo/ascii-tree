import { TreeNode } from "@/typings";
import { generateId } from "./global";

const generateAscii = (
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
      result += generateAscii(child, newPrefix, isLastChild, false);
    });
  }

  return result;
};

function parseAsciiTree(asciiText: string): TreeNode {
  const lines = asciiText.split("\n").filter((line) => line.trim());

  // First line as root node
  const rootName = lines[0];
  const root: TreeNode = {
    id: generateId(),
    name: rootName,
    path: rootName,
    children: [],
  };

  const stack: { node: TreeNode; level: number }[] = [
    { node: root, level: -1 },
  ];

  lines.slice(1).forEach((line) => {
    const indent = line.match(/^[\s│]*(?:├──|└──|)/)?.[0].length || 0;
    const level = Math.floor(indent / 4);

    // 提取节点名称，去除前缀符号
    const name = line.replace(/^[\s│]*(├──|└──)\s*/, "").trim();

    // 回溯堆栈找到正确的父节点
    while (stack.length > 1 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    const parent = stack[stack.length - 1].node;
    const path = parent.path.endsWith("/")
      ? `${parent.path}${name}`
      : `${parent.path}/${name}`;

    // 创建新节点
    const newNode: TreeNode = {
      id: generateId(),
      name,
      path,
      children: [],
    };

    if (!parent.children) parent.children = [];
    parent.children.push(newNode);

    stack.push({ node: newNode, level });
  });

  // 添加处理函数：递归遍历树，为有子节点的节点添加/
  const processNode = (node: TreeNode) => {
    // 如果节点有子节点且名称没有以/结尾，则添加/
    if (node.children && node.children.length > 0 && !node.name.endsWith("/")) {
      node.name = node.name + "/";

      // 同时更新 path
      if (!node.path.endsWith("/")) {
        node.path = node.path + "/";
      }
    }

    // 递归处理所有子节点
    if (node.children) {
      node.children.forEach(processNode);
    }
  };

  // 处理整个树
  processNode(root);

  return root;
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
    return false;
  }

  // 用 Map 存储每个缩进级别的节点名称集合
  const levelNodes = new Map<number, Set<string>>();
  levelNodes.set(0, new Set([rootLine]));

  // 2. Validate subsequent lines
  let lastIndentLevel = 0;
  const indentStack: number[] = [0];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];

    // Basic format check: remove trailing slash before validation
    const cleanLine = line.replace(/\/$/, "");
    const indentMatch = cleanLine.match(/^(\s*(│\s+)*)(├──|└──)\s+\S.*?$/);
    if (!indentMatch) return false;

    // Calculate current line's indent level
    const indent = line.search(/[^\s│]/);
    const indentLevel = Math.floor(indent / 4);

    // Check if indent is reasonable
    if (indent % 4 !== 0) return false;

    // Check if indent level change is reasonable
    if (indentLevel > lastIndentLevel + 1) return false;

    // If indent decreases, update indent stack and clear higher level nodes
    while (
      indentStack.length > 0 &&
      indentLevel < indentStack[indentStack.length - 1]
    ) {
      const poppedLevel = indentStack.pop()!;
      // 清理更高层级的节点集合
      for (let level = poppedLevel; level > indentLevel; level--) {
        levelNodes.delete(level);
      }
    }

    // Extract node name
    const nodeName = line
      .substring(indent)
      .replace(/(├──|└──)\s*/, "")
      .trim();

    // Check for duplicate names at the same level
    if (!levelNodes.has(indentLevel)) {
      levelNodes.set(indentLevel, new Set());
    }
    const currentLevelNodes = levelNodes.get(indentLevel)!;
    if (currentLevelNodes.has(nodeName)) {
      return false; // 发现重复名称
    }
    currentLevelNodes.add(nodeName);

    // Check vertical line positions
    const prefixPart = line.substring(0, indent);
    const expectedPipes = indentLevel;
    const actualPipes = (prefixPart.match(/│/g) || []).length;

    if (actualPipes > expectedPipes) return false;

    // Check lines after └──
    if (i > 0 && lines[i - 1].includes("└──")) {
      const prevIndent = lines[i - 1].search(/[^\s│]/);
      const prevPart = lines[i - 1].substring(0, prevIndent);
      const currentPart = line.substring(0, prevIndent);

      if (
        line.length > prevIndent &&
        currentPart.split("│").length > prevPart.split("│").length
      ) {
        return false;
      }
    }

    lastIndentLevel = indentLevel;
    if (line.includes("├──") || line.includes("└──")) {
      indentStack.push(indentLevel);
    }
  }

  return true;
}

export { generateAscii, parseAsciiTree, isValidAsciiTree };
