import { ParsedNode, ParseError, TreeNode } from "@/typings";
import { generateId, generateNodePath } from "./global";
import { EditorConfig } from "@/components/mg/markdown-editor";

type ValidationResult = {
  level: number;
  name: string;
};

const isFolder = (nodeName: string) => nodeName.endsWith("/");

// 主解析函数
const parseMarkdownToNodes = (text: string): { parsedNodes: ParsedNode[] } => {
  const lines = text.split("\n");
  const parsedNodes: ParsedNode[] = [];

  // 初始化堆栈，包含虚拟根节点
  const stack: { node: ParsedNode; level: number; siblingsSet: Set<string> }[] =
    [
      {
        node: { name: "ROOT", path: "", children: parsedNodes },
        level: -1, // 虚拟根节点的层级设为 -1
        siblingsSet: new Set<string>(),
      },
    ];

  lines.forEach((line, lineIndex) => {
    const nextLine = lines[lineIndex + 1];
    let validationResult: ValidationResult;

    try {
      // 仅解析行以获取级别和名称，不进行重复检测
      validationResult = parseMarkdownLine(line, lineIndex, nextLine);
    } catch (error) {
      throw error;
    }

    const { level, name } = validationResult;

    // 调整堆栈以找到正确的父节点
    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    // 获取当前父节点和其 siblingsSet
    const parent = stack[stack.length - 1].node;
    const siblingsSet = stack[stack.length - 1].siblingsSet;

    // 验证同级节点名称是否重复
    if (siblingsSet.has(name)) {
      throw {
        type: "Duplicate Node Name",
        content: `Duplicate node name '${name}' at line ${lineIndex + 1}`,
        location: {
          line: lineIndex + 1,
          column: line.indexOf(name) + name.length + (isFolder(name) ? 0 : 1),
        },
      } as ParseError;
    }

    // 添加节点名称到 siblingsSet
    siblingsSet.add(name);

    // 创建新节点
    const newNode: ParsedNode = {
      name,
      path: generateNodePath(parent.path, name),
      children: isFolder(name) ? [] : undefined,
    };

    // 添加新节点到父节点的 children
    parent.children = parent.children || [];
    parent.children.push(newNode);

    // 如果是文件夹，推入堆栈并初始化新的 siblingsSet
    if (isFolder(name)) {
      stack.push({
        node: newNode,
        level,
        siblingsSet: new Set<string>(),
      });
    }
  });

  return { parsedNodes };
};

// 解析每一行的函数
function parseMarkdownLine(
  line: string,
  lineIndex: number,
  nextLine: string | undefined
): ValidationResult {
  // 检查空行
  const firstNonSpace = line.search(/\S/);
  if (firstNonSpace === -1) {
    throw {
      type: "Empty Line",
      content: "Empty line",
      location: {
        line: lineIndex + 1,
        column: 1,
      },
    } as ParseError;
  }

  // 使用正则匹配行格式，捕获缩进和内容
  const match = line.match(/^(\s*)-(\s+.+)$/);

  if (!match) {
    const dashIndex = line.indexOf("-");
    if (dashIndex === -1) {
      // 未找到 '-'
      throw {
        type: "Missing Dash",
        content: "Line must start with '-' after indentation",
        location: {
          line: lineIndex + 1,
          column: firstNonSpace + 1,
        },
      } as ParseError;
    }

    // 检查 '-' 后的格式
    const afterDash = line.slice(dashIndex + 1);
    if (!afterDash.startsWith(" ")) {
      throw {
        type: "Missing Space",
        content: "Dash must be followed by a space",
        location: {
          line: lineIndex + 1,
          column: dashIndex + 2,
        },
      } as ParseError;
    } else if (!afterDash.slice(1).trim()) {
      throw {
        type: "Missing Content",
        content: "List item must have content after '- '",
        location: {
          line: lineIndex + 1,
          column: dashIndex + 3,
        },
      } as ParseError;
    } else {
      throw {
        type: "Invalid Format",
        content: "Invalid line format",
        location: {
          line: lineIndex + 1,
          column: dashIndex + 2,
        },
      } as ParseError;
    }
  }

  const [, indent, content] = match;

  // 检查缩进是否为 2 的倍数
  if (indent.length % 2 !== 0) {
    throw {
      type: "Invalid Indentation",
      content: "Indentation must be multiple of 2 spaces",
      location: {
        line: lineIndex + 1,
        column: indent.length,
      },
    } as ParseError;
  }

  let nodeName = content.trim();

  // 检查节点名称是否为空
  if (!nodeName) {
    throw {
      type: "Empty Node Name",
      content: "Node name cannot be empty",
      location: {
        line: lineIndex + 1,
        column: indent.length + 3,
      },
    } as ParseError;
  }

  // 检查文件节点是否有子节点
  if (!isFolder(nodeName)) {
    const currentLevel = indent.length / 2;
    if (nextLine) {
      const nextLineMatch = nextLine.match(/^(\s*)(?:[├└]──\s+|\-\s+)(.+)$/);
      const nextLineIndent = nextLineMatch ? nextLineMatch[1].length / 2 : 0;
      if (nextLineIndent > currentLevel) {
        throw {
          type: "Invalid File Node",
          content: "File node cannot have children",
          location: {
            line: lineIndex + 1,
            column: indent.length + 3 + nodeName.length,
          },
        } as ParseError;
      }
    }
  }

  return {
    level: indent.length / 2,
    name: nodeName,
  };
}

