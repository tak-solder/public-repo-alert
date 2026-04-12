import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, act } from "@testing-library/react";
import { ThemeProvider, BaseStyles } from "@primer/react";
import { Setting } from "./Setting";

vi.mock("@/utils/storage", () => ({
  showAlertItem: {
    setValue: vi.fn(),
  },
  protectFormItem: {
    setValue: vi.fn(),
  },
  ignoreListItem: {
    setValue: vi.fn(),
  },
}));
import { showAlertItem, protectFormItem, ignoreListItem } from "@/utils/storage";
const mockShowAlertSetValue = vi.mocked(showAlertItem.setValue);
const mockProtectFormSetValue = vi.mocked(protectFormItem.setValue);
const mockIgnoreListSetValue = vi.mocked(ignoreListItem.setValue);

type Props = {
  showAlert?: boolean;
  protectForm?: boolean;
  ignoreList?: string[];
};

function renderSetting({showAlert = true, protectForm = true, ignoreList = []}: Props = {}) {
  return render(
    <ThemeProvider>
      <BaseStyles>
        <Setting showAlert={showAlert} protectForm={protectForm} ignoreList={ignoreList} />
      </BaseStyles>
    </ThemeProvider>,
  );
}

const FORMAT_ERROR = "owner/repo \u307E\u305F\u306F owner/* \u306E\u5F62\u5F0F\u3067\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044";
const DUPLICATE_ERROR = "\u3053\u306E\u30D1\u30BF\u30FC\u30F3\u306F\u65E2\u306B\u767B\u9332\u3055\u308C\u3066\u3044\u307E\u3059";

