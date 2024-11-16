import { MouseEventHandler, useState } from "react";
import { Button } from "./components/ui/button";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  SquarePen,
} from "lucide-react";

type Tree = {
  name: string;
  children?: Tree[];
};

function App() {
  const [fileTree, setFileTree] = useState<Tree>({
    name: "root",
    children: [
      {
        name: "folder1",
        children: [
          {
            name: "file1",
          },
          {
            name: "file2",
          },
        ],
      },
      {
        name: "folder2",
        children: [
          {
            name: "file3",
          },
          {
            name: "file4",
          },
        ],
      },
    ],
  });
  return (
    <>
      <div className="h-screen flex flex-col">
        <div className="w-screen border-b p-2">
          <div className="flex justify-between items-center">
            <div className="font-bold text-xl">
              ASCII folder structure diagrams
            </div>
            <Button className="ml-auto">copy</Button>
          </div>
          <div className="flex gap-2">
            <Button size="sm">+ new folder</Button>
            <Button size="sm">+ new file</Button>
            {/* tool bar */}
            <Button variant="link">undo</Button>
            <Button variant="link">redo</Button>
          </div>
        </div>
        <div className="flex flex-1 gap-2">
          <div className="w-64 border-r p-2">
            <TreeNode node={fileTree} />
          </div>
          <div className="flex-1 p-2">right</div>
        </div>
      </div>
    </>
  );
}

export default App;

// 递归的树节点组件
const TreeNode = ({ node, level = 0 }: { node: Tree; level?: number }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const hasChildren = node.children && node.children.length > 0;
  const handleEdit: MouseEventHandler<SVGSVGElement> = (e) => {
    e.stopPropagation();
    console.log("wow");
  };
  return (
    <div className="select-none">
      <div
        className={`flex items-center hover:bg-gray-100 rounded px-2 py-1 cursor-pointer`}
        style={{ paddingLeft: `${level * 16}px` }}
        onClick={() => setIsOpen(!isOpen)}
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
        {isEditing ? <span>{node.name}</span> : <span>{node.name}</span>}
        <SquarePen
          onClick={handleEdit}
          className="w-4 h-4 ml-auto text-gray-500 hover:text-blue-500"
        />
      </div>

      {hasChildren && isOpen && (
        <div>
          {node.children?.map((child, index) => (
            <TreeNode
              key={`${child.name}-${index}`}
              node={child}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};
