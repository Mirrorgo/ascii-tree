import { describe, it, expect } from "vitest";
import { TreeNode } from "@/typings";
import { markdownToTree, treeToMarkdown } from "./markdown.ts";

describe("Markdown Tree Parser", () => {
  describe("markdownToTree", () => {
    it("should parse a simple single-node tree", () => {
      const markdown = "- Root/";
      const result = markdownToTree(markdown);

      expect(result.error).toBeNull();
      expect(result.tree[0]).toMatchObject({
        name: "Root/",
        path: "Root/",
        children: [],
      });
      expect(result.tree[0]?.id).toBeDefined();
    });

    it("should parse a tree with children", () => {
      const markdown = `- Root/
      - Child1/
      - Child2/
        - Grandchild/`;

      const result = markdownToTree(markdown);

      expect(result.error).toBeNull();
      expect(result.tree).toMatchObject([
        {
          name: "Root/",
          path: "Root/",
          children: [
            {
              name: "Child1/",
              path: "Root/Child1/",
              children: [],
            },
            {
              name: "Child2/",
              path: "Root/Child2/",
              children: [
                {
                  name: "Grandchild/",
                  path: "Root/Child2/Grandchild/",
                  children: [],
                },
              ],
            },
          ],
        },
      ]);
    });

    it("should maintain existing IDs when updating tree", () => {
      const markdown = "- Root/";
      const existingTree: TreeNode[] = [
        {
          id: "existing-id",
          name: "OldRoot/",
          path: "Root/",
          children: [],
        },
      ];

      const result = markdownToTree(markdown, existingTree);

      expect(result.error).toBeNull();
      expect(result.tree).toEqual([
        {
          id: "existing-id",
          name: "Root/",
          path: "Root/",
          children: [],
        },
      ]);
    });

    describe("Comment Handling", () => {
      it("should parse comments in file and folder nodes", () => {
        const markdown = `- Root/ # root folder
  - Child/ # child folder
    - file1.js # file1 comment
- index.js # top-level file
    `;

        const result = markdownToTree(markdown);

        expect(result.error).toBeNull(); // 确保解析没报错
        expect(result.tree).toMatchObject([
          {
            name: "Root/",
            comment: "root folder",
            children: [
              {
                name: "Child/",
                comment: "child folder",
                children: [
                  {
                    name: "file1.js",
                    comment: "file1 comment",
                  },
                ],
              },
            ],
          },
          {
            name: "index.js",
            comment: "top-level file",
          },
        ]);
      });

      it("should parse a nested structure with comments gracefully", () => {
        const markdown = `- src/ # the root folder for source code
  - components/ # UI components
    - button.tsx # reusable button component
    - modal.tsx # modal dialog component
  - utils/ # utility functions
    - helper.ts # helper function
- package.json # project configuration
- .gitignore # file for ignored content`;

        const result = markdownToTree(markdown);

        // 确保解析没有出错
        expect(result.error).toBeNull();

        // 验证解析后的节点树结构
        expect(result.tree).toMatchObject([
          {
            name: "src/",
            comment: "the root folder for source code",
            children: [
              {
                name: "components/",
                comment: "UI components",
                children: [
                  {
                    name: "button.tsx",
                    comment: "reusable button component",
                  },
                  {
                    name: "modal.tsx",
                    comment: "modal dialog component",
                  },
                ],
              },
              {
                name: "utils/",
                comment: "utility functions",
                children: [
                  {
                    name: "helper.ts",
                    comment: "helper function",
                  },
                ],
              },
            ],
          },
          {
            name: "package.json",
            comment: "project configuration",
          },
          {
            name: ".gitignore",
            comment: "file for ignored content",
          },
        ]);
      });

      it("should handle nodes without comment correctly", () => {
        const markdown = `- folder/
      - file.txt`;

        const result = markdownToTree(markdown);

        expect(result.error).toBeNull();
        expect(result.tree).toMatchObject([
          {
            name: "folder/",
            // 没有comment字段
            children: [
              {
                name: "file.txt",
              },
            ],
          },
        ]);
      });
    });

    describe("Error Handling", () => {
      it("should detect empty input", () => {
        const markdown = "";
        const result = markdownToTree(markdown);

        expect(result.tree).toEqual([]);
        expect(result.error).toMatchObject({
          content: "Empty line",
          location: {
            column: 1,
            line: 1,
          },
          type: "Empty Line",
        });
      });

      it("should detect invalid indentation", () => {
        const markdown = `- Root/
   - Invalid/`; // 3 spaces instead of 2

        const result = markdownToTree(markdown);

        expect(result.tree).toEqual([]);
        expect(result.error).toMatchObject({
          type: "Invalid Indentation",
          location: { line: 2, column: 3 },
        });
      });

      describe("Duplicate Node Name Detection", () => {
        it("should detect duplicate node names within a tree", () => {
          const markdown = `- Root/
            - Child/
            - Child/`; // Duplicate name

          const result = markdownToTree(markdown);

          expect(result.tree).toEqual([]);
          expect(result.error).toMatchObject({
            type: "Duplicate Node Name",
            location: { line: 3 },
          });
        });

        it("should detect multiple root nodes with duplicate names", () => {
          const markdown = `- Root/
- Root/`; // Duplicate root node name

          const result = markdownToTree(markdown);

          expect(result.tree).toEqual([]);
          expect(result.error).toMatchObject({
            type: "Duplicate Node Name",
            location: { line: 2 },
          });
        });
      });

      it("should detect file nodes with children", () => {
        const markdown = `- Root/
      - file.txt
            - Invalid`; // File nodes cannot have children

        const result = markdownToTree(markdown);

        expect(result.tree).toEqual([]);
        expect(result.error).toMatchObject({
          type: "Invalid File Node",
          location: { line: 2 },
        });
      });

      it("should handle file nodes correctly", () => {
        const markdown = `- Root/
  - Child/
        - file.txt`;

        const result = markdownToTree(markdown);
        expect(result.error).toBeNull();

        expect(result.tree[0]).toMatchObject({
          name: "Root/",
          children: [
            {
              name: "Child/",
              children: [
                {
                  name: "file.txt",
                },
              ],
            },
          ],
        });
      });

      it("should detect missing dash", () => {
        const markdown = `- Root/
  Invalid/`; // Missing dash

        const result = markdownToTree(markdown);

        expect(result.tree).toEqual([]);
        expect(result.error).toMatchObject({
          type: "Missing Dash",
          location: { line: 2 },
        });
      });
    });
  });

  describe("treeToMarkdown", () => {
    it("should convert a simple tree to markdown", () => {
      const tree: TreeNode[] = [
        {
          id: "1",
          name: "Root/",
          path: "Root/",
          children: [],
        },
      ];

      const markdown = treeToMarkdown(tree);
      expect(markdown).toBe("- Root/\n");
    });

    it("should convert a complex tree to markdown", () => {
      const tree: TreeNode[] = [
        {
          id: "1",
          name: "Root/",
          path: "Root/",
          children: [
            {
              id: "2",
              name: "Child1/",
              path: "Root/Child1/",
              children: [],
            },
            {
              id: "3",
              name: "Child2/",
              path: "Root/Child2/",
              children: [
                {
                  id: "4",
                  name: "Grandchild/",
                  path: "Root/Child2/Grandchild/",
                  children: [],
                },
              ],
            },
          ],
        },
      ];

      const expectedMarkdown = `- Root/
  - Child1/
  - Child2/
    - Grandchild/
`;

      const markdown = treeToMarkdown(tree);
      expect(markdown).toBe(expectedMarkdown);
    });

    it("should handle mixed folder and file nodes correctly", () => {
      const tree: TreeNode[] = [
        {
          id: "1",
          name: "Root/",
          path: "Root/",
          children: [
            {
              id: "2",
              name: "Folder/",
              path: "Root/Folder/",
              children: [
                {
                  id: "3",
                  name: "file.txt",
                  path: "Root/Folder/file.txt",
                  children: [],
                },
              ],
            },
          ],
        },
      ];

      const expectedMarkdown = `- Root/
  - Folder/
    - file.txt
`;

      const markdown = treeToMarkdown(tree);
      expect(markdown).toBe(expectedMarkdown);
    });
  });

  describe("Round Trip", () => {
    it("should maintain tree structure when converting back and forth", () => {
      const originalMarkdown = `- Root/
  - Child1/
  - Child2/
    - file.txt
`;

      const result = markdownToTree(originalMarkdown);
      expect(result.error).toBeNull();

      const convertedBack = treeToMarkdown(result.tree!);
      expect(convertedBack).toBe(originalMarkdown);
    });
  });
});
