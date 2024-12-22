import { generateId, TreeNode } from "./global";

const generateAscii = (
  node: TreeNode,
  prefix = "",
  isLast = true,
  isRoot = true
): string => {
  let result = "";

  if (isRoot) {
    result = node.name + "\n";
    prefix = "";
  } else {
    result = prefix + (isLast ? "└── " : "├── ") + node.name + "\n";
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

// 解析 ASCII 树结构的函数
function parseAsciiTree(asciiText: string): TreeNode {
  const lines = asciiText.split("\n").filter((line) => line.trim());

  // 第一行作为根节点
  const rootName = lines[0].trim();
  const root: TreeNode = {
    id: generateId(),
    name: rootName,
    children: [],
  };

  // 当前处理的节点栈，每个元素包含节点和其层级
  const stack: { node: TreeNode; level: number }[] = [
    { node: root, level: -1 },
  ];

  // 从第二行开始处理子节点
  lines.slice(1).forEach((line) => {
    // 计算当前行的层级（通过计算前导符号的数量）
    const level = Math.floor(line.search(/[^\s│├└]/) / 4);

    // 提取节点名称（移除树形符号）
    const name = line.replace(/[│├└─\s]+/, "").trim();

    // 创建新节点
    const newNode: TreeNode = {
      id: generateId(),
      name,
      children: [],
    };

    // 回溯栈直到找到合适的父节点
    while (stack.length > 1 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    // 将新节点添加到父节点的子节点列表中
    const parent = stack[stack.length - 1].node;
    if (!parent.children) parent.children = [];
    parent.children.push(newNode);

    // 将新节点压入栈中
    stack.push({ node: newNode, level });
  });

  return root;
}

// 用于验证输入文本是否是有效的 ASCII 树格式
function isValidAsciiTree(text: string): boolean {
  const lines = text.split("\n").filter((line) => line.trim());
  if (lines.length === 0) return false;

  // 第一行应该是根节点名称，不带任何前缀符号
  if (/[│├└─]/.test(lines[0])) return false;

  // 验证其余行
  const validLinePattern = /^((\s*)(│\s*)*[├└]──\s*|\s*)[^\s].+$/;
  return lines.slice(1).every((line) => validLinePattern.test(line));
}

export { generateAscii, parseAsciiTree, isValidAsciiTree };
