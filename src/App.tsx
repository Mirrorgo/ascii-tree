import { FocusEvent, MouseEventHandler, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  SquarePen,
} from "lucide-react";
import { Input } from "@/components/ui/input";

type TreeNode = {
  id: string;
  name: string;
  type: "file" | "folder";
  children?: TreeNode[];
};

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

function App() {
  const [fileTree, setFileTree] = useState<TreeNode>({
    id: "root",
    name: "root",
    type: "folder",
    children: [
      {
        id: "1",
        name: "folder1",
        type: "folder",
        children: [
          {
            id: "2",
            name: "file1",
            type: "file",
          },
          {
            id: "3",
            name: "file2",
            type: "file",
          },
        ],
      },
      {
        id: "4",
        name: "folder2",
        type: "folder",
        children: [
          {
            id: "5",
            name: "file3",
            type: "file",
          },
          {
            id: "6",
            name: "file4",
            type: "file",
          },
        ],
      },
    ],
  });

  const addFolder = () => {
    const newFolder: TreeNode = {
      id: generateId(),
      name: "New Folder",
      type: "folder",
      children: [],
    };
    setFileTree((prev) => ({
      ...prev,
      children: [...(prev.children || []), newFolder],
    }));
  };

  const addFile = () => {
    const newFile: TreeNode = {
      id: generateId(),
      name: "New File",
      type: "file",
    };
    setFileTree((prev) => ({
      ...prev,
      children: [...(prev.children || []), newFile],
    }));
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

    // 处理根节点
    if (isRoot) {
      result = node.name + "\n";
      prefix = ""; // 重置前缀，确保从 root 开始对齐
    } else {
      result = prefix + (isLast ? "└── " : "├── ") + node.name + "\n";
    }

    // 处理子节点
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

  return (
    <div className="h-screen flex flex-col">
      <div className="w-full border-b p-2">
        <div className="flex justify-between items-center">
          <div className="font-bold text-xl">
            ASCII folder structure diagrams
          </div>
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
          <Button size="sm" onClick={addFolder}>
            + new folder
          </Button>
          <Button size="sm" onClick={addFile}>
            + new file
          </Button>
          <Button variant="link">undo</Button>
          <Button variant="link">redo</Button>
        </div>
      </div>
      <div className="flex flex-1 gap-2">
        <div className="w-64 border-r p-2">
          <TreeNodeComponent node={fileTree} onUpdate={updateNode} />
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
}: {
  node: TreeNode;
  level?: number;
  onUpdate: (id: string, newName: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
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
        className="flex items-center hover:bg-gray-100 rounded px-2 py-1 cursor-pointer"
        style={{ paddingLeft: `${level * 16}px` }}
        onClick={() => node.type === "folder" && setIsOpen(!isOpen)}
      >
        {node.type === "folder" ? (
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

      {node.type === "folder" && node.children && isOpen && (
        <div>
          {node.children.map((child) => (
            <TreeNodeComponent
              key={child.id}
              node={child}
              level={level + 1}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default App;
