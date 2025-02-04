import {
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  SquarePen,
} from "lucide-react";
import { useState, forwardRef, useImperativeHandle, useCallback } from "react";
import { TreeNode } from "@/typings";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../ui/tooltip";
import { TooltipArrow } from "@radix-ui/react-tooltip";
import { NodeEditPopover } from "./node-edit-popover";
import { removeTrailingSlash } from "@/helper/global";

export interface ExplorerPanelRef {
  expandAll: () => void;
  collapseAll: () => void;
  expandNode: (nodeId: string) => void;
  collapseNode: (nodeId: string) => void;
}

interface ExplorerPanelProps {
  nodes: TreeNode[];
  level?: number;
  selectedNodeIds: string[];
  editingNode: TreeNode | null;
  setEditingNode: (node: TreeNode | null) => void;
  onSelectNode: (
    id: string | null,
    ctrlKey: boolean,
    shiftKey: boolean
  ) => void;
  disabled?: boolean;
  onRemoveTempNode: (id: string) => void;
  onUpdateNode: (id: string, updates: Partial<TreeNode>) => void;
}

const ExplorerPanel = forwardRef<ExplorerPanelRef, ExplorerPanelProps>(
  (props, ref) => {
    const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(
      new Set()
    );

    const getAllFolderIds = useCallback((nodes: TreeNode[]): string[] => {
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

    const renderNode = useCallback(
      (node: TreeNode, level: number = 0) => {
        const hasChildren = node.children && node.children.length > 0;
        const isSelected = props.selectedNodeIds.includes(node.id);
        const isFolder = node.name.endsWith("/");
        const isCollapsed = collapsedNodes.has(node.id);

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
        const displayName = removeTrailingSlash(node.name);

        const editButton = (
          <button
            type="button"
            className="ml-auto text-gray-500 hover:text-blue-500"
            onClick={(e) => {
              e.stopPropagation();
              props.setEditingNode(node);
              props.onSelectNode?.(node.id, false, false);
            }}
          >
            <SquarePen className="w-4 h-4" />
          </button>
        );
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
              {/* 名称 + comment 的展示，可配合 Tooltip */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="truncate space-x-2 flex-1">
                      <span>{displayName}</span>
                      {node.comment && (
                        <span className="text-gray-400">{node.comment}</span>
                      )}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <span className="space-x-2">
                      <span>{displayName}</span>
                      {node.comment !== undefined && node.comment !== "" && (
                        <span className="text-green-500">{node.comment}</span>
                      )}
                    </span>
                    <TooltipArrow />
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {props.editingNode?.id === node.id ? (
                <NodeEditPopover
                  open={props.editingNode !== null}
                  setOpen={(nextOpen: boolean, action?: "cancel" | "save") => {
                    if (!nextOpen) {
                      if (action === "cancel" && node.isTemp) {
                        props.onRemoveTempNode(node.id);
                        props.onSelectNode?.(null, false, false);
                      }
                      props.setEditingNode(null);
                    } else {
                      props.setEditingNode(node);
                    }
                  }}
                  defaultName={removeTrailingSlash(node.name)}
                  defaultIsFolder={node.name.endsWith("/")}
                  defaultComment={node.comment ?? ""}
                  onConfirm={({ name, comment }) => {
                    props.onUpdateNode(node.id, {
                      name,
                      comment,
                      isTemp: false,
                    });
                  }}
                  // 直接把编辑按钮作为 anchor 传入
                  anchor={editButton}
                />
              ) : (
                // 未编辑状态下正常显示编辑按钮
                editButton
              )}
            </div>
            {hasChildren && !isCollapsed && (
              <div>
                {node.children!.map((child) => renderNode(child, level + 1))}
              </div>
            )}
          </div>
        );
      },
      [collapsedNodes, props]
    );

    return props.nodes.map((node: TreeNode) => renderNode(node));
  }
);

export default ExplorerPanel;
