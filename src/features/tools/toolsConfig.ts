import type { ChapterId } from "@/config/chapters";

export interface ToolDef {
  id: string;
  chapter: ChapterId;
  title: string;
  description: string;
  phase: number;
}

export const TOOLS: ToolDef[] = [
  {
    id: "incoterms",
    chapter: "C3",
    title: "Incoterms® 2020 Explorer",
    description: "Chọn 1 trong 11 điều kiện → chuỗi vận tải với thanh CHI PHÍ / RỦI RO / BẢO HIỂM; so sánh 2 điều kiện.",
    phase: 2,
  },
  {
    id: "icc",
    chapter: "C4",
    title: "ICC Coverage Checker",
    description: "Chọn rủi ro → xem AR/WA/FPA và ICC (A)/(B)/(C) có bảo hiểm hay không (Bảng 6.2).",
    phase: 2,
  },
  {
    id: "payment-flow",
    chapter: "C5",
    title: "Payment Flow Stepper",
    description: "Từng bước T/T trả trước, T/T trả sau, D/P, D/A, L/C; so sánh rủi ro nhà XK vs nhà NK.",
    phase: 2,
  },
  {
    id: "lc-dates",
    chapter: "C5",
    title: "L/C Date Checker",
    description: "Nhập ngày phát hành, giao hàng, xuất trình, hết hạn → kiểm tra từng quy tắc về ngày của L/C.",
    phase: 2,
  },
  {
    id: "fx-profit",
    chapter: "C2",
    title: "FX & Export Profit Calculator",
    description: "Doanh thu, lãi/lỗ tỷ giá, lợi nhuận gộp, biên lợi nhuận — có sẵn ví dụ EUR 50,000 trên slide.",
    phase: 2,
  },
  {
    id: "clause-doctor",
    chapter: "C6",
    title: "Contract Clause Doctor",
    description: "Đọc điều khoản hợp đồng có lỗi → chọn loại lỗi → nhận phản hồi. (Tùy chọn)",
    phase: 5,
  },
];
