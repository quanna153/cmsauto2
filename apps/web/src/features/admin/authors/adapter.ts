import { initialAuthors } from "./mock";
import { normalizeAuthorInput, type Author, type AuthorInput } from "./model";

const storageKey = "cmsauto.admin.authors.v1";
const articleAuthorStorageKey = "cmsauto.admin.article-authors.v1";
const articleAuditAuthorStorageKey = "cmsauto.admin.article-audit-authors.v1";

function readAuthors() {
  const stored = window.localStorage.getItem(storageKey);
  if (!stored) {
    writeAuthors(initialAuthors);
    return initialAuthors;
  }

  try {
    const authors = JSON.parse(stored) as Author[];
    return Array.isArray(authors)
      ? authors.map((author) => ({ ...author, avatarUrl: author.avatarUrl ?? "", language: author.language ?? "vi" }))
      : initialAuthors;
  } catch {
    writeAuthors(initialAuthors);
    return initialAuthors;
  }
}

function writeAuthors(authors: Author[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(authors));
}

export async function listAuthors() {
  return readAuthors();
}

export async function createAuthor(input: AuthorInput) {
  const authors = readAuthors();
  const normalized = normalizeAuthorInput(input);
  const author: Author = {
    ...normalized,
    id: crypto.randomUUID(),
    updatedAt: new Date().toISOString()
  };
  writeAuthors([author, ...authors]);
  return author;
}

export async function updateAuthor(id: string, input: AuthorInput) {
  const authors = readAuthors();
  const normalized = normalizeAuthorInput(input);
  const updatedAt = new Date().toISOString();
  const nextAuthors = authors.map((author) => author.id === id ? { ...author, ...normalized, updatedAt } : author);
  writeAuthors(nextAuthors);
}

export async function deleteAuthor(id: string) {
  writeAuthors(readAuthors().filter((author) => author.id !== id));
}

export async function assignArticleAuthor(articleId: string, authorId: string) {
  const assignments = readArticleAuthorAssignments();
  window.localStorage.setItem(articleAuthorStorageKey, JSON.stringify({ ...assignments, [articleId]: authorId }));
}

function readArticleAuthorAssignments() {
  const stored = window.localStorage.getItem(articleAuthorStorageKey);
  try {
    const assignments = stored ? JSON.parse(stored) as Record<string, string> : {};
    return assignments && typeof assignments === "object" ? assignments : {};
  } catch {
    return {};
  }
}

export async function listArticleAuthorAssignments() {
  return readArticleAuthorAssignments();
}

export async function assignArticleAuditAuthor(articleId: string, authorId: string) {
  const assignments = readArticleAuditAuthorAssignments();
  window.localStorage.setItem(articleAuditAuthorStorageKey, JSON.stringify({ ...assignments, [articleId]: authorId }));
}

function readArticleAuditAuthorAssignments() {
  const stored = window.localStorage.getItem(articleAuditAuthorStorageKey);
  try {
    const assignments = stored ? JSON.parse(stored) as Record<string, string> : {};
    return assignments && typeof assignments === "object" ? assignments : {};
  } catch {
    return {};
  }
}

export async function listArticleAuditAuthorAssignments() {
  return readArticleAuditAuthorAssignments();
}
