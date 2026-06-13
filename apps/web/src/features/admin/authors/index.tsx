"use client";

import { Camera, Contact, Pencil, Plus, Save, Search, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/ui/states";
import { Textarea } from "@/components/ui/textarea";

import { createAuthor, deleteAuthor, listAuthors, updateAuthor } from "./adapter";
import { authorInitials, emptyAuthorInput, normalizeAuthorInput, slugifyAuthorName, type Author, type AuthorInput, type AuthorLanguage, type AuthorStatus } from "./model";

const fieldLabelClassName = "grid gap-1 text-xs font-semibold uppercase text-[#687386]";
const maximumAvatarSize = 1024 * 1024;
const acceptedAvatarTypes = ["image/jpeg", "image/png", "image/webp"];
const languageLabels: Record<AuthorLanguage, string> = { vi: "Tiếng Việt", en: "English" };
const languageFlags: Record<AuthorLanguage, string> = { vi: "🇻🇳", en: "🇺🇸" };

async function readAvatar(file: File) {
  if (!acceptedAvatarTypes.includes(file.type)) throw new Error("Chỉ hỗ trợ ảnh PNG, JPEG hoặc WebP.");
  if (file.size > maximumAvatarSize) throw new Error("Ảnh tác giả không được lớn hơn 1 MB.");

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Không thể đọc ảnh đã chọn."));
    reader.readAsDataURL(file);
  });
}

