import { TreeNode } from "@/typings";
import { generateId } from "./global";

// 添加一个辅助函数来获取树中的所有节点ID
function getAllNodeIds(node: TreeNode): string[] {
  const ids = [node.id];
  if (node.children) {
    node.children.forEach((child) => {
      ids.push(...getAllNodeIds(child));
    });
  }
  return ids;
}

// 添加一个函数来获取两个节点之间的所有节点
function getNodesBetween(
  tree: TreeNode,
  startId: string,
  endId: string
): string[] {
  const allIds = getAllNodeIds(tree);
  const startIndex = allIds.indexOf(startId);
  const endIndex = allIds.indexOf(endId);

  if (startIndex === -1 || endIndex === -1) return [];

  const start = Math.min(startIndex, endIndex);
  const end = Math.max(startIndex, endIndex);

  return allIds.slice(start, end + 1);
}

const createNode = (
  name: string,
  isFolder: boolean,
  parentPath: string = ""
): TreeNode => {
  const path = parentPath ? `${parentPath}/${name}` : name;
  return {
    id: generateId(),
    name,
    path,
    ...(isFolder ? { children: [] } : {}),
  };
};

// 处理树节点的通用函数
const processNode = (
  node: TreeNode,
  selectedNodeId: string,
  newNode: TreeNode
): TreeNode => {
  // 如果当前节点有子节点且其中包含目标节点，说明我们找到了目标节点的父节点
  if (node.children?.some((child) => child.id === selectedNodeId)) {
    // 获取选中的节点，判断是文件还是文件夹
    const selectedNode = node.children.find(
      (child) => child.id === selectedNodeId
    );
    if (selectedNode?.name.endsWith("/")) {
      // 如果选中的是文件夹，在其子节点中添加
      return {
        ...node,
        children: node.children.map((child) =>
          child.id === selectedNodeId
            ? {
                ...child,
                children: [...(child.children || []), newNode],
              }
            : child
        ),
      };
    } else {
      // 如果选中的是文件，添加为兄弟节点
      return {
        ...node,
        children: [...node.children, newNode],
      };
    }
  }

  // 如果有子节点，继续递归
  if (node.children) {
    return {
      ...node,
      children: node.children.map((child) =>
        processNode(child, selectedNodeId, newNode)
      ),
    };
  }

  return node;
};

export { getNodesBetween, getAllNodeIds, createNode, processNode };