describe("Setting", () => {
  beforeEach(() => {
    mockShowAlertSetValue.mockReset();
    mockShowAlertSetValue.mockResolvedValue(undefined);
    mockProtectFormSetValue.mockReset();
    mockProtectFormSetValue.mockResolvedValue(undefined);
    mockIgnoreListSetValue.mockReset();
    mockIgnoreListSetValue.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
  });

  describe("\u521D\u671F\u8868\u793A", () => {
    it("\u898B\u51FA\u3057\u304C\u8868\u793A\u3055\u308C\u308B", () => {
      renderSetting();
      expect(screen.getByRole("heading", { name: "Public repo Alert Settings" })).toBeInTheDocument();
    });

    it("GitHub\u30EA\u30DD\u30B8\u30C8\u30EA\u3078\u306E\u30EA\u30F3\u30AF\u304C\u8868\u793A\u3055\u308C\u308B", () => {
      renderSetting();
      const link = screen.getByRole("link", { name: "GitHub repository" });
      expect(link).toHaveAttribute("href", "https://github.com/tak-solder/public-repo-alert");
    });

    it("\u30A2\u30E9\u30FC\u30C8\u8868\u793A\u30C8\u30B0\u30EB\u304CON\u72B6\u614B\u3067\u8868\u793A\u3055\u308C\u308B", () => {
      renderSetting({showAlert: true});
      const toggle = screen.getByLabelText("\u30A2\u30E9\u30FC\u30C8\u8868\u793A");
      expect(toggle).toHaveAttribute("aria-pressed", "true");
    });

    it("\u30A2\u30E9\u30FC\u30C8\u8868\u793A\u30C8\u30B0\u30EB\u304COFF\u72B6\u614B\u3067\u8868\u793A\u3055\u308C\u308B", () => {
      renderSetting({showAlert: false});
      const toggle = screen.getByLabelText("\u30A2\u30E9\u30FC\u30C8\u8868\u793A");
      expect(toggle).toHaveAttribute("aria-pressed", "false");
    });

    it("\u30D5\u30A9\u30FC\u30E0\u4FDD\u8B77\u30C8\u30B0\u30EB\u304CON\u72B6\u614B\u3067\u8868\u793A\u3055\u308C\u308B", () => {
      renderSetting({protectForm: true});
      const toggle = screen.getByLabelText("\u30D5\u30A9\u30FC\u30E0\u4FDD\u8B77");
      expect(toggle).toHaveAttribute("aria-pressed", "true");
    });

    it("\u30D5\u30A9\u30FC\u30E0\u4FDD\u8B77\u30C8\u30B0\u30EB\u304COFF\u72B6\u614B\u3067\u8868\u793A\u3055\u308C\u308B", () => {
      renderSetting({protectForm: false});
      const toggle = screen.getByLabelText("\u30D5\u30A9\u30FC\u30E0\u4FDD\u8B77");
      expect(toggle).toHaveAttribute("aria-pressed", "false");
    });

    it("\u9664\u5916\u30EA\u30B9\u30C8\u304C\u4E00\u89A7\u8868\u793A\u3055\u308C\u308B", () => {
      renderSetting({ignoreList: ["owner/repo-a", "org/*"]});
      expect(screen.getByText("owner/repo-a")).toBeInTheDocument();
      expect(screen.getByText("org/*")).toBeInTheDocument();
    });

    it("\u9664\u5916\u30EA\u30B9\u30C8\u304C\u7A7A\u306E\u5834\u5408\u306F\u4E00\u89A7\u304C\u7A7A\u3067\u8868\u793A\u3055\u308C\u308B", () => {
      renderSetting({ignoreList: []});
      expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
    });

    it("\u6B63\u898F\u8868\u73FE\u30D1\u30BF\u30FC\u30F3\u306E\u30C6\u30AD\u30B9\u30C8\u30A8\u30EA\u30A2\u304C\u8868\u793A\u3055\u308C\u306A\u3044", () => {
      renderSetting();
      expect(screen.queryByRole("textbox", { name: /ignore/i })).not.toBeInTheDocument();
    });

    it("\u4FDD\u5B58\u30DC\u30BF\u30F3\u304C\u8868\u793A\u3055\u308C\u306A\u3044", () => {
      renderSetting();
      expect(screen.queryByRole("button", { name: "Save" })).not.toBeInTheDocument();
    });
  });

  describe("\u30C8\u30B0\u30EB\u64CD\u4F5C", () => {
    it("\u30A2\u30E9\u30FC\u30C8\u8868\u793A\u3092ON\u304B\u3089OFF\u306B\u5207\u308A\u66FF\u3048\u308B\u3068storage\u306B\u5373\u6642\u53CD\u6620\u3055\u308C\u308B", async () => {
      renderSetting({showAlert: true});
      const toggle = screen.getByLabelText("\u30A2\u30E9\u30FC\u30C8\u8868\u793A");
      await act(async () => {
        fireEvent.click(toggle);
      });
      expect(mockShowAlertSetValue).toHaveBeenCalledWith(false);
    });

    it("\u30A2\u30E9\u30FC\u30C8\u8868\u793A\u3092OFF\u304B\u3089ON\u306B\u5207\u308A\u66FF\u3048\u308B\u3068storage\u306B\u5373\u6642\u53CD\u6620\u3055\u308C\u308B", async () => {
      renderSetting({showAlert: false});
      const toggle = screen.getByLabelText("\u30A2\u30E9\u30FC\u30C8\u8868\u793A");
      await act(async () => {
        fireEvent.click(toggle);
      });
      expect(mockShowAlertSetValue).toHaveBeenCalledWith(true);
    });

    it("\u30D5\u30A9\u30FC\u30E0\u4FDD\u8B77\u3092ON\u304B\u3089OFF\u306B\u5207\u308A\u66FF\u3048\u308B\u3068storage\u306B\u5373\u6642\u53CD\u6620\u3055\u308C\u308B", async () => {
      renderSetting({protectForm: true});
      const toggle = screen.getByLabelText("\u30D5\u30A9\u30FC\u30E0\u4FDD\u8B77");
      await act(async () => {
        fireEvent.click(toggle);
      });
      expect(mockProtectFormSetValue).toHaveBeenCalledWith(false);
    });

    it("\u30D5\u30A9\u30FC\u30E0\u4FDD\u8B77\u3092OFF\u304B\u3089ON\u306B\u5207\u308A\u66FF\u3048\u308B\u3068storage\u306B\u5373\u6642\u53CD\u6620\u3055\u308C\u308B", async () => {
      renderSetting({protectForm: false});
      const toggle = screen.getByLabelText("\u30D5\u30A9\u30FC\u30E0\u4FDD\u8B77");
      await act(async () => {
        fireEvent.click(toggle);
      });
      expect(mockProtectFormSetValue).toHaveBeenCalledWith(true);
    });
  });

  describe("\u9664\u5916\u30EA\u30B9\u30C8\u524A\u9664", () => {
    it("\u4E2D\u9593\u306E\u9805\u76EE\u3092\u524A\u9664\u3067\u304D\u308B", async () => {
      renderSetting({ignoreList: ["owner/repo-a", "org/*", "user/repo-b"]});
      const deleteButton = screen.getByRole("button", { name: "org/* \u3092\u524A\u9664" });
      await act(async () => {
        fireEvent.click(deleteButton);
      });
      expect(mockIgnoreListSetValue).toHaveBeenCalledWith(["owner/repo-a", "user/repo-b"]);
    });

    it("\u5148\u982D\u306E\u9805\u76EE\u3092\u524A\u9664\u3067\u304D\u308B", async () => {
      renderSetting({ignoreList: ["owner/repo-a", "org/*"]});
      const deleteButton = screen.getByRole("button", { name: "owner/repo-a \u3092\u524A\u9664" });
      await act(async () => {
        fireEvent.click(deleteButton);
      });
      expect(mockIgnoreListSetValue).toHaveBeenCalledWith(["org/*"]);
    });

    it("\u6700\u5F8C\u306E1\u4EF6\u3092\u524A\u9664\u3067\u304D\u308B", async () => {
      renderSetting({ignoreList: ["owner/repo-a"]});
      const deleteButton = screen.getByRole("button", { name: "owner/repo-a \u3092\u524A\u9664" });
      await act(async () => {
        fireEvent.click(deleteButton);
      });
      expect(mockIgnoreListSetValue).toHaveBeenCalledWith([]);
    });

    it("\u524A\u9664\u5F8C\u306BUI\u304B\u3089\u8A72\u5F53\u9805\u76EE\u304C\u6D88\u3048\u308B", async () => {
      renderSetting({ignoreList: ["owner/repo-a", "org/*"]});
      const deleteButton = screen.getByRole("button", { name: "owner/repo-a \u3092\u524A\u9664" });
      await act(async () => {
        fireEvent.click(deleteButton);
      });
      expect(screen.queryByText("owner/repo-a")).not.toBeInTheDocument();
      expect(screen.getByText("org/*")).toBeInTheDocument();
    });
  });

  describe("\u9664\u5916\u30EA\u30B9\u30C8\u8FFD\u52A0", () => {
    function getInput() {
      return screen.getByPlaceholderText("owner/repo");
    }

    function getAddButton() {
      return screen.getByRole("button", { name: "\u8FFD\u52A0" });
    }

    async function addPattern(value: string) {
      fireEvent.change(getInput(), { target: { value } });
      await act(async () => {
        fireEvent.click(getAddButton());
      });
    }

    it("owner/repo\u5F62\u5F0F\u306E\u30D1\u30BF\u30FC\u30F3\u3092\u8FFD\u52A0\u3067\u304D\u308B", async () => {
      renderSetting({ignoreList: ["existing/repo"]});
      await addPattern("new-owner/new-repo");
      expect(mockIgnoreListSetValue).toHaveBeenCalledWith(["existing/repo", "new-owner/new-repo"]);
    });

    it("owner/*\u5F62\u5F0F\u306E\u30D1\u30BF\u30FC\u30F3\u3092\u8FFD\u52A0\u3067\u304D\u308B", async () => {
      renderSetting({ignoreList: []});
      await addPattern("org-name/*");
      expect(mockIgnoreListSetValue).toHaveBeenCalledWith(["org-name/*"]);
    });

    it("\u8FFD\u52A0\u5F8C\u306BUI\u306E\u4E00\u89A7\u306B\u65B0\u3057\u3044\u30D1\u30BF\u30FC\u30F3\u304C\u8868\u793A\u3055\u308C\u308B", async () => {
      renderSetting({ignoreList: []});
      await addPattern("owner/repo");
      expect(screen.getByText("owner/repo")).toBeInTheDocument();
    });

    it("\u8FFD\u52A0\u5F8C\u306B\u5165\u529B\u6B04\u304C\u30AF\u30EA\u30A2\u3055\u308C\u308B", async () => {
      renderSetting({ignoreList: []});
      await addPattern("owner/repo");
      expect(getInput()).toHaveValue("");
    });
  });

  describe("\u9664\u5916\u30EA\u30B9\u30C8\u8FFD\u52A0 \u30D0\u30EA\u30C7\u30FC\u30B7\u30E7\u30F3", () => {
    function getInput() {
      return screen.getByPlaceholderText("owner/repo");
    }

    function getAddButton() {
      return screen.getByRole("button", { name: "\u8FFD\u52A0" });
    }

    async function addPattern(value: string) {
      fireEvent.change(getInput(), { target: { value } });
      await act(async () => {
        fireEvent.click(getAddButton());
      });
    }

    it("\u7A7A\u6587\u5B57\u306F\u8FFD\u52A0\u3067\u304D\u306A\u3044", async () => {
      renderSetting();
      await act(async () => {
        fireEvent.click(getAddButton());
      });
      expect(mockIgnoreListSetValue).not.toHaveBeenCalled();
    });

    it("\u7A7A\u767D\u306E\u307F\u306E\u5165\u529B\u306F\u8FFD\u52A0\u3067\u304D\u306A\u3044", async () => {
      renderSetting();
      await addPattern("   ");
      expect(mockIgnoreListSetValue).not.toHaveBeenCalled();
    });

    it("\u30B9\u30E9\u30C3\u30B7\u30E5\u3092\u542B\u307E\u306A\u3044\u6587\u5B57\u5217\u306F\u8FFD\u52A0\u3067\u304D\u306A\u3044", async () => {
      renderSetting();
      await addPattern("invalid-pattern");
      expect(mockIgnoreListSetValue).not.toHaveBeenCalled();
      expect(screen.getByText(FORMAT_ERROR)).toBeInTheDocument();
    });

    it("\u30B9\u30E9\u30C3\u30B7\u30E5\u306E\u307F\u306E\u5165\u529B\u306F\u8FFD\u52A0\u3067\u304D\u306A\u3044", async () => {
      renderSetting();
      await addPattern("/");
      expect(mockIgnoreListSetValue).not.toHaveBeenCalled();
      expect(screen.getByText(FORMAT_ERROR)).toBeInTheDocument();
    });

    it("owner\u304C\u7A7A\u306E\u30D1\u30BF\u30FC\u30F3\u306F\u8FFD\u52A0\u3067\u304D\u306A\u3044", async () => {
      renderSetting();
      await addPattern("/repo");
      expect(mockIgnoreListSetValue).not.toHaveBeenCalled();
      expect(screen.getByText(FORMAT_ERROR)).toBeInTheDocument();
    });

    it("repo\u304C\u7A7A\u306E\u30D1\u30BF\u30FC\u30F3\u306F\u8FFD\u52A0\u3067\u304D\u306A\u3044", async () => {
      renderSetting();
      await addPattern("owner/");
      expect(mockIgnoreListSetValue).not.toHaveBeenCalled();
      expect(screen.getByText(FORMAT_ERROR)).toBeInTheDocument();
    });

    it("\u91CD\u8907\u30D1\u30BF\u30FC\u30F3\u306F\u8FFD\u52A0\u3067\u304D\u306A\u3044\uFF08\u5B8C\u5168\u4E00\u81F4\uFF09", async () => {
      renderSetting({ignoreList: ["owner/repo"]});
      await addPattern("owner/repo");
      expect(mockIgnoreListSetValue).not.toHaveBeenCalled();
      expect(screen.getByText(DUPLICATE_ERROR)).toBeInTheDocument();
    });

    it("\u91CD\u8907\u30D1\u30BF\u30FC\u30F3\u306F\u5927\u6587\u5B57\u5C0F\u6587\u5B57\u3092\u533A\u5225\u3057\u306A\u3044", async () => {
      renderSetting({ignoreList: ["Owner/Repo"]});
      await addPattern("owner/repo");
      expect(mockIgnoreListSetValue).not.toHaveBeenCalled();
      expect(screen.getByText(DUPLICATE_ERROR)).toBeInTheDocument();
    });

    it("\u30EF\u30A4\u30EB\u30C9\u30AB\u30FC\u30C9\u30D1\u30BF\u30FC\u30F3\u306E\u91CD\u8907\u30C1\u30A7\u30C3\u30AF", async () => {
      renderSetting({ignoreList: ["org/*"]});
      await addPattern("ORG/*");
      expect(mockIgnoreListSetValue).not.toHaveBeenCalled();
      expect(screen.getByText(DUPLICATE_ERROR)).toBeInTheDocument();
    });

    it("\u5165\u529B\u5024\u306E\u524D\u5F8C\u306E\u7A7A\u767D\u306F\u30C8\u30EA\u30E0\u3055\u308C\u3066\u8FFD\u52A0\u3055\u308C\u308B", async () => {
      renderSetting();
      await addPattern("  owner/repo  ");
      expect(mockIgnoreListSetValue).toHaveBeenCalledWith(["owner/repo"]);
    });
  });
});
