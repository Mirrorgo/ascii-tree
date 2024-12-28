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

// Parse ASCII tree structure
function parseAsciiTree(asciiText: string): TreeNode {
  const lines = asciiText.split("\n").filter((line) => line.trim());

  // First line as root node - remove trailing slash if present
  const rootName = lines[0].trim().replace(/\/$/, "");
  const root: TreeNode = {
    id: generateId(),
    name: rootName,
    children: [],
  };

  const stack: { node: TreeNode; level: number }[] = [
    { node: root, level: -1 },
  ];

  lines.slice(1).forEach((line) => {
    const level = Math.floor(line.search(/[^\s│├└]/) / 4);

    // Extract node name (remove tree symbols and trailing slash)
    const name = line
      .replace(/[│├└─\s]+/, "")
      .trim()
      .replace(/\/$/, ""); // Remove trailing slash using regex

    // Create new node
    const newNode: TreeNode = {
      id: generateId(),
      name,
      children: [],
    };

    // Backtrack stack to find parent node
    while (stack.length > 1 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    const parent = stack[stack.length - 1].node;
    if (!parent.children) parent.children = [];
    parent.children.push(newNode);

    stack.push({ node: newNode, level });
  });

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

    // If indent decreases, update indent stack
    while (
      indentStack.length > 0 &&
      indentLevel < indentStack[indentStack.length - 1]
    ) {
      indentStack.pop();
    }

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