export function AuthorsFeature() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [draft, setDraft] = useState<AuthorInput>(emptyAuthorInput);
  const [slugTouched, setSlugTouched] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | AuthorStatus>("all");
  const [language, setLanguage] = useState<"all" | AuthorLanguage>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function refreshAuthors() {
    setAuthors(await listAuthors());
  }

  useEffect(() => {
    let active = true;
    listAuthors()
      .then((items) => {
        if (active) setAuthors(items);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Không thể tải danh sách tác giả.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredAuthors = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase();
    return authors.filter((author) => {
      const matchesStatus = status === "all" || author.status === status;
      const matchesLanguage = language === "all" || author.language === language;
      const matchesSearch = !keyword || [author.name, author.email, author.role, author.slug]
        .some((value) => value.toLocaleLowerCase().includes(keyword));
      return matchesStatus && matchesLanguage && matchesSearch;
    });
  }, [authors, language, search, status]);

  const groupedAuthors = useMemo(() => ({
    vi: filteredAuthors.filter((author) => author.language === "vi"),
    en: filteredAuthors.filter((author) => author.language === "en")
  }), [filteredAuthors]);

  const normalizedDraft = normalizeAuthorInput(draft);
  const canCreate = normalizedDraft.name && normalizedDraft.slug && normalizedDraft.email && normalizedDraft.role;

  function closeCreateForm() {
    setDraft(emptyAuthorInput);
    setSlugTouched(false);
    setIsCreateOpen(false);
  }

  async function handleCreate() {
    setError("");
    setIsSaving(true);
    try {
      await createAuthor(draft);
      await refreshAuthors();
      closeCreateForm();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể thêm tác giả.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdate(id: string, input: AuthorInput) {
    setError("");
    setIsSaving(true);
    try {
      await updateAuthor(id, input);
      await refreshAuthors();
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể lưu thay đổi.");
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(author: Author) {
    if (!window.confirm(`Xóa tác giả "${author.name}"?`)) return;
    setError("");
    setIsSaving(true);
    try {
      await deleteAuthor(author.id);
      await refreshAuthors();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể xóa tác giả.");
    } finally {
      setIsSaving(false);
    }
  }

  return <>
    <PageHeader
      actions={<Button disabled={isCreateOpen} onClick={() => { setError(""); setIsCreateOpen(true); }}>
        <Plus size={16} />Thêm tác giả
      </Button>}
      description="Quản lý hồ sơ, vai trò và trạng thái của các tác giả viết bài."
      eyebrow="Admin"
      title="Quản lý tác giả"
    />

    {isCreateOpen ? <section className="mb-5 rounded-xl border bg-white p-4">
      <div className="mb-4 flex items-center gap-2">
        <Contact size={18} className="text-[#a88412]" />
        <h2 className="font-semibold text-[#172033]">Thêm tác giả</h2>
      </div>
      <div className="mb-4">
        <AvatarField
          name={draft.name}
          onChange={(avatarUrl) => setDraft((current) => ({ ...current, avatarUrl }))}
          value={draft.avatarUrl}
        />
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className={fieldLabelClassName}>
          Họ tên
          <Input
            onChange={(event) => {
              const name = event.target.value;
              setDraft((current) => ({ ...current, name, slug: slugTouched ? current.slug : slugifyAuthorName(name) }));
            }}
            placeholder="Nguyễn Minh Anh"
            value={draft.name}
          />
        </label>
        <label className={fieldLabelClassName}>
          Slug
          <Input
            onChange={(event) => {
              setSlugTouched(true);
              setDraft((current) => ({ ...current, slug: event.target.value }));
            }}
            placeholder="nguyen-minh-anh"
            value={draft.slug}
          />
        </label>
        <label className={fieldLabelClassName}>
          Email
          <Input
            onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))}
            placeholder="author@example.com"
            type="email"
            value={draft.email}
          />
        </label>
        <label className={fieldLabelClassName}>
          Vai trò
          <Input
            onChange={(event) => setDraft((current) => ({ ...current, role: event.target.value }))}
            placeholder="Biên tập viên"
            value={draft.role}
          />
        </label>
        <label className={`${fieldLabelClassName} md:col-span-2 xl:col-span-4`}>
          Giới thiệu
          <Textarea
            onChange={(event) => setDraft((current) => ({ ...current, bio: event.target.value }))}
            placeholder="Mô tả ngắn về chuyên môn của tác giả"
            rows={3}
            value={draft.bio}
          />
        </label>
      </div>
      <div className="mt-3 grid items-end gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto]">
        <label className={fieldLabelClassName}>
          Phần nội dung
          <Select
            onChange={(event) => setDraft((current) => ({ ...current, language: event.target.value as AuthorLanguage }))}
            value={draft.language}
          >
            <option value="vi">Tiếng Việt</option>
            <option value="en">English</option>
          </Select>
        </label>
        <label className={fieldLabelClassName}>
          Trạng thái
          <Select
            onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as AuthorStatus }))}
            value={draft.status}
          >
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Tạm ngưng</option>
          </Select>
        </label>
        <Button className="h-10 md:min-w-48" disabled={!canCreate || isSaving} onClick={handleCreate}>
          <Plus size={16} />Thêm tác giả
        </Button>
        <Button className="h-10" disabled={isSaving} onClick={closeCreateForm} variant="secondary">
          <X size={16} />Hủy
        </Button>
      </div>
    </section> : null}

    {error ? <div className="mb-5"><ErrorState message={error} /></div> : null}

    <div className="mb-5 grid gap-3 md:grid-cols-[1fr_180px_200px]">
      <label className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#687386]" size={16} />
        <Input
          aria-label="Tìm tác giả"
          className="pl-9"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Tìm theo tên, email, vai trò..."
          value={search}
        />
      </label>
      <Select aria-label="Lọc ngôn ngữ tác giả" onChange={(event) => setLanguage(event.target.value as "all" | AuthorLanguage)} value={language}>
        <option value="all">Tất cả ngôn ngữ</option>
        <option value="vi">Tiếng Việt</option>
        <option value="en">English</option>
      </Select>
      <Select aria-label="Lọc trạng thái tác giả" onChange={(event) => setStatus(event.target.value as "all" | AuthorStatus)} value={status}>
        <option value="all">Tất cả trạng thái</option>
        <option value="active">Đang hoạt động</option>
        <option value="inactive">Tạm ngưng</option>
      </Select>
    </div>

    {isLoading
      ? <LoadingSkeleton label="Đang tải danh sách tác giả..." />
      : authors.length === 0
        ? <EmptyState description="Thêm tác giả đầu tiên để bắt đầu quản lý hồ sơ viết bài." title="Chưa có tác giả" />
        : filteredAuthors.length === 0
          ? <EmptyState description="Thử thay đổi từ khóa hoặc bộ lọc trạng thái." title="Không tìm thấy tác giả" />
          : <div className="grid gap-7">
              {(language === "all" || language === "vi")
                ? <AuthorLanguageGroup
                    authors={groupedAuthors.vi}
                    disabled={isSaving}
                    language="vi"
                    onDelete={handleDelete}
                    onSave={handleUpdate}
                  />
                : null}
              {(language === "all" || language === "en")
                ? <AuthorLanguageGroup
                    authors={groupedAuthors.en}
                    disabled={isSaving}
                    language="en"
                    onDelete={handleDelete}
                    onSave={handleUpdate}
                  />
                : null}
            </div>}
  </>;
}

