import { MarkdownParseError, TreeNode } from "@/typings";

interface ParseError {
  type: string;
  message: string;
  line: number;
  column: number;
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

// 专门用于验证行格式的函数
function validateLineFormat(
  line: string,
  lineIndex: number
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

  return {
    level: indent.length / 2,
    name: content.trim(),
  };
}

function markdownToTree(text: string): {
  tree: TreeNode | null;
  error: MarkdownParseError | null;
} {
  try {
    const lines = text.split("\n").filter((line) => line.trim());
    const tempRoot: TreeNode = { id: "root", name: "root", children: [] };
    const stack: { node: TreeNode; level: number }[] = [
      { node: tempRoot, level: -1 },
    ];

    lines.forEach((line, lineIndex) => {
      // 使用验证函数检查行格式
      const { level, name } = validateLineFormat(line, lineIndex);

      // 验证缩进层级关系
      if (stack.length > 0) {
        const parentLevel = stack[stack.length - 1].level;
        if (level > parentLevel + 1) {
          throw {
            type: "Invalid Indentation Level",
            message: "Can only indent one level at a time",
            line: lineIndex + 1,
            column: level * 2 + 1,
          } as ParseError;
        }
      }

      // 处理节点层级关系
      while (stack.length > 1 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }

      // 创建新节点
      const newNode: TreeNode = {
        id: generateId(),
        name,
        children: [],
      };

      // 添加到父节点
      const parent = stack[stack.length - 1].node;
      if (!parent.children) parent.children = [];
      parent.children.push(newNode);
      stack.push({ node: newNode, level });
    });

    // 返回最终的树结构
    if (tempRoot.children && tempRoot.children.length === 1) {
      return { tree: tempRoot.children[0], error: null };
    } else {
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
