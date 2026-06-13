import type { Author } from "./model";

export const initialAuthors: Author[] = [
  {
    id: "author-nguyen-minh-anh",
    name: "Nguyễn Minh Anh",
    slug: "nguyen-minh-anh",
    email: "minhanh@cmsauto.local",
    role: "Biên tập viên",
    bio: "Phụ trách nội dung hướng dẫn và kiến thức nền tảng.",
    avatarUrl: "",
    language: "vi",
    status: "active",
    updatedAt: "2026-06-08T02:30:00.000Z"
  },
  {
    id: "author-tran-quoc-huy",
    name: "Trần Quốc Huy",
    slug: "tran-quoc-huy",
    email: "quochuy@cmsauto.local",
    role: "Chuyên gia nội dung",
    bio: "Review nội dung chuyên sâu trước khi xuất bản.",
    avatarUrl: "",
    language: "en",
    status: "active",
    updatedAt: "2026-06-07T09:15:00.000Z"
  },
  {
    id: "author-le-thu-ha",
    name: "Lê Thu Hà",
    slug: "le-thu-ha",
    email: "thuha@cmsauto.local",
    role: "Cộng tác viên",
    bio: "Viết nội dung theo kế hoạch và brief của ban biên tập.",
    avatarUrl: "",
    language: "vi",
    status: "inactive",
    updatedAt: "2026-06-05T04:45:00.000Z"
  }
];
