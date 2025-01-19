import {
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  SquarePen,
} from "lucide-react";
import {
  FocusEvent,
  MouseEventHandler,
  useState,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";
import { Input } from "../ui/input";
import { TreeNode } from "@/typings";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

export interface TreeNodeRef {
  expandAll: () => void;
  collapseAll: () => void;
  expandNode: (nodeId: string) => void;
  collapseNode: (nodeId: string) => void;
}

interface TreeNodeProps {
  nodes: TreeNode[];
  level?: number;
  onUpdate: (id: string, newName: string) => void;
  selectedNodeIds: string[];
  onSelectNode: (id: string, ctrlKey: boolean, shiftKey: boolean) => void;
  disabled?: boolean;
}

// Root component that manages all state
const TreeNodeComponent = forwardRef<TreeNodeRef, TreeNodeProps>(
  (props, ref) => {
    const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(
      new Set()
    );

    // 监控 collapsedNodes 的变化
    // useEffect(() => {
    //   console.log("collapsedNodes changed:", Array.from(collapsedNodes));
    // }, [collapsedNodes]);
    const [editingNodeId, setEditingNodeId] = useState<string | null>(null);

    // Get all folder IDs recursively
    const getAllFolderIds = useCallback((nodes: TreeNode[]): string[] => {
      // console.log("getAllFolderIds called with node:", node);
      return nodes.reduce((folderIds: string[], node) => {
        if (node.name.endsWith("/")) {
          folderIds.push(node.id);
        }
        if (node.children) {
          folderIds.push(...getAllFolderIds(node.children));
        }
        return folderIds;
      }, []);
    }, []);

    // Find parent node
    const findParentNode = useCallback(
      (root: TreeNode, nodeId: string): TreeNode | null => {
        if (!root.children) return null;

        for (const child of root.children) {
          if (child.id === nodeId) return root;
          const found = findParentNode(child, nodeId);
          if (found) return found;
        }

        return null;
      },
      []
    );

    // Expose methods through ref
    useImperativeHandle(
      ref,
      () => ({
        expandAll: () => {
          setCollapsedNodes(new Set());
        },
        collapseAll: () => {
          const allFolderIds = getAllFolderIds(props.nodes);
          setCollapsedNodes(new Set(allFolderIds));
        },
        expandNode: (nodeId: string) => {
          setCollapsedNodes((prev) => {
            const next = new Set(prev);
            next.delete(nodeId);

            // Find parent node recursively in all nodes
            const findParent = (
              nodes: TreeNode[],
              nodeId: string
            ): TreeNode | null => {
              for (const node of nodes) {
                if (node.id === nodeId) return null; // Current node doesn't have a parent
                if (node.children) {
                  if (node.children.some((child) => child.id === nodeId)) {
                    return node; // Parent node found
                  }
                  const parent = findParent(node.children, nodeId);
                  if (parent) return parent; // Recursive call to find parent in nested nodes
                }
              }
              return null; // No parent found
            };

            // Find the parent node from the root (or root nodes)
            let parent = findParent(props.nodes, nodeId);
            while (parent) {
              next.delete(parent.id); // Remove parent from collapsed set
              parent = findParent(props.nodes, parent.id); // Continue up the tree
            }

            return next;
          });
        },

        collapseNode: (nodeId: string) => {
          setCollapsedNodes((prev) => {
            const next = new Set(prev);
            next.add(nodeId);
            return next;
          });
        },
      }),
      [props.nodes, getAllFolderIds, findParentNode]
    );

    // Recursive render function
    const renderNode = useCallback(
      (node: TreeNode, level: number = 0) => {
        const hasChildren = node.children && node.children.length > 0;
        const isSelected = props.selectedNodeIds.includes(node.id);
        const isFolder = node.name.endsWith("/");
        const isCollapsed = collapsedNodes.has(node.id);
        const isEditing = editingNodeId === node.id;

        const handleNodeClick = (e: React.MouseEvent) => {
          if (props.disabled) return;
          e.stopPropagation();
          props.onSelectNode?.(node.id, e.ctrlKey, e.shiftKey);
          if (isFolder && !e.ctrlKey && !e.shiftKey) {
            setCollapsedNodes((prev) => {
              const next = new Set(prev);
              if (isCollapsed) {
                next.delete(node.id);
              } else {
                next.add(node.id);
              }
              return next;
            });
          }
        };

        const handleEdit: MouseEventHandler<SVGSVGElement> = (e) => {
          if (props.disabled) return;
          e.stopPropagation();
          setEditingNodeId(isEditing ? null : node.id);
        };

        const saveEdit = (e: FocusEvent<HTMLInputElement>) => {
          let value = e.target.value;
          if (!isFolder && hasChildren) {
            value = value + "/";
          }
          props.onUpdate(node.id, value);
          setEditingNodeId(null);
        };

        return (
          <div
            key={node.id}
            className={`select-none ${props.disabled ? "opacity-50" : ""}`}
          >
            <div
              className={`flex items-center rounded px-2 py-1 cursor-pointer ${
                isSelected ? "bg-blue-200" : "hover:bg-gray-100"
              }`}
              style={{ paddingLeft: `${level * 16}px` }}
              onClick={handleNodeClick}
            >
              {isFolder ? (
                <>
                  {!isCollapsed ? (
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
                  className="h-6 mx-0"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                  onBlur={saveEdit}
                  defaultValue={node.name}
                />
              ) : (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="truncate flex-1">
                        {removeTrailingSlash(node.name)}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      {removeTrailingSlash(node.name)}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <SquarePen
                onClick={handleEdit}
                className="w-4 h-4 ml-auto text-gray-500 hover:text-blue-500"
              />
            </div>

            {hasChildren && !isCollapsed && (
              <div>
                {node.children!.map((child) => renderNode(child, level + 1))}
              </div>
            )}
          </div>
        );
      },
      [collapsedNodes, editingNodeId, props]
    );

    return props.nodes.map((node: TreeNode) => renderNode(node));
  }
);

const removeTrailingSlash = (str: string) => str.replace(/\/$/, "");

export default TreeNodeComponent;
