import {
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  SquarePen,
} from "lucide-react";
import { FocusEvent, MouseEventHandler, useState } from "react";
import { Input } from "../ui/input";
import { TreeNode } from "@/typings";

const TreeNodeComponent = ({
  node,
  level = 0,
  onUpdate,
  selectedNodeIds,
  onSelectNode,
  disabled,
}: {
  node: TreeNode;
  level?: number;
  onUpdate: (id: string, newName: string) => void;
  selectedNodeIds: string[];
  onSelectNode: (id: string, ctrlKey: boolean, shiftKey: boolean) => void;
  disabled?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedNodeIds.includes(node.id);

  const handleNodeClick = (e: React.MouseEvent) => {
    if (disabled) return;
    e.stopPropagation();
    onSelectNode?.(node.id, e.ctrlKey, e.shiftKey);
    if (hasChildren && !e.ctrlKey && !e.shiftKey) {
      setIsOpen(!isOpen);
    }
  };

  const handleEdit: MouseEventHandler<SVGSVGElement> = (e) => {
    if (disabled) return;
    e.stopPropagation();
    setIsEditing(!isEditing);
  };

  const saveEdit = (e: FocusEvent<HTMLInputElement>) => {
    onUpdate(node.id, e.target.value);
    setIsEditing(false);
  };

  return (
    <div className={`select-none ${disabled ? "opacity-50" : ""}`}>
      <div
        className={`flex items-center rounded px-2 py-1 cursor-pointer ${
          isSelected ? "bg-blue-200" : "hover:bg-gray-100"
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

export default TreeNodeComponent;
