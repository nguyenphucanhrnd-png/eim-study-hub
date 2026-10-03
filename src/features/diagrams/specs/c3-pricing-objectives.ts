import type { DiagramSpec } from "../engine/types";

const SRC = "KB §3.2 · Slide C3 p.6";

/**
 * D3.1 — "Pricing objectives and pricing strategy" (slide C3 p.6): objectives → price level → strategies,
 * two branches, double arrow between the two strategy boxes. Wording per KB §3.2; slide remarks in `note`.
 */
const spec: DiagramSpec = {
  id: "c3-pricing-objectives",
  chapter: "C3",
  title: "Pricing objectives and pricing strategy",
  titleVi: "Mục tiêu định giá → chiến lược giá",
  provenance: "slide",
  slideRef: "C3 p.6",
  note: "Ghi chú về slide: slide ghi “Covey” (đúng là “Convey”, ERRATA E-10) và “different prices for all markets”; KB dùng cách viết “different prices for different markets”.",
  nodeFont: 17,
  legendRoles: false,
  zones: [
    { label: "Pricing objectives", x: 10, y: 20, w: 980, h: 135 },
    { label: "Price level", x: 10, y: 205, w: 980, h: 135 },
    { label: "Pricing strategies", x: 10, y: 390, w: 980, h: 170 },
  ],
  nodes: [
    { id: "o-sales", label: "Maximize\nsales", role: "seller", x: 95, y: 98, w: 150, h: 70, shape: "rect", descVi: "Mục tiêu tối đa hóa doanh số → giá tối thiểu." },
    { id: "o-share", label: "Increase\nmarket share", role: "seller", x: 255, y: 98, w: 150, h: 70, shape: "rect", descVi: "Mục tiêu tăng thị phần → giá tối thiểu; penetration pricing = giá thấp để tăng thị phần." },
    { id: "o-discount", label: "Convey image\nof discounts", role: "seller", x: 415, y: 98, w: 150, h: 70, shape: "rect", descVi: "Truyền tải hình ảnh giảm giá → giá tối thiểu." },
    { id: "o-profit", label: "Achieve a desired\nprofit level", role: "buyer", x: 660, y: 98, w: 190, h: 70, shape: "rect", descVi: "Đạt mức lợi nhuận mong muốn → giá tối đa." },
    { id: "o-prestige", label: "Convey image\nof prestige", role: "buyer", x: 870, y: 98, w: 190, h: 70, shape: "rect", descVi: "Truyền tải hình ảnh uy tín, sang trọng → giá tối đa; skimming = giá cao (premium)." },
    { id: "p-min", label: "Minimum price", labelVi: "Same price for all markets", role: "seller", x: 255, y: 282, w: 340, h: 82, shape: "rect", descVi: "Giá tối thiểu; một mức giá cho tất cả thị trường." },
    { id: "p-max", label: "Maximum price", labelVi: "Different prices for different markets", role: "buyer", x: 765, y: 282, w: 340, h: 82, shape: "rect", descVi: "Giá tối đa; giá khác nhau cho các thị trường khác nhau." },
    { id: "s-low", label: "Penetration pricing\nCost-based pricing", role: "seller", x: 255, y: 480, w: 340, h: 100, shape: "rect", descVi: "Penetration: giá thấp để tăng thị phần. Cost-based: giá dựa trên toàn bộ chi phí cộng mức lãi (markup) hoặc lợi nhuận trên vốn mong muốn.", links: [{ label: "C3 · 6 phương pháp định giá", to: "/learn/c3#pricing-approaches" }] },
    { id: "s-high", label: "Price skimming\nDemand-based pricing", role: "buyer", x: 765, y: 480, w: 340, h: 100, shape: "rect", descVi: "Skimming: định giá cao (premium). Demand-based: giá dựa trên mức người mua sẵn sàng trả, do cầu thị trường quyết định.", links: [{ label: "C3 · 6 phương pháp định giá", to: "/learn/c3#pricing-approaches" }] },
  ],
  edges: [
    { id: "a1", from: "o-sales", to: "p-min", kind: "sequence" },
    { id: "a2", from: "o-share", to: "p-min", kind: "sequence" },
    { id: "a3", from: "o-discount", to: "p-min", kind: "sequence" },
    { id: "a4", from: "p-min", to: "s-low", kind: "sequence" },
    { id: "b1", from: "o-profit", to: "p-max", kind: "sequence" },
    { id: "b2", from: "o-prestige", to: "p-max", kind: "sequence" },
    { id: "b3", from: "p-max", to: "s-high", kind: "sequence" },
    { id: "ab", from: "s-low", to: "s-high", kind: "sequence", both: true },
  ],
  steps: [
    {
      id: "branch-low",
      order: 1,
      badge: "A",
      title: "Maximize sales / market share / image of discounts → minimum price → penetration or cost-based pricing",
      titleVi: "Nhánh A: doanh số, thị phần, hình ảnh giảm giá → giá tối thiểu",
      edgeIds: ["a4", "a1", "a2", "a3"],
      actors: ["p-min", "o-sales", "o-share", "o-discount", "s-low"],
      what: "Các mục tiêu tối đa hóa doanh số, tăng thị phần, truyền tải hình ảnh giảm giá dẫn đến giá tối thiểu, một giá cho mọi thị trường, với chiến lược penetration pricing hoặc cost-based pricing.",
      why: "Giá thấp giúp mở rộng doanh số và thị phần.",
      trap: "Penetration pricing = giá THẤP để tăng thị phần; đừng nhầm với skimming (giá cao).",
      source: SRC,
      practiceTopic: "pricing-objectives",
    },
    {
      id: "branch-high",
      order: 2,
      badge: "B",
      title: "Desired profit level / image of prestige → maximum price → price skimming or demand-based pricing",
      titleVi: "Nhánh B: lợi nhuận mong muốn, hình ảnh uy tín → giá tối đa",
      edgeIds: ["b3", "b1", "b2"],
      actors: ["p-max", "o-profit", "o-prestige", "s-high"],
      what: "Các mục tiêu đạt mức lợi nhuận mong muốn, truyền tải hình ảnh uy tín dẫn đến giá tối đa, giá khác nhau cho các thị trường, với chiến lược price skimming hoặc demand-based pricing.",
      why: "Giá cao gắn với lợi nhuận và hình ảnh cao cấp.",
      trap: "Skimming = giá cao (premium) – thuộc nhánh giá tối đa.",
      source: SRC,
      practiceTopic: "pricing-objectives",
    },
  ],
  keyTakeaways: [
    "Doanh số / thị phần / hình ảnh giảm giá → giá tối thiểu → penetration, cost-based.",
    "Lợi nhuận mong muốn / hình ảnh uy tín → giá tối đa → skimming, demand-based.",
  ],
};

