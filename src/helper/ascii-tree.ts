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

/**
 * Token类型
 */
enum TokenType {
  ROOT, // 根节点
  BRANCH_MIDDLE, // 中间分支: ├──
  BRANCH_END, // 结尾分支: └──
  INDENT, // 缩进: "│   " 或 "    "
  NAME, // 节点名称
  COMMENT, // 注释
}

/**
 * 解析后的Token
 */
interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

/**
 * AST节点
 */
interface ASTNode {
  name: string;
  comment?: string;
  level: number;
  line: number;
  column: number;
  children: ASTNode[];
}

/**
 * 词法分析器 - 将ASCII文本转换为Token流
 */
function tokenize(text: string): { tokens: Token[]; errors: ParseError[] } {
  const lines = text.split("\n").filter((line) => line.trim());
  const tokens: Token[] = [];
  const errors: ParseError[] = [];

  lines.forEach((line, lineIndex) => {
    const lineNumber = lineIndex + 1;
    let column = 0;

    // 分析缩进和分支符号
    const indentRegex = /^((?:│   |    )*)(.*)$/;
    const indentMatch = line.match(indentRegex);

    if (!indentMatch) {
      errors.push({
        type: "invalidFormat",
        location: { line: lineNumber, column: 1 },
        token: line,
      });
      return;
    }

    const indentBlocks = indentMatch[1] || "";
    let remainder = indentMatch[2] || "";

    // 处理缩进块
    const indentMatches = indentBlocks.match(/(?:│   |    )/g) || [];
    indentMatches.forEach((indent) => {
      tokens.push({
        type: TokenType.INDENT,
        value: indent,
        line: lineNumber,
        column: column + 1,
      });
      column += indent.length;
    });

    // 处理分支符号和节点名称
    const branchStartRegex = /^([├└])/;
    const strictBranchRegex = /^([├└]── )(.*)$/;
    const branchMatch = remainder.match(strictBranchRegex);

    if (branchMatch) {
      // 有正确的分支符号
      const branchSymbol = branchMatch[1];
      const type = branchSymbol.startsWith("├")
        ? TokenType.BRANCH_MIDDLE
        : TokenType.BRANCH_END;

      tokens.push({
        type,
        value: branchSymbol,
        line: lineNumber,
        column: column + 1,
      });

      column += branchSymbol.length;

      // 处理节点名称和注释
      const content = branchMatch[2].trim();
      const commentIndex = content.indexOf("#");

      if (commentIndex !== -1) {
        const name = content.slice(0, commentIndex).trim();
        const comment = content.slice(commentIndex + 1).trim();

        tokens.push({
          type: TokenType.NAME,
          value: name,
          line: lineNumber,
          column: column + 1,
        });

        tokens.push({
          type: TokenType.COMMENT,
          value: comment,
          line: lineNumber,
          column: column + name.length + 2, // +2 for "#" and space
        });
      } else {
        tokens.push({
          type: TokenType.NAME,
          value: content,
          line: lineNumber,
          column: column + 1,
        });
      }
    } else if (indentMatches.length === 0) {
      // 根节点
      const content = remainder.trim();
      const commentIndex = content.indexOf("#");

      if (commentIndex !== -1) {
        const name = content.slice(0, commentIndex).trim();
        const comment = content.slice(commentIndex + 1).trim();

        tokens.push({
          type: TokenType.ROOT,
          value: name,
          line: lineNumber,
          column: 1,
        });

        tokens.push({
          type: TokenType.COMMENT,
          value: comment,
          line: lineNumber,
          column: commentIndex + 2, // +2 for "#" and space
        });
      } else {
        tokens.push({
          type: TokenType.ROOT,
          value: content,
          line: lineNumber,
          column: 1,
        });
      }
    } else if (remainder.match(branchStartRegex)) {
      // 检查不正确的分支符号格式
      // 特别是检测 '├───' 这样有太多水平线或 '├─' 这样有太少水平线的情况
      const horizBarMatch = remainder.match(/^[├└](─+)/);

      if (horizBarMatch && horizBarMatch[1].length !== 2) {
        // 错误的水平线数量
        errors.push({
          type: "invalidBranchSymbol",
          location: { line: lineNumber, column: column + 1 },
          token: remainder,
          // message: `分支符号有 ${horizBarMatch[1].length} 个水平线(─)，应该正好有 2 个`,
        });
      } else {
        // 其他分支符号格式错误
        errors.push({
          type: "invalidBranchSymbol",
          location: { line: lineNumber, column: column + 1 },
          token: remainder,
          // message: "分支符号格式错误。正确格式应为: '├── ' 或 '└── '",
        });
      }
    } else {
      // 无法识别的格式
      errors.push({
        type: "invalidFormat",
        location: { line: lineNumber, column: column + 1 },
        token: line,
      });
    }

    return { tokens, errors };
  });
  return { tokens, errors };
}

