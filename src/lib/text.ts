/** Lowercase and strip Vietnamese diacritics so "thu tin dung" matches "Thư tín dụng". */
export function foldVi(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}