export default spec;

/** Mini-classifier: 6 short scenarios written from the KB definitions only. */
export const PRICING_SCENARIOS = [
  { id: "p1", textVi: "Doanh nghiệp muốn nhanh chóng tăng thị phần ở thị trường mới bằng giá thấp.", bucket: "low", whyVi: "Penetration pricing: giá thấp để tăng thị phần." },
  { id: "p2", textVi: "Doanh nghiệp đặt mục tiêu tối đa hóa doanh số.", bucket: "low", whyVi: "Maximize sales → giá tối thiểu." },
  { id: "p3", textVi: "Doanh nghiệp muốn khách hàng thấy hình ảnh hàng giảm giá.", bucket: "low", whyVi: "Convey image of discounts → giá tối thiểu." },
  { id: "p4", textVi: "Doanh nghiệp muốn đạt một mức lợi nhuận mong muốn.", bucket: "high", whyVi: "Achieve a desired profit level → giá tối đa." },
  { id: "p5", textVi: "Doanh nghiệp muốn truyền tải hình ảnh uy tín, cao cấp.", bucket: "high", whyVi: "Convey image of prestige → giá tối đa." },
  { id: "p6", textVi: "Doanh nghiệp định giá cao (premium) cho sản phẩm.", bucket: "high", whyVi: "Price skimming = giá premium." },
];
