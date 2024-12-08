import { FocusEvent, MouseEventHandler, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  Github,
  SquarePen,
} from "lucide-react";
import { Input } from "@/components/ui/input";

type TreeNode = {
  id: string;
  name: string;
  children?: TreeNode[];
};

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

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

function App() {
  const [fileTree, setFileTree] = useState<TreeNode>({
    id: "root",
    name: "root",
    children: [
      {
        id: "1",
        name: "folder1",
        children: [
          {
            id: "2",
            name: "file1",
          },
          {
            id: "3",
            name: "file2",
          },
        ],
      },
      {
        id: "4",
        name: "folder2",
        children: [
          {
            id: "5",
            name: "file3",
          },
          {
            id: "6",
            name: "file4",
          },
        ],
      },
    ],
  });

  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);

  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

  const addChildNode = () => {
    if (selectedNodeIds.length > 1) return; // 选中多个节点时禁用添加功能
    if (selectedNodeIds.length === 0) {
      // 如果没有选中节点，添加到根节点
      const newNode: TreeNode = {
        id: generateId(),
        name: "New Node",
      };
      setFileTree((prev) => ({
        ...prev,
        children: [...(prev.children || []), newNode],
      }));
      return;
    } else {
      // 此时只需要考虑选中的节点数量为1的情况，因为更大的时候会禁用添加功能
      const selectedNodeId = selectedNodeIds[0];
      const addNodeToParent = (node: TreeNode): TreeNode => {
        if (node.id === selectedNodeId) {
          return {
            ...node,
            children: [
              ...(node.children || []),
              {
                id: generateId(),
                name: "New Node",
              },
            ],
          };
        }
        if (node.children) {
          return {
            ...node,
            children: node.children.map(addNodeToParent),
          };
        }
        return node;
      };

      setFileTree(addNodeToParent);
    }

    // 在选中的节点下添加子节点
  };

  const addSiblingNode = () => {
    if (selectedNodeIds.length > 1) return; // 选中多个节点时禁用添加功能
    if (selectedNodeIds.length === 0) return; // 没有选中节点时禁用添加功能

    // 选中的节点数量为1的情况
    const selectedNodeId = selectedNodeIds[0];
    if (!selectedNodeId || selectedNodeId === "root") {
      return; // 根节点没有同级节点
    }

    const addSibling = (node: TreeNode): TreeNode => {
      if (node.children?.some((child) => child.id === selectedNodeId)) {
        // 找到了父节点
        return {
          ...node,
          children: [
            ...node.children,
            {
              id: generateId(),
              name: "New Node",
            },
          ],
        };
      }
      if (node.children) {
        return {
          ...node,
          children: node.children.map(addSibling),
        };
      }
      return node;
    };

    setFileTree(addSibling);
  };

  // 在 App 组件中添加删除函数
  const deleteNode = () => {
    if (selectedNodeIds.includes("root")) return;
    if (selectedNodeIds.length === 0) return;

    const removeNodes = (node: TreeNode): TreeNode => {
      if (node.children) {
        const filteredChildren = node.children
          .filter((child) => !selectedNodeIds.includes(child.id))
          .map(removeNodes);

        return {
          ...node,
          children: filteredChildren,
        };
      }
      return node;
    };

    setFileTree(removeNodes);
    setSelectedNodeIds([]); // 删除后清除选中状态
  };

  const updateNode = (nodeId: string, newName: string) => {
    const updateTreeNode = (node: TreeNode): TreeNode => {
      if (node.id === nodeId) {
        return { ...node, name: newName };
      }
      if (node.children) {
        return {
          ...node,
          children: node.children.map(updateTreeNode),
        };
      }
      return node;
    };
    setFileTree(updateTreeNode(fileTree));
  };

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

  const handleNodeSelection = (
    id: string,
    ctrlKey: boolean,
    shiftKey: boolean
  ) => {
    if (ctrlKey) {
      // Ctrl+点击的逻辑保持不变
      setSelectedNodeIds((prev) =>
        prev.includes(id)
          ? prev.filter((nodeId) => nodeId !== id)
          : [...prev, id]
      );
      setLastSelectedId(id);
    } else if (shiftKey && lastSelectedId) {
      // Shift+点击：选择范围
      const nodesBetween = getNodesBetween(fileTree, lastSelectedId, id);
      setSelectedNodeIds(nodesBetween);
    } else {
      // 普通点击：选择单个
      setSelectedNodeIds([id]);
      setLastSelectedId(id);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="w-full border-b p-2">
        <div className="flex justify-between items-center">
          <a
            className="flex items-center"
            target="_blank"
            href="https://github.com/Mirrorgo/ascii-tree/"
          >
            <div className="font-bold text-xl mr-2">
              ASCII folder structure diagrams
            </div>
            <Github className="cursor-pointer" />
          </a>
          <Button
            className="ml-auto"
            onClick={() => {
              const ascii = generateAscii(fileTree);
              navigator.clipboard.writeText(ascii);
            }}
          >
            copy
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={addChildNode}
            disabled={selectedNodeIds.length > 1}
          >
            Add Child
          </Button>
          <Button
            size="sm"
            onClick={addSiblingNode}
            disabled={
              selectedNodeIds.length !== 1 || selectedNodeIds.includes("root")
            }
          >
            Add Sibling
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={deleteNode}
            disabled={
              selectedNodeIds.length === 0 || selectedNodeIds.includes("root")
            }
          >
            Delete
          </Button>
          <Button variant="link">undo</Button>
          <Button variant="link">redo</Button>
        </div>
      </div>
      <div className="flex flex-1 gap-2">
        <div className="w-64 border-r p-2">
          <TreeNodeComponent
            node={fileTree}
            onUpdate={updateNode}
            selectedNodeIds={selectedNodeIds}
            onSelectNode={(id, ctrlKey, shiftKey) =>
              handleNodeSelection(id, ctrlKey, shiftKey)
            }
          />
        </div>
        <div className="flex-1 p-2 font-mono whitespace-pre">
          {generateAscii(fileTree)}
        </div>
      </div>
    </div>
  );
}

