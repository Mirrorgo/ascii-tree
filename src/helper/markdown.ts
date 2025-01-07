import { MarkdownParseError, ParsedNode, TreeNode } from "@/typings";
import { generateId, generateNodePath } from "./global";

interface ParseError {
  type: string;
  message: string;
  line: number;
  column: number;
}

interface ValidationResult {
  level: number;
  name: string;
}

// 导出的公共 API
export function treeToMarkdown(node: TreeNode, level = 0): string {
  const indent = "  ".repeat(level);
  let result = `${indent}- ${node.name}\n`;

  if (node.children && node.children.length > 0) {
    result += node.children
      .map((child) => treeToMarkdown(child, level + 1))
      .join("");
  }

  return result;
}

export function markdownToTree(
  text: string,
  existingTree: TreeNode | null = null
): { tree: TreeNode | null; error: MarkdownParseError | null } {
  try {
    const parsedRoot = parseMarkdownToNodes(text);
    const updatedTree = updateTreeNode(parsedRoot, existingTree);
    return { tree: updatedTree, error: null };
  } catch (error) {
    const parseError = error as ParseError;
    return {
      tree: null,
      error: {
        type: parseError.type,
        location: {
          line: parseError.line,
          column: parseError.column,
        },
        content: parseError.message,
      },
    };
  }
}

// 私有工具函数
// 专门用于验证行格式的函数, 出现错误时抛出异常
function validateMarkdownLine(
  line: string,
  lineIndex: number,
  nextLine: string | undefined,
  siblings: string[] = []
): ValidationResult {
  // Check for empty line
  const firstNonSpace = line.search(/\S/);
  if (firstNonSpace === -1) {
    throw {
      type: "Empty Line",
      message: "Empty line",
      line: lineIndex + 1,
      column: 1,
    } as ParseError;
  }

  // Match line format with capturing groups for indentation and content
  const match = line.match(/^(\s*)-(\s+)(.+)$/);

  if (!match) {
    const dashIndex = line.indexOf("-");
    if (dashIndex === -1) {
      // No dash found - report error at first non-space character
      throw {
        type: "Missing Dash",
        message: "Line must start with '-' after indentation",
        line: lineIndex + 1,
        // Column should be at the position where dash should be
        column: firstNonSpace + 1,
      } as ParseError;
    }

    // Check formatting after dash
    const afterDash = line.slice(dashIndex + 1);
    if (!afterDash.startsWith(" ")) {
      throw {
        type: "Missing Space",
        message: "Dash must be followed by a space",
        line: lineIndex + 1,
        // Column should be right after the dash
        column: dashIndex + 2,
      } as ParseError;
    } else if (!afterDash.slice(1).trim()) {
      throw {
        type: "Missing Content",
        message: "List item must have content after '- '",
        line: lineIndex + 1,
        // Column should be where content should start
        column: dashIndex + 3,
      } as ParseError;
    } else {
      throw {
        type: "Invalid Format",
        message: "Invalid line format",
        line: lineIndex + 1,
        // Column should be at the problematic character
        column: dashIndex + 2,
      } as ParseError;
    }
  }

  const [, indent, spaceAfterDash, content] = match;

  // Check indentation
  if (indent.length % 2 !== 0) {
    throw {
      type: "Invalid Indentation",
      message: "Indentation must be multiple of 2 spaces",
      line: lineIndex + 1,
      // Column should be at the position where indentation becomes invalid
      column: indent.length,
    } as ParseError;
  }

  // Check space after dash
  if (spaceAfterDash.length !== 1) {
    throw {
      type: "Invalid Space After Dash",
      message: "Dash must be followed by exactly one space",
      line: lineIndex + 1,
      // Column should be right after the dash
      column: indent.length + 2,
    } as ParseError;
  }

  // Check for empty node name
  if (!content.trim()) {
    throw {
      type: "Empty Node Name",
      message: "Node name cannot be empty",
      line: lineIndex + 1,
      // Column should be where content should start
      column: indent.length + 3,
    } as ParseError;
  }

  const nodeName = content.trim();

  // Check file node children
  if (!nodeName.endsWith("/")) {
    const currentLevel = indent.length / 2;
    if (nextLine) {
      const nextLineIndent = nextLine.search(/\S|$/);
      if (nextLineIndent / 2 > currentLevel) {
        throw {
          type: "Invalid File Node",
          message: "File node cannot have children",
          line: lineIndex + 1,
          // Column should be at the end of the current node name
          column: indent.length + 3 + content.trim().length,
        } as ParseError;
      }
    }
  }

  // Check for duplicate names
  if (siblings.includes(nodeName)) {
    throw {
      type: "Duplicate Node Name",
      message: "Node names must be unique at the same level",
      line: lineIndex + 1,
      // Column should be at the end of the duplicate name
      column: indent.length + 3 + content.trim().length,
    } as ParseError;
  }

  return {
    level: indent.length / 2,
    name: content.trim(),
  };
}

// 内部实现细节，使用 const 声明
const parseMarkdownToNodes = (text: string): ParsedNode => {
  const lines = text.split("\n").filter((line) => line.trim());
  const root: ParsedNode = { name: "", path: "", children: [] };
  const stack: { node: ParsedNode; level: number }[] = [
    { node: root, level: -1 },
  ];

  const buildNodeTree = (
    line: string,
    lineIndex: number,
    nextLine: string | undefined
  ) => {
    // 先计算当前行的缩进级别
    const match = line.match(/^(\s*)-\s+(.+)$/);
    const level = match ? match[1].length / 2 : 0;

    // 找到应该比较的同级节点所在的父节点
    let compareLevel = stack.length - 1;
    while (compareLevel > 0 && stack[compareLevel].level >= level) {
      compareLevel--;
    }
    const siblingParent = stack[compareLevel].node;
    const siblingsNames = (siblingParent.children || []).map(
      (node) => node.name
    );

    // 进行校验
    const validationResult = validateMarkdownLine(
      line,
      lineIndex,
      nextLine,
      siblingsNames
    );

    // 校验通过后再调整栈
    while (stack.length > 1 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    const parent = stack[stack.length - 1].node;
    const path = generateNodePath(parent.path, validationResult.name);
    const newNode: ParsedNode = {
      name: validationResult.name,
      path,
      children: [],
    };

    if (!parent.children) parent.children = [];
    parent.children.push(newNode);
    stack.push({ node: newNode, level });
  };

  // 处理每一行
  lines.forEach((line, lineIndex) => {
    buildNodeTree(line, lineIndex, lines[lineIndex + 1]);
  });

  if (!root.children || root.children.length === 0) {
    throw {
      type: "Empty Tree",
      message: "Tree must have at least one node",
      line: 1,
      column: 1,
    };
  }

  return root.children[0];
};

const updateTreeNode = (
  parsedNode: ParsedNode,
  existing: TreeNode | null
): TreeNode => {
  if (existing && existing.path === parsedNode.path) {
    // 节点已存在，更新名称但保留 ID
    return {
      ...existing,
      name: parsedNode.name,
      path: parsedNode.path,
      children: parsedNode.children?.map((child) => {
        const existingChild = existing.children?.find(
          (ec) => ec.path === child.path
        );
        return updateTreeNode(child, existingChild || null);
      }),
    };
  } else {
    // 新节点，生成新的 ID
    return {
      id: generateId(),
      name: parsedNode.name,
      path: parsedNode.path,
      children: parsedNode.children?.map((child) =>
        updateTreeNode(child, null)
      ),
    };
  }
};
