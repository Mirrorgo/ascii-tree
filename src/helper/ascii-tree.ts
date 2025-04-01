import { ParseError, TreeNode } from "@/typings";
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

  // 若存在 comment，则在节点名称后加上 "# 注释"
  const displayName = node.comment
    ? `${node.name}  # ${node.comment}`
    : node.name;

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
    // const regex = /^((?:│   |    )*)(?:[├└]─{2,}\s+)(.*)$/;
    // 用下面的方案，可以支持更多的分支符号
    const regex =
      /^((?:[\│\u2502]\s*|\s+)*)(?:[\├\└\u251C\u2514][\─\-\u2500]+\s+)(.*)$/;
    const match = line.match(regex);
    if (match) {
      const content = match[2].trim();
      const sharpIndex = content.indexOf("#");
      let name = "";
      let comment: string | undefined;
      if (sharpIndex !== -1) {
        name = content.slice(0, sharpIndex).trim();
        comment = content.slice(sharpIndex + 1).trim();
      } else {
        name = content;
      }

      // // 计算缩进块的数量，每个 "│   " 或 "    " 块代表一级缩进
      // const indentBlockPattern = /(?:│   |    )/g;
      // const indentMatches = indentBlocks.match(indentBlockPattern);
      // const numIndent = indentMatches ? indentMatches.length : 0;

      // // 当前节点的层级为缩进块数 +1（因为有分支符号）
      // const level = numIndent + 1;

      // 提取和计算缩进级别的改进方法
      const indentBlockCount = (match[1].match(/[\│\u2502]|(?:\s{4})/g) || [])
        .length;
      const level = indentBlockCount + 1;

      const isFolder = name.endsWith("/");

      const newNode: TreeNode = {
        id: generateId(),
        name: name,
        path: "",
        comment,
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
      const content = line.trim();
      // 如果没有分支符号，认为是根节点
      // ^(.*?) 表示从开头到第一个 # 之间的任意内容（非贪婪）
      // #       匹配第一个 #
      // ([\s\S]*) 表示后续所有字符（包括换行等）
      const match = content.match(/^(.*?)#([\s\S]*)$/);

      // 如果匹配不到，就说明没有 #，此时把整个 content 当成 name
      const name = match ? match[1].trim() : content.trim();
      // match?[2] 可能是 undefined，所以用可选链和 || 来兜底
      const comment = match?.[2].trim() || undefined;
      const isFolder = name.endsWith("/");
      const newNode: TreeNode = {
        id: generateId(),
        name,
        path: isFolder ? name.slice(0, -1) + "/" : name,
        comment,
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

function isValidAsciiTree(text: string): {
  valid: boolean;
  errors: ParseError[];
} {
  const lines = text.split("\n").filter((l) => l.trim());
  const errors: ParseError[] = [];

  // 记录已出现的根节点名称，用于检测重复
  const globalRootNames = new Set<string>();

  interface StackItem {
    name: string;
    level: number;
    siblings: Set<string>;
  }
  const stack: StackItem[] = [];

  if (lines.length === 0) {
    return {
      valid: false,
      errors: [
        {
          type: "emptyLine",
          location: { line: 0, column: 0 },
        },
      ],
    };
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const lineNumber = i + 1;

    // ========== 1) 拆分缩进部分和剩余部分 ==========
    const indentRegex = /^((?:│   |    )*)(.*)$/;
    const indentMatch = rawLine.match(indentRegex);
    if (!indentMatch) {
      errors.push({
        type: "invalidFormat",
        location: { line: lineNumber, column: 1 },
      });
      continue;
    }

    const indentBlocks = indentMatch[1] ?? "";
    let remainder = indentMatch[2] ?? "";
    remainder = remainder.trimEnd();

    // 计算缩进块数
    const blockPattern = /(?:│   |    )/g;
    const matchedBlocks = indentBlocks.match(blockPattern);
    const baseIndent = matchedBlocks ? matchedBlocks.length : 0;

    // ========== 2) 判断是否有合法的分支符(├──/└──) ==========
    const strictBranchRegex = /^(?:[├└]── )(.*)$/;
    const branchMatch = remainder.match(strictBranchRegex);

    let hasBranch = false;
    let nodeName = remainder; // 默认等于 remainder，再做修正

    if (branchMatch) {
      // 确实匹配到 "├── " 或 "└── "
      hasBranch = true;
      nodeName = branchMatch[1].trim();
    } else {
      // 如果 remainder 中有 '├' 或 '└' 但没匹配到严格的 "── "
      // 比如 "├───" 或 "└─" 等 => 视为无效格式
      if (/^[├└]/.test(remainder)) {
        errors.push({
          type: "invalidBranchSymbol",
          // content: `Malformed branch symbol at line ${lineNumber}`,
          location: { line: lineNumber, column: indentBlocks.length + 1 },
        });
        continue;
      }
    }

    // ========== 3) 计算 level ==========
    // 若有分支符 => level = baseIndent + 1，否则 => baseIndent
    const level = hasBranch ? baseIndent + 1 : baseIndent;

    // ========== 4) 根节点 vs 子节点 ==========
    if (level === 0) {
      // 根节点
      const rootName = nodeName.trim();
      if (globalRootNames.has(rootName)) {
        errors.push({
          type: "duplicateNodeName",
          location: { line: lineNumber, column: indentBlocks.length + 1 },
        });
      } else {
        globalRootNames.add(rootName);
      }

      // 重置栈
      stack.length = 0;
      stack.push({
        name: rootName,
        level,
        siblings: new Set([rootName]),
      });
    } else {
      // 子节点
      // 4.1 若 stack 为空 => 无法确定父节点 => 报错
      if (stack.length === 0) {
        errors.push({
          type: "orphanNode",
          location: { line: lineNumber, column: indentBlocks.length + 1 },
        });
        continue;
      }

      // 4.2 检查缩进跳跃
      const top = stack[stack.length - 1];
      if (level > top.level + 1) {
        errors.push({
          type: "invalidIndentation",
          location: { line: lineNumber, column: indentBlocks.length + 1 },
        });
        continue;
      }

      // 4.3 弹出 >= 当前 level 的节点
      while (stack.length > 0 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }

      if (stack.length === 0) {
        errors.push({
          type: "orphanNode",
          location: { line: lineNumber, column: indentBlocks.length + 1 },
        });
        continue;
      }

      // 4.4 同级重复检测
      const parent = stack[stack.length - 1];
      if (parent.siblings.has(nodeName)) {
        errors.push({
          type: "duplicateNodeName",
          location: { line: lineNumber, column: indentBlocks.length + 1 },
        });
      } else {
        parent.siblings.add(nodeName);
      }

      // 4.5 入栈
      stack.push({
        name: nodeName,
        level,
        siblings: new Set(),
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export { generateAscii, parseAsciiTree, isValidAsciiTree };
