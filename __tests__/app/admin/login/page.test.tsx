import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AdminLoginPage from "@/app/admin/login/page";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} src={src} />
  ),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

// jsdom doesn't have matchMedia — some UI libs need it
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function submitForm(email: string, password: string) {
  fireEvent.change(screen.getByPlaceholderText("Enter your email"), {
    target: { value: email },
  });
  fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
    target: { value: password },
  });
  const form = screen.getByPlaceholderText("Enter your email").closest("form")!;
  fireEvent.submit(form);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("AdminLoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Rendering ─────────────────────────────────────────────────────────────

  it("renders the welcome heading", () => {
    render(<AdminLoginPage />);
    expect(screen.getByText("Welcome back")).toBeDefined();
  });

  it("renders the subheading", () => {
    render(<AdminLoginPage />);
    expect(screen.getByText("Sign in to your admin account")).toBeDefined();
  });

  it("renders email and password inputs", () => {
    render(<AdminLoginPage />);
    expect(screen.getByPlaceholderText("Enter your email")).toBeDefined();
    expect(screen.getByPlaceholderText("Enter your password")).toBeDefined();
  });

  it("renders the Sign in submit button", () => {
    render(<AdminLoginPage />);
    expect(screen.getByRole("button", { name: /sign in/i })).toBeDefined();
  });

  it("does not show an error message on initial render", () => {
    render(<AdminLoginPage />);
    expect(screen.queryByText(/invalid/i)).toBeNull();
  });

  // ── Password toggle ────────────────────────────────────────────────────────

  it("password input starts as type='password'", () => {
    render(<AdminLoginPage />);
    const input = screen.getByPlaceholderText("Enter your password");
    expect(input.getAttribute("type")).toBe("password");
  });

  it("toggles password to visible when eye button is clicked", () => {
    render(<AdminLoginPage />);
    const input = screen.getByPlaceholderText("Enter your password");
    // The toggle is the only type="button" button; the submit is type="submit"
    const toggleBtn = document
      .querySelector('button[type="button"]') as HTMLButtonElement;
    fireEvent.click(toggleBtn);
    expect(input.getAttribute("type")).toBe("text");
  });

  it("toggles password back to hidden on second click", () => {
    render(<AdminLoginPage />);
    const input = screen.getByPlaceholderText("Enter your password");
    const toggleBtn = document.querySelector('button[type="button"]') as HTMLButtonElement;
    fireEvent.click(toggleBtn);
    fireEvent.click(toggleBtn);
    expect(input.getAttribute("type")).toBe("password");
  });

  // ── Form submission ────────────────────────────────────────────────────────

  it("calls /api/admin/login with email and password on submit", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: "1", name: "Admin", email: "a@b.com", role: "admin" }),
    });

    render(<AdminLoginPage />);
    submitForm("admin@farmfresh.com", "secret123");

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/admin/login",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "admin@farmfresh.com", password: "secret123" }),
        })
      );
    });
  });

  it("redirects to /admin/dashboard on successful login", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: "1", name: "Admin", email: "a@b.com", role: "admin" }),
    });

    render(<AdminLoginPage />);
    submitForm("admin@farmfresh.com", "secret123");

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/admin/dashboard");
    });
  });

  it("shows error message from API on failed login", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Invalid email or password." }),
    });

    render(<AdminLoginPage />);
    submitForm("admin@farmfresh.com", "wrongpass");

    await waitFor(() => {
      expect(screen.getByText("Invalid email or password.")).toBeDefined();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("shows fallback error when API returns no error message", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });

    render(<AdminLoginPage />);
    submitForm("admin@farmfresh.com", "wrongpass");

    await waitFor(() => {
      expect(screen.getByText("Invalid email or password.")).toBeDefined();
    });
  });

  it("shows generic error when fetch throws (network failure)", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    render(<AdminLoginPage />);
    submitForm("admin@farmfresh.com", "secret123");

    await waitFor(() => {
      expect(screen.getByText("Something went wrong. Please try again.")).toBeDefined();
    });
  });

  // ── Loading state ──────────────────────────────────────────────────────────

  it("shows loading spinner while request is in flight", async () => {
    let resolveFetch!: (v: unknown) => void;
    mockFetch.mockReturnValue(new Promise((r) => { resolveFetch = r; }));

    render(<AdminLoginPage />);
    submitForm("admin@farmfresh.com", "secret123");

    await waitFor(() => {
      expect(screen.getByText("Signing in...")).toBeDefined();
    });

    // Resolve so the component can clean up
    resolveFetch({ ok: true, json: async () => ({}) });
  });

  it("disables the submit button while loading", async () => {
    let resolveFetch!: (v: unknown) => void;
    mockFetch.mockReturnValue(new Promise((r) => { resolveFetch = r; }));

    render(<AdminLoginPage />);
    submitForm("admin@farmfresh.com", "secret123");

    await waitFor(() => {
      const btn = screen.getByRole("button", { name: /signing in/i });
      expect(btn).toBeDefined();
      expect(btn.hasAttribute("disabled")).toBe(true);
    });

    resolveFetch({ ok: true, json: async () => ({}) });
  });

  it("clears previous error on a new submission", async () => {
    // First call fails
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Invalid email or password." }),
    });
    // Second call succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "1", name: "Admin", email: "a@b.com", role: "admin" }),
    });

    render(<AdminLoginPage />);
    submitForm("admin@farmfresh.com", "wrong");

    await waitFor(() => {
      expect(screen.getByText("Invalid email or password.")).toBeDefined();
    });

    // Re-submit — error should disappear
    submitForm("admin@farmfresh.com", "correct");
    await waitFor(() => {
      expect(screen.queryByText("Invalid email or password.")).toBeNull();
    });
  });
});
