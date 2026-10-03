/** Lists reused by the C5 L/C diagrams (verbatim from KB §5.5). */

export const LC_CONTENTS = [
  "Issuing bank",
  "L/C number",
  "Place & date of issue",
  "Type of L/C",
  "Beneficiary",
  "Amount",
  "Expiry date",
  "Description of goods",
  "Required documents",
  "Terms of sale",
  "Terms and conditions of delivery",
  "Commitment of issuing bank",
  "Signature of issuing bank",
];

export const LC_CHECKLIST = [
  "All names and addresses are correct",
  "No unacceptable conditions",
  "Documents can be obtained in the required form",
  "Unit price and total price conform",
  "Cost of goods and other charges in the sales agreement comply with the L/C amount",
  "Partial shipments / transshipments are specified correctly",
  "Description of goods consistent between the L/C and the commercial invoice",
  "Shipping, expiration and presentation dates allow sufficient time to process the order, ship, and prepare documents",
  "Points of dispatch, taking in charge, loading on board, or discharge are as agreed",
  "Freight payment indicated properly",
  "Instructions on whom drafts are drawn and their tenor are correct",
  "Whether drafts may be less than 100% of invoice value",
  "Insurance coverage and the party paying charges are as agreed",
  "All required documents need to be presented",
];

export const DISCREPANCIES = [
  "Accidental – sửa dễ dàng bởi người thụ hưởng hoặc ngân hàng phát hành",
  "Minor – khắc phục bằng văn bản chấp thuận bất hợp lệ (written waiver) của người mua",
  "Major – không thể sửa, hoặc chỉ sửa được bằng tu chỉnh L/C (amendment)",
];

/** Documents of the slide contract example (KB §6.10) — typical documents stipulated in an L/C. */
export const LC_EXAMPLE_DOCUMENTS = [
  "Commercial Invoice",
  "Bill of Lading",
  "Packing List",
  "Certificate of Quantity & Quality",
  "Certificate of Origin",
];

export const E15_NOTE =
  "ERRATA E-15 – UCP 600: ngân hàng chỉ trả tiền/chiết khấu khi là ngân hàng được chỉ định (nominated) hoặc ngân hàng xác nhận (confirming); ngân hàng chỉ làm nhiệm vụ thông báo (advising) thì không trả tiền. Slide vẫn giữ luồng “ngân hàng thông báo trả tiền cho người bán”.";
