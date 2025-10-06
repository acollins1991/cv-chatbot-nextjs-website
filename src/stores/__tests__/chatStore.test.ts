import { useChatStore } from "@/stores/chatStore";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

describe("chatStore", () => {
  // Reset the store before each test
  beforeEach(() => {
    act(() => {
      useChatStore.setState({ messages: [] });
    });
  });
  it("should have the correct initial state", () => {
    const { result } = renderHook(() => useChatStore());
    expect(result.current.messages).toEqual([]);
  });

  it("should add a message", () => {
    const { result } = renderHook(() => useChatStore());
    const messagePayload = { text: "Hello", sender: "User", success: true };

    let newMessage;
    act(() => {
      newMessage = result.current.addMessage(messagePayload);
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0]).toEqual(
      expect.objectContaining(messagePayload),
    );
    expect(newMessage).toEqual(expect.objectContaining(messagePayload));
    expect(newMessage.id).toBeTypeOf("string");
  });

  it("should delete a message", () => {
    const { result } = renderHook(() => useChatStore());
    const messagePayload = { text: "Hello", sender: "User", success: true };

    let messageId;
    act(() => {
      const newMessage = result.current.addMessage(messagePayload);
      messageId = newMessage.id;
    });

    expect(result.current.messages).toHaveLength(1);

    act(() => {
      result.current.deleteMessage(messageId);
    });

    expect(result.current.messages).toHaveLength(0);
  });

  it("should update a message", () => {
    const { result } = renderHook(() => useChatStore());
    const messagePayload = { text: "Hello", sender: "User", success: true };

    let messageId;
    act(() => {
      const newMessage = result.current.addMessage(messagePayload);
      messageId = newMessage.id;
    });

    const updateArgs = { text: "Hello, updated", success: false };
    act(() => {
      result.current.updateMessage(messageId, updateArgs);
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0]).toEqual(
      expect.objectContaining({
        id: messageId,
        sender: "User",
        ...updateArgs,
      }),
    );
  });

  it("should set a message id", () => {
    const { result } = renderHook(() => useChatStore());
    const messagePayload = { text: "Hello", sender: "User", success: true };

    act(() => {
      result.current.addMessage(messagePayload);
    });

    const newId = "custom-id-123";
    act(() => {
      result.current.setMessageId(0, newId);
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].id).toBe(newId);
  });
});