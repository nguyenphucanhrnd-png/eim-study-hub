import { useState } from "react";
import { cx } from "@/components/ui";
import { Segmented } from "@/components/ui/form";
import { E04_NOTE, PERILS, POLICIES, POLICY_LABEL, covers, type Peril, type Policy } from "./data";

function Mark({ yes, errata }: { yes: boolean; errata?: boolean }) {
  return (
    <span
      className={cx(
        "inline-flex h-7 min-w-9 items-center justify-center rounded-md px-1.5 text-sm font-bold",
        yes ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300",
      )}
    >
      {yes ? "Y" : "N"}
      {errata && <sup className="ml-0.5">*</sup>}
      <span className="sr-only">{yes ? " – có bảo hiểm" : " – không bảo hiểm"}{errata ? " (xem ghi chú E-04)" : ""}</span>
    </span>
  );
}

function PerilDetail({ peril }: { peril: Peril }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800" aria-live="polite">
      <p className="font-semibold text-navy-900 dark:text-white">
        {peril.en} <span className="font-normal text-slate-500 dark:text-slate-400">– {peril.vi}</span>
      </p>
      <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {POLICIES.map((pol) => (
          <div key={pol} className="rounded-lg bg-slate-50 p-2 text-center dark:bg-slate-900">
            <dt className="mb-1 text-xs text-slate-600 dark:text-slate-400">{POLICY_LABEL[pol]}</dt>
            <dd>
              <Mark yes={covers(peril, pol)} errata={peril.errata?.includes(pol)} />
            </dd>
          </div>
        ))}
      </dl>
      {peril.errata && <p className="mt-3 text-xs text-slate-600 dark:text-slate-400">* {E04_NOTE}</p>}
    </div>
  );
}

const GROUP_LABEL: Record<Policy | "all", string> = { all: "Tất cả", ...POLICY_LABEL };

export default function IccChecker() {
  const [selected, setSelected] = useState(PERILS[0]!.id);
  const [view, setView] = useState<"pick" | "table">("pick");
  const [highlight, setHighlight] = useState<Policy | "all">("all");
  const peril = PERILS.find((p) => p.id === selected) ?? PERILS[0]!;

  return (
    <div className="space-y-5">
      <Segmented
        label="Chế độ xem"
        value={view}
        onChange={setView}
        options={[
          { value: "pick", label: "Chọn rủi ro" },
          { value: "table", label: "Bảng 6.2 đầy đủ" },
        ]}
      />

      {view === "pick" ? (
        <>
          <div>
            <label htmlFor="peril" className="mb-1 block text-sm font-medium">
              Rủi ro / tổn thất (peril)
            </label>
            <select
              id="peril"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="w-full max-w-xl rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900 dark:[color-scheme:dark]"
            >
              {PERILS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.en} – {p.vi}
                </option>
              ))}
            </select>
          </div>
          <PerilDetail peril={peril} />
        </>
      ) : (
        <>
          <Segmented
            label="Làm nổi bật điều kiện"
            value={highlight}
            onChange={setHighlight}
            options={(["all", ...POLICIES] as const).map((v) => ({ value: v, label: v === "all" ? GROUP_LABEL.all : v }))}
          />
          <div className="max-h-[70vh] overflow-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <caption className="sr-only">Bảng 6.2 – So sánh phạm vi bảo hiểm</caption>
              <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900">
                <tr>
                  <th scope="col" className="p-2 text-left">
                    Peril
                  </th>
                  {POLICIES.map((pol) => (
                    <th
                      key={pol}
                      scope="col"
                      className={cx("p-2 text-center", pol === "ICC-A" && "border-l-2 border-red-500", highlight === pol && "bg-navy-100 dark:bg-navy-800")}
                    >
                      {pol === "AR" ? "All risk" : pol}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERILS.map((p) => (
                  <tr key={p.id} className="border-t border-slate-200 dark:border-slate-800">
                    <th scope="row" className="p-2 text-left font-normal">
                      {p.en}
                      <span className="block text-xs text-slate-500 dark:text-slate-400">{p.vi}</span>
                    </th>
                    {POLICIES.map((pol) => (
                      <td
                        key={pol}
                        className={cx(
                          "p-1.5 text-center",
                          pol === "ICC-A" && "border-l-2 border-red-500",
                          highlight === pol && "bg-navy-50 dark:bg-navy-900/40",
                          highlight !== "all" && highlight !== pol && "opacity-40",
                        )}
                      >
                        <Mark yes={covers(p, pol)} errata={p.errata?.includes(pol)} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">* {E04_NOTE}</p>
        </>
      )}

      <div className="grid gap-3 text-sm sm:grid-cols-3">
        <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
          <p className="font-semibold">ICC (C) ≈ FPA</p>
          <p className="text-slate-600 dark:text-slate-400">6 rủi ro “tai nạn lớn” (+ nondelivery/theft theo slide*).</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
          <p className="font-semibold">ICC (B) ≈ WA</p>
          <p className="text-slate-600 dark:text-slate-400">Thêm: động đất/núi lửa/sét, nước tràn vào, tổn thất toàn bộ khi rơi/xếp dỡ, sóng cuốn.</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
          <p className="font-semibold">ICC (A) ≈ AR</p>
          <p className="text-slate-600 dark:text-slate-400">Rộng nhất: mọi rủi ro, trừ các điểm loại trừ.</p>
        </div>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Nguồn: KB §4.5 – Table 6.2; §4.6 – tương ứng FPA≈C, WA≈B, AR≈A chỉ là gần đúng (ERRATA E-05).
      </p>
    </div>
  );
}
