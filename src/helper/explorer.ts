import { TreeNode } from "@/typings";
import { generateId } from "./global";

// 添加一个辅助函数来获取树中的所有节点ID
function getAllNodeIds(nodes: TreeNode[]): string[] {
  return nodes.reduce<string[]>(
    (acc, node) => [
      ...acc,
      node.id,
      ...(node.children ? getAllNodeIds(node.children) : []),
    ],
    []
  );

  // const ids = [node.id];
  // if (node.children) {
  //   node.children.forEach((child) => {
  //     ids.push(...getAllNodeIds(child));
  //   });
  // }
  // return ids;
}

// 添加一个函数来获取两个节点之间的所有节点
function getNodesBetween(
  tree: TreeNode[],
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

const processNode = (
  nodes: TreeNode[],
  selectedNodeId: string,
  newNode: TreeNode
): TreeNode[] => {
  return nodes.map((node) => {
    // 如果当前节点有子节点并且它们之中有选中的节点
    if (node.children?.some((child) => child.id === selectedNodeId)) {
      // 找到选中的节点
      const selectedNode = node.children.find(
        (child) => child.id === selectedNodeId
      );

      // 如果选中的是文件夹
      if (selectedNode && selectedNode.name.endsWith("/")) {
        return {
          ...node,
          children: node.children.map((child) => {
            if (child.id === selectedNodeId) {
              // 在其子节点中添加新节点
              return {
                ...child,
                children: [...(child.children || []), newNode],
              };
            }
            return child;
          }),
        };
      } else {
        // 如果选中的是文件，则把新节点当作兄弟节点插入
        return {
          ...node,
          children: [...node.children, newNode],
        };
      }
    }

    // 如果没有在当前节点的子节点中找到选中的节点，但当前节点仍然有子节点，则继续递归
    if (node.children && node.children.length > 0) {
      return {
        ...node,
        children: processNode(node.children, selectedNodeId, newNode),
      };
    }

    // 如果当前节点没有子节点，直接返回自身即可
    return node;
  });
};

export { getNodesBetween, getAllNodeIds, createNode, processNode };
