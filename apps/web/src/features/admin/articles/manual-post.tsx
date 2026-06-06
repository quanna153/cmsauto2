"use client";

import { useRef, useState, type ChangeEvent, type ClipboardEvent, type FormEvent } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { Bold, CalendarClock, ChevronDown, ChevronRight, ExternalLink, Eye, FilePenLine, Highlighter, Image as ImageIcon, Italic, Link2, List, Redo2, Save, Table2, Trash2, Underline, Undo2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { createManualPost, saveManualPostDraft, scheduleManualPost } from "./manual-post-adapter";

export function ManualPostFeature() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [contentHistory, setContentHistory] = useState<string[]>([]);
  const [redoHistory, setRedoHistory] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<Record<string, string>>({});
  const [attemptedAction, setAttemptedAction] = useState<"draft" | "preview" | "publish" | "schedule" | null>(null);
  const [previewError, setPreviewError] = useState("");
  const [publishMenuOpen, setPublishMenuOpen] = useState(false);
  const [schedulePanelOpen, setSchedulePanelOpen] = useState(false);
  const [publishAtLocal, setPublishAtLocal] = useState(() => toDatetimeLocalValue(new Date(Date.now() + 30 * 60 * 1000).toISOString()));
  const [tablePickerOpen, setTablePickerOpen] = useState(false);
  const [tableSize, setTableSize] = useState({ rows: 3, columns: 3 });
  const [listMenuOpen, setListMenuOpen] = useState(false);
  const [highlightMenuOpen, setHighlightMenuOpen] = useState(false);
  const [linkMenuOpen, setLinkMenuOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("https://");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const editorHtmlRef = useRef("");
  const titleError = attemptedAction && title.trim().length === 0 ? "Nhập tiêu đề bài viết." : "";
  const contentError = (attemptedAction === "preview" || attemptedAction === "publish" || attemptedAction === "schedule") && content.trim().length === 0 ? "Nhập nội dung bài viết." : "";
  const scheduleError = attemptedAction === "schedule" && !isValidDatetimeLocal(publishAtLocal) ? "Chọn ngày và giờ đăng hợp lệ." : "";
  const create = useMutation({
    mutationFn: () => createManualPost({ title, content: expandUploadedImages(readEditorMarkdown(), uploadedImages) })
  });
  const saveDraft = useMutation({
    mutationFn: () => saveManualPostDraft({ title, content: expandUploadedImages(readEditorMarkdown(), uploadedImages) })
  });
  const schedule = useMutation({
    mutationFn: () => scheduleManualPost({ title, content: expandUploadedImages(readEditorMarkdown(), uploadedImages), publishAt: datetimeLocalToIso(publishAtLocal) })
  });

  function updateContent(nextContent: string, syncEditor = true) {
    if (nextContent === content) return;
    setContentHistory((current) => [...current.slice(-49), content]);
    setRedoHistory([]);
    setContent(nextContent);
    if (syncEditor) {
      window.requestAnimationFrame(() => syncEditorContent(nextContent));
    }
  }

  function undoContentChange() {
    const previousContent = contentHistory.at(-1);
    if (previousContent === undefined) return;

    setContent(previousContent);
    setContentHistory((current) => current.slice(0, -1));
    setRedoHistory((current) => [...current.slice(-49), content]);
    window.requestAnimationFrame(() => {
      syncEditorContent(previousContent);
      editorRef.current?.focus();
    });
  }

  function redoContentChange() {
    const nextContent = redoHistory.at(-1);
    if (nextContent === undefined) return;

    setContent(nextContent);
    setRedoHistory((current) => current.slice(0, -1));
    setContentHistory((current) => [...current.slice(-49), content]);
    window.requestAnimationFrame(() => {
      syncEditorContent(nextContent);
      editorRef.current?.focus();
    });
  }

  function submit() {
    setAttemptedAction("publish");
    setPublishMenuOpen(false);
    const currentContent = commitEditorContent();
    if (title.trim().length === 0 || currentContent.trim().length === 0) return;
    create.mutate();
  }

  function schedulePost() {
    setAttemptedAction("schedule");
    setPublishMenuOpen(false);
    const currentContent = commitEditorContent();
    if (title.trim().length === 0 || currentContent.trim().length === 0 || !isValidDatetimeLocal(publishAtLocal)) return;
    schedule.mutate();
  }

  function save() {
    setAttemptedAction("draft");
    commitEditorContent();
    if (title.trim().length === 0) return;
    saveDraft.mutate();
  }

  function clearCurrentPost() {
    setTitle("");
    updateContent("");
    setUploadedImages({});
    setAttemptedAction(null);
    setPreviewError("");
    setPublishMenuOpen(false);
    setSchedulePanelOpen(false);
    setTablePickerOpen(false);
    setListMenuOpen(false);
    setHighlightMenuOpen(false);
    setLinkMenuOpen(false);
    setLinkUrl("https://");
    setPublishAtLocal(toDatetimeLocalValue(new Date(Date.now() + 30 * 60 * 1000).toISOString()));
    create.reset();
    saveDraft.reset();
    schedule.reset();
    window.requestAnimationFrame(() => editorRef.current?.focus());
  }

  function preview() {
    setAttemptedAction("preview");
    setPreviewError("");
    const currentContent = commitEditorContent();
    if (title.trim().length === 0 || currentContent.trim().length === 0) return;

    const previewWindow = window.open("", "_blank");
    if (!previewWindow) {
      setPreviewError("Trình duyệt đã chặn cửa sổ xem trước. Hãy cho phép popup rồi thử lại.");
      return;
    }

    previewWindow.document.open();
    previewWindow.document.write(buildReaderPreviewHtml(title, expandUploadedImages(currentContent, uploadedImages)));
    previewWindow.document.close();
    previewWindow.focus();
  }

  async function insertImageFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setPreviewError("Chỉ chọn file ảnh để chèn vào bài viết.");
      return;
    }

    const id = crypto.randomUUID().slice(0, 8);
    const dataUrl = await readFileAsDataUrl(file);
    setUploadedImages((current) => ({ ...current, [id]: dataUrl }));
    insertHtmlAtCursor(`<img alt="${escapeAttribute(cleanImageLabel(file.name))}" data-cms-image-id="${id}" src="${escapeAttribute(dataUrl)}" />`);
  }

  async function selectImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    await insertImageFile(file);
  }

  function pasteContent(event: ClipboardEvent<HTMLDivElement>) {
    const imageFile = Array.from(event.clipboardData.files).find((file) => file.type.startsWith("image/"));
    if (imageFile) {
      event.preventDefault();
      void insertImageFile(imageFile);
      return;
    }

    const html = event.clipboardData.getData("text/html");
    if (html.trim().length > 0) {
      const markdown = htmlToMarkdown(html);
      if (markdown.length > 0) {
        event.preventDefault();
        insertHtmlAtCursor(markdownToEditorHtml(markdown, uploadedImages));
        return;
      }
    }

    const text = event.clipboardData.getData("text/plain").trim();
    if (isImageUrl(text)) {
      event.preventDefault();
      insertHtmlAtCursor(`<img alt="Ảnh minh họa" src="${escapeAttribute(text)}" />`);
      return;
    }

    if (text.length > 0) {
      event.preventDefault();
      insertHtmlAtCursor(looksLikeMarkdownText(text) ? markdownToEditorHtml(normalizePastedMarkdown(text), uploadedImages) : plainTextToEditorHtml(text));
    }
  }

  function insertAtCursor(markdown: string) {
    insertHtmlAtCursor(markdownToEditorHtml(markdown, uploadedImages));
  }

  function insertHtmlAtCursor(html: string) {
    insertHtmlIntoEditor(editorRef.current, html);
    updateContentFromEditor();
  }

  function runEditorCommand(command: string, value?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    updateContentFromEditor();
  }

  function syncEditorContent(nextContent: string) {
    const editor = editorRef.current;
    if (!editor) return;

    const nextHtml = nextContent.trim().length > 0 ? markdownToEditorHtml(nextContent, uploadedImages) : "";
    if (editor.innerHTML !== nextHtml) {
      editor.innerHTML = nextHtml;
    }
    applyEditorHeadingStyles(editor);
    editorHtmlRef.current = editor.innerHTML;
  }

  function updateContentFromEditor() {
    const editor = editorRef.current;
    if (!editor) return;

    applyEditorHeadingStyles(editor);
    editorHtmlRef.current = editor.innerHTML;
    updateContent(htmlToMarkdown(editor.innerHTML), false);
  }

  function editContent(event: FormEvent<HTMLDivElement>) {
    applyEditorHeadingStyles(event.currentTarget);
    editorHtmlRef.current = event.currentTarget.innerHTML;
    updateContent(htmlToMarkdown(event.currentTarget.innerHTML), false);
  }

  function readEditorMarkdown() {
    const editor = editorRef.current;
    if (!editor) return content;

    applyEditorHeadingStyles(editor);
    editorHtmlRef.current = editor.innerHTML;
    return htmlToMarkdown(editor.innerHTML);
  }

  function commitEditorContent() {
    const currentContent = readEditorMarkdown();
    if (currentContent !== content) {
      setContent(currentContent);
    }
    return currentContent;
  }

  function preserveEditorDom() {
    const editor = editorRef.current;
    if (!editor || editor.innerHTML.trim().length > 0 || editorHtmlRef.current.trim().length === 0) return;

    editor.innerHTML = editorHtmlRef.current;
    applyEditorHeadingStyles(editor);
    setContent(htmlToMarkdown(editorHtmlRef.current));
  }

  function applyHighlightFormat(color: "yellow" | "green" | "pink") {
    const colorMap = {
      green: "#dff3c4",
      pink: "#ffd6df",
      yellow: "#fff3a8"
    };

    runEditorCommand("hiliteColor", colorMap[color]);
    setHighlightMenuOpen(false);
  }

  function applyParagraphFormat(format: "normal" | "h1" | "h2" | "h3" | "h4") {
    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();
    const selection = window.getSelection();
    const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
    const block = range && editor.contains(range.commonAncestorContainer) ? findEditorBlock(range.commonAncestorContainer, editor) : null;
    const tagName = format === "normal" ? "p" : format;

    if (!block) {
      document.execCommand("formatBlock", false, tagName);
      updateContentFromEditor();
      return;
    }

    const replacement = document.createElement(tagName);
    while (block.firstChild) {
      replacement.appendChild(block.firstChild);
    }
    if (format !== "normal") {
      replacement.setAttribute("style", headingStyle(Number(format.slice(1)) as 1 | 2 | 3 | 4));
    }

    block.replaceWith(replacement);
    const nextRange = document.createRange();
    nextRange.selectNodeContents(replacement);
    nextRange.collapse(false);
    selection?.removeAllRanges();
    selection?.addRange(nextRange);
    updateContentFromEditor();
  }

  function insertTable(rows: number, columns: number) {
    insertAtCursor(buildMarkdownTable(rows, columns));
    setTablePickerOpen(false);
  }

  function applyListFormat(style: "dash" | "dot" | "number") {
    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();
    document.execCommand(style === "number" ? "insertOrderedList" : "insertUnorderedList");
    markCurrentListStyle(style, editor);
    updateContentFromEditor();
    setListMenuOpen(false);
  }

  function applyLinkFormat() {
    const url = linkUrl.trim();
    if (!isLinkUrl(url)) {
      setPreviewError("Nhập đường liên kết bắt đầu bằng https://, http:// hoặc /.");
      return;
    }

    runEditorCommand("createLink", url);
    setPreviewError("");
    setLinkMenuOpen(false);
  }

  const busy = saveDraft.isPending || create.isPending || schedule.isPending;

  return <>
    <PageHeader description="Nhập tiêu đề và nội dung, có thể lưu nháp, xem trước hoặc publish ngay ra Reader." eyebrow="Admin" title="Đăng bài thủ công" />
    <section className="grid gap-4 rounded-xl border bg-white p-5">
      <style>{manualPostEditorTypography}</style>
      <label className="grid gap-1 text-sm font-semibold">
        Tiêu đề
        <Input aria-invalid={Boolean(titleError)} onChange={(event) => setTitle(event.target.value)} value={title} />
        {titleError ? <span className="text-xs font-medium text-red-600">{titleError}</span> : null}
      </label>
      <div className="grid gap-1 text-sm font-semibold">
        <span>Nội dung bài viết</span>
        <div className="rounded-lg">
          <div className="flex flex-wrap items-center gap-2 rounded-t-lg border border-b-0 border-[#d9ddd2] bg-[#fafaf7] px-2 py-2">
            <button
              aria-label="Hoàn tác"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-white text-[#566174] transition hover:bg-[#f0f1ec] hover:text-[#172033] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2"
              disabled={contentHistory.length === 0}
              onClick={undoContentChange}
              title="Hoàn tác"
              type="button"
            >
              <Undo2 size={18} />
            </button>
            <button
              aria-label="Làm lại"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-white text-[#566174] transition hover:bg-[#f0f1ec] hover:text-[#172033] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2"
              disabled={redoHistory.length === 0}
              onClick={redoContentChange}
              title="Làm lại"
              type="button"
            >
              <Redo2 size={18} />
            </button>
            <span aria-hidden="true" className="h-6 w-px bg-[#d9ddd2]" />
            <button
              aria-label="Thêm ảnh"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-white text-[#566174] transition hover:bg-[#f0f1ec] hover:text-[#172033] focus-visible:outline-2"
              onClick={() => fileInputRef.current?.click()}
              title="Thêm ảnh"
              type="button"
            >
              <ImageIcon size={18} />
            </button>
            <div className="relative">
              <button
                aria-expanded={tablePickerOpen}
                aria-label="Thêm bảng"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-white text-[#566174] transition hover:bg-[#f0f1ec] hover:text-[#172033] focus-visible:outline-2"
                onClick={() => setTablePickerOpen((current) => !current)}
                title="Thêm bảng"
                type="button"
              >
                <Table2 size={18} />
              </button>
              {tablePickerOpen ? <div className="absolute left-0 top-full z-20 mt-2 w-[216px] overflow-hidden rounded-lg border bg-white shadow-lg">
                <div className="flex h-12 items-center justify-between border-b px-4">
                  <div className="flex items-center gap-2 text-[#222222]">
                    <Table2 size={16} />
                    <span className="text-base font-semibold leading-none">Thành phần</span>
                  </div>
                  <ChevronRight className="text-[#8b8b8b]" size={16} />
                </div>
                <div className="px-3 pb-3 pt-3">
                  <div className="grid grid-cols-10 gap-1">
                    {Array.from({ length: 100 }, (_, index) => {
                      const row = Math.floor(index / 10) + 1;
                      const column = index % 10 + 1;
                      const active = row <= tableSize.rows && column <= tableSize.columns;

                      return <button
                        aria-label={`${row} hàng ${column} cột`}
                        className={`h-3.5 w-3.5 rounded-[2px] border ${active ? "border-[#5b9dff] bg-[#cfe0ff]" : "border-[#e1e3e6] bg-[#fafafa]"} hover:border-[#5b9dff] hover:bg-[#cfe0ff]`}
                        key={`${row}-${column}`}
                        onClick={() => insertTable(row, column)}
                        onMouseEnter={() => setTableSize({ rows: row, columns: column })}
                        type="button"
                      />;
                    })}
                  </div>
                  <div className="mt-2 text-center text-base font-semibold text-[#222222]">{tableSize.rows} x {tableSize.columns}</div>
                </div>
              </div> : null}
            </div>
            <span aria-hidden="true" className="h-6 w-px bg-[#d9ddd2]" />
            <select
              aria-label="Định dạng đoạn văn bản"
              className="h-9 w-36 rounded-md bg-white px-2 text-sm font-semibold text-[#273247] focus:outline-2"
              defaultValue="normal"
              onChange={(event) => {
                applyParagraphFormat(event.target.value as "normal" | "h1" | "h2" | "h3" | "h4");
                event.target.value = "normal";
              }}
              title="Định dạng đoạn văn bản"
            >
              <option value="normal">Văn bản thường</option>
              <option value="h1">Heading 1</option>
              <option value="h2">Heading 2</option>
              <option value="h3">Heading 3</option>
              <option value="h4">Heading 4</option>
            </select>
            <span aria-hidden="true" className="h-6 w-px bg-[#d9ddd2]" />
            <div className="flex items-center gap-1">
              <button
                aria-label="In đậm"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-white text-[#566174] transition hover:bg-[#f0f1ec] hover:text-[#172033] focus-visible:outline-2"
                onClick={() => runEditorCommand("bold")}
                title="In đậm"
                type="button"
              >
                <Bold size={18} />
              </button>
              <button
                aria-label="In nghiêng"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-white text-[#566174] transition hover:bg-[#f0f1ec] hover:text-[#172033] focus-visible:outline-2"
                onClick={() => runEditorCommand("italic")}
                title="In nghiêng"
                type="button"
              >
                <Italic size={18} />
              </button>
              <button
                aria-label="Gạch chân"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-white text-[#566174] transition hover:bg-[#f0f1ec] hover:text-[#172033] focus-visible:outline-2"
                onClick={() => runEditorCommand("underline")}
                title="Gạch chân"
                type="button"
              >
                <Underline size={18} />
              </button>
              <div className="relative">
                <button
                  aria-expanded={highlightMenuOpen}
                  aria-label="Màu đánh dấu"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-white text-[#566174] transition hover:bg-[#f0f1ec] hover:text-[#172033] focus-visible:outline-2"
                  onClick={() => setHighlightMenuOpen((current) => !current)}
                  title="Màu đánh dấu"
                  type="button"
                >
                  <Highlighter size={18} />
                </button>
                {highlightMenuOpen ? <div className="absolute left-0 top-full z-20 mt-2 flex gap-2 rounded-lg border bg-white p-2 shadow-lg">
                  <button aria-label="Đánh dấu màu vàng" className="h-7 w-7 rounded border border-[#d2b85a] bg-[#fff3a8] hover:border-[#80640b]" onClick={() => applyHighlightFormat("yellow")} type="button" />
                  <button aria-label="Đánh dấu màu xanh lá" className="h-7 w-7 rounded border border-[#9fbd7c] bg-[#dff3c4] hover:border-[#80640b]" onClick={() => applyHighlightFormat("green")} type="button" />
                  <button aria-label="Đánh dấu màu hồng nhạt" className="h-7 w-7 rounded border border-[#d99aaa] bg-[#ffd6df] hover:border-[#80640b]" onClick={() => applyHighlightFormat("pink")} type="button" />
                </div> : null}
              </div>
            </div>
            <span aria-hidden="true" className="h-6 w-px bg-[#d9ddd2]" />
            <div className="relative">
              <button
                aria-expanded={listMenuOpen}
                aria-label="Tạo danh sách"
                className="inline-flex h-9 items-center justify-center gap-1 rounded-md bg-white px-2 text-[#566174] transition hover:bg-[#f0f1ec] hover:text-[#172033] focus-visible:outline-2"
                onClick={() => setListMenuOpen((current) => !current)}
                title="Tạo danh sách"
                type="button"
              >
                <List size={18} />
                <ChevronDown size={14} />
              </button>
              {listMenuOpen ? <div className="absolute left-0 top-full z-20 mt-2 min-w-44 rounded-lg border bg-white p-1 text-sm font-semibold shadow-lg">
                <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-[#273247] hover:bg-[#f7f7f4]" onClick={() => applyListFormat("dash")} type="button"><span className="w-4 text-center">-</span>Dấu gạch ngang</button>
                <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-[#273247] hover:bg-[#f7f7f4]" onClick={() => applyListFormat("dot")} type="button"><span className="w-4 text-center">•</span>Dấu chấm tròn</button>
                <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-[#273247] hover:bg-[#f7f7f4]" onClick={() => applyListFormat("number")} type="button"><span className="w-4 text-center">1.</span>Số thứ tự</button>
              </div> : null}
            </div>
            <span aria-hidden="true" className="h-6 w-px bg-[#d9ddd2]" />
            <div className="relative">
              <button
                aria-expanded={linkMenuOpen}
                aria-label="Chèn đường liên kết"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-white text-[#566174] transition hover:bg-[#f0f1ec] hover:text-[#172033] focus-visible:outline-2"
                onClick={() => setLinkMenuOpen((current) => !current)}
                title="Chèn đường liên kết"
                type="button"
              >
                <Link2 size={18} />
              </button>
              {linkMenuOpen ? <div className="absolute left-0 top-full z-20 mt-2 grid w-72 gap-2 rounded-lg border bg-white p-3 text-sm font-semibold shadow-lg">
                <label className="grid gap-1">
                  URL
                  <Input onChange={(event) => setLinkUrl(event.target.value)} placeholder="https://example.com hoặc /vi-vn/bai-viet" value={linkUrl} />
                </label>
                <div className="flex justify-end gap-2">
                  <Button onClick={() => setLinkMenuOpen(false)} type="button" variant="secondary">Huỷ</Button>
                  <Button onClick={applyLinkFormat} type="button"><Link2 size={16} />Chèn link</Button>
                </div>
              </div> : null}
            </div>
            <input accept="image/*" className="hidden" onChange={(event) => void selectImage(event)} ref={fileInputRef} type="file" />
          </div>
          <div
            aria-invalid={Boolean(contentError)}
            className="article-content min-h-72 w-full overflow-auto rounded-b-lg rounded-t-none border border-[#d9ddd2] bg-white px-4 py-3 text-base font-normal leading-7 text-[#273247] focus:outline-2 [&_a]:text-[#80640b] [&_a]:underline [&_blockquote]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:border-[#d9ddd2] [&_blockquote]:pl-3 [&_h1]:my-5 [&_h1]:!text-[2rem] [&_h1]:!font-extrabold [&_h1]:!leading-tight [&_h2]:my-4 [&_h2]:!text-[1.5rem] [&_h2]:!font-bold [&_h2]:!leading-snug [&_h3]:my-3 [&_h3]:!text-[1.25rem] [&_h3]:!font-semibold [&_h3]:!leading-snug [&_h4]:my-3 [&_h4]:!text-[1.125rem] [&_h4]:!font-semibold [&_h4]:!leading-snug [&_img]:my-4 [&_img]:max-w-full [&_img]:rounded-lg [&_li]:my-1 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-3 [&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-[#d9ddd2] [&_td]:p-2 [&_th]:border [&_th]:border-[#d9ddd2] [&_th]:bg-[#fafaf7] [&_th]:p-2 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6"
            contentEditable
            onClick={preserveEditorDom}
            onFocus={preserveEditorDom}
            onInput={editContent}
            onPaste={pasteContent}
            ref={editorRef}
            role="textbox"
            suppressContentEditableWarning
          />
        </div>
        {contentError ? <span className="text-xs font-medium text-red-600">{contentError}</span> : null}
      </div>
      {create.error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{create.error.message}</p> : null}
      {saveDraft.error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{saveDraft.error.message}</p> : null}
      {schedule.error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{schedule.error.message}</p> : null}
      {previewError ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{previewError}</p> : null}
      {saveDraft.data?.article.id ? <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">Đã lưu nháp. Bài viết chưa hiển thị ngoài Reader.</div> : null}
      {create.data?.article.livePath ? <div className="rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-700">Đã publish bài viết. <Link className="inline-flex items-center gap-1 underline" href={create.data.article.livePath}><ExternalLink size={14} />Xem public</Link></div> : null}
      {schedule.data?.article.id ? <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">Đã đặt lịch đăng bài lúc {formatLocalSchedule(schedule.data.article.publishAt)}. Bài viết chưa hiển thị ngoài Reader.</div> : null}
      {schedulePanelOpen ? <div className="grid gap-2 rounded-lg border bg-[#fafaf7] p-3 sm:max-w-md">
        <label className="grid gap-1 text-sm font-semibold">
          Thời gian đăng bài
          <Input aria-invalid={Boolean(scheduleError)} onChange={(event) => setPublishAtLocal(event.target.value)} type="datetime-local" value={publishAtLocal} />
        </label>
        {scheduleError ? <span className="text-xs font-medium text-red-600">{scheduleError}</span> : null}
        <Button disabled={busy} onClick={schedulePost} type="button"><CalendarClock size={16} />{schedule.isPending ? "Đang đặt lịch..." : "Đặt lịch đăng bài"}</Button>
      </div> : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button disabled={busy || (title.length === 0 && content.length === 0)} onClick={clearCurrentPost} type="button" variant="danger"><Trash2 size={16} />Xoá bài</Button>
        <div className="flex flex-wrap justify-end gap-3">
          <Button disabled={busy} onClick={save} variant="secondary">{saveDraft.isPending ? "Đang lưu..." : <><Save size={16} />Lưu nháp</>}</Button>
          <Button disabled={busy} onClick={preview} type="button" variant="secondary"><Eye size={16} />Xem trước</Button>
          <div className="relative flex">
            <Button className="rounded-r-none" disabled={busy} onClick={submit} type="button">{create.isPending ? "Đang đăng..." : <><FilePenLine size={16} />Đăng bài thủ công</>}</Button>
            <button
              aria-expanded={publishMenuOpen}
              aria-label="Mở menu đăng bài"
              className="inline-flex items-center justify-center rounded-r-lg border-l border-[#80640b] bg-[#a88412] px-2 text-white transition hover:bg-[#80640b] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2"
              disabled={busy}
              onClick={() => setPublishMenuOpen((current) => !current)}
              type="button"
            >
              <ChevronDown size={16} />
            </button>
            {publishMenuOpen ? <div className="absolute right-0 top-full z-10 mt-2 min-w-48 rounded-lg border bg-white p-1 text-sm font-semibold shadow-lg">
              <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-[#273247] hover:bg-[#f7f7f4]" onClick={submit} type="button"><FilePenLine size={16} />Xuất bản ngay</button>
              <button
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-[#273247] hover:bg-[#f7f7f4]"
                onClick={() => {
                  setSchedulePanelOpen(true);
                  setPublishMenuOpen(false);
                  setAttemptedAction(null);
                }}
                type="button"
              >
                <CalendarClock size={16} />Đặt lịch đăng bài
              </button>
            </div> : null}
          </div>
          {create.data?.article.id || saveDraft.data?.article.id || schedule.data?.article.id ? <Link href="/admin/articles"><Button type="button" variant="secondary">Về danh sách</Button></Link> : null}
        </div>
      </div>
    </section>
  </>;
}

const manualPostEditorTypography = `
  .article-content h1 { font-size: 2rem !important; line-height: 1.15 !important; font-weight: 800 !important; margin: 1.5rem 0 .875rem !important; }
  .article-content h2 { font-size: 1.5rem !important; line-height: 1.3 !important; font-weight: 700 !important; margin: 1.25rem 0 .75rem !important; }
  .article-content h3 { font-size: 1.25rem !important; line-height: 1.35 !important; font-weight: 600 !important; margin: 1rem 0 .625rem !important; }
  .article-content h4 { font-size: 1.125rem !important; line-height: 1.35 !important; font-weight: 600 !important; margin: .875rem 0 .5rem !important; }
  .article-content ul { list-style-position: outside !important; list-style-type: disc !important; padding-left: 1.5rem !important; }
  .article-content ol { list-style-position: outside !important; list-style-type: decimal !important; padding-left: 1.5rem !important; }
  .article-content ul[data-cms-list-style="dash"] { list-style: none !important; padding-left: 0 !important; }
  .article-content ul[data-cms-list-style="dash"] > li { padding-left: 1.5rem !important; position: relative !important; }
  .article-content ul[data-cms-list-style="dash"] > li::before { content: "-" !important; left: 0 !important; position: absolute !important; }
`;

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Không đọc được file ảnh."));
    });
    reader.addEventListener("error", () => reject(reader.error ?? new Error("Không đọc được file ảnh.")));
    reader.readAsDataURL(file);
  });
}

function isImageUrl(value: string) {
  return /^https?:\/\/\S+\.(?:png|jpe?g|gif|webp|avif|svg)(?:\?\S*)?$/i.test(value);
}

function isLinkUrl(value: string) {
  return /^https?:\/\/\S+$/i.test(value) || /^\/\S*$/.test(value);
}

function insertHtmlIntoEditor(editor: HTMLDivElement | null, html: string) {
  if (!editor) return;

  editor.focus();
  const selection = window.getSelection();
  const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
  const activeRange = range && editor.contains(range.commonAncestorContainer) ? range : null;
  const insertionRange = activeRange ?? document.createRange();

  if (!activeRange) {
    insertionRange.selectNodeContents(editor);
    insertionRange.collapse(false);
  }

  const fragment = document.createRange().createContextualFragment(html);
  const lastNode = fragment.lastChild;
  insertionRange.deleteContents();
  insertionRange.insertNode(fragment);

  if (lastNode && selection) {
    const nextRange = document.createRange();
    nextRange.setStartAfter(lastNode);
    nextRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(nextRange);
  }
}

function findEditorBlock(node: Node, editor: HTMLElement) {
  let current: Node | null = node.nodeType === 1 ? node : node.parentNode;

  while (current && current !== editor) {
    if (current instanceof HTMLElement && /^(blockquote|div|h[1-6]|li|p)$/i.test(current.tagName)) {
      return current;
    }
    current = current.parentNode;
  }

  return null;
}

function markdownToEditorHtml(markdown: string, images: Record<string, string>) {
  const expandedMarkdown = expandUploadedImages(normalizePastedMarkdown(markdown), images);
  return renderMarkdown(expandedMarkdown, extractPreviewHeadings(expandedMarkdown));
}

function applyEditorHeadingStyles(editor: HTMLElement) {
  ([1, 2, 3, 4] as const).forEach((level) => {
    editor.querySelectorAll(`h${level}`).forEach((heading) => {
      if (!(heading instanceof HTMLElement)) return;
      heading.setAttribute("style", headingStyle(level));
    });
  });
}

function markCurrentListStyle(style: "dash" | "dot" | "number", editor: HTMLElement) {
  const selection = window.getSelection();
  const node = selection?.rangeCount ? selection.getRangeAt(0).commonAncestorContainer : null;
  const list = node && editor.contains(node) ? findClosestList(node, editor) : null;

  if (!list) return;
  if (style === "number") {
    list.removeAttribute("data-cms-list-style");
    return;
  }

  list.setAttribute("data-cms-list-style", style);
}

function findClosestList(node: Node, editor: HTMLElement) {
  let current: Node | null = node.nodeType === 1 ? node : node.parentNode;

  while (current && current !== editor) {
    if (current instanceof HTMLElement && /^(ul|ol)$/i.test(current.tagName)) {
      return current;
    }
    current = current.parentNode;
  }

  return null;
}

function looksLikeMarkdownText(text: string) {
  return /(^|\n)\s{0,3}#{1,4}\s+\S/.test(text) || /(^|\n)\s*(?:[-*]\s+|\d+\.\s+)/.test(text) || /\*\*[^*]+\*\*/.test(text);
}

function plainTextToEditorHtml(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

function htmlToMarkdown(html: string) {
  const document = new DOMParser().parseFromString(html, "text/html");
  const context = {
    classStyles: parseClipboardClassStyles(document)
  };
  const blocks = Array.from(document.body.childNodes)
    .map((node) => nodeToMarkdown(node, context))
    .map((block) => block.trim())
    .filter(Boolean);

  return normalizePastedMarkdown(blocks.join("\n\n"));
}

type HtmlMarkdownContext = {
  classStyles: Map<string, string>;
};

function nodeToMarkdown(node: ChildNode, context: HtmlMarkdownContext): string {
  if (node.nodeType === 3) {
    return normalizeInlineText(node.textContent ?? "");
  }

  if (node.nodeType !== 1) return "";

  return elementToMarkdown(node as HTMLElement, context);
}

function elementToMarkdown(element: HTMLElement, context: HtmlMarkdownContext): string {
  const tag = element.tagName.toLowerCase();

  if (tag === "style" || tag === "script" || tag === "meta") return "";
  if (tag === "br") return "\n";
  if (tag === "img") return imageElementToMarkdown(element);
  if (tag === "table") return tableElementToMarkdown(element);
  if (tag === "ul" || tag === "ol") return listElementToMarkdown(element, tag === "ol", context);
  if (tag === "blockquote") return childrenToMarkdown(element, context).split("\n").map((line) => `> ${line}`).join("\n");

  const content = childrenToMarkdown(element, context).trim();
  if (!content) return "";

  const markdownHeading = getMarkdownHeadingFromContent(content);
  if (markdownHeading) return `${"#".repeat(markdownHeading.level)} ${markdownHeading.text}`;

  const headingLevel = getHeadingLevel(element, context);
  if (headingLevel) return `${"#".repeat(headingLevel)} ${content.replace(/\n+/g, " ")}`;
  if (hasChildBlockElements(element)) return content;

  const inlineContent = applyPastedInlineMarks(content, element, context);
  if (tag === "a") return linkElementToMarkdown(element, inlineContent);
  if (isParagraphElement(tag)) return inlineContent;

  return inlineContent;
}

function childrenToMarkdown(element: HTMLElement, context: HtmlMarkdownContext) {
  return Array.from(element.childNodes).map((child) => {
    if (child.nodeType !== 1) return nodeToMarkdown(child, context);

    const childElement = child as HTMLElement;
    const markdown = nodeToMarkdown(childElement, context).trim();
    if (!markdown) return "";

    return isMarkdownBlockElement(childElement) ? `\n\n${markdown}\n\n` : markdown;
  }).join("");
}

function isParagraphElement(tag: string) {
  return tag === "p" || tag === "div" || tag === "section" || tag === "article";
}

function isMarkdownBlockElement(element: HTMLElement) {
  return /^(article|blockquote|div|h[1-6]|li|ol|p|section|table|ul)$/i.test(element.tagName);
}

function hasChildBlockElements(element: HTMLElement) {
  return Array.from(element.children).some((child) => child instanceof HTMLElement && isMarkdownBlockElement(child));
}

function parseClipboardClassStyles(document: Document) {
  const classStyles = new Map<string, string>();
  const css = Array.from(document.querySelectorAll("style")).map((style) => style.textContent ?? "").join("\n");
  const classRulePattern = /\.([A-Za-z0-9_-]+)\s*\{([^}]+)\}/g;
  let match: RegExpExecArray | null;

  while ((match = classRulePattern.exec(css)) !== null) {
    classStyles.set(match[1], match[2]);
  }

  return classStyles;
}

function getElementStyleText(element: HTMLElement, context: HtmlMarkdownContext) {
  const classStyle = Array.from(context.classStyles.entries())
    .filter(([className]) => element.classList.contains(className))
    .map(([, style]) => style)
    .join(";");
  const inlineStyle = element.getAttribute("style") ?? "";
  return [classStyle, inlineStyle].filter(Boolean).join(";");
}

function getLargestFontSizePx(element: HTMLElement, context: HtmlMarkdownContext) {
  const sizes = [element, ...Array.from(element.querySelectorAll<HTMLElement>("*"))]
    .map((node) => parseFontSizePx(getElementStyleText(node, context)))
    .filter((size): size is number => size !== null);

  return sizes.length > 0 ? Math.max(...sizes) : null;
}

function parseFontSizePx(style: string) {
  const fontSizes = Array.from(style.matchAll(/font-size:\s*(\d+(?:\.\d+)?)(px|pt)/gi));
  const fontSize = fontSizes.at(-1);
  if (!fontSize) return null;

  const value = Number(fontSize[1]);
  return fontSize[2].toLowerCase() === "pt" ? value * 1.333 : value;
}

function getHeadingLevel(element: HTMLElement, context: HtmlMarkdownContext) {
  const tag = element.tagName.toLowerCase();
  const semanticMatch = /^h([1-6])$/.exec(tag);
  if (semanticMatch) return Math.min(Number(semanticMatch[1]), 4);
  if (hasChildBlockElements(element)) return null;

  const size = getLargestFontSizePx(element, context);
  if (!size) return null;

  if (size >= 26) return 1;
  if (size >= 21) return 2;
  if (size >= 17) return 3;
  if (size >= 15.5 && isBoldElement(element, context)) return 4;
  return null;
}

function getMarkdownHeadingFromContent(content: string) {
  const normalized = content.replace(/\n+/g, " ").trim();
  const unwrapped = normalized
    .replace(/^\*\*(#{1,4}\s+.+?)\*\*$/, "$1")
    .replace(/^\*(#{1,4}\s+.+?)\*$/, "$1");
  const match = /^(#{1,4})\s+(.+?)$/.exec(unwrapped);
  if (!match) return null;

  return {
    level: match[1].length as 1 | 2 | 3 | 4,
    text: stripMarkdownHeadingInlineMarks(cleanMarkdownHeadingText(match[2]))
  };
}

function stripMarkdownHeadingInlineMarks(value: string) {
  return value
    .replace(/^\*\*(.+)\*\*$/, "$1")
    .replace(/^\*(.+)\*$/, "$1")
    .trim();
}

function applyPastedInlineMarks(value: string, element: HTMLElement, context: HtmlMarkdownContext) {
  if (!value.trim()) return value;

  let result = value;
  const tag = element.tagName.toLowerCase();

  if ((tag === "strong" || tag === "b" || isBoldElement(element, context)) && !isWrapped(result, "**")) {
    result = `**${result}**`;
  }

  if ((tag === "em" || tag === "i" || isItalicElement(element, context)) && !isWrapped(result, "*")) {
    result = `*${result}*`;
  }

  if ((tag === "u" || isUnderlineElement(element, context)) && !/^\[.+\]\(underline:\)$/.test(result)) {
    result = `[${result}](underline:)`;
  }

  if (isHighlightElement(element, context) && !/^\[.+\]\(highlight:/.test(result)) {
    result = `[${result}](highlight:yellow)`;
  }

  return result;
}

function isWrapped(value: string, wrapper: string) {
  return value.startsWith(wrapper) && value.endsWith(wrapper);
}

function isBoldElement(element: HTMLElement, context: HtmlMarkdownContext) {
  const style = getElementStyleText(element, context);
  return /font-weight:\s*(bold|[6-9]00)/i.test(style);
}

function isItalicElement(element: HTMLElement, context: HtmlMarkdownContext) {
  return /font-style:\s*italic/i.test(getElementStyleText(element, context));
}

function isUnderlineElement(element: HTMLElement, context: HtmlMarkdownContext) {
  return /text-decoration[^;]*underline/i.test(getElementStyleText(element, context));
}

function isHighlightElement(element: HTMLElement, context: HtmlMarkdownContext) {
  const style = getElementStyleText(element, context);
  const match = /background(?:-color)?:\s*([^;]+)/i.exec(style);
  if (!match) return false;

  const color = match[1].trim().toLowerCase();
  return color !== "transparent" && color !== "inherit" && !/^rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\s*\)$/.test(color);
}

function linkElementToMarkdown(element: HTMLElement, content: string) {
  const href = element.getAttribute("href")?.trim() ?? "";
  if (!href || (!isLinkUrl(href) && !href.startsWith("#"))) return content;
  return `[${content}](${href})`;
}

function imageElementToMarkdown(element: HTMLElement) {
  const cmsImageId = element.getAttribute("data-cms-image-id")?.trim();
  if (cmsImageId) {
    const alt = element.getAttribute("alt")?.trim() || "Ảnh minh họa";
    return `![${alt}](cms-image:${cmsImageId})`;
  }

  const source = element.getAttribute("src")?.trim() ?? "";
  if (!isImageUrl(source) && !source.startsWith("data:image/")) return "";

  const alt = element.getAttribute("alt")?.trim() || "Ảnh minh họa";
  return `![${alt}](${source})`;
}

function listElementToMarkdown(element: HTMLElement, ordered: boolean, context: HtmlMarkdownContext): string {
  const unorderedMarker = element.getAttribute("data-cms-list-style") === "dot" ? "* " : "- ";

  return Array.from(element.children)
    .filter((child): child is HTMLElement => child instanceof HTMLElement && child.tagName.toLowerCase() === "li")
    .map((item, index) => {
      const marker = ordered ? `${index + 1}. ` : unorderedMarker;
      const itemContent = Array.from(item.childNodes)
        .filter((child) => !(child instanceof HTMLElement && ["ul", "ol"].includes(child.tagName.toLowerCase())))
        .map((child) => nodeToMarkdown(child, context))
        .join("")
        .replace(/\n+/g, " ")
        .trim();
      const nestedLists = Array.from(item.children)
        .filter((child): child is HTMLElement => child instanceof HTMLElement && ["ul", "ol"].includes(child.tagName.toLowerCase()))
        .map((child) => listElementToMarkdown(child, child.tagName.toLowerCase() === "ol", context).split("\n").map((line: string) => `  ${line}`).join("\n"))
        .join("\n");

      return nestedLists ? `${marker}${itemContent}\n${nestedLists}` : `${marker}${itemContent}`;
    })
    .join("\n");
}

function tableElementToMarkdown(element: HTMLElement) {
  const rows = Array.from(element.querySelectorAll("tr"))
    .map((row) => Array.from(row.querySelectorAll("th,td")).map((cell) => normalizePastedMarkdown(cell.textContent ?? "")))
    .filter((row) => row.length > 0);

  if (rows.length === 0) return "";

  const columnCount = Math.max(...rows.map((row) => row.length));
  const normalizedRows = rows.map((row) => [...row, ...Array.from({ length: columnCount - row.length }, () => "")]);
  const [header, ...body] = normalizedRows;

  return [
    markdownTableRow(header),
    markdownTableRow(Array.from({ length: columnCount }, () => "---")),
    ...body.map((row) => markdownTableRow(row))
  ].join("\n");
}

function normalizeInlineText(value: string) {
  return value.replace(/\u00a0/g, " ").replace(/[ \t\r\n]+/g, " ");
}

function normalizePastedMarkdown(value: string) {
  return normalizeMarkdownTokenLines(repairMarkdownBlockBoundaries(value))
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeMarkdownTokenLines(value: string) {
  const lines = value.replace(/\r\n/g, "\n").split("\n");
  const normalized: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    const headingToken = /^(#{1,4})$/.exec(line);
    if (headingToken) {
      const nextLine = lines[index + 1]?.trim() ?? "";
      if (nextLine && !/^#{1,4}\s+/.test(nextLine) && !isRawMarkdownTokenLine(nextLine)) {
        normalized.push(`${headingToken[1]} ${nextLine}`);
        index += 1;
      }
      continue;
    }

    if (isRawMarkdownTokenLine(line)) continue;

    normalized.push(lines[index]);
  }

  return normalized.join("\n");
}

function isRawMarkdownTokenLine(value: string) {
  return /^(?:#{1,6}|\*{1,2}|_{1,2})$/.test(value.trim());
}

function repairMarkdownBlockBoundaries(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/([^\n#])([ \t]*#{1,4}[ \t]+\S)/g, "$1\n\n$2")
    .replace(/(\*\*[^*\n]+\*\*)(?=\S)/g, "$1\n\n")
    .split("\n")
    .map((line) => line.replace(/^(\s{0,3}#{1,4}\s+.+?)\s*#{1,6}\s*$/, "$1"))
    .join("\n");
}

function cleanImageLabel(fileName: string) {
  const label = fileName.replace(/\.[^.]+$/, "").trim();
  return label || "Ảnh minh họa";
}

function expandUploadedImages(markdown: string, images: Record<string, string>) {
  return markdown.replace(/!\[([^\]]*)\]\(cms-image:([a-z0-9-]+)\)/gi, (match, alt: string, id: string) => {
    const dataUrl = images[id];
    return dataUrl ? `![${alt}](${dataUrl})` : match;
  });
}

function buildMarkdownTable(rows: number, columns: number) {
  const headers = Array.from({ length: columns }, (_, index) => `Cột ${index + 1}`);
  const separator = Array.from({ length: columns }, () => "---");
  const body = Array.from({ length: rows }, (_, rowIndex) =>
    Array.from({ length: columns }, (_, columnIndex) => `Ô ${rowIndex + 1}.${columnIndex + 1}`)
  );

  return [
    markdownTableRow(headers),
    markdownTableRow(separator),
    ...body.map((row) => markdownTableRow(row))
  ].join("\n");
}

function markdownTableRow(cells: string[]) {
  return `| ${cells.join(" | ")} |`;
}

function buildReaderPreviewHtml(title: string, markdown: string) {
  const escapedTitle = escapeHtml(title);
  const publishedDate = escapeHtml(new Date().toLocaleDateString("vi-VN"));
  const headings = extractPreviewHeadings(markdown);

  return `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapedTitle}</title>
  <style>
    :root { --background: #f7f7f4; --foreground: #172033; --border: #e3e5df; --muted: #687386; --brand: #a88412; --brand-strong: #80640b; }
    * { box-sizing: border-box; border-color: var(--border); }
    html, body { margin: 0; min-height: 100%; background: var(--background); color: var(--foreground); font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
    a { color: inherit; }
    header { border-bottom: 1px solid var(--border); background: #172033; color: white; }
    .header-inner, main, .footer-inner { max-width: 72rem; margin: 0 auto; padding-left: 1.25rem; padding-right: 1.25rem; }
    .header-inner { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem; padding-top: 1rem; padding-bottom: 1rem; }
    .brand { color: #e4c865; font-family: Georgia, "Times New Roman", serif; font-size: 1.25rem; font-weight: 700; text-decoration: none; }
    nav { display: flex; flex-wrap: wrap; gap: 1rem; color: rgba(255,255,255,.75); font-size: .875rem; }
    nav a { text-decoration: none; }
    main { padding-top: 2rem; padding-bottom: 2rem; }
    .article-grid { display: grid; gap: 2rem; }
    .eyebrow { color: var(--brand); font-size: .75rem; font-weight: 700; letter-spacing: .18em; margin: 0; text-transform: uppercase; }
    h1 { margin: .75rem 0 0; font-family: Georgia, "Times New Roman", serif; font-size: 2.25rem; line-height: 1.1; font-weight: 700; }
    .date { margin-top: 1rem; color: var(--muted); font-size: .875rem; }
    .body-wrap { margin-top: 1.75rem; }
    .article-content { color: #273247; font-family: Georgia, "Times New Roman", serif; font-size: 1.125rem; line-height: 1.9; }
    .article-content h1, .article-content h2, .article-content h3, .article-content h4 { color: #172033; font-family: Inter, ui-sans-serif, system-ui, sans-serif; margin: 2rem 0 .75rem; }
    .article-content h1 { font-size: 2rem !important; line-height: 1.15 !important; font-weight: 800 !important; }
    .article-content h2 { font-size: 1.5rem !important; line-height: 1.3 !important; font-weight: 700 !important; }
    .article-content h3 { font-size: 1.25rem !important; line-height: 1.35 !important; font-weight: 600 !important; }
    .article-content h4 { font-size: 1.125rem !important; line-height: 1.35 !important; font-weight: 600 !important; }
    .article-content p, .article-content ul, .article-content ol, .article-content blockquote { margin: 1rem 0; }
    .article-content ul, .article-content ol { padding-left: 1.5rem; }
    .article-content ul { list-style-position: outside; list-style-type: disc; }
    .article-content ul[data-cms-list-style="dash"] { list-style: none; padding-left: 0; }
    .article-content ul[data-cms-list-style="dash"] > li { padding-left: 1.5rem; position: relative; }
    .article-content ul[data-cms-list-style="dash"] > li::before { content: "-"; left: 0; position: absolute; }
    .article-content ol { list-style-position: outside; list-style-type: decimal; }
    .article-content a { color: var(--brand-strong); text-decoration: underline; }
    .article-content img { display: block; max-width: 100%; height: auto; margin: 1.5rem 0; border-radius: .5rem; }
    .article-content table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; font-family: Inter, ui-sans-serif, system-ui, sans-serif; font-size: 1rem; line-height: 1.5; }
    .article-content th, .article-content td { border: 1px solid var(--border); padding: .65rem .75rem; text-align: left; vertical-align: top; }
    .article-content th { background: #fafaf7; color: #172033; font-weight: 700; }
    .toc { margin-bottom: 2rem; border: 1px solid var(--border); border-radius: .5rem; background: white; padding: 1rem; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
    .toc h2 { margin: 0; font-size: 1.125rem; }
    .toc ol { display: grid; gap: .5rem; margin: .75rem 0 0; padding: 0; }
    .toc li { list-style: none; }
    .toc a { color: var(--brand-strong); text-decoration: none; }
    .toc a:hover { text-decoration: underline; }
    aside .card { position: sticky; top: 1.25rem; border: 1px solid var(--border); border-radius: .75rem; background: white; padding: 1rem; }
    aside h2 { margin: 0; font-size: 1rem; }
    aside p { color: var(--muted); font-size: .875rem; line-height: 1.6; }
    footer { margin-top: 4rem; border-top: 1px solid var(--border); background: white; }
    .footer-inner { display: flex; flex-direction: column; justify-content: space-between; gap: .75rem; padding-top: 2rem; padding-bottom: 2rem; color: var(--muted); font-size: .875rem; }
    .footer-links { display: flex; gap: 1rem; }
    @media (min-width: 640px) { .footer-inner { flex-direction: row; } }
    @media (min-width: 1024px) { .article-grid { grid-template-columns: minmax(0, 760px) 260px; } h1 { font-size: 2.5rem; } }
  </style>
</head>
<body>
  <header>
    <div class="header-inner">
      <a class="brand" href="#">CMS Auto Việt Nam</a>
      <nav><a href="#">Thị trường</a><a href="#">Kiến thức</a><a href="#">Phân tích</a><a href="#">Bài viết</a><span>Tìm kiếm</span></nav>
    </div>
  </header>
  <main>
    <article class="article-grid">
      <div>
        <p class="eyebrow">Preview</p>
        <h1>${escapedTitle}</h1>
        <p class="date">${publishedDate}</p>
        <div class="body-wrap">${renderPreviewToc(headings)}<div class="article-content">${renderMarkdown(markdown, [...headings])}</div></div>
      </div>
      <aside><div class="card"><h2>Bài liên quan</h2><p>Khu vực này sẽ hiển thị bài liên quan sau khi bài được publish.</p></div></aside>
    </article>
  </main>
  <footer><div class="footer-inner"><span>© 2026 CMS Auto Việt Nam</span><div class="footer-links"><a href="#">Trang chủ</a><a href="#">Giới thiệu</a></div></div></footer>
</body>
</html>`;
}

type PreviewHeading = {
  id: string;
  level: number;
  text: string;
};

function extractPreviewHeadings(markdown: string): PreviewHeading[] {
  const usedIds = new Map<string, number>();

  return markdown
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => /^\s{0,3}(#{1,4})\s+(.+?)\s*$/.exec(line))
    .filter((match): match is RegExpExecArray => Boolean(match))
    .map((match) => {
      const text = stripPreviewInlineMarkdown(cleanMarkdownHeadingText(match[2] ?? ""));
      const baseId = slugifyPreviewHeading(text) || "section";
      const count = usedIds.get(baseId) ?? 0;
      usedIds.set(baseId, count + 1);

      return {
        id: count === 0 ? baseId : `${baseId}-${count + 1}`,
        level: match[1]?.length ?? 1,
        text
      };
    });
}

function renderPreviewToc(headings: PreviewHeading[]) {
  if (headings.length === 0) return "";

  let h2Count = 0;
  const items = headings.map((heading) => {
    const label = heading.level === 2 ? `${++h2Count}. ${heading.text}` : heading.text;
    return `<li style="padding-left:${(heading.level - 1) * 0.9}rem"><a href="#${heading.id}">${escapeHtml(label)}</a></li>`;
  });

  return `<nav class="toc" aria-label="Table of Contents"><h2>Table of Contents</h2><ol>${items.join("")}</ol></nav>`;
}

function stripPreviewInlineMarkdown(value: string) {
  return value
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`~]/g, "")
    .trim();
}

function slugifyPreviewHeading(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function renderMarkdown(markdown: string, headings: PreviewHeading[]) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line) continue;
    if (isRawMarkdownTokenLine(line)) continue;

    const tableSeparator = lines[index + 1]?.trim() ?? "";
    if (isMarkdownTable([line, tableSeparator])) {
      const tableLines = [line, tableSeparator];
      index += 2;
      while (index < lines.length && lines[index].trim().startsWith("|")) {
        tableLines.push(lines[index].trim());
        index += 1;
      }
      index -= 1;
      html.push(renderMarkdownTable(tableLines));
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const markerPattern = line.startsWith("*") ? /^\*\s+/ : /^-\s+/;
      const listLines = [line];
      while (index + 1 < lines.length && markerPattern.test(lines[index + 1].trim())) {
        index += 1;
        listLines.push(lines[index].trim());
      }
      html.push(renderMarkdownBlock(listLines.join("\n"), headings));
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const listLines = [line];
      while (index + 1 < lines.length && /^\d+\.\s+/.test(lines[index + 1].trim())) {
        index += 1;
        listLines.push(lines[index].trim());
      }
      html.push(renderMarkdownBlock(listLines.join("\n"), headings));
      continue;
    }

    if (/^>\s+/.test(line)) {
      const quoteLines = [line];
      while (index + 1 < lines.length && /^>\s+/.test(lines[index + 1].trim())) {
        index += 1;
        quoteLines.push(lines[index].trim());
      }
      html.push(renderMarkdownBlock(quoteLines.join("\n"), headings));
      continue;
    }

    if (/^#{1,4}\s+/.test(line)) {
      html.push(renderMarkdownBlock(line, headings));
      continue;
    }

    const paragraphLines = [line];
    while (index + 1 < lines.length) {
      const nextLine = lines[index + 1].trim();
      if (!nextLine || /^(?:#{1,4}\s+|[-*]\s+|\d+\.\s+|>\s+)/.test(nextLine)) break;
      paragraphLines.push(nextLine);
      index += 1;
    }
    html.push(renderMarkdownBlock(paragraphLines.join("\n"), headings));
  }

  return html.join("");
}

function renderMarkdownBlock(block: string, headings: PreviewHeading[]) {
  if (!block) return "";

  if (block.startsWith("#### ")) return renderHeadingBlock(4, headings.shift()?.id ?? "", block.slice(5));
  if (block.startsWith("### ")) return renderHeadingBlock(3, headings.shift()?.id ?? "", block.slice(4));
  if (block.startsWith("## ")) return renderHeadingBlock(2, headings.shift()?.id ?? "", block.slice(3));
  if (block.startsWith("# ")) return renderHeadingBlock(1, headings.shift()?.id ?? "", block.slice(2));

  const lines = block.split("\n");
  if (isMarkdownTable(lines)) {
    return renderMarkdownTable(lines);
  }

  if (lines.every((line) => /^-\s+/.test(line))) {
    return `<ul data-cms-list-style="dash">${lines.map((line) => `<li>${renderInlineMarkdown(line.replace(/^-\s+/, ""))}</li>`).join("")}</ul>`;
  }

  if (lines.every((line) => /^\*\s+/.test(line))) {
    return `<ul data-cms-list-style="dot">${lines.map((line) => `<li>${renderInlineMarkdown(line.replace(/^\*\s+/, ""))}</li>`).join("")}</ul>`;
  }

  if (lines.every((line) => /^\d+\.\s+/.test(line))) {
    return `<ol>${lines.map((line) => `<li>${renderInlineMarkdown(line.replace(/^\d+\.\s+/, ""))}</li>`).join("")}</ol>`;
  }

  if (lines.every((line) => line.startsWith("> "))) {
    return `<blockquote>${lines.map((line) => renderInlineMarkdown(line.slice(2))).join("<br />")}</blockquote>`;
  }

  return `<p>${renderInlineMarkdown(lines.join("\n"))}</p>`;
}

function renderHeadingBlock(level: 1 | 2 | 3 | 4, id: string, value: string) {
  return `<h${level} id="${escapeAttribute(id)}" style="${headingStyle(level)}">${renderInlineMarkdown(cleanMarkdownHeadingText(value))}</h${level}>`;
}

function headingStyle(level: 1 | 2 | 3 | 4) {
  const styles = {
    1: "font-size:2rem;line-height:1.15;font-weight:800;margin:1.5rem 0 .875rem",
    2: "font-size:1.5rem;line-height:1.3;font-weight:700;margin:1.25rem 0 .75rem",
    3: "font-size:1.25rem;line-height:1.35;font-weight:600;margin:1rem 0 .625rem",
    4: "font-size:1.125rem;line-height:1.35;font-weight:600;margin:.875rem 0 .5rem"
  };

  return styles[level];
}

function cleanMarkdownHeadingText(value: string) {
  return value.replace(/\s*#{1,6}\s*$/, "").trim();
}

function isMarkdownTable(lines: string[]) {
  return lines.length >= 2 && /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(lines[1]);
}

function renderMarkdownTable(lines: string[]) {
  const header = parseMarkdownTableRow(lines[0]);
  const body = lines.slice(2).map(parseMarkdownTableRow).filter((row) => row.length > 0);

  return `<table><thead><tr>${header.map((cell) => `<th>${renderInlineMarkdown(cell)}</th>`).join("")}</tr></thead><tbody>${body.map((row) => `<tr>${row.map((cell) => `<td>${renderInlineMarkdown(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
}

function parseMarkdownTableRow(line: string) {
  return line
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function renderInlineMarkdown(value: string) {
  return escapeHtml(value)
    .replace(/!\[([^\]]*)\]\(((?:https?:\/\/|data:image\/)[^)\s]+)\)/g, '<img alt="$1" src="$2" />')
    .replace(/\[([^\]]+)\]\(highlight:yellow\)/g, '<mark style="background:#fff3a8;color:inherit;padding:0 .12em;border-radius:.15em">$1</mark>')
    .replace(/\[([^\]]+)\]\(highlight:green\)/g, '<mark style="background:#dff3c4;color:inherit;padding:0 .12em;border-radius:.15em">$1</mark>')
    .replace(/\[([^\]]+)\]\(highlight:pink\)/g, '<mark style="background:#ffd6df;color:inherit;padding:0 .12em;border-radius:.15em">$1</mark>')
    .replace(/\[([^\]]+)\]\(underline:\)/g, "<u>$1</u>")
    .replace(/\[([^\]]+)\]\(((?:https?:\/\/|\/)[^)\s]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br />");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttribute(value: string) {
  return escapeHtml(value);
}

function toDatetimeLocalValue(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function datetimeLocalToIso(value: string) {
  return new Date(value).toISOString();
}

function isValidDatetimeLocal(value: string) {
  return value.length > 0 && !Number.isNaN(new Date(value).getTime());
}

function formatLocalSchedule(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}
