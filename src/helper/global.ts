import { MarkdownParseError, ParsedNode, TreeNode } from "@/typings";

interface ParseError {
  type: string;
  message: string;
  line: number;
  column: number;
}

function generateNodePath(parentPath: string, name: string): string {
  return parentPath ? `${parentPath}/${name}` : name;
}

function parseMarkdownToNodes(text: string): ParsedNode {
  const lines = text.split("\n").filter((line) => line.trim());
  const root: ParsedNode = { name: "", path: "", children: [] };
  const stack: { node: ParsedNode; level: number }[] = [
    { node: root, level: -1 },
  ];

  lines.forEach((line, lineIndex) => {
    const nextLine = lines[lineIndex + 1];

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
}

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

// 专门用于验证行格式的函数, 出现错误时抛出异常
function validateMarkdownLine(
  line: string,
  lineIndex: number,
  nextLine: string | undefined,
  siblings: string[] = [] // 当前行的同级节点名称列表
): {
  level: number;
  name: string;
} {
  // 检查空行
  const firstNonSpace = line.search(/\S/);
  if (firstNonSpace === -1) {
    throw {
      type: "Empty Line",
      message: "Empty line",
      line: lineIndex + 1,
      column: 1,
    } as ParseError;
  }

  // 使用更精确的正则表达式来匹配行格式
  const match = line.match(/^(\s*)-(\s+)(.+)$/);

  if (!match) {
    const dashIndex = line.indexOf("-");
    if (dashIndex === -1) {
      // 完全没有破折号的情况
      throw {
        type: "Missing Dash",
        message: "Line must start with '-' after indentation",
        line: lineIndex + 1,
        column: firstNonSpace + 1,
      } as ParseError;
    }

    // 破折号后格式不正确
    const afterDash = line.slice(dashIndex + 1);
    if (!afterDash.startsWith(" ")) {
      throw {
        type: "Missing Space",
        message: "Dash must be followed by a space",
        line: lineIndex + 1,
        column: dashIndex + 2,
      } as ParseError;
    } else if (!afterDash.slice(1).trim()) {
      throw {
        type: "Missing Content",
        message: "List item must have content after '- '",
        line: lineIndex + 1,
        column: dashIndex + 3,
      } as ParseError;
    } else {
      throw {
        type: "Invalid Format",
        message: "Invalid line format",
        line: lineIndex + 1,
        column: dashIndex + 2,
      } as ParseError;
    }
  }

  const [, indent, spaceAfterDash, content] = match;

  // 检查缩进是否合法
  if (indent.length % 2 !== 0) {
    throw {
      type: "Invalid Indentation",
      message: "Indentation must be multiple of 2 spaces",
      line: lineIndex + 1,
      column: indent.length + 1,
    } as ParseError;
  }

  // 检查破折号后的空格是否正确
  if (spaceAfterDash.length !== 1) {
    throw {
      type: "Invalid Space After Dash",
      message: "Dash must be followed by exactly one space",
      line: lineIndex + 1,
      column: indent.length + 2,
    } as ParseError;
  }

  // 检查节点名称是否为空
  if (!content.trim()) {
    throw {
      type: "Empty Node Name",
      message: "Node name cannot be empty",
      line: lineIndex + 1,
      column: line.length + 1,
    } as ParseError;
  }

  const nodeName = content.trim();

  // 检查非文件夹节点是否有子节点
  if (!nodeName.endsWith("/")) {
    const currentLevel = indent.length / 2;
    if (nextLine) {
      // 简单计算下一行的缩进长度，不用正则
      const nextLineIndent = nextLine.search(/\S|$/);
      if (nextLineIndent / 2 > currentLevel) {
        throw {
          type: "Invalid File Node",
          message: "File node cannot have children",
          line: lineIndex + 1,
          column: nextLineIndent + 1,
        } as ParseError;
      }
    }
  }

  // 检查重复名称
  if (siblings.includes(nodeName)) {
    throw {
      type: "Duplicate Node Name",
      message: "Node names must be unique at the same level",
      line: lineIndex + 1,
      column: line.length - nodeName.length + 1,
    } as ParseError;
  }

  return {
    level: indent.length / 2,
    name: content.trim(),
  };
}

function markdownToTree(
  text: string,
  existingTree: TreeNode | null = null
): { tree: TreeNode | null; error: MarkdownParseError | null } {
  try {
    const parsedRoot = parseMarkdownToNodes(text);

    function updateNode(
      parsedNode: ParsedNode,
      existing: TreeNode | null
    ): TreeNode {
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
            // 将 undefined 转换为 null
            return updateNode(child, existingChild || null);
          }),
        };
      } else {
        // 新节点，生成新的 ID
        return {
          id: generateId(),
          name: parsedNode.name,
          path: parsedNode.path,
          children: parsedNode.children?.map((child) =>
            updateNode(child, null)
          ),
        };
      }
    }

    const updatedTree = updateNode(parsedRoot, existingTree);
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

export { generateId, treeToMarkdown, markdownToTree };
