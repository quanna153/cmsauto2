"use client";

import { Bold, ChevronDown, Eraser, Image, Italic, List, Redo2, Table2, Underline, Undo2 } from "lucide-react";
import { useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Select } from "@/components/ui/select";

export function MainContentEditor({ markdown, onChange }: { markdown: string; onChange: (markdown: string) => void }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<Range | null>(null);
  const toolbarInteractionRef = useRef(false);

  function saveSelection() {
    const selection = window.getSelection();
    if (selection?.rangeCount && editorRef.current?.contains(selection.anchorNode)) {
      selectionRef.current = selection.getRangeAt(0).cloneRange();
    }
  }

  function restoreSelection() {
    if (!selectionRef.current) return;
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(selectionRef.current);
  }

  function syncMarkdown() {
    if (!editorRef.current) return;
    const h1 = markdown.match(/^# (?!#).+$/m)?.[0] ?? "";
    const body = editorContentToMarkdown(editorRef.current);
    onChange([h1, body].filter(Boolean).join("\n\n"));
  }

  function runCommand(command: string, value?: string) {
    restoreSelection();
    document.execCommand(command, false, value);
    saveSelection();
    syncMarkdown();
  }

  function insertImage() {
    const src = window.prompt("Nhập URL hình ảnh:");
    if (src?.trim()) runCommand("insertImage", src.trim());
  }

  function insertTable() {
    runCommand("insertHTML", "<table><tbody><tr><th>Tiêu đề 1</th><th>Tiêu đề 2</th></tr><tr><td>Nội dung 1</td><td>Nội dung 2</td></tr></tbody></table><p><br></p>");
  }

  return <div className="mt-2 overflow-hidden rounded-lg border bg-white">
    <div className="flex flex-wrap items-center gap-1 border-b bg-[#fbfbf8] p-2">
      <EditorToolButton icon={Undo2} label="Hoàn tác" onClick={() => runCommand("undo")} />
      <EditorToolButton icon={Redo2} label="Làm lại" onClick={() => runCommand("redo")} />
      <ToolbarDivider />
      <EditorToolButton icon={Image} label="Chèn ảnh" onClick={insertImage} />
      <EditorToolButton icon={Table2} label="Chèn bảng" onClick={insertTable} />
      <ToolbarDivider />
      <Select
        aria-label="Kiểu văn bản"
        className="h-10 w-44 font-semibold"
        defaultValue="p"
        onChange={(event) => {
          runCommand("formatBlock", event.target.value);
          toolbarInteractionRef.current = false;
        }}
        onMouseDown={() => {
          toolbarInteractionRef.current = true;
          saveSelection();
        }}
      >
        <option value="p">Văn bản thường</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
      </Select>
      <ToolbarDivider />
      <EditorToolButton icon={Bold} label="In đậm" onClick={() => runCommand("bold")} />
      <EditorToolButton icon={Italic} label="In nghiêng" onClick={() => runCommand("italic")} />
      <EditorToolButton icon={Underline} label="Gạch chân" onClick={() => runCommand("underline")} />
      <EditorToolButton icon={Eraser} label="Xóa định dạng" onClick={() => runCommand("removeFormat")} />
      <ToolbarDivider />
      <EditorToolButton icon={List} label="Danh sách dấu đầu dòng" onClick={() => runCommand("insertUnorderedList")} />
      <EditorToolButton icon={ChevronDown} label="Danh sách đánh số" onClick={() => runCommand("insertOrderedList")} />
    </div>
    <div
      className="max-h-[560px] min-h-80 overflow-auto bg-[#f7f7f4] p-5 text-sm leading-7 text-[#273247] outline-none [&_a]:font-semibold [&_a]:text-[#80640b] [&_a]:underline [&_h2]:mb-3 [&_h2]:mt-7 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:text-base [&_h3]:font-bold [&_img]:max-w-full [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-4 [&_table]:mb-4 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:p-2 [&_th]:border [&_th]:bg-white [&_th]:p-2 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5"
      contentEditable
      onBlur={() => {
        if (!toolbarInteractionRef.current) syncMarkdown();
      }}
      onInput={saveSelection}
      onKeyUp={saveSelection}
      onMouseUp={saveSelection}
      ref={editorRef}
      role="textbox"
      suppressContentEditableWarning
      style={{ fontFamily: "Arial, sans-serif" }}
    >
      <ReactMarkdown
        components={{
          h1: () => null,
          pre: ({ children }) => <pre className="mb-4 whitespace-pre-wrap rounded-md bg-white p-3" style={{ fontFamily: "Arial, sans-serif" }}>{children}</pre>,
          code: ({ children }) => <code style={{ fontFamily: "Arial, sans-serif" }}>{children}</code>
        }}
        remarkPlugins={[remarkGfm]}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  </div>;
}

function EditorToolButton({ icon: Icon, label, onClick }: { icon: typeof Bold; label: string; onClick: () => void }) {
  return <button
    aria-label={label}
    className="flex size-10 items-center justify-center rounded-md bg-white text-[#566174] transition hover:bg-[#f1f2ee] hover:text-[#172033]"
    onClick={onClick}
    onMouseDown={(event) => event.preventDefault()}
    title={label}
    type="button"
  >
    <Icon size={18} />
  </button>;
}

function ToolbarDivider() {
  return <span aria-hidden="true" className="mx-1 h-7 w-px bg-[#e2e4de]" />;
}

function editorContentToMarkdown(editor: HTMLElement) {
  return Array.from(editor.childNodes)
    .map((node) => editorNodeToMarkdown(node))
    .join("")
    .replace(/\u00a0/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function editorNodeToMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
  if (!(node instanceof HTMLElement)) return "";

  const tag = node.tagName.toLowerCase();
  const children = () => Array.from(node.childNodes).map((child) => editorNodeToMarkdown(child)).join("");
  if (tag === "br") return "\n";
  if (tag === "h2") return `## ${children().trim()}\n\n`;
  if (tag === "h3") return `### ${children().trim()}\n\n`;
  if (tag === "p" || tag === "div") return `${children().trim()}\n\n`;
  if (tag === "strong" || tag === "b") return `**${children()}**`;
  if (tag === "em" || tag === "i") return `*${children()}*`;
  if (tag === "u") return `<u>${children()}</u>`;
  if (tag === "a") return `[${children()}](${node.getAttribute("href") ?? ""})`;
  if (tag === "img") return `![${node.getAttribute("alt") ?? ""}](${node.getAttribute("src") ?? ""})`;
  if (tag === "ul" || tag === "ol") {
    return `${Array.from(node.children).map((item, index) => `${tag === "ol" ? `${index + 1}.` : "-"} ${editorNodeToMarkdown(item).trim()}`).join("\n")}\n\n`;
  }
  if (tag === "li") return children();
  if (tag === "table") return `${editorTableToMarkdown(node)}\n\n`;
  return children();
}

function editorTableToMarkdown(table: HTMLElement) {
  const rows = Array.from(table.querySelectorAll("tr")).map((row) =>
    Array.from(row.querySelectorAll("th,td")).map((cell) => (cell.textContent ?? "").trim())
  );
  if (!rows.length) return "";
  const width = Math.max(...rows.map((row) => row.length));
  const normalized = rows.map((row) => [...row, ...Array(Math.max(0, width - row.length)).fill("")]);
  return [
    `| ${normalized[0].join(" | ")} |`,
    `| ${Array(width).fill("---").join(" | ")} |`,
    ...normalized.slice(1).map((row) => `| ${row.join(" | ")} |`)
  ].join("\n");
}
