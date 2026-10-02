/**
 * ERRATA register mirrored from KB §9.
 * - "T" (test-per-slide): may be tested; the correct answer follows the slide.
 *   If `extNoteRequired`, the explanation must carry an extNote.
 * - "N" (do-not-test): no MCQ may use this point as the basis of its correct answer.
 * - "info": editorial note only (no question constraint).
 * Questions reference an erratum through a tag `errata-E04` etc.
 */
export type ErrataMode = "T" | "N" | "info";

export interface Erratum {
  id: string;
  mode: ErrataMode;
  extNoteRequired: boolean;
  summaryVi: string;
}

export const ERRATA: Erratum[] = [
  { id: "E01", mode: "info", extNoteRequired: false, summaryVi: "Slide Thanh toán ghi “Chapter 3” – dùng C5." },
  { id: "E02", mode: "T", extNoteRequired: false, summaryVi: "Slide cấu trúc Incoterms 2010 (có DAT) – chỉ hỏi DAT trong ngữ cảnh 2010 vs 2020." },
  { id: "E03", mode: "T", extNoteRequired: true, summaryVi: "“Revocable L/C” – UCP 600 Art. 3: L/C là không hủy ngang kể cả khi không ghi." },
  { id: "E04", mode: "N", extNoteRequired: false, summaryVi: "Bảng 6.2 ghi ICC(B)/(C) bảo hiểm Theft/Nondelivery – không ra câu hỏi." },
  { id: "E05", mode: "T", extNoteRequired: false, summaryVi: "FPA≈C, WA≈B, AR≈A chỉ là tương ứng gần đúng – chỉ hỏi mức độ bảo hiểm." },
  { id: "E06", mode: "T", extNoteRequired: true, summaryVi: "Câu chữ về ngày L/C bị lỗi – dùng bản diễn đạt lại (issue < shipment < expiry; xuất trình ≤ 21 ngày)." },
  { id: "E07", mode: "N", extNoteRequired: false, summaryVi: "Slide ghi 1 mile = 1,609 km – không ra câu hỏi về mile." },
  { id: "E08", mode: "N", extNoteRequired: false, summaryVi: "CPTPP thiếu Chile trong danh sách – không hỏi “nước nào KHÔNG là thành viên” quanh Chile." },
  { id: "E09", mode: "N", extNoteRequired: false, summaryVi: "Số thứ tự bước trong sơ đồ T/T không rõ – không hỏi số bước cụ thể." },
  { id: "E10", mode: "T", extNoteRequired: false, summaryVi: "“Covey” = “Convey” trong sơ đồ chiến lược giá." },
  { id: "E11", mode: "N", extNoteRequired: false, summaryVi: "Ví dụ FOB và ví dụ B/L “Freight Prepaid” là hai ví dụ riêng – chỉ dùng làm case." },
  { id: "E12", mode: "T", extNoteRequired: false, summaryVi: "20 ngày (ví dụ HĐ) vs 21 ngày (quy tắc chung) không mâu thuẫn." },
  { id: "E13", mode: "T", extNoteRequired: true, summaryVi: "Định nghĩa hối phiếu có kỳ hạn “…and receives the goods” – giữ theo slide, kèm ghi chú." },
];

export const ERRATA_BY_ID: Record<string, Erratum> = Object.fromEntries(ERRATA.map((e) => [e.id, e]));

/** Parse `errata-E04` / `errata-E-04` tags into erratum ids. */
export function errataIdsFromTags(tags: string[]): string[] {
  return tags
    .map((tg) => /^errata-E-?(\d{2})$/i.exec(tg))
    .filter((m): m is RegExpExecArray => m !== null)
    .map((m) => `E${m[1]}`);
}
