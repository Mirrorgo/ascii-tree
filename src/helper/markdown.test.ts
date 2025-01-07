import { describe, it, expect } from "vitest";
import { TreeNode } from "@/typings";
import { markdownToTree, treeToMarkdown } from "./markdown";

describe("Markdown Tree Parser", () => {
  describe("markdownToTree", () => {
    it("should parse a simple single-node tree", () => {
      const markdown = "- Root/";
      const result = markdownToTree(markdown);

      expect(result.error).toBeNull();
      expect(result.tree).toMatchObject({
        name: "Root/",
        path: "Root/",
        children: [],
      });
      expect(result.tree?.id).toBeDefined();
    });

    it("should parse a tree with children", () => {
      const markdown = `- Root/
      - Child1/
      - Child2/
            - Grandchild/`;

      const result = markdownToTree(markdown);

      expect(result.error).toBeNull();
      expect(result.tree).toMatchObject({
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
      });
    });

    it("should maintain existing IDs when updating tree", () => {
      const markdown = "- Root/";
      const existingTree: TreeNode = {
        id: "existing-id",
        name: "OldRoot/",
        path: "Root/",
        children: [],
      };

      const result = markdownToTree(markdown, existingTree);

      expect(result.error).toBeNull();
      expect(result.tree).toMatchObject({
        id: "existing-id",
        name: "Root/",
        path: "Root/",
        children: [],
      });
    });

    describe("Error Handling", () => {
      it("should detect empty input", () => {
        const markdown = "";
        const result = markdownToTree(markdown);

        expect(result.tree).toBeNull();
        expect(result.error).toMatchObject({
          type: "Empty Tree",
          location: { line: 1, column: 1 },
        });
      });

      it("should detect invalid indentation", () => {
        const markdown = `- Root/
   - Invalid/`; // 3 spaces instead of 2

        const result = markdownToTree(markdown);

        expect(result.tree).toBeNull();
        expect(result.error).toMatchObject({
          type: "Invalid Indentation",
          location: { line: 2, column: 3 },
        });
      });

      it("should detect duplicate node names", () => {
        const markdown = `- Root/
      - Child/
      - Child/`; // Duplicate name

        const result = markdownToTree(markdown);

        expect(result.tree).toBeNull();
        expect(result.error).toMatchObject({
          type: "Duplicate Node Name",
          location: { line: 3 },
        });
      });

      it("should detect file nodes with children", () => {
        const markdown = `- Root/
      - file.txt
            - Invalid`; // File nodes cannot have children

        const result = markdownToTree(markdown);

        expect(result.tree).toBeNull();
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
        expect(result.tree).toMatchObject({
          name: "Root/",
          children: [
            {
              name: "Child/",
              children: [
                {
                  name: "file.txt",
                  children: [],
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

        expect(result.tree).toBeNull();
        expect(result.error).toMatchObject({
          type: "Missing Dash",
          location: { line: 2 },
        });
      });
    });
  });

  describe("treeToMarkdown", () => {
    it("should convert a simple tree to markdown", () => {
      const tree: TreeNode = {
        id: "1",
        name: "Root/",
        path: "Root/",
        children: [],
      };

      const markdown = treeToMarkdown(tree);
      expect(markdown).toBe("- Root/\n");
    });

    it("should convert a complex tree to markdown", () => {
      const tree: TreeNode = {
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
      };

      const expectedMarkdown = `- Root/
  - Child1/
  - Child2/
    - Grandchild/
`;

      const markdown = treeToMarkdown(tree);
      expect(markdown).toBe(expectedMarkdown);
    });

    it("should handle mixed folder and file nodes correctly", () => {
      const tree: TreeNode = {
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
      };

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
