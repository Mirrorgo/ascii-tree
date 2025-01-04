import { describe, it, expect } from "vitest";
import { TreeNode } from "@/typings";
import { generateAscii, isValidAsciiTree, parseAsciiTree } from "./ascii-tree";

describe("Tree ASCII Processing", () => {
  // 测试数据准备
  const sampleTree: TreeNode = {
    id: "1",
    name: "Root",
    path: "Root",
    children: [
      {
        id: "2",
        name: "Child1",
        path: "Root/Child1",
        children: [
          {
            id: "4",
            name: "Grandchild1",
            path: "Root/Child1/Grandchild1",
            children: [],
          },
        ],
      },
      {
        id: "3",
        name: "Child2",
        path: "Root/Child2",
        children: [],
      },
    ],
  };

  const expectedAscii = `Root
├── Child1
│   └── Grandchild1
└── Child2`;

  describe("generateAscii", () => {
    it("should generate correct ASCII tree for a simple tree", () => {
      const result = generateAscii(sampleTree);
      expect(result.trim()).toBe(expectedAscii);
    });

    it("should handle single node tree", () => {
      const singleNode: TreeNode = {
        id: "1",
        name: "Single",
        path: "Single",
        children: [],
      };
      expect(generateAscii(singleNode).trim()).toBe("Single");
    });

    it("should handle deep nested structure", () => {
      const deepTree: TreeNode = {
        id: "1",
        name: "Root",
        path: "Root",
        children: [
          {
            id: "2",
            name: "Level1",
            path: "Root/Level1",
            children: [
              {
                id: "3",
                name: "Level2",
                path: "Root/Level1/Level2",
                children: [
                  {
                    id: "4",
                    name: "Level3",
                    path: "Root/Level1/Level2/Level3",
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      };
      const expected = `Root
└── Level1
    └── Level2
        └── Level3`;
      expect(generateAscii(deepTree).trim()).toBe(expected);
    });
  });

  describe("parseAsciiTree", () => {
    it("should parse ASCII tree back to TreeNode structure", () => {
      const parsed = parseAsciiTree(expectedAscii);
      // 由于 id 是动态生成的，我们只比较结构和名称
      expect(parsed.name).toBe("Root");
      expect(parsed.children?.length).toBe(2);
      expect(parsed.children?.[0].name).toBe("Child1");
      expect(parsed.children?.[1].name).toBe("Child2");
      expect(parsed.children?.[0].children?.[0].name).toBe("Grandchild1");
    });

    it("should handle single node ASCII tree", () => {
      const parsed = parseAsciiTree("SingleNode");
      expect(parsed.name).toBe("SingleNode");
      expect(parsed.children?.length).toBe(0);
    });

    it("should preserve empty children array", () => {
      const parsed = parseAsciiTree("Root\n└── Leaf");
      expect(parsed.children?.[0].children).toEqual([]);
    });

    it("should correctly parse paths for nested folders", () => {
      const asciiTree = `root/
  ├── folder1/
  │   ├── subfolder/
  │   │   └── file1
  │   └── file2
  └── folder2/`;

      const parsed = parseAsciiTree(asciiTree);
      expect(parsed.path).toBe("root/");
      expect(parsed.children?.[0].path).toBe("root/folder1/");
      expect(parsed.children?.[0].children?.[0].path).toBe(
        "root/folder1/subfolder/"
      );
      expect(parsed.children?.[0].children?.[0].children?.[0].path).toBe(
        "root/folder1/subfolder/file1"
      );
    });

    it("should handle mixed files and folders", () => {
      const asciiTree = `project/
  ├── src/
  │   ├── index.ts
  │   └── types/
  └── package.json`;

      const parsed = parseAsciiTree(asciiTree);
      expect(parsed.children?.length).toBe(2);
      expect(parsed.children?.[0].name).toBe("src/");
      expect(parsed.children?.[0].children?.[0].name).toBe("index.ts");
      expect(parsed.children?.[1].name).toBe("package.json");
      expect(parsed.children?.[1].children?.length).toBe(0);
    });

    it("should maintain folder indicators (/)", () => {
      const asciiTree = `root/
  └── folder/`;

      const parsed = parseAsciiTree(asciiTree);
      expect(parsed.name.endsWith("/")).toBe(true);
      expect(parsed.children?.[0].name.endsWith("/")).toBe(true);
    });
  });

  describe("isValidAsciiTree", () => {
    it("should validate correct ASCII tree format", () => {
      expect(isValidAsciiTree(expectedAscii)).toBe(true);
    });

    it("should validate single node tree", () => {
      expect(isValidAsciiTree("SingleNode")).toBe(true);
    });

    it("should reject empty string", () => {
      expect(isValidAsciiTree("")).toBe(false);
    });

    it("should reject invalid tree format", () => {
      expect(isValidAsciiTree("├── Invalid Root")).toBe(false);
    });

    it("should reject malformed branch symbols", () => {
      const invalidTree = `Root
├─── Invalid
└── Valid`;
      expect(isValidAsciiTree(invalidTree)).toBe(false);
    });

    it("should handle multiple levels correctly", () => {
      const validTree = `Root
├── Level1A
│   ├── Level2A
│   └── Level2B
└── Level1B
    └── Level2C`;
      expect(isValidAsciiTree(validTree)).toBe(true);
    });

    it("should reject ASCII tree with duplicate sibling names", () => {
      const asciiTree = `root/
├── file1
├── file1
└── file1`;

      expect(isValidAsciiTree(asciiTree)).toBe(false);
    });
  });
  describe("Path Generation", () => {
    it("should handle deep nesting with consistent paths", () => {
      const asciiTree = `root/
└── level1/
    └── level2/
        └── level3/
            └── file.txt`;

      const parsed = parseAsciiTree(asciiTree);
      const deepestFile =
        parsed.children?.[0].children?.[0].children?.[0].children?.[0];
      expect(deepestFile?.path).toBe("root/level1/level2/level3/file.txt");
    });
  });

  describe("Edge Cases", () => {
    it("should handle trees with special characters in names", () => {
      const asciiTree = `root/
├── file-with-dashes
├── file_with_underscores
└── file with spaces`;

      const parsed = parseAsciiTree(asciiTree);
      expect(parsed.children?.length).toBe(3);
      expect(parsed.children?.map((c) => c.name)).toContain("file-with-dashes");
      expect(parsed.children?.map((c) => c.name)).toContain(
        "file_with_underscores"
      );
      expect(parsed.children?.map((c) => c.name)).toContain("file with spaces");
    });

    it("should handle empty folders", () => {
      const asciiTree = `root/
├── empty-folder/
└── another-empty/`;

      const parsed = parseAsciiTree(asciiTree);
      expect(parsed.children?.length).toBe(2);
      expect(
        parsed.children?.every(
          (child) =>
            child.name.endsWith("/") &&
            (!child.children || child.children.length === 0)
        )
      ).toBe(true);
    });
  });
});
