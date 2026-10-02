import { useEffect, useId, useState, type FormEvent, type ReactNode } from "react";
import { Button, ButtonLink, Card, PageHeader, cx } from "@/components/ui";
import { Segmented } from "@/components/ui/form";
import { authErrorVi } from "@/lib/sync/cloud";
import { useAuth } from "@/store/authStore";

const MIN_PASSWORD = 8;
const timeFmt = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "medium" });

function TextInput({
  label,
  type,
  value,
  onChange,
  autoComplete,
  hint,
}: {
  label: string;
  type: "email" | "password";
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  hint?: string;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
      <input
        id={id}
        type={type}
        required
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={hint ? `${id}-hint` : undefined}
        minLength={type === "password" ? MIN_PASSWORD : undefined}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
      />
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-slate-600 dark:text-slate-400">
          {hint}
        </p>
      )}
    </div>
  );
}

function Message({ kind, children }: { kind: "error" | "success"; children: ReactNode }) {
  return (
    <p
      role={kind === "error" ? "alert" : "status"}
      className={cx(
        "rounded-lg px-3 py-2 text-sm",
        kind === "error" ? "bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-200" : "bg-green-50 text-green-800 dark:bg-green-950/40 dark:text-green-200",
      )}
    >
      {children}
    </p>
  );
}

/** Runs an async form action with busy/error/success state. */
function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const run = async (fn: () => Promise<string | void>) => {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const msg = await fn();
      if (msg) setSuccess(msg);
    } catch (e) {
      setError(authErrorVi(e));
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, success, run, setError };
}

function SignInForm({ onForgot }: { onForgot: () => void }) {
  const signIn = useAuth((s) => s.signIn);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { busy, error, run } = useAction();
  const submit = (e: FormEvent) => {
    e.preventDefault();
    void run(() => signIn(email.trim(), password));
  };
  return (
    <form onSubmit={submit} className="space-y-4" noValidate={false}>
      <TextInput label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" />
      <TextInput label="Mật khẩu" type="password" value={password} onChange={setPassword} autoComplete="current-password" />
      {error && <Message kind="error">{error}</Message>}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={busy}>
          {busy ? "Đang đăng nhập…" : "Đăng nhập"}
        </Button>
        <button type="button" onClick={onForgot} className="text-sm text-navy-700 underline dark:text-navy-200">
          Quên mật khẩu?
        </button>
      </div>
    </form>
  );
}

function SignUpForm() {
  const signUp = useAuth((s) => s.signUp);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const { busy, error, success, run, setError } = useAction();
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return setError("Hai mật khẩu không khớp.");
    void run(async () => {
      const res = await signUp(email.trim(), password);
      if (res === "confirm")
        return `Đã gửi email xác nhận tới ${email.trim()}. Hãy mở email và bấm vào liên kết để kích hoạt tài khoản (kiểm tra cả thư mục Spam).`;
    });
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <TextInput label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" />
      <TextInput
        label="Mật khẩu"
        type="password"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
        hint={`Ít nhất ${MIN_PASSWORD} ký tự.`}
      />
      <TextInput label="Nhập lại mật khẩu" type="password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
      {error && <Message kind="error">{error}</Message>}
      {success && <Message kind="success">{success}</Message>}
      <Button type="submit" disabled={busy}>
        {busy ? "Đang tạo tài khoản…" : "Đăng ký"}
      </Button>
    </form>
  );
}

function ForgotForm({ onBack }: { onBack: () => void }) {
  const sendPasswordReset = useAuth((s) => s.sendPasswordReset);
  const [email, setEmail] = useState("");
  const { busy, error, success, run } = useAction();
  const submit = (e: FormEvent) => {
    e.preventDefault();
    void run(async () => {
      await sendPasswordReset(email.trim());
      return "Nếu email này đã đăng ký, bạn sẽ nhận được liên kết đặt lại mật khẩu trong vài phút.";
    });
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-slate-700 dark:text-slate-300">Nhập email đã đăng ký, chúng tôi sẽ gửi liên kết để đặt mật khẩu mới.</p>
      <TextInput label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" />
      {error && <Message kind="error">{error}</Message>}
      {success && <Message kind="success">{success}</Message>}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={busy}>
          {busy ? "Đang gửi…" : "Gửi liên kết"}
        </Button>
        <Button variant="ghost" onClick={onBack}>
          ← Quay lại đăng nhập
        </Button>
      </div>
    </form>
  );
}

function NewPasswordForm({ title }: { title: string }) {
  const updatePassword = useAuth((s) => s.updatePassword);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const { busy, error, success, run, setError } = useAction();
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return setError("Hai mật khẩu không khớp.");
    void run(async () => {
      await updatePassword(password);
      setPassword("");
      setConfirm("");
      return "Đã cập nhật mật khẩu.";
    });
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <h2 className="font-semibold text-navy-900 dark:text-white">{title}</h2>
      <TextInput label="Mật khẩu mới" type="password" value={password} onChange={setPassword} autoComplete="new-password" hint={`Ít nhất ${MIN_PASSWORD} ký tự.`} />
      <TextInput label="Nhập lại mật khẩu mới" type="password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
      {error && <Message kind="error">{error}</Message>}
      {success && <Message kind="success">{success}</Message>}
      <Button type="submit" disabled={busy}>
        {busy ? "Đang lưu…" : "Lưu mật khẩu"}
      </Button>
    </form>
  );
}