const TreeNodeComponent = ({
  node,
  level = 0,
  onUpdate,
  selectedNodeIds,
  onSelectNode,
}: {
  node: TreeNode;
  level?: number;
  onUpdate: (id: string, newName: string) => void;
  selectedNodeIds: string[];
  onSelectNode: (id: string, ctrlKey: boolean, shiftKey: boolean) => void;
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedNodeIds.includes(node.id);

  const handleNodeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectNode(node.id, e.ctrlKey, e.shiftKey);
    if (hasChildren && !e.ctrlKey && !e.shiftKey) {
      setIsOpen(!isOpen);
    }
  };

  const handleEdit: MouseEventHandler<SVGSVGElement> = (e) => {
    e.stopPropagation();
    setIsEditing(!isEditing);
  };

  const saveEdit = (e: FocusEvent<HTMLInputElement>) => {
    onUpdate(node.id, e.target.value);
    setIsEditing(false);
  };

  return (
    <div className="select-none">
      <div
        className={`flex items-center hover:bg-gray-100 rounded px-2 py-1 cursor-pointer ${
          isSelected ? "bg-blue-100 hover:bg-blue-200" : ""
        }`}
        style={{ paddingLeft: `${level * 16}px` }}
        onClick={handleNodeClick}
      >
        {hasChildren ? (
          <>
            {isOpen ? (
              <ChevronDown className="w-4 h-4 mr-1" />
            ) : (
              <ChevronRight className="w-4 h-4 mr-1" />
            )}
            <Folder className="w-4 h-4 mr-2 text-blue-500" />
          </>
        ) : (
          <>
            <span className="w-4 mr-1" />
            <FileText className="w-4 h-4 mr-2 text-gray-500" />
          </>
        )}
        {isEditing ? (
          <Input
            className="h-6 mx-0 max-w-32"
            autoFocus
            onClick={(e) => e.stopPropagation()}
            onBlur={saveEdit}
            defaultValue={node.name}
          />
        ) : (
          <span>{node.name}</span>
        )}
        <SquarePen
          onClick={handleEdit}
          className="w-4 h-4 ml-auto text-gray-500 hover:text-blue-500"
        />
      </div>

      {hasChildren && isOpen && (
        <div>
          {node.children!.map((child) => (
            <TreeNodeComponent
              key={child.id}
              node={child}
              level={level + 1}
              onUpdate={onUpdate}
              selectedNodeIds={selectedNodeIds}
              onSelectNode={onSelectNode}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default App;
