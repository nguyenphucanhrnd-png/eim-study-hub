# Review – 5 câu hỏi

### 1. `C2-fx-risk-003` · C2 · Rủi ro tỷ giá · độ khó 2 (apply) · tags: calculation, scenario

**A Vietnamese exporter will receive EUR 50,000 six months after delivery. At the contract date 1 EUR = 30,000 VND; on the payment date 1 EUR = 29,000 VND. What is the effect on its VND revenue?**

- A. Loss of VND 50 million (VND 1.45 billion instead of VND 1.50 billion)  ✅
- B. Gain of VND 100 million
- C. Loss of VND 1.45 billion
- D. No effect, because the buyer still pays EUR 50,000

✔ **Đáp án đúng: A**
**Tóm tắt:** 50,000 × (29,000 − 30,000) = −VND 50 triệu: thu VND 1.45 tỷ thay vì 1.50 tỷ.

**Vì sao đúng:** Theo ví dụ tỷ giá trên slide, giá trị VND kỳ vọng tại ngày ký là 50,000 × 30,000 = VND 1.50 tỷ. Khi nhận tiền, EUR giảm giá còn 29,000, nên nhà xuất khẩu thu 50,000 × 29,000 = VND 1.45 tỷ. Chênh lệch là khoản lỗ VND 50 triệu, dù người mua vẫn trả đủ EUR 50,000.

**Vì sao các phương án khác sai:**
- B: EUR giảm giá so với VND nên nhà xuất khẩu bị lỗ chứ không lãi; 100 triệu cũng không đúng mức chênh.
- C: VND 1.45 tỷ là doanh thu VND thực nhận, không phải khoản lỗ do biến động tỷ giá.
- D: Số EUR không đổi nhưng giá trị VND thay đổi; slide nhấn mạnh rủi ro này với thanh toán trả chậm.

📘 **Nguồn:** KB §2.9 – FX example (Scenario 1 logic)

🧮 calc: `fx-gain-loss` {"amount":50000,"rateAtContract":30000,"rateAtPayment":29000} → -50000000

---
### 2. `C2-risk-types-002` · C2 · 6 nhóm rủi ro · độ khó 1 (remember)

**Non-payment, delayed payment and the buyer's creditworthiness belong to which risk group?**

- A. Foreign credit / payment risk  ✅
- B. Foreign exchange risk
- C. Regulatory & compliance risk
- D. Transportation risk

✔ **Đáp án đúng: A**
**Tóm tắt:** Rủi ro tín dụng/thanh toán: người mua không trả tiền, trả chậm, khả năng tín dụng của người mua.

**Vì sao đúng:** Theo slide, rủi ro tín dụng/thanh toán nước ngoài (foreign credit/payment risk) gồm người mua không thanh toán (non-payment), thanh toán chậm (delayed payment) và vấn đề khả năng tín dụng (creditworthiness) của người mua. Đây là một trong 6 nhóm rủi ro cần được xử lý trong thành phần quản trị rủi ro của kế hoạch xuất khẩu.

**Vì sao các phương án khác sai:**
- B: Rủi ro tỷ giá liên quan đến biến động đồng tiền và khả năng chuyển ngoại tệ, không phải việc người mua không trả.
- C: Rủi ro pháp lý và tuân thủ liên quan đến quy định nhập khẩu, tiêu chuẩn sản phẩm và chứng từ.
- D: Rủi ro vận tải liên quan đến mất mát, hư hỏng hoặc chậm trễ của hàng hóa trong quá trình vận chuyển.

📘 **Nguồn:** KB §2.10 – Foreign credit / payment risk

---
### 3. `C2-fx-risk-005` · C2 · Rủi ro tỷ giá · độ khó 3 (analyze) · tags: calculation, integrated, scenario

**An exporter sells goods for EUR 60,000 with payment 6 months after delivery. COGS is VND 1.62 billion. At the contract date 1 EUR = 30,000 VND; on the payment date 1 EUR = 28,500 VND. What is the actual gross profit in VND?**

- A. VND 180 million – unchanged, because the buyer still pays EUR 60,000
- B. VND 90 million – half of the VND 180 million planned at the contract date  ✅
- C. VND 1.71 billion
- D. A loss of VND 1.62 billion

✔ **Đáp án đúng: B**
**Tóm tắt:** Doanh thu thực = 60,000 × 28,500 = VND 1.71 tỷ; LN gộp = 1.71 − 1.62 = VND 90 triệu (kế hoạch 180 triệu).