/**
 * 语法分析器 - 将Token流转换为AST
 */
function parse(
  tokens: Token[],
  errors: ParseError[]
): { ast: ASTNode[]; errors: ParseError[] } {
  const rootNodes: ASTNode[] = [];
  const stack: { node: ASTNode; level: number }[] = [];
  const globalRootNames = new Set<string>();

  // 按行分组tokens，便于处理
  const lines: Token[][] = [];
  let currentLine = -1;

  // 将tokens按行分组
  tokens.forEach((token) => {
    if (token.line !== currentLine) {
      currentLine = token.line;
      lines[currentLine] = [];
    }
    lines[currentLine].push(token);
  });

  // 去除空行
  const nonEmptyLines = lines.filter((line) => line && line.length > 0);

  for (let lineIndex = 0; lineIndex < nonEmptyLines.length; lineIndex++) {
    const lineTokens = nonEmptyLines[lineIndex];
    if (!lineTokens || lineTokens.length === 0) continue;

    const firstToken = lineTokens[0];

    // 处理根节点
    if (firstToken.type === TokenType.ROOT) {
      const name = firstToken.value;
      const line = firstToken.line;
      const column = firstToken.column;

      // 检查重复的根节点名称
      if (globalRootNames.has(name)) {
        errors.push({
          type: "duplicateNodeName",
          location: { line, column },
          token: name,
        });
      } else {
        globalRootNames.add(name);
      }

      // 创建根节点
      const rootNode: ASTNode = {
        name,
        level: 0,
        line,
        column,
        children: [],
      };

      // 检查是否有注释
      const commentToken = lineTokens.find((t) => t.type === TokenType.COMMENT);
      if (commentToken) {
        rootNode.comment = commentToken.value;
      }

      rootNodes.push(rootNode);
      stack.length = 0; // 清空栈
      stack.push({ node: rootNode, level: 0 });

      continue;
    }

    // 处理子节点
    let indentCount = 0;
    let branchToken: Token | null = null;
    let nameToken: Token | null = null;
    let commentToken: Token | null = null;

    // 解析当前行
    for (const token of lineTokens) {
      if (token.type === TokenType.INDENT) {
        indentCount++;
      } else if (
        token.type === TokenType.BRANCH_MIDDLE ||
        token.type === TokenType.BRANCH_END
      ) {
        branchToken = token;
      } else if (token.type === TokenType.NAME) {
        nameToken = token;
      } else if (token.type === TokenType.COMMENT) {
        commentToken = token;
      }
    }

    // 必须有分支和名称token
    if (!branchToken || !nameToken) continue;

    const level = indentCount + 1; // 缩进数 + 1 = 节点级别
    const name = nameToken.value;
    const line = nameToken.line;
    const column = nameToken.column;

    // 栈为空，说明没有父节点
    if (stack.length === 0) {
      errors.push({
        type: "orphanNode",
        location: { line, column: 1 },
        token: name,
      });
      continue;
    }

    // 清理栈，找到正确的父节点
    // 当栈顶节点的level >= 当前节点的level时，弹出
    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    // 如果栈为空，说明节点是孤儿
    if (stack.length === 0) {
      errors.push({
        type: "orphanNode",
        location: { line, column: 1 },
        token: name,
      });
      continue;
    }

    // 获取父节点
    const parent = stack[stack.length - 1].node;

    // 检查同级重复
    const siblingNames = new Set(parent.children.map((child) => child.name));
    if (siblingNames.has(name)) {
      errors.push({
        type: "duplicateNodeName",
        location: { line, column },
        token: name,
      });
    }

    // 创建新节点
    const newNode: ASTNode = {
      name,
      level,
      line,
      column,
      children: [],
    };

    // 添加注释
    if (commentToken) {
      newNode.comment = commentToken.value;
    }

    // 将新节点添加到父节点
    parent.children.push(newNode);

    // 将新节点压入栈
    stack.push({ node: newNode, level });
  }
  console.log("ast", rootNodes);
  console.log("errors", errors);

  return { ast: rootNodes, errors };
}

