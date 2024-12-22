import { TreeNode } from "@/typings";

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

export { getNodesBetween, getAllNodeIds };