**Vì sao đúng:** Bài toán kết hợp tỷ giá và lợi nhuận gộp. Kế hoạch: doanh thu 60,000 × 30,000 = VND 1.80 tỷ, lợi nhuận gộp 1.80 − 1.62 = VND 180 triệu. Thực tế: doanh thu 60,000 × 28,500 = VND 1.71 tỷ, lợi nhuận gộp 1.71 − 1.62 = VND 90 triệu. EUR giảm giá 5% nhưng lợi nhuận giảm một nửa, đúng như slide cảnh báo về tác động đến khả năng sinh lời.

**Vì sao các phương án khác sai:**
- A: VND 180 triệu là lợi nhuận kế hoạch; số EUR không đổi nhưng giá trị VND thực nhận đã giảm.
- C: VND 1.71 tỷ là doanh thu VND thực nhận, chưa trừ giá vốn hàng bán VND 1.62 tỷ.
- D: Doanh thu VND 1.71 tỷ vẫn lớn hơn giá vốn, nên nhà xuất khẩu vẫn có lãi gộp chứ không lỗ.

📘 **Nguồn:** KB §2.9 – FX considerations; Gross Profit

🧮 calc: `gross-profit` {"revenue":1710000000,"cogs":1620000000} → 90000000

---
### 4. `C2-eleven-questions-003` · C2 · 11 câu hỏi chuẩn bị XK · độ khó 2 (understand) · tags: integrated

**Which of the 11 export preparation questions corresponds to the “Resources & Responsibilities” component?**

- A. How will results be evaluated and used to modify the plan?
- B. Which products are selected for export development?
- C. What special challenges pertain to each market?
- D. What personnel and company resources will be dedicated to exporting?  ✅

✔ **Đáp án đúng: D**
**Tóm tắt:** Câu hỏi 9 (nhân sự và nguồn lực dành cho XK) ↔ thành phần Nguồn lực & Trách nhiệm.

**Vì sao đúng:** Thành phần nguồn lực và trách nhiệm trả lời câu hỏi ai thực hiện kế hoạch: các phòng ban nội bộ và đối tác bên ngoài. Câu hỏi 9 – những nhân sự và nguồn lực nào của công ty sẽ được dành cho xuất khẩu – tương ứng trực tiếp với thành phần này.

**Vì sao các phương án khác sai:**
- A: Đánh giá kết quả để điều chỉnh kế hoạch (câu hỏi 11) là khâu kiểm soát, không phải phân công nguồn lực.
- B: Chọn sản phẩm (câu hỏi 1) tương ứng với thành phần sản phẩm cho thị trường nước ngoài.
- C: Thách thức của từng thị trường (câu hỏi 5) gắn với phân tích thị trường và rủi ro, không phải nguồn lực.

📘 **Nguồn:** KB §2.11 – Question 9; §2.8

---
### 5. `C2-risk-types-001` · C2 · 6 nhóm rủi ro · độ khó 1 (remember)

**Trade restrictions or sanctions belong to which risk group on the slides?**

- A. Transportation risk
- B. Market risk
- C. Foreign credit / payment risk
- D. Political / country risk  ✅

✔ **Đáp án đúng: D**
**Tóm tắt:** Rủi ro chính trị/quốc gia: bất ổn chính trị, hạn chế thương mại hoặc trừng phạt, thay đổi chính sách, gián đoạn kinh tế/địa chính trị.

**Vì sao đúng:** Slide liệt kê 6 nhóm rủi ro. Rủi ro chính trị/quốc gia (political/country risk) gồm bất ổn chính trị; hạn chế thương mại hoặc lệnh trừng phạt (sanctions); thay đổi chính sách của chính phủ; và các gián đoạn kinh tế hoặc địa chính trị.

**Vì sao các phương án khác sai:**
- A: Rủi ro vận tải gồm mất mát, hư hỏng trong vận chuyển và chậm trễ, không gồm lệnh trừng phạt.
- B: Rủi ro thị trường liên quan đến thay đổi nhu cầu, điều kiện thị trường, cạnh tranh hoặc giá cả.
- C: Rủi ro tín dụng/thanh toán liên quan đến người mua không trả, trả chậm và khả năng tín dụng.

📘 **Nguồn:** KB §2.10 – Political / country risk

---