function AuthorLanguageGroup({
  authors,
  disabled,
  language,
  onDelete,
  onSave
}: {
  authors: Author[];
  disabled: boolean;
  language: AuthorLanguage;
  onDelete: (author: Author) => void;
  onSave: (id: string, input: AuthorInput) => Promise<boolean>;
}) {
  return <section>
    <div className="mb-3 flex items-center gap-2 border-b pb-3">
      <span aria-hidden="true" className="text-lg leading-none">{languageFlags[language]}</span>
      <h2 className="font-semibold text-[#172033]">{languageLabels[language]}</h2>
      <Badge>{authors.length} tác giả</Badge>
    </div>
    {authors.length
      ? <div className="grid gap-4 xl:grid-cols-2">
          {authors.map((author) =>
            <AuthorCard
              author={author}
              disabled={disabled}
              key={author.id}
              onDelete={() => onDelete(author)}
              onSave={(input) => onSave(author.id, input)}
            />
          )}
        </div>
      : <div className="rounded-xl border border-dashed bg-white p-5 text-sm text-[#687386]">
          Chưa có tác giả cho phần {languageLabels[language]}.
        </div>}
  </section>;
}

function AuthorCard({
  author,
  disabled,
  onDelete,
  onSave
}: {
  author: Author;
  disabled: boolean;
  onDelete: () => void;
  onSave: (input: AuthorInput) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState<AuthorInput>(author);
  const [isEditing, setIsEditing] = useState(false);
  const normalizedDraft = normalizeAuthorInput(draft);
  const canSave = normalizedDraft.name && normalizedDraft.slug && normalizedDraft.email && normalizedDraft.role;

  useEffect(() => {
    setDraft(author);
  }, [author]);

  function handleCancel() {
    setDraft(author);
    setIsEditing(false);
  }

  async function handleSave() {
    if (await onSave(draft)) setIsEditing(false);
  }

  return <article className="rounded-xl border bg-white p-4">
    <div className="mb-4 flex flex-col items-start gap-4 sm:flex-row sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <AuthorAvatar avatarUrl={author.avatarUrl} name={author.name} />
        <div className="min-w-0">
          <strong className="block truncate text-[#172033]">{author.name}</strong>
          <p className="truncate text-xs text-[#687386]">/{author.slug}</p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap justify-start gap-2 sm:justify-end">
        <Badge className="bg-[#eef3fb] text-[#34527a]">{languageLabels[author.language]}</Badge>
        <Badge className={author.status === "active" ? "bg-green-50 text-green-700" : ""}>
          {author.status === "active" ? "Đang hoạt động" : "Tạm ngưng"}
        </Badge>
        {!isEditing
          ? <Button aria-label={`Chỉnh sửa tác giả ${author.name}`} onClick={() => setIsEditing(true)} size="sm" variant="secondary">
              <Pencil size={14} />Chỉnh sửa
            </Button>
          : null}
      </div>
    </div>

    {isEditing
      ? <>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <AvatarField
                name={draft.name}
                onChange={(avatarUrl) => setDraft((current) => ({ ...current, avatarUrl }))}
                value={draft.avatarUrl}
              />
            </div>
            <label className={fieldLabelClassName}>
              Họ tên
              <Input onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} value={draft.name} />
            </label>
            <label className={fieldLabelClassName}>
              Slug
              <Input onChange={(event) => setDraft((current) => ({ ...current, slug: event.target.value }))} value={draft.slug} />
            </label>
            <label className={fieldLabelClassName}>
              Email
              <Input onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))} type="email" value={draft.email} />
            </label>
            <label className={fieldLabelClassName}>
              Vai trò
              <Input onChange={(event) => setDraft((current) => ({ ...current, role: event.target.value }))} value={draft.role} />
            </label>
            <label className={`${fieldLabelClassName} sm:col-span-2`}>
              Giới thiệu
              <Textarea onChange={(event) => setDraft((current) => ({ ...current, bio: event.target.value }))} rows={3} value={draft.bio} />
            </label>
            <label className={fieldLabelClassName}>
              Phần nội dung
              <Select onChange={(event) => setDraft((current) => ({ ...current, language: event.target.value as AuthorLanguage }))} value={draft.language}>
                <option value="vi">Tiếng Việt</option>
                <option value="en">English</option>
              </Select>
            </label>
            <label className={fieldLabelClassName}>
              Trạng thái
              <Select onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as AuthorStatus }))} value={draft.status}>
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Tạm ngưng</option>
              </Select>
            </label>
            <p className="self-end pb-2 text-xs text-[#687386]">
              Cập nhật {new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(author.updatedAt))}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
            <Button disabled={!canSave || disabled} onClick={handleSave} size="sm" variant="secondary">
              <Save size={15} />Lưu thay đổi
            </Button>
            <Button disabled={disabled} onClick={handleCancel} size="sm" variant="ghost">
              <X size={15} />Hủy
            </Button>
            <Button aria-label={`Xóa tác giả ${author.name}`} disabled={disabled} onClick={onDelete} size="sm" variant="ghost">
              <Trash2 size={15} />Xóa
            </Button>
          </div>
        </>
      : <>
          <dl className="grid gap-x-5 gap-y-4 border-t pt-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase text-[#687386]">Email</dt>
              <dd className="mt-1 break-words text-sm font-medium text-[#273247]">{author.email}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-[#687386]">Vai trò</dt>
              <dd className="mt-1 text-sm font-medium text-[#273247]">{author.role}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold uppercase text-[#687386]">Giới thiệu</dt>
              <dd className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#566174]">{author.bio || "Chưa có thông tin giới thiệu."}</dd>
            </div>
          </dl>
          <p className="mt-4 border-t pt-3 text-xs text-[#687386]">
            Cập nhật {new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(author.updatedAt))}
          </p>
        </>}
  </article>;
}

