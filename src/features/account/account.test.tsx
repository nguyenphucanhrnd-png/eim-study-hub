import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AccountPage from "./AccountPage";
import { useAuth } from "@/store/authStore";

const initial = useAuth.getState();
const renderPage = () =>
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AccountPage />
    </MemoryRouter>,
  );

afterEach(() => useAuth.setState(initial, true));

describe("AccountPage", () => {
  it("explains that accounts are off when Supabase is not configured", () => {
    renderPage();
    expect(screen.getByText(/chưa được bật/)).toBeInTheDocument();
  });

  it("signs in and shows a Vietnamese error for wrong credentials", async () => {
    const signIn = vi.fn().mockRejectedValue(new Error("Invalid login credentials"));
    useAuth.setState({ status: "signedOut", signIn });
    renderPage();
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: " an@ueh.edu.vn " } });
    fireEvent.change(screen.getByLabelText("Mật khẩu"), { target: { value: "secret123" } });
    fireEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Email hoặc mật khẩu không đúng.");
    expect(signIn).toHaveBeenCalledWith("an@ueh.edu.vn", "secret123");
  });

  it("sign-up checks the repeated password and tells the user to confirm by e-mail", async () => {
    const signUp = vi.fn().mockResolvedValue("confirm");
    useAuth.setState({ status: "signedOut", signUp });
    renderPage();
    fireEvent.click(screen.getByRole("radio", { name: "Đăng ký" }));
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "an@ueh.edu.vn" } });
    fireEvent.change(screen.getByLabelText("Mật khẩu"), { target: { value: "secret123" } });
    fireEvent.change(screen.getByLabelText("Nhập lại mật khẩu"), { target: { value: "secret124" } });
    fireEvent.click(screen.getByRole("button", { name: "Đăng ký" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("không khớp");
    expect(signUp).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Nhập lại mật khẩu"), { target: { value: "secret123" } });
    fireEvent.click(screen.getByRole("button", { name: "Đăng ký" }));
    expect(await screen.findByText(/Đã gửi email xác nhận tới an@ueh.edu.vn/)).toBeInTheDocument();
  });

  it("shows the account, sync status and both sign-out options when signed in", async () => {
    const signOut = vi.fn().mockResolvedValue(undefined);
    useAuth.setState({
      status: "signedIn",
      user: { id: "u1", email: "an@ueh.edu.vn" },
      sync: { state: "idle", lastSyncedAt: "2026-10-03T08:00:00Z", error: null },
      signOut,
    });
    renderPage();
    expect(screen.getByText("an@ueh.edu.vn")).toBeInTheDocument();
    expect(screen.getByText(/Đã đồng bộ lúc/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Đăng xuất và xóa dữ liệu trên máy này" }));
    await waitFor(() => expect(signOut).toHaveBeenCalledWith(true));
  });
});
