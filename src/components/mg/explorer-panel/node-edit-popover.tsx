import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { ReactElement, useRef } from "react";
import { PopoverProps } from "@radix-ui/react-popover";

interface NodeEditPopoverProps extends PopoverProps {
  defaultName: string;
  defaultComment?: string;
  defaultIsFolder: boolean;
  open: boolean; // 必须由外部传入
  anchor: ReactElement | null; // 父组件传进来的定位元素
  setOpen: (open: boolean, action?: "save" | "cancel") => void; // 必须由外部传入
  onConfirm: (values: { name: string; comment: string }) => void;
}

export function NodeEditPopover({
  anchor,
  defaultName,
  defaultComment,
  defaultIsFolder,
  onConfirm,
  open,
  setOpen,
  ...popoverProps
}: NodeEditPopoverProps) {
  const nameRef = useRef<HTMLInputElement>(null);
  const commentRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLButtonElement>(null);

  const handleSave = () => {
    const isFolder =
      folderRef.current?.getAttribute("data-state") === "checked";
    const rawName = nameRef.current?.value ?? "";
    const comment = commentRef.current?.value ?? "";

    let newNodeName = rawName;
    if (!rawName.endsWith("/") && isFolder) {
      newNodeName = rawName + "/";
    } else if (rawName.endsWith("/") && !isFolder) {
      newNodeName = rawName.slice(0, -1);
    }

    onConfirm({ name: newNodeName, comment });
    setOpen(false, "save");
  };

  const handleCancel = () => {
    setOpen(false, "cancel");
  };
  return (
    <Popover open={open} onOpenChange={setOpen} {...popoverProps}>
      <PopoverAnchor asChild>{anchor}</PopoverAnchor>
      <PopoverContent
        className="w-72 p-4 space-y-4"
        align="end"
        onClick={(e) => e.stopPropagation()}
        onInteractOutside={handleCancel}
      >
        <div className="space-y-2">
          <div className="grid gap-2">
            <div className="grid grid-cols-3 items-center gap-2 h-8">
              <Label htmlFor="node-name">Name</Label>
              <Input
                id="node-name"
                defaultValue={defaultName}
                ref={nameRef}
                className="col-span-2 h-8"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-2 h-8">
              <Label htmlFor="node-comment">Comment</Label>
              <Input
                id="node-comment"
                defaultValue={defaultComment ?? ""}
                ref={commentRef}
                className="col-span-2 h-8"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-2 h-8">
              <Label htmlFor="node-is-folder">Is Folder</Label>
              <Switch
                ref={folderRef}
                id="node-is-folder"
                defaultChecked={defaultIsFolder}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={handleCancel}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave}>
            Save
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
