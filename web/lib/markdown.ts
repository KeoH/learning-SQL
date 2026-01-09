import fs from "fs";
import path from "path";

const CONVERSATIONS_DIR = path.join(process.cwd(), "..", "conversations");

export interface Session {
  id: string;
  name: string;
  timestamp: number;
}

export interface Message {
  type: "query" | "result" | "error" | "note" | "saved-query";
  content: string;
}

const PAGE_BREAK_MARKER = "## Page Break";
const MESSAGES_PER_PAGE = 20;

// Function to ensure conversations directory exists
const ensureDir = () => {
  if (!fs.existsSync(CONVERSATIONS_DIR)) {
    fs.mkdirSync(CONVERSATIONS_DIR, { recursive: true });
  }
};

export const getSessions = (): Session[] => {
  ensureDir();
  const files = fs.readdirSync(CONVERSATIONS_DIR);
  return files
    .filter((file) => file.endsWith(".md") && !file.startsWith("_"))
    .map((file) => {
      const filePath = path.join(CONVERSATIONS_DIR, file);
      const stats = fs.statSync(filePath);
      const content = fs.readFileSync(filePath, "utf-8");
      const firstLine = content.split("\n")[0];
      const title = firstLine.startsWith("# ")
        ? firstLine.substring(2)
        : file.replace(".md", "");

      return {
        id: file.replace(".md", ""),
        name: title,
        timestamp: stats.mtimeMs,
      };
    })
    .sort((a, b) => b.timestamp - a.timestamp);
};

export const getSessionDatabase = (id: string): string => {
  ensureDir();
  const filePath = path.join(CONVERSATIONS_DIR, `${id}.md`);
  if (!fs.existsSync(filePath)) {
    return "learning_db";
  }
  const content = fs.readFileSync(filePath, "utf-8");
  const match = content.match(/<!-- database: (.*?) -->/);
  return match ? match[1] : "learning_db";
};

export const getSessionContent = (id: string): string => {
  ensureDir();
  const filePath = path.join(CONVERSATIONS_DIR, `${id}.md`);
  if (!fs.existsSync(filePath)) {
    return "";
  }
  return fs.readFileSync(filePath, "utf-8");
};

export const createSession = (
  name: string,
  database: string = "learning_db"
): string => {
  ensureDir();
  // Sanitize name to be a valid filename
  const safeName = name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  const id = `${Date.now()}_${safeName}`;
  const filePath = path.join(CONVERSATIONS_DIR, `${id}.md`);
  fs.writeFileSync(filePath, `# ${name}\n<!-- database: ${database} -->\n\n`);
  return id;
};

