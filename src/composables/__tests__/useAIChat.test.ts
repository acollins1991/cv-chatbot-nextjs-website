import { useAIChat } from "@/composables/useAIChat";
import { cookies } from "next/headers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock next/headers
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

const FAKE_WEBHOOK_URL = "https://fake-webhook.com";

describe("useAIChat", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_N8N_CHAT_WEBHOOK", FAKE_WEBHOOK_URL);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("should send a message and return an AI response", async () => {
    const mockSessionId = "mock-session-id";
    const mockCookieStore = new Map();
    mockCookieStore.set("anthonyCollinsChatSessionId", {
      value: mockSessionId,
    });

    vi.mocked(cookies).mockReturnValue({
      has: (name) => mockCookieStore.has(name),
      get: (name) => mockCookieStore.get(name),
      set: (name, value) => mockCookieStore.set(name, { value }),
    } as any);

    const mockApiResponse = { output: "Hello from AI" };
    vi.spyOn(global, "fetch").mockResolvedValue({
      json: async () => mockApiResponse,
    } as any);

    const { sendMessage } = useAIChat();
    const userMessage = "Hello";
    const aiResponse = await sendMessage(userMessage);

    expect(fetch).toHaveBeenCalledWith(
      FAKE_WEBHOOK_URL,
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Session-ID": mockSessionId,
        },
        body: JSON.stringify({ message: userMessage }),
      }),
    );

    expect(aiResponse).toEqual({
      id: expect.any(String),
      text: mockApiResponse.output,
      sender: "AI",
    });
  });

  it("should create a new session cookie if one does not exist", async () => {
    const mockCookieStore = new Map();

    vi.mocked(cookies).mockReturnValue({
      has: (name) => mockCookieStore.has(name),
      get: (name) => mockCookieStore.get(name),
      set: (name, value) => mockCookieStore.set(name, { value }),
    } as any);

    const mockApiResponse = { output: "Welcome!" };
    vi.spyOn(global, "fetch").mockResolvedValue({
      json: async () => mockApiResponse,
    } as any);

    const { sendMessage } = useAIChat();
    await sendMessage("Hi");

    expect(mockCookieStore.has("anthonyCollinsChatSessionId")).toBe(true);
    const newCookie = mockCookieStore.get("anthonyCollinsChatSessionId");
    expect(newCookie).toBeDefined();
    expect(newCookie.value).toBeTypeOf("string");

    expect(fetch).toHaveBeenCalledWith(
      FAKE_WEBHOOK_URL,
      expect.objectContaining({
        headers: {
          "Content-Type": "application/json",
          "X-Session-ID": newCookie.value,
        },
      }),
    );
  });
});