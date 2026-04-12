import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import { App } from "./App";

vi.mock("@/utils/storage", () => ({
  showAlertItem: {
    getValue: vi.fn(),
    setValue: vi.fn().mockResolvedValue(undefined),
  },
  protectFormItem: {
    getValue: vi.fn(),
    setValue: vi.fn().mockResolvedValue(undefined),
  },
  ignoreListItem: {
    getValue: vi.fn(),
    setValue: vi.fn().mockResolvedValue(undefined),
  },
}));
import { showAlertItem, protectFormItem, ignoreListItem } from "@/utils/storage";
const mockShowAlertGetValue = vi.mocked(showAlertItem.getValue);
const mockProtectFormGetValue = vi.mocked(protectFormItem.getValue);
const mockIgnoreListGetValue = vi.mocked(ignoreListItem.getValue);

describe("App", () => {
  beforeEach(() => {
    mockShowAlertGetValue.mockReset();
    mockProtectFormGetValue.mockReset();
    mockIgnoreListGetValue.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("\u8A2D\u5B9A\u8AAD\u307F\u8FBC\u307F\u5B8C\u4E86\u524D\u306FSetting\u304C\u8868\u793A\u3055\u308C\u306A\u3044", async () => {
    mockShowAlertGetValue.mockReturnValue(new Promise(() => {}));
    mockProtectFormGetValue.mockReturnValue(new Promise(() => {}));
    mockIgnoreListGetValue.mockReturnValue(new Promise(() => {}));

    await act(async () => {
      render(<App />);
    });

    expect(screen.queryByRole("heading", { name: "Public repo Alert Settings" })).not.toBeInTheDocument();
  });

  it("\u8A2D\u5B9A\u8AAD\u307F\u8FBC\u307F\u5B8C\u4E86\u5F8C\u306BSetting\u304C\u8868\u793A\u3055\u308C\u308B", async () => {
    mockShowAlertGetValue.mockResolvedValue(true);
    mockProtectFormGetValue.mockResolvedValue(true);
    mockIgnoreListGetValue.mockResolvedValue([]);

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Public repo Alert Settings" })).toBeInTheDocument();
  });

  it("showAlert\u304Cfalse\u306E\u5834\u5408\u3001\u30C8\u30B0\u30EB\u304COFF\u72B6\u614B\u3067\u8868\u793A\u3055\u308C\u308B", async () => {
    mockShowAlertGetValue.mockResolvedValue(false);
    mockProtectFormGetValue.mockResolvedValue(true);
    mockIgnoreListGetValue.mockResolvedValue([]);

    render(<App />);

    await screen.findByRole("heading", { name: "Public repo Alert Settings" });
    const toggle = screen.getByLabelText("\u30A2\u30E9\u30FC\u30C8\u8868\u793A");
    expect(toggle).toHaveAttribute("aria-pressed", "false");
  });

  it("protectForm\u304Cfalse\u306E\u5834\u5408\u3001\u30C8\u30B0\u30EB\u304COFF\u72B6\u614B\u3067\u8868\u793A\u3055\u308C\u308B", async () => {
    mockShowAlertGetValue.mockResolvedValue(true);
    mockProtectFormGetValue.mockResolvedValue(false);
    mockIgnoreListGetValue.mockResolvedValue([]);

    render(<App />);

    await screen.findByRole("heading", { name: "Public repo Alert Settings" });
    const toggle = screen.getByLabelText("\u30D5\u30A9\u30FC\u30E0\u4FDD\u8B77");
    expect(toggle).toHaveAttribute("aria-pressed", "false");
  });

  it("\u4FDD\u5B58\u6E08\u307F\u306E\u9664\u5916\u30EA\u30B9\u30C8\u304C\u4E00\u89A7\u8868\u793A\u3055\u308C\u308B", async () => {
    mockShowAlertGetValue.mockResolvedValue(true);
    mockProtectFormGetValue.mockResolvedValue(true);
    mockIgnoreListGetValue.mockResolvedValue(["owner/repo", "org/*"]);

    render(<App />);

    expect(await screen.findByText("owner/repo")).toBeInTheDocument();
    expect(screen.getByText("org/*")).toBeInTheDocument();
  });

  it("\u4E00\u90E8\u306E\u30B9\u30C8\u30EC\u30FC\u30B8\u30A2\u30A4\u30C6\u30E0\u306E\u307F\u89E3\u6C7A\u6E08\u307F\u306E\u5834\u5408\u306FSetting\u304C\u8868\u793A\u3055\u308C\u306A\u3044", async () => {
    mockShowAlertGetValue.mockResolvedValue(true);
    mockProtectFormGetValue.mockReturnValue(new Promise(() => {}));
    mockIgnoreListGetValue.mockResolvedValue([]);

    await act(async () => {
      render(<App />);
    });

    expect(screen.queryByRole("heading", { name: "Public repo Alert Settings" })).not.toBeInTheDocument();
  });
});