export const appendToSession = (
  id: string,
  type: "query" | "result" | "error" | "note" | "mermaid",
  content: string
) => {
  ensureDir();
  const filePath = path.join(CONVERSATIONS_DIR, `${id}.md`);

  let markdown = "";
  if (type === "query") {
    // Check if we should insert a page break
    const currentContent = fs.readFileSync(filePath, "utf-8");
    // Count how many blocks since last Page Break
    const lastPageBreakIndex = currentContent.lastIndexOf(PAGE_BREAK_MARKER);
    const contentAfterLastBreak =
      lastPageBreakIndex !== -1
        ? currentContent.substring(lastPageBreakIndex)
        : currentContent;

    const messagesInCurrentPage = contentAfterLastBreak
      .split(/^## /gm)
      .filter((b) => {
        const t = b.trim();
        return (
          t &&
          (t.startsWith("Query") ||
            t.startsWith("Result") ||
            t.startsWith("Error") ||
            t.startsWith("Note") ||
            t.startsWith("Diagram") ||
            t.startsWith("Saved Query"))
        );
      }).length;

    if (messagesInCurrentPage >= MESSAGES_PER_PAGE) {
      markdown += `\n${PAGE_BREAK_MARKER}\n`;
    }

    markdown += `\n## Query\n\`\`\`sql\n${content}\n\`\`\`\n`;
  } else if (type === "result") {
    // Content is expected to be a markdown table string already, or we format it here?
    // Let's assume the API formats it to markdown table or code block before calling this.
    // For now, let's treat it as generic markdown block if not formatted.
    markdown = `\n## Result\n${content}\n`;
  } else if (type === "error") {
    markdown = `\n## Error\n\`\`\`\n${content}\n\`\`\`\n`;
  } else if (type === "note") {
    markdown = `\n## Note\n${content}\n`;
  } else if (type === "mermaid") {
    markdown = `\n## Diagram\n${content}\n`;
  } else if (type === "saved-query") {
    // Format: ## Saved Query: Name\n```sql\nSQL\n```
    markdown = `\n## Saved Query\n${content}\n`;
  }

  fs.appendFileSync(filePath, markdown);
};

export const deleteSession = (id: string) => {
  ensureDir();
  const filePath = path.join(CONVERSATIONS_DIR, `${id}.md`);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

export const updateSessionTitle = (id: string, newTitle: string) => {
  ensureDir();
  const filePath = path.join(CONVERSATIONS_DIR, `${id}.md`);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    // Replace first line if it's a header, or prepend new header
    if (lines[0].startsWith("# ")) {
      lines[0] = `# ${newTitle}`;
    } else {
      lines.unshift(`# ${newTitle}`, "");
    }

    fs.writeFileSync(filePath, lines.join("\n"));
  }
};

export const updateSessionNote = (
  id: string,
  index: number,
  newContent: string
) => {
  ensureDir();
  const filePath = path.join(CONVERSATIONS_DIR, `${id}.md`);
  if (!fs.existsSync(filePath)) {
    throw new Error("Session not found");
  }

  const content = fs.readFileSync(filePath, "utf-8");
  // Use same splitting logic as frontend to ensure index alignment
  const parts = content.split(/^## /gm);

  // Find valid parts (non-empty) to map index
  const validIndices: number[] = [];
  parts.forEach((part, idx) => {
    const trimmed = part.trim();
    if (!trimmed) return;

    // Match logic with frontend: only count blocks that start with known types
    if (
      trimmed.startsWith("Query") ||
      trimmed.startsWith("Result") ||
      trimmed.startsWith("Error") ||
      trimmed.startsWith("Note") ||
      trimmed.startsWith("Diagram") ||
      trimmed.startsWith("Saved Query") ||
      trimmed.startsWith("Page Break")
    ) {
      validIndices.push(idx);
    }
  });

  if (index < 0 || index >= validIndices.length) {
    throw new Error("Message index out of bounds");
  }

  const realIndex = validIndices[index];
  const targetPart = parts[realIndex];

  if (targetPart.startsWith("Page Break")) {
    throw new Error("Cannot edit a page break");
  }

  if (
    !targetPart.startsWith("Note") &&
    !targetPart.startsWith("Diagram") &&
    !targetPart.startsWith("Saved Query")
  ) {
    throw new Error("Target message is not a note, diagram or saved query");
  }

  // Replace content: keep header prefix, replace rest
  let header = "Note";
  if (targetPart.startsWith("Diagram")) header = "Diagram";
  if (targetPart.startsWith("Saved Query")) header = "Saved Query";

  parts[realIndex] = `${header}\n${newContent}\n`;

  const newFileContent = parts.join("## ");
  fs.writeFileSync(filePath, newFileContent);
};

export const deleteSessionNote = (id: string, index: number) => {
  ensureDir();
  const filePath = path.join(CONVERSATIONS_DIR, `${id}.md`);
  if (!fs.existsSync(filePath)) {
    throw new Error("Session not found");
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const parts = content.split(/^## /gm);

  // Valid indices logic similar to update
  const validIndices: number[] = [];
  parts.forEach((part, idx) => {
    const trimmed = part.trim();
    if (!trimmed) return;
    if (
      trimmed.startsWith("Query") ||
      trimmed.startsWith("Result") ||
      trimmed.startsWith("Error") ||
      trimmed.startsWith("Note") ||
      trimmed.startsWith("Diagram") ||
      trimmed.startsWith("Saved Query") ||
      trimmed.startsWith("Page Break")
    ) {
      validIndices.push(idx);
    }
  });

  if (index < 0 || index >= validIndices.length) {
    throw new Error("Message index out of bounds");
  }

  const realIndex = validIndices[index];
  const targetPart = parts[realIndex];

  if (targetPart.startsWith("Page Break")) {
    throw new Error("Cannot delete a page break");
  }

  if (
    !targetPart.startsWith("Note") &&
    !targetPart.startsWith("Diagram") &&
    !targetPart.startsWith("Saved Query")
  ) {
    throw new Error("Target message is not a note, diagram or saved query");
  }

  // Remove the part
  parts.splice(realIndex, 1);

  const newFileContent = parts.join("## ");
  fs.writeFileSync(filePath, newFileContent);
};