/**
 * 将AST转换为TreeNode结构
 */
function astToTreeNodes(ast: ASTNode[]): TreeNode[] {
  const buildTreeNode = (
    astNode: ASTNode,
    parentPath: string = ""
  ): TreeNode => {
    const isFolder = astNode.children.length > 0 || astNode.name.endsWith("/");
    const name =
      isFolder && !astNode.name.endsWith("/")
        ? astNode.name + "/"
        : astNode.name;

    const path = parentPath
      ? parentPath.endsWith("/")
        ? parentPath + name
        : `${parentPath}/${name}`
      : name;

    const normalizedPath = isFolder && !path.endsWith("/") ? path + "/" : path;

    const node: TreeNode = {
      id: generateId(),
      name,
      path: normalizedPath,
      comment: astNode.comment,
    };

    if (astNode.children.length > 0) {
      node.children = astNode.children.map((child) =>
        buildTreeNode(child, normalizedPath)
      );
    }

    return node;
  };

  return ast.map((rootNode) => buildTreeNode(rootNode));
}

/**
 * 解析ASCII树文本为TreeNode结构（用AST方式优化）
 */
function parseAsciiTree(asciiText: string): TreeNode[] {
  // 词法分析
  const { tokens, errors: lexErrors } = tokenize(asciiText);

  // 语法分析
  const { ast, errors: parseErrors } = parse(tokens, lexErrors);

  // 转换为TreeNode
  return astToTreeNodes(ast);
}

//

/**
 * 验证ASCII树文本是否有效
 */
function isValidAsciiTree(text: string): {
  valid: boolean;
  errors: ParseError[];
} {
  if (!text.trim()) {
    return {
      valid: false,
      errors: [
        {
          type: "emptyLine",
          location: { line: 0, column: 0 },
          token: "",
        },
      ],
    };
  }

  // 使用词法和语法分析来验证
  const { tokens, errors: lexErrors } = tokenize(text);
  const { errors: parseErrors } = parse(tokens, []); // 注意这里传空数组，避免lexErrors被重复传入

  // 合并所有错误并去重
  const uniqueErrorMap = new Map();

  // 先处理词法错误
  lexErrors.forEach((error) => {
    const key = `${error.type}-${error.location.line}-${error.location.column}`;
    uniqueErrorMap.set(key, error);
  });

  // 再处理语法错误
  parseErrors.forEach((error) => {
    const key = `${error.type}-${error.location.line}-${error.location.column}`;
    uniqueErrorMap.set(key, error);
  });

  const errors = Array.from(uniqueErrorMap.values());

  return {
    valid: errors.length === 0,
    errors,
  };
}

// function isValidAsciiTree(text: string): {
//   valid: boolean;
//   errors: ParseError[];
// } {
//   const lines = text.split("\n").filter((l) => l.trim());
//   const errors: ParseError[] = [];

//   // 记录已出现的根节点名称，用于检测重复
//   const globalRootNames = new Set<string>();

//   interface StackItem {
//     name: string;
//     level: number;
//     siblings: Set<string>;
//   }
//   const stack: StackItem[] = [];

//   if (lines.length === 0) {
//     return {
//       valid: false,
//       errors: [
//         {
//           type: "emptyLine",
//           location: { line: 0, column: 0 },
//         },
//       ],
//     };
//   }

//   for (let i = 0; i < lines.length; i++) {
//     const rawLine = lines[i];
//     const lineNumber = i + 1;