function AuthorAvatar({ avatarUrl, name, size = "small" }: { avatarUrl: string; name: string; size?: "small" | "large" }) {
  const sizeClassName = size === "large" ? "size-20 text-lg" : "size-11 text-sm";
  return <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#172033] font-bold text-white ${sizeClassName}`}>
    {avatarUrl
      ? <img alt={`Ảnh đại diện ${name || "tác giả"}`} className="size-full object-cover" src={avatarUrl} />
      : authorInitials(name)}
  </div>;
}

function AvatarField({ name, onChange, value }: { name: string; onChange: (value: string) => void; value: string }) {
  const [error, setError] = useState("");

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError("");
    try {
      onChange(await readAvatar(file));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể cập nhật ảnh tác giả.");
    }
  }

  return <div className="flex flex-col gap-3 rounded-lg border bg-[#fafaf8] p-3 sm:flex-row sm:items-center">
    <AuthorAvatar avatarUrl={value} name={name} size="large" />
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase text-[#687386]">Ảnh tác giả</p>
      <p className="mt-1 text-xs text-[#687386]">PNG, JPEG hoặc WebP, tối đa 1 MB.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border bg-white px-3 py-1.5 text-xs font-semibold text-[#273247] transition hover:bg-[#f7f7f4]">
          <Camera size={15} />{value ? "Thay ảnh" : "Chọn ảnh"}
          <input
            accept={acceptedAvatarTypes.join(",")}
            className="sr-only"
            onChange={(event) => {
              void handleFile(event.target.files?.[0]);
              event.currentTarget.value = "";
            }}
            type="file"
          />
        </label>
        {value
          ? <Button onClick={() => { setError(""); onChange(""); }} size="sm" type="button" variant="ghost">
              <Trash2 size={15} />Xóa ảnh
            </Button>
          : null}
      </div>
      {error ? <p className="mt-2 text-xs font-medium text-red-600">{error}</p> : null}
    </div>
  </div>;
}
