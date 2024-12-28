import { describe, it, expect } from "vitest";
import { TreeNode } from "@/typings";
import { generateAscii, isValidAsciiTree, parseAsciiTree } from "./ascii-tree";

describe("Tree ASCII Processing", () => {
  // 测试数据准备
  const sampleTree: TreeNode = {
    id: "1",
    name: "Root",
    children: [
      {
        id: "2",
        name: "Child1",
        children: [
          {
            id: "4",
            name: "Grandchild1",
            children: [],
          },
        ],
      },
      {
        id: "3",
        name: "Child2",
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
        children: [],
      };
      expect(generateAscii(singleNode).trim()).toBe("Single");
    });

    it("should handle deep nested structure", () => {
      const deepTree: TreeNode = {
        id: "1",
        name: "Root",
        children: [
          {
            id: "2",
            name: "Level1",
            children: [
              {
                id: "3",
                name: "Level2",
                children: [
                  {
                    id: "4",
                    name: "Level3",
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
  });
});