//     // ========== 1) 拆分缩进部分和剩余部分 ==========
//     const indentRegex = /^((?:│   |    )*)(.*)$/;
//     const indentMatch = rawLine.match(indentRegex);
//     if (!indentMatch) {
//       errors.push({
//         type: "invalidFormat",
//         location: { line: lineNumber, column: 1 },
//       });
//       continue;
//     }

//     const indentBlocks = indentMatch[1] ?? "";
//     let remainder = indentMatch[2] ?? "";
//     remainder = remainder.trimEnd();

//     // 计算缩进块数
//     const blockPattern = /(?:│   |    )/g;
//     const matchedBlocks = indentBlocks.match(blockPattern);
//     const baseIndent = matchedBlocks ? matchedBlocks.length : 0;

//     // ========== 2) 判断是否有合法的分支符(├──/└──) ==========
//     const strictBranchRegex = /^(?:[├└]── )(.*)$/;
//     const branchMatch = remainder.match(strictBranchRegex);

//     let hasBranch = false;
//     let nodeName = remainder; // 默认等于 remainder，再做修正

//     if (branchMatch) {
//       // 确实匹配到 "├── " 或 "└── "
//       hasBranch = true;
//       nodeName = branchMatch[1].trim();
//     } else {
//       // 如果 remainder 中有 '├' 或 '└' 但没匹配到严格的 "── "
//       // 比如 "├───" 或 "└─" 等 => 视为无效格式
//       if (/^[├└]/.test(remainder)) {
//         errors.push({
//           type: "invalidBranchSymbol",
//           // content: `Malformed branch symbol at line ${lineNumber}`,
//           location: { line: lineNumber, column: indentBlocks.length + 1 },
//         });
//         continue;
//       }
//     }

//     // ========== 3) 计算 level ==========
//     // 若有分支符 => level = baseIndent + 1，否则 => baseIndent
//     const level = hasBranch ? baseIndent + 1 : baseIndent;

//     // ========== 4) 根节点 vs 子节点 ==========
//     if (level === 0) {
//       // 根节点
//       const rootName = nodeName.trim();
//       if (globalRootNames.has(rootName)) {
//         errors.push({
//           type: "duplicateNodeName",
//           location: { line: lineNumber, column: indentBlocks.length + 1 },
//         });
//       } else {
//         globalRootNames.add(rootName);
//       }

//       // 重置栈
//       stack.length = 0;
//       stack.push({
//         name: rootName,
//         level,
//         siblings: new Set([rootName]),
//       });
//     } else {
//       // 子节点
//       // 4.1 若 stack 为空 => 无法确定父节点 => 报错
//       if (stack.length === 0) {
//         errors.push({
//           type: "orphanNode",
//           location: { line: lineNumber, column: indentBlocks.length + 1 },
//         });
//         continue;
//       }

//       // 4.2 检查缩进跳跃
//       const top = stack[stack.length - 1];
//       if (level > top.level + 1) {
//         errors.push({
//           type: "invalidIndentation",
//           location: { line: lineNumber, column: indentBlocks.length + 1 },
//         });
//         continue;
//       }

//       // 4.3 弹出 >= 当前 level 的节点
//       while (stack.length > 0 && stack[stack.length - 1].level >= level) {
//         stack.pop();
//       }

//       if (stack.length === 0) {
//         errors.push({
//           type: "orphanNode",
//           location: { line: lineNumber, column: indentBlocks.length + 1 },
//         });
//         continue;
//       }

//       // 4.4 同级重复检测
//       const parent = stack[stack.length - 1];
//       if (parent.siblings.has(nodeName)) {
//         errors.push({
//           type: "duplicateNodeName",
//           location: { line: lineNumber, column: indentBlocks.length + 1 },
//         });
//       } else {
//         parent.siblings.add(nodeName);
//       }

//       // 4.5 入栈
//       stack.push({
//         name: nodeName,
//         level,
//         siblings: new Set(),
//       });
//     }
//   }

//   return {
//     valid: errors.length === 0,
//     errors,
//   };
// }

export { generateAscii, parseAsciiTree, isValidAsciiTree };