function SignedIn() {
  const user = useAuth((s) => s.user);
  const sync = useAuth((s) => s.sync);
  const syncNow = useAuth((s) => s.syncNow);
  const signOut = useAuth((s) => s.signOut);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const out = async (clear: boolean) => {
    setBusy(true);
    try {
      await signOut(clear);
    } finally {
      setBusy(false);
    }
  };

  const statusText =
    sync.state === "syncing"
      ? "Đang đồng bộ…"
      : sync.state === "error"
        ? `Lỗi đồng bộ: ${authErrorVi(sync.error)} Thay đổi vẫn được lưu trên máy và sẽ đồng bộ lại sau.`
        : sync.lastSyncedAt
          ? `Đã đồng bộ lúc ${timeFmt.format(new Date(sync.lastSyncedAt))}.`
          : "Chưa đồng bộ.";

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <p className="text-sm text-slate-600 dark:text-slate-400">Đang đăng nhập với</p>
        <p className="text-lg font-semibold text-slate-900 dark:text-white">{user?.email}</p>
        <p
          className={cx("text-sm", sync.state === "error" ? "text-wrong dark:text-red-300" : "text-slate-700 dark:text-slate-300")}
          aria-live="polite"
        >
          {statusText}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => void syncNow()} disabled={sync.state === "syncing"}>
            Đồng bộ ngay
          </Button>
          <Button variant="secondary" onClick={() => setShowPassword((v) => !v)} aria-expanded={showPassword}>
            Đổi mật khẩu
          </Button>
        </div>
        {showPassword && (
          <div className="border-t border-slate-200 pt-4 dark:border-slate-800">
            <NewPasswordForm title="Đổi mật khẩu" />
          </div>
        )}
      </Card>

      <Card className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
        <h2 className="font-semibold text-navy-900 dark:text-white">Những gì được đồng bộ</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Kết quả luyện tập, ngân hàng câu sai, câu đánh dấu, mục lý thuyết đã học, flashcards.</li>
          <li>Bài thi thử đang làm và lịch sử thi thử.</li>
          <li>Bài làm, điểm tự chấm và lịch sử của case study.</li>
        </ul>
        <p>Giao diện sáng/tối và thời gian làm bài vẫn lưu riêng trên từng thiết bị.</p>
      </Card>

      <Card className="space-y-3">
        <h2 className="font-semibold text-navy-900 dark:text-white">Đăng xuất</h2>
        <p className="text-sm text-slate-700 dark:text-slate-300">
          Dữ liệu đã đồng bộ vẫn nằm trong tài khoản. Nếu đây là máy dùng chung, hãy chọn xóa dữ liệu trên máy này.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" disabled={busy} onClick={() => void out(false)}>
            Đăng xuất
          </Button>
          <Button variant="secondary" disabled={busy} onClick={() => void out(true)} className="border-red-300 text-red-700 dark:border-red-800 dark:text-red-300">
            Đăng xuất và xóa dữ liệu trên máy này
          </Button>
        </div>
      </Card>
    </div>
  );
}

function SignedOut() {
  const [tab, setTab] = useState<"signin" | "signup" | "forgot">("signin");
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)]">
      <Card className="space-y-5">
        {tab !== "forgot" && (
          <Segmented
            label="Đăng nhập hoặc đăng ký"
            value={tab}
            options={[
              { value: "signin", label: "Đăng nhập" },
              { value: "signup", label: "Đăng ký" },
            ]}
            onChange={setTab}
          />
        )}
        {tab === "signin" && <SignInForm onForgot={() => setTab("forgot")} />}
        {tab === "signup" && <SignUpForm />}
        {tab === "forgot" && <ForgotForm onBack={() => setTab("signin")} />}
      </Card>
      <Card className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
        <h2 className="font-semibold text-navy-900 dark:text-white">Vì sao nên đăng nhập?</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Tiến độ ôn tập được lưu vào tài khoản, mở trên máy khác vẫn tiếp tục được.</li>
          <li>Không mất dữ liệu khi xóa lịch sử trình duyệt hoặc đổi trình duyệt.</li>
          <li>Tiến độ bạn đã làm khi chưa đăng nhập sẽ được gộp vào tài khoản ở lần đăng nhập đầu tiên.</li>
        </ul>
        <p>Không đăng nhập vẫn dùng được đầy đủ; tiến độ khi đó chỉ lưu trên trình duyệt này.</p>
      </Card>
    </div>
  );
}

export default function AccountPage() {
  const status = useAuth((s) => s.status);
  const init = useAuth((s) => s.init);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    init().catch((e: unknown) => setInitError(authErrorVi(e)));
  }, [init]);

  return (
    <>
      <PageHeader title="Tài khoản" subtitle="Đăng nhập để lưu tiến độ ôn tập lên tài khoản và dùng trên nhiều thiết bị." />
      {status === "disabled" && (
        <Card className="space-y-2">
          <p className="font-medium text-slate-800 dark:text-slate-200">Tính năng tài khoản chưa được bật cho website này.</p>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            Tiến độ của bạn vẫn được lưu tự động trên trình duyệt này. (Người quản trị: xem mục “Accounts & sync” trong README để cấu hình Supabase.)
          </p>
          <ButtonLink to="/" variant="secondary">
            Về trang chủ
          </ButtonLink>
        </Card>
      )}
      {initError && <Message kind="error">{initError}</Message>}
      {(status === "uninitialized" || status === "loading") && !initError && <p role="status">Đang tải…</p>}
      {status === "signedOut" && <SignedOut />}
      {status === "recovery" && (
        <Card className="max-w-md">
          <NewPasswordForm title="Đặt mật khẩu mới" />
        </Card>
      )}
      {status === "signedIn" && <SignedIn />}
    </>
  );
}
