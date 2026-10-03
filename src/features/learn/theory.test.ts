import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseTheory } from "./parseTheory";
import { EMBEDS } from "./embeds";
import { DIAGRAM_BY_ID } from "@/features/diagrams/catalog";

// Vitest runs from the project root (jsdom env has no file:// import.meta.url).
const dir = join(process.cwd(), "src", "content", "theory");
const read = (n: number) => readFileSync(join(dir, `c0${n}.md`), "utf8");
const norm = (s: string) => s.toLowerCase().replace(/\*\*/g, "").replace(/\s+/g, " ");

/**
 * Acceptance (Phase 2): every list/table in the KB appears in the theory.
 * Each entry: chapter → KB list name → distinctive item strings that must occur in that chapter.
 */
const KB_LISTS: Record<number, Record<string, string[]>> = {
  1: {
    "§1.2 physical flow (9)": ["Seller's factory", "Packing & loading at origin", "Export customs clearance", "Port/airport of loading", "International transport", "Port/airport of discharge", "Import customs clearance", "Inland transport to buyer", "Buyer's premises"],
    "§1.3 financial flow (A–E)": ["Buyer's bank", "Payment methods", "Seller's bank"],
    "§1.4 key documents": ["Commercial Invoice", "Packing List", "Export Declaration", "Bill of Lading / Air Waybill", "Certificate of Origin", "Import Declaration"],
    "§1.5 coordination": ["Right goods", "Right place", "Right time", "Right documents", "Right payment", "Acceptable risk"],
    "§1.6 six elements": ["Get ready to export", "Plan for market entry strategy", "Start finding foreign buyers", "Determine terms of sale and terms of payment", "Identify the steps required", "Research and confirm duties"],
    "§1.7 order process": ["Quotation", "Order entry", "Shipment", "Collection"],
    "§1.8 Figure 1-6": ["Treasury or Accounting", "Information Systems", "VP Marketing", "VP Purchasing", "Freight Forwarders", "Customs Brokers", "Insurance Companies and Sureties", "Packing Companies", "Translators", "Consulates", "Preshipment Inspection"],
    "§1.9 12 players": ["Exporter", "Importer", "Banks", "Port authorities", "Carrier/transporter", "Freight forwarder", "Customs", "Clearing agent", "Insurance companies", "Inspection companies", "Arbitrator", "Chamber of Commerce"],
    "§1.10 six roles": ["Facilitating international trade", "Coordinating international trade operations", "Managing risks", "Creating customer value", "Enhancing organizational competitiveness", "Enabling digital trade transformation", "documentary risk", "e-Bill of Lading"],
  },
  2: {
    "§2.1 nine components": ["Export objectives", "Target market and target customer", "Market entry / Distribution", "Product for foreign market", "Pricing & Payment", "Logistics & Delivery", "Resources & Responsibilities", "Financial analysis", "Risk management"],
    "§2.2 KPIs": ["Export Sales Revenue", "Export Sales Growth", "Gross Profit Margin", "Expected Profit", "Break-even Point", "Loss (%)"],
    "§2.3 target market": ["Technical Barriers to Trade", "Target Customer Profile"],
    "§2.4 market entry": ["Direct export", "Indirect export", "Cross-border e-commerce", "D2C"],
    "§2.5 IP protection": ["trademarks", "patents", "copyrights"],
    "§2.6 payment timing": ["prepayment", "payment at sight", "deferred payment"],
    "§2.9 formulas & FX example": ["Export Revenue = Export Quantity × Export Price", "EUR 50,400", "Gross Profit = Revenue − COGS", "Gross Profit Margin = Gross Profit / Revenue × 100%", "VND 1.50 billion", "VND 1.40 billion", "VND 1.60 billion", "VND 100 million"],
    "§2.10 six risks": ["Transportation risk", "Foreign credit / payment risk", "Foreign exchange risk", "Market risk", "Regulatory & compliance risk", "Political / country risk"],
    "§2.11 eleven questions": ["Is an export license needed?", "Which countries are targeted", "How will the product's export sales price be determined?", "How will results be evaluated"],
  },
  3: {
    "§3.1 six approaches": ["Cost-based pricing", "Marginal pricing", "Skimming pricing", "Penetration pricing", "Demand-based pricing", "Competitive pricing"],
    "§3.2 objectives → strategy": ["Maximize sales", "Convey an image of prestige", "Minimum price", "Maximum price", "Price skimming"],
    "§3.3 history & purpose": ["1936", "1953, 1967, 1976, 1980, 1990, 2000, 2010", "ICC"],
    "§3.3 scope": ["transfer of title", "payment terms or methods", "breach of contract"],
    "§3.4 2010 groups": ["E – Departure", "F – Main carriage unpaid", "C – Main carriage paid", "D – Arrival", "DAT"],
    "§3.6 seven differences": ["DPU – Delivered at Place Unloaded", "on-board B/L", "tối thiểu ICC (C)", "FCA, DAP, DPU, DDP", "A9/B9", "Explanatory Notes for Users", "an ninh"],
    "§3.7 carriage": ["Pre-carriage", "Main-carriage", "On-carriage", "Terminal Handling Charges"],
    "§3.8 11 rules": ["Ex Works", "Free Carrier", "Free Alongside Ship", "Free On Board", "Cost and Freight", "Cost, Insurance and Freight", "Carriage Paid To", "Carriage and Insurance Paid To", "Delivered at Place", "Delivered at Place Unloaded", "Delivered Duty Paid"],
  },
  4: {
    "§4.1 four risks": ["Political risk", "Foreign credit risk", "Transportation risk", "Foreign exchange / transfer risk"],
    "§4.3 principles": ["Insurable interest", "Subrogation"],
    "§4.5 Table 6.2 perils": ["Collision", "Discharge of cargo at port", "general average and salvage", "Jettison", "Overturning or derailment", "Vessel grounded, sunk, or stranded", "Earthquake, volcano, lightning", "Entry of sea, lake, or river water", "Total loss of cargo overboard", "Washing overboard", "any external cause", "Contact with other cargo", "Deliberate damage", "Fresh water", "Hook damage, mud grease", "Improper stowage by shipowner", "Nondelivery", "Pilferage", "Ship sweat, steam of hold", "Theft"],
    "§4.6 traditional": ["Free of Particular Average", "With (Particular) Average", "All Risks"],
    "§4.7 seven changes": ["DPU", "CIF và CIP", "A9/B9", "An ninh", "phương tiện vận tải riêng", "FCA – vận đơn on-board", "thân thiện hơn"],
  },
  5: {
    "§5.1 consignment problems": ["chậm thanh toán", "không được thanh toán", "chở hàng trả về", "ít nỗ lực bán hàng"],
    "§5.2 open account": ["30 đến 120 ngày"],
    "§5.3 T/T forms": ["payment in advance", "payment at sight", "deferred payment"],
    "§5.3 when to use CIA": ["khách hàng mới", "đáng ngờ, không đạt hoặc không kiểm chứng được", "chính trị và thương mại", "độc đáo"],
    "§5.4 drafts": ["Sight draft", "Time draft / Usance draft", "Drawer", "Drawee"],
    "§5.4 Figure 11.2 (7)": ["remitting bank", "collecting bank", "Người mua **chấp nhận** hoặc **trả tiền**"],
    "§5.4 when DC (4)": ["khả năng và thiện chí thanh toán", "ổn định về chính trị, kinh tế và pháp lý", "không hạn chế ngoại hối", "easily marketable"],
    "§5.5 parties": ["Applicant", "Beneficiary", "Issuing bank / Opening bank", "Advising bank", "Confirming bank / Paying bank"],
    "§5.5 11 L/C types": ["Revocable", "Irrevocable", "Irrevocable confirmed", "Irrevocable without recourse", "Back-to-back", "Transferable", "Revolving", "Standby", "Red clause", "Deferred payment", "Reciprocal"],
    "§5.5 13 contents": ["Issuing bank", "L/C number", "Place & date of issue", "Type of L/C", "Beneficiary", "Amount", "Expiry date", "Description of goods", "Required documents", "Terms of sale", "Terms and conditions of delivery", "Commitment of issuing bank", "Signature of issuing bank"],
    "§5.5 discrepancies": ["Accidental", "Minor", "Major", "written waiver", "amendment"],
    "§5.5 14-item checklist": ["All names and addresses are correct", "No unacceptable conditions", "Documents can be obtained in the required form", "Unit price and total price conform", "comply with the L/C amount", "Partial shipments / transshipments", "Description of goods consistent", "allow sufficient time", "Points of dispatch", "Freight payment indicated properly", "whom drafts are drawn", "less than 100% of invoice value", "Insurance coverage and the party paying charges", "All required documents need to be presented"],
  },
  6: {
    "§6.2 14 articles": ["Commodity", "Quality", "Quantity", "Packing & Marking", "Price", "Delivery", "Payment", "Documents", "Insurance", "Claim", "Penalty", "Arbitration", "Force Majeure", "Other terms & conditions"],
    "§6.4 5 quality methods": ["by samples", "by standard", "by detailed description", "by trademark/brand", "by technical documents", "Samsung Galaxy S25"],
    "§6.5 units & tolerance": ["1,016.05 kg", "907.18 kg", "0.914 m", "1.609 km", "at the Buyer's option", "net weight", "gross weight"],
    "§6.7 price elements": ["currency of price", "Incoterms®", "unit price", "Say: US Dollars Two Hundred and Fifty Thousand Only", "fixed price"],
    "§6.8 delivery": ["subject to shipping space available", "subject to the opening of L/C", "prompt", "as soon as possible", "ETD, ETA", "FOB Saigon Port", "3 ngày trước", "24 giờ"],
    "§6.9 payment": ["UCP 600", "60 days from the B/L date", "Tokyo Commercial Bank", "Vietcombank"],
    "§6.10 documents": ["Fumigation Certificate", "Dangerous Goods Declaration", "Full set 3/3 original clean on-board B/L", "C/O issued by VCCI", "20 ngày"],
    "§6.12 claim docs": ["Letter of Claim", "Survey Report", "Report on Receipt of Cargo", "Cargo Outturn Report", "latent defects"],
    "§6.14 CISG": ["11/4/1980", "1/1/1988", "18/12/2015", "1/1/2017"],
    "§6.15 force majeure": ["unforeseeable, unavoidable and impossible to overcome", "terminate", "prolong", "lockout"],
    "§6.16 other terms": ["Sửa đổi", "Chuyển nhượng", "Toàn bộ thỏa thuận", "bản tiếng Anh được ưu tiên", "Hiệu lực"],
    "§6.17 mistakes": ["Freight Prepaid", "Freight Collect"],
  },
  7: {
    "§7.1 shipping documents (8)": ["Invoice", "Bill of Lading", "Certificate of Quantity", "Certificate of Quality", "Packing List", "Certificate of Insurance / Insurance Policy", "Certificate of Origin", "Inspection Certificate"],
    "§7.2 documents (11)": ["Commercial invoice", "Pro forma invoice", "Air waybill", "Destination control statement", "Shipper's export declaration", "Export packing list", "Manifest"],
    "§7.3 invoice vs L/C (7)": ["beneficiary named in the L/C", "same currency", "description of goods", "tolerance", "unit price & total amount", "delivery terms/Incoterms", "marks, numbers"],
    "§7.5 B/L functions": ["receipt for shipment", "evidence of the contract of carriage", "document of title"],
    "§7.5 B/L types": ["Clean B/L", "Unclean B/L", "Shipped on board B/L", "Received for shipment B/L", "B/L to order", "Straight B/L", "Bearer B/L"],
    "§7.5 B/L checklist (19)": ["Name of ship", "Port of loading & port of discharge", "Place & date of issue", "agent of master", "Signature", "Shipped-on-board date", "Number of originals", "Clean on board", "L/C number on the B/L", "Order party", "Shipper name/address", "Consignee name/address", "Notify party name/address", "Shipping marks", "Number of packages", "Description of goods", "Weight", "Freight Collect / Payable at Destination", "Additional notations"],
    "§7.6 insurance docs": ["Insurance Certificate", "Insurance Policy", "Cover note", "không muộn hơn ngày giao hàng"],
    "§7.8 C/O forms": ["Form A", "Form B", "Form D", "Form E", "Form AK", "Form AJ", "Form AI", "Form AANZ", "Form RCEP", "Form VK", "Form VJ", "Form EUR.1", "Form EUR.1 UK", "Form CPTPP", "Chile", "10 nước ASEAN"],
    "§7.8 GSP": ["UNCTAD", "MFN"],
  },
  8: {
    "§8.1 considerations": ["Terms of sale – Incoterms®", "Method of payment"],
    "§8.2 export (10)": ["negotiate and sign the sales contract", "consider payment terms", "prepare goods for export", "inspect goods", "arrange transportation", "arrange cargo insurance", "complete export customs clearance", "deliver the goods", "prepare and present shipping documents for payment", "handle claims and resolve disputes"],
    "§8.3 import (9)": ["Đàm phán & ký hợp đồng mua bán", "mở L/C nếu thanh toán bằng L/C", "E & F", "E, F, CPT, CFR", "Làm thủ tục hải quan nhập khẩu", "take delivery of goods", "Kiểm tra hàng", "Khiếu nại & giải quyết khiếu nại", "make payment"],
  },
};

