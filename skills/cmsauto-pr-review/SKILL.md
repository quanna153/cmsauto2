---
name: cmsauto-pr-review
description: Review PR CMS Auto theo scope, boundary và bằng chứng kiểm thử. Dùng trước khi gửi hoặc merge một feature branch.
---

# CMS Auto PR Review

## Khi nào dùng

- Trước khi mở PR.
- Khi review branch của một thành viên.

## Quy trình

1. Đọc context pack của ticket.
2. Chạy `git diff --stat main...HEAD` và `git diff main...HEAD`.
3. Từ chối PR nếu có secret, DB, artifacts hoặc file ngoài scope chưa được giải thích.
4. Kiểm tra route chỉ import feature entrypoint.
5. Kiểm tra UI dùng kit shared, có responsive và state cần thiết.
6. Kiểm tra client không sửa core contract hoặc server-owned state.
7. Chạy verify phù hợp.

## Common Rationalizations

| Suy nghĩ sai | Thực tế |
| --- | --- |
| “CI xanh nên merge được.” | CI không chứng minh diff đúng scope hoặc UI đúng mockup. |
| “Shared change chỉ vài dòng.” | Shared change cần owner review riêng. |
| “Ảnh mobile không cần vì Tailwind responsive.” | Responsive phải được kiểm tra bằng bằng chứng. |

## Red Flags

- PR quá lớn, trộn nhiều feature.
- Có `.env.local`, DB hoặc generated files.
- Có thay đổi trong contracts, migration hoặc UI kit không thuộc ticket.
- Thiếu screenshot hoặc verify output.

## Verification

- [ ] Diff đúng scope.
- [ ] `pnpm handoff:check` pass.
- [ ] Verify commands pass.
- [ ] Có screenshot desktop/mobile.
- [ ] Shared changes có approval riêng nếu tồn tại.