// 更新现有树节点的函数
const updateTreeNode = (
  parsedNodes: ParsedNode[],
  existing: TreeNode[]
): TreeNode[] => {
  return parsedNodes.map((parsedNode) => {
    const existingNode = existing.find((node) => node.path === parsedNode.path);

    if (existingNode) {
      // Node exists, update name but keep the ID and merge children
      return {
        ...existingNode,
        name: parsedNode.name,
        path: parsedNode.path,
        children:
          parsedNode.children !== undefined
            ? parsedNode.children.length > 0
              ? updateTreeNode(parsedNode.children, existingNode.children || [])
              : []
            : existingNode.children, // Preserve existing children if parsedNode has no children
      };
    } else {
      // New node, generate new ID
      return {
        id: generateId(),
        name: parsedNode.name,
        path: parsedNode.path,
        children:
          parsedNode.children !== undefined
            ? parsedNode.children.length > 0
              ? updateTreeNode(parsedNode.children, [])
              : []
            : undefined,
      };
    }
  });
};

const fixMarkdownByConfig = (text: string, config: EditorConfig) => {
  const lines = text.split("\n");
  const newLines: string[] = [];

  lines.forEach((line) => {
    if (!line.trim()) return; // 跳过空行
    newLines.push(line);
  });

  newLines.forEach((line, lineIndex) => {
    if (lineIndex === newLines.length - 1) return; // 最后一行不用检查
    if (config.autoSlash) {
      const nextLine = newLines[lineIndex + 1];
      const { isFixed, fixedLine } = autoSlash(line, nextLine);
      if (isFixed) newLines[lineIndex] = fixedLine;
    }
  });
  return newLines.join("\n");
  type AutoSlashResult =
    | { isFixed: true; fixedLine: string }
    | { isFixed: false; fixedLine: null };
  function autoSlash(line: string, nextLine: string): AutoSlashResult {
    const match = line.match(/^(\s*)-(\s+.+)$/);
    const nextLineMatch = nextLine.match(/^(\s*)(?:[├└]──\s+|\-\s+)(.+)$/);
    if (!match || !nextLineMatch) return { isFixed: false, fixedLine: null }; // 交给validator去处理吧
    const [, indent, content] = match;
    let nodeName = content.trim();
    if (isFolder(nodeName)) return { isFixed: false, fixedLine: null }; // 不用改了
    const currentLevel = indent.length / 2;
    const nextLineIndent = nextLineMatch ? nextLineMatch[1].length / 2 : 0;
    if (nextLineIndent > currentLevel) {
      const fixedLine = line + "/";
      return { isFixed: true, fixedLine };
    } else {
      return { isFixed: false, fixedLine: null };
    }
  }
};

// 公共 API
export function treeToMarkdown(nodes: TreeNode[]): string {
  return nodes.map((node) => singleNodeToMarkdown(node)).join("");

  function singleNodeToMarkdown(node: TreeNode, level = 0): string {
    const indent = "  ".repeat(level);
    let result = `${indent}- ${node.name}\n`;

    if (node.children && node.children.length > 0) {
      result += node.children
        .map((child) => singleNodeToMarkdown(child, level + 1))
        .join("");
    }

    return result;
  }
}

export function markdownToTree(
  text: string,
  existingTree: TreeNode[] = [],
  // config 添加上默认配置是为了方便测试
  config: EditorConfig = {
    autoSlash: false,
  }
): { tree: TreeNode[]; error: ParseError | null } {
  try {
    const fixedMarkdown = fixMarkdownByConfig(text, config);
    const { parsedNodes } = parseMarkdownToNodes(fixedMarkdown);
    const updatedTree = updateTreeNode(parsedNodes, existingTree);
    return { tree: updatedTree, error: null };
  } catch (error) {
    return {
      tree: [],
      error: error as ParseError,
    };
  }
}