describe.each([1, 2, 3, 4, 5, 6, 7, 8])("theory c0%i.md", (n) => {
  const src = read(n);
  const text = norm(src);
  const theory = parseTheory(src);

  it("parses into sections with takeaways, traps and a visual summary", () => {
    expect(theory.intro.some((b) => b.type === "callout" && b.kind === "takeaways")).toBe(true);
    const ids = theory.sections.map((s) => s.id);
    expect(ids).toContain("traps");
    expect(ids).toContain("visual-summary");
    const visual = theory.sections.find((s) => s.id === "visual-summary")!;
    expect(visual.blocks.some((b) => b.type === "embed")).toBe(true);
  });

  it("only references existing embeds and has no stray heading ids", () => {
    const blocks = [...theory.intro, ...theory.sections.flatMap((s) => s.blocks)];
    for (const b of blocks) {
      if (b.type === "embed" && b.name.startsWith("diagram:")) expect(DIAGRAM_BY_ID.has(b.name.slice(8)), b.name).toBe(true);
      else if (b.type === "embed") expect(Object.keys(EMBEDS)).toContain(b.name);
      if (b.type !== "embed") expect(b.text).not.toMatch(/\{#[a-z0-9-]+\}/);
    }
  });

  it.each(Object.entries(KB_LISTS[n] ?? {}))("contains KB list %s", (_name, items) => {
    const missing = items.filter((it) => !text.includes(norm(it)));
    expect(missing).toEqual([]);
  });
});
