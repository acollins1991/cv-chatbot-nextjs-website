"use client";

import type { ChatStatus } from "ai";
import { useState } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ui/shadcn-io/ai/conversation";
import { Message, MessageContent } from "@/components/ui/shadcn-io/ai/message";
import { sendChatMessage } from "@/composables/useApi";
import { useChatStore } from "@/stores/chatStore";
import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
} from "./shadcn-io/ai/prompt-input";
import { Response } from "./shadcn-io/ai/response";

export function ChatWindow() {
  const messages = useChatStore((state) => state.messages);
  const { addMessage } = useChatStore();
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<ChatStatus>("ready");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) return;

    const userMessage = input;

    try {
      setInput("");
      setStatus("submitted");
      addMessage({
        text: userMessage,
        sender: "User",
        success: true,
      });
      const res = await sendChatMessage(userMessage);
      const message = await res.json();
      addMessage(message);
      setStatus("ready");
    } catch (error) {
      console.error("Error sending message:", error);
      setStatus("error");
    } finally {
      setInput("");
    }
  };

  return (
    <div className="flex flex-col">
      <Conversation className="h-full h-3/4 md:max-h-screen">
        <ConversationContent>
          {messages.map((message) => (
            <Message from={message.sender} key={message.id}>
              <MessageContent>
                <Response>{message.text}</Response>
              </MessageContent>
            </Message>
          ))}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <PromptInput onSubmit={handleSubmit} className="mt-4">
        <PromptInputTextarea
          value={input}
          placeholder="Say something..."
          onChange={(e) => setInput(e.currentTarget.value)}
        />
        <PromptInputSubmit status={status} disabled={!input.trim()} />
      </PromptInput>
    </div>
  );
}
