import type { AnchorHTMLAttributes, ComponentPropsWithoutRef, ReactNode } from "react";
import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";

export function ArticleBody({ markdown, showToc = true }: { markdown: string; showToc?: boolean }) {
  const headings = extractHeadings(markdown);
  const tocHeadings = numberTocHeadings(headings);
  const headingIds = [...headings];
  const dashListStartLines = getDashListStartLines(markdown);

  return <>
    {showToc && tocHeadings.length > 0 ? <nav aria-label="Table of Contents" className="mb-8 rounded-lg border border-[#E5E7EB] bg-white p-4 font-sans text-base leading-6 shadow-sm">
      <h2 className="m-0 text-lg font-bold text-[#111827]">Table of Contents</h2>
      <ol className="mt-3 grid gap-2 p-0">
        {tocHeadings.map((heading) =>
          <li className="list-none" key={heading.id} style={{ paddingLeft: `${(heading.level - 1) * 0.9}rem` }}>
            <a className="text-[#A88412] no-underline hover:underline" href={`#${heading.id}`}>{heading.label}</a>
          </li>
        )}
      </ol>
    </nav> : null}
    <div className="article-content article-prose">
      <ReactMarkdown components={{
        a: ReaderLink,
        h1: (props) => <ReaderHeading level={1} id={headingIds.shift()?.id} {...props} />,
        h2: (props) => <ReaderHeading level={2} id={headingIds.shift()?.id} {...props} />,
        h3: (props) => <ReaderHeading level={3} id={headingIds.shift()?.id} {...props} />,
        h4: (props) => <ReaderHeading level={4} id={headingIds.shift()?.id} {...props} />,
        ul: (props) => <ReaderUnorderedList dashListStartLines={dashListStartLines} {...props} />
      }} remarkPlugins={[remarkGfm]} urlTransform={readerUrlTransform}>{markdown}</ReactMarkdown>
    </div>
  </>;
}

type TocHeading = {
  id: string;
  level: number;
  text: string;
};

function numberTocHeadings(headings: TocHeading[]) {
  let h2Count = 0;

  return headings.map((heading) => {
    if (heading.level !== 2) {
      return { ...heading, label: heading.text };
    }

    h2Count += 1;
    return { ...heading, label: `${h2Count}. ${heading.text}` };
  });
}

function extractHeadings(markdown: string): TocHeading[] {
  const usedIds = new Map<string, number>();

  return markdown
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => /^(#{1,4})\s+(.+?)\s*$/.exec(line))
    .filter((match): match is RegExpExecArray => Boolean(match))
    .map((match) => {
      const text = stripInlineMarkdown(match[2] ?? "");
      const baseId = slugifyHeading(text) || "section";
      const count = usedIds.get(baseId) ?? 0;
      usedIds.set(baseId, count + 1);

      return {
        id: count === 0 ? baseId : `${baseId}-${count + 1}`,
        level: match[1]?.length ?? 1,
        text
      };
    });
}

function stripInlineMarkdown(value: string) {
  return value
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`~]/g, "")
    .trim();
}

function slugifyHeading(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getDashListStartLines(markdown: string) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const startLines = new Set<number>();

  lines.forEach((line, index) => {
    const previousLine = lines[index - 1]?.trim() ?? "";
    if (/^\s*-\s+/.test(line) && !/^\s*-\s+/.test(previousLine)) {
      startLines.add(index + 1);
    }
  });

  return startLines;
}

function readerUrlTransform(url: string, key: string) {
  if (key === "src" && /^data:image\/(?:png|jpe?g|gif|webp|avif|svg\+xml);base64,/i.test(url)) {
    return url;
  }

  if (key === "href" && (url === "underline:" || /^highlight:(yellow|green|pink)$/.test(url))) {
    return url;
  }

  return defaultUrlTransform(url);
}

function ReaderLink({ href, children }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  if (href === "underline:") {
    return <u>{children}</u>;
  }

  if (href === "highlight:yellow") {
    return <mark className="rounded-sm bg-[#fff3a8] px-0.5 text-inherit">{children}</mark>;
  }

  if (href === "highlight:green") {
    return <mark className="rounded-sm bg-[#dff3c4] px-0.5 text-inherit">{children}</mark>;
  }

  if (href === "highlight:pink") {
    return <mark className="rounded-sm bg-[#ffd6df] px-0.5 text-inherit">{children}</mark>;
  }

  return <a href={href}>{children}</a>;
}

type ReaderHeadingProps = ComponentPropsWithoutRef<"h1"> & {
  level: 1 | 2 | 3 | 4;
  children?: ReactNode;
};

type ReaderListProps = ComponentPropsWithoutRef<"ul"> & {
  dashListStartLines: Set<number>;
  node?: {
    position?: {
      start?: {
        line?: number;
      };
    };
  };
};

function ReaderUnorderedList({ dashListStartLines, node, ...props }: ReaderListProps) {
  const line = node?.position?.start?.line;
  const listStyle = line && dashListStartLines.has(line) ? "dash" : "dot";
  return <ul data-cms-list-style={listStyle} {...props} />;
}

function ReaderHeading({ level, id, children, ...props }: ReaderHeadingProps) {
  if (level === 1) {
    return <h1 id={id} {...props}>{children}</h1>;
  }

  if (level === 2) {
    return <h2 id={id} {...props}>{children}</h2>;
  }

  if (level === 3) {
    return <h3 id={id} {...props}>{children}</h3>;
  }

  return <h4 id={id} {...props}>{children}</h4>;
}
