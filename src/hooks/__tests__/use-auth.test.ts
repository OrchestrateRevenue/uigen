import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuth } from "@/hooks/use-auth";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock actions
const mockSignIn = vi.fn();
const mockSignUp = vi.fn();
vi.mock("@/actions", () => ({
  signIn: (...args: unknown[]) => mockSignIn(...args),
  signUp: (...args: unknown[]) => mockSignUp(...args),
}));

// Mock project actions
const mockGetProjects = vi.fn();
const mockCreateProject = vi.fn();
vi.mock("@/actions/get-projects", () => ({
  getProjects: () => mockGetProjects(),
}));
vi.mock("@/actions/create-project", () => ({
  createProject: (...args: unknown[]) => mockCreateProject(...args),
}));

// Mock anon-work-tracker
const mockGetAnonWorkData = vi.fn();
const mockClearAnonWork = vi.fn();
vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: () => mockGetAnonWorkData(),
  clearAnonWork: () => mockClearAnonWork(),
}));

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initial state", () => {
    it("returns isLoading as false initially", () => {
      const { result } = renderHook(() => useAuth());
      expect(result.current.isLoading).toBe(false);
    });

    it("returns signIn and signUp functions", () => {
      const { result } = renderHook(() => useAuth());
      expect(typeof result.current.signIn).toBe("function");
      expect(typeof result.current.signUp).toBe("function");
    });
  });

  describe("signIn", () => {
    it("sets isLoading to true during sign in, then false after", async () => {
      mockSignIn.mockResolvedValue({ success: false });
      mockGetAnonWorkData.mockReturnValue(null);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "password");
      });

      expect(result.current.isLoading).toBe(false);
    });

    it("calls signInAction with email and password", async () => {
      mockSignIn.mockResolvedValue({ success: false });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "secret");
      });

      expect(mockSignIn).toHaveBeenCalledWith("user@example.com", "secret");
    });

    it("returns the result from signInAction", async () => {
      const mockResult = { success: false, error: "Invalid credentials" };
      mockSignIn.mockResolvedValue(mockResult);

      const { result } = renderHook(() => useAuth());

      let returnValue;
      await act(async () => {
        returnValue = await result.current.signIn("user@example.com", "wrong");
      });

      expect(returnValue).toEqual(mockResult);
    });

    it("does not call handlePostSignIn when sign in fails", async () => {
      mockSignIn.mockResolvedValue({ success: false });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "wrong");
      });

      expect(mockGetAnonWorkData).not.toHaveBeenCalled();
      expect(mockGetProjects).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("sets isLoading to false even when signInAction throws", async () => {
      mockSignIn.mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "password").catch(() => {});
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("signUp", () => {
    it("calls signUpAction with email and password", async () => {
      mockSignUp.mockResolvedValue({ success: false });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("new@example.com", "newpass");
      });

      expect(mockSignUp).toHaveBeenCalledWith("new@example.com", "newpass");
    });

    it("returns the result from signUpAction", async () => {
      const mockResult = { success: false, error: "Email taken" };
      mockSignUp.mockResolvedValue(mockResult);

      const { result } = renderHook(() => useAuth());

      let returnValue;
      await act(async () => {
        returnValue = await result.current.signUp("taken@example.com", "pass");
      });

      expect(returnValue).toEqual(mockResult);
    });

    it("sets isLoading to false even when signUpAction throws", async () => {
      mockSignUp.mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("new@example.com", "pass").catch(() => {});
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("handlePostSignIn - with anonymous work", () => {
    it("creates a project with anon work and redirects", async () => {
      const anonWork = {
        messages: [{ role: "user", content: "hello" }],
        fileSystemData: { "/": { type: "directory" } },
      };
      mockSignIn.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(anonWork);
      mockCreateProject.mockResolvedValue({ id: "proj-anon-123" });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "pass");
      });

      expect(mockCreateProject).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: anonWork.messages,
          data: anonWork.fileSystemData,
        })
      );
      expect(mockClearAnonWork).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/proj-anon-123");
    });

    it("does not call getProjects when anon work exists", async () => {
      mockSignIn.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue({
        messages: [{ role: "user", content: "hi" }],
        fileSystemData: {},
      });
      mockCreateProject.mockResolvedValue({ id: "proj-123" });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "pass");
      });

      expect(mockGetProjects).not.toHaveBeenCalled();
    });

    it("does not redirect with anon work when messages array is empty", async () => {
      mockSignIn.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue({ messages: [], fileSystemData: {} });
      mockGetProjects.mockResolvedValue([{ id: "existing-proj" }]);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "pass");
      });

      expect(mockCreateProject).not.toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/existing-proj");
    });

    it("does not redirect with anon work when getAnonWorkData returns null", async () => {
      mockSignIn.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([{ id: "existing-proj" }]);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "pass");
      });

      expect(mockCreateProject).not.toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/existing-proj");
    });
  });

  describe("handlePostSignIn - no anonymous work", () => {
    beforeEach(() => {
      mockGetAnonWorkData.mockReturnValue(null);
    });

    it("redirects to existing project when user has projects", async () => {
      mockSignIn.mockResolvedValue({ success: true });
      mockGetProjects.mockResolvedValue([
        { id: "proj-recent" },
        { id: "proj-older" },
      ]);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "pass");
      });

      expect(mockPush).toHaveBeenCalledWith("/proj-recent");
    });

    it("redirects to the most recent project (first in list)", async () => {
      mockSignIn.mockResolvedValue({ success: true });
      mockGetProjects.mockResolvedValue([{ id: "first-proj" }, { id: "second-proj" }]);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "pass");
      });

      expect(mockPush).toHaveBeenCalledWith("/first-proj");
    });

    it("creates a new project and redirects when user has no projects", async () => {
      mockSignIn.mockResolvedValue({ success: true });
      mockGetProjects.mockResolvedValue([]);
      mockCreateProject.mockResolvedValue({ id: "new-proj-99" });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "pass");
      });

      expect(mockCreateProject).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [],
          data: {},
        })
      );
      expect(mockPush).toHaveBeenCalledWith("/new-proj-99");
    });

    it("new project name includes 'New Design' prefix", async () => {
      mockSignIn.mockResolvedValue({ success: true });
      mockGetProjects.mockResolvedValue([]);
      mockCreateProject.mockResolvedValue({ id: "new-proj-1" });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "pass");
      });

      expect(mockCreateProject).toHaveBeenCalledWith(
        expect.objectContaining({
          name: expect.stringMatching(/^New Design #\d+$/),
        })
      );
    });

    it("works the same for signUp success", async () => {
      mockSignUp.mockResolvedValue({ success: true });
      mockGetProjects.mockResolvedValue([{ id: "signup-proj" }]);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("new@example.com", "pass");
      });

      expect(mockPush).toHaveBeenCalledWith("/signup-proj");
    });
  });
});
