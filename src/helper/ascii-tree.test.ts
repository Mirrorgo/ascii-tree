import { describe, it, expect } from "vitest";
import { TreeNode } from "@/typings";
import { generateAscii, isValidAsciiTree, parseAsciiTree } from "./ascii-tree";

describe("Tree ASCII Processing", () => {
  const sampleTree: TreeNode[] = [
    {
      id: "1",
      name: "Root/",
      path: "Root/",
      children: [
        {
          id: "2",
          name: "Child1/",
          path: "Root/Child1/",
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
    },
  ];

  const expectedAscii = `Root/
├── Child1/
│   └── Grandchild1
└── Child2`;

  describe("generateAscii", () => {
    it("should generate correct ASCII tree for a simple tree", () => {
      const result = generateAscii(sampleTree);
      expect(result.trim()).toBe(expectedAscii);
    });

    it("should handle single node tree", () => {
      const singleNode: TreeNode[] = [
        {
          id: "1",
          name: "Single",
          path: "Single",
          children: [],
        },
      ];
      expect(generateAscii(singleNode).trim()).toBe("Single");
    });

    it("should handle deep nested structure", () => {
      const deepTree: TreeNode[] = [
        {
          id: "1",
          name: "Root/",
          path: "Root/",
          children: [
            {
              id: "2",
              name: "Level1/",
              path: "Root/Level1/",
              children: [
                {
                  id: "3",
                  name: "Level2/",
                  path: "Root/Level1/Level2/",
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
        },
      ];
      const expected = `Root/
└── Level1/
    └── Level2/
        └── Level3`;
      expect(generateAscii(deepTree).trim()).toBe(expected);
    });
  });

  describe("parseAsciiTree", () => {
    it("should parse ASCII tree back to TreeNode structure", () => {
      const parsed = parseAsciiTree(expectedAscii)[0];
      expect(parsed.name).toBe("Root/");
      expect(parsed.children?.length).toBe(2);
      expect(parsed.children?.[0].name).toBe("Child1/");
      expect(parsed.children?.[1].name).toBe("Child2");
      expect(parsed.children?.[0].children?.[0].name).toBe("Grandchild1");
    });

    it("should automatically add slash to folders with children", () => {
      const asciiTree = `Root
├── Folder1
│   └── file1.txt
└── file2.txt`;

      const parsed = parseAsciiTree(asciiTree)[0];
      expect(parsed.name).toBe("Root/"); // 有子节点，添加/
      expect(parsed.children?.[0].name).toBe("Folder1/"); // 有子节点，添加/
      expect(parsed.children?.[0].children?.[0].name).toBe("file1.txt"); // 无子节点，不添加/
      expect(parsed.children?.[1].name).toBe("file2.txt"); // 无子节点，不添加/
    });

    it("should preserve existing slashes in folder names", () => {
      const asciiTree = `root/
    ├── folder1/
    │   └── file1.txt
    └── folder2/
        └── file2.txt`;

      const parsed = parseAsciiTree(asciiTree)[0];
      expect(parsed.name).toBe("root/");
      expect(parsed.children?.[0].name).toBe("folder1/");
      expect(parsed.children?.[1].name).toBe("folder2/");
    });

    it("should handle mixed cases with and without trailing slashes", () => {
      const asciiTree = `project
    ├── src/
    │   ├── components
    │   │   └── Button.tsx
    │   └── index.ts
    └── package.json`;
      const parsed = parseAsciiTree(asciiTree)[0];
      expect(parsed.name).toBe("project/"); // 添加/因为有子节点
      expect(parsed.children?.[0].name).toBe("src/"); // 保持已有的/
      expect(parsed.children?.[0].children?.[0].name).toBe("components/"); // 添加/因为有子节点
      expect(parsed.children?.[0].children?.[0].children?.[0].name).toBe(
        "Button.tsx"
      ); // 不添加/
      expect(parsed.children?.[0].children?.[1].name).toBe("index.ts"); // 不添加/
      expect(parsed.children?.[1].name).toBe("package.json"); // 不添加/
    });

    it("should handle single node ASCII tree", () => {
      const parsed = parseAsciiTree("SingleNode")[0];
      expect(parsed.name).toBe("SingleNode");
      expect(parsed.children).toBeUndefined();
    });

    it("should preserve empty children array", () => {
      const parsed = parseAsciiTree("Root\n└── Leaf")[0];
      expect(parsed.children?.[0].children).toBeUndefined();
    });

    it("should correctly parse paths for nested folders", () => {
      const asciiTree = `root/
├── folder1/
│   ├── subfolder/
│   │   └── file1
│   └── file2
└── folder2/`;

      const parsed = parseAsciiTree(asciiTree)[0];
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

      const parsed = parseAsciiTree(asciiTree)[0];
      expect(parsed.children?.length).toBe(2);
      expect(parsed.children?.[0].name).toBe("src/");
      expect(parsed.children?.[0].children?.[0].name).toBe("index.ts");
      expect(parsed.children?.[1].name).toBe("package.json");
      expect(parsed.children?.[1].children).toBeUndefined();
    });

    it("should maintain folder indicators (/)", () => {
      const asciiTree = `root/
└── folder/`;

      const parsed = parseAsciiTree(asciiTree)[0];
      expect(parsed.name.endsWith("/")).toBe(true);
      expect(parsed.children?.[0].name.endsWith("/")).toBe(true);
    });
  });

  describe("isValidAsciiTree", () => {
    it("should validate correct ASCII tree format", () => {
      expect(isValidAsciiTree(expectedAscii).valid).toBe(true);
    });

    it("should validate single node tree", () => {
      expect(isValidAsciiTree("SingleNode").valid).toBe(true);
    });

    it("should reject empty string", () => {
      const result = isValidAsciiTree("");
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        location: {
          column: 0,
          line: 0,
        },
        type: "emptyLine",
      });
    });

    it("should reject invalid tree format", () => {
      const result = isValidAsciiTree("├── Invalid Root");
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          location: {
            column: 1,
            line: 1,
          },
          type: "orphanNode",
        })
      );
    });

    it("should reject malformed branch symbols", () => {
      const invalidTree = `Root
├─── Invalid
└── Valid`;
      const result = isValidAsciiTree(invalidTree);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          type: "invalidBranchSymbol",
          location: {
            column: 1,
            line: 2,
          },
        })
      );
    });

    it("should handle multiple levels correctly", () => {
      const validTree = `Root
├── Level1A
│   ├── Level2A
│   └── Level2B
└── Level1B
    └── Level2C`;
      expect(isValidAsciiTree(validTree).valid).toBe(true);
    });

    it("should reject ASCII tree with duplicate sibling names at the same level", () => {
      const invalidTree = `root/
├── file1
├── file1
└── file1`;
      const result = isValidAsciiTree(invalidTree);

      // Check that the tree is invalid
      expect(result.valid).toBe(false);

      // Ensure the correct number of errors
      expect(result.errors.length).toBe(2);

      // Check for the specific errors
      expect(result.errors[0]).toEqual(
        expect.objectContaining({
          type: "duplicateNodeName",
          location: {
            column: 1,
            line: 3,
          },
        })
      );

      expect(result.errors[1]).toEqual(
        expect.objectContaining({
          type: "duplicateNodeName",
          location: {
            column: 1,
            line: 4,
          },
        })
      );
    });

    it("should reject ASCII tree with duplicate root nodes", () => {
      const asciiTree = `root/
└── file1
root/
└── file2`;
      const result = isValidAsciiTree(asciiTree);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          location: {
            column: 1,
            line: 3,
          },
          type: "duplicateNodeName",
        })
      );
    });

    it("should accept same node names under different parents", () => {
      const asciiTree = `root/
├── parent1/
│   └── child
└── parent2/
    └── child`;
      expect(isValidAsciiTree(asciiTree).valid).toBe(true);
    });

    it("should validate multiple root nodes correctly", () => {
      const asciiTree = `Root1/
├── Child1
└── Child2
Root2/
├── ChildA/
│   └── GrandchildA
└── ChildB`;
      expect(isValidAsciiTree(asciiTree).valid).toBe(true);
    });
  });
  describe("Path Generation", () => {
    it("should handle deep nesting with consistent paths", () => {
      const asciiTree = `root/
└── level1/
    └── level2/
        └── level3/
            └── file.txt`;

      const parsed = parseAsciiTree(asciiTree)[0];
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

      const parsed = parseAsciiTree(asciiTree)[0];
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

      const parsed = parseAsciiTree(asciiTree)[0];
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
  describe("Comment Handling", () => {
    it("should parse comments correctly", () => {
      const asciiTree = `root/
├── file1  # this is a file
└── folder/  # this is a folder`;

      const parsed = parseAsciiTree(asciiTree)[0];

      expect(parsed.name).toBe("root/");
      expect(parsed.children?.[0].name).toBe("file1");
      expect(parsed.children?.[0].comment).toBe("this is a file");
      expect(parsed.children?.[1].name).toBe("folder/");
      expect(parsed.children?.[1].comment).toBe("this is a folder");
    });

    it("should preserve comments when generating ASCII tree", () => {
      const tree: TreeNode[] = [
        {
          id: "1",
          name: "root/",
          path: "root/",
          children: [
            {
              id: "2",
              name: "file1",
              path: "root/file1",
              comment: "this is a file",
              children: [],
            },
            {
              id: "3",
              name: "folder/",
              path: "root/folder/",
              comment: "this is a folder",
              children: [],
            },
          ],
        },
      ];

      const expectedAscii = `root/
├── file1  # this is a file
└── folder/  # this is a folder`;

      expect(generateAscii(tree).trim()).toBe(expectedAscii);
    });

    it("should handle nodes with missing comments", () => {
      const asciiTree = `root/
├── file1  # file comment
├── file2
└── folder/`;

      const parsed = parseAsciiTree(asciiTree)[0];

      expect(parsed.children?.[0].comment).toBe("file comment");
      expect(parsed.children?.[1].comment).toBeUndefined();
      expect(parsed.children?.[2].comment).toBeUndefined();
    });

    it("should parse deeply nested nodes with comments", () => {
      const asciiTree = `root/
└── folder/
    ├── file1  # comment1
    └── subfolder/  # comment2
        └── file2  # comment3`;

      const parsed = parseAsciiTree(asciiTree)[0];

      expect(parsed.children?.[0].name).toBe("folder/");
      expect(parsed.children?.[0].children?.[0].comment).toBe("comment1");
      expect(parsed.children?.[0].children?.[1].comment).toBe("comment2");
      expect(parsed.children?.[0].children?.[1].children?.[0].comment).toBe(
        "comment3"
      );
    });

    it("should ignore # inside node names and not treat it as a comment", () => {
      const asciiTree = `root/
├── file#1
└── folder/#subfolder`;

      const parsed = parseAsciiTree(asciiTree)[0];

      expect(parsed.children?.[0].name).toBe("file");
      expect(parsed.children?.[0].comment).toBe("1");

      expect(parsed.children?.[1].name).toBe("folder/");
      expect(parsed.children?.[1].comment).toBe("subfolder");
    });

    it("should validate ASCII tree with malformed comments", () => {
      const invalidTree = `root/
└── file1#missing space after #`;

      const result = isValidAsciiTree(invalidTree);
      expect(result.valid).toBe(true); // 允许注释缺少空格，但不解析为 comment
      const parsed = parseAsciiTree(invalidTree)[0];

      expect(parsed.children?.[0].name).toBe("file1");
      expect(parsed.children?.[0].comment).toBe("missing space after #");
    });
  });
});
