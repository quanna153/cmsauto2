export type AuthorStatus = "active" | "inactive";
export type AuthorLanguage = "vi" | "en";

export type Author = {
  id: string;
  name: string;
  slug: string;
  email: string;
  role: string;
  bio: string;
  avatarUrl: string;
  language: AuthorLanguage;
  status: AuthorStatus;
  updatedAt: string;
};

export type AuthorInput = Pick<Author, "name" | "slug" | "email" | "role" | "bio" | "avatarUrl" | "language" | "status">;

export const emptyAuthorInput: AuthorInput = {
  name: "",
  slug: "",
  email: "",
  role: "",
  bio: "",
  avatarUrl: "",
  language: "vi",
  status: "active"
};

export function normalizeAuthorInput(input: AuthorInput): AuthorInput {
  return {
    name: input.name.trim(),
    slug: input.slug.trim().replace(/^\/+|\/+$/g, ""),
    email: input.email.trim().toLocaleLowerCase(),
    role: input.role.trim(),
    bio: input.bio.trim(),
    avatarUrl: input.avatarUrl ?? "",
    language: input.language ?? "vi",
    status: input.status
  };
}

export function slugifyAuthorName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function authorInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toLocaleUpperCase())
    .join("");
}
