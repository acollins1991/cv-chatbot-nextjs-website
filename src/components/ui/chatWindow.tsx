"use client";

import Markdown from "markdown-to-jsx";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { sendChatMessage } from "@/composables/useApi";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/stores/chatStore";
import { InitialChatFormLoadingSpinner } from "./initialChatFormLoadingSpinner";
import { Input } from "./input";

export function ChatWindow({ children }: { children: React.ReactNode }) {
  const messages = useChatStore((state) => state.messages);

  const [width, setWidth] = useState<number>();
  const [height, setHeight] = useState<number>();
  const [padding, setPadding] = useState<number>();

  useEffect(() => {
    if (messages.length === 0 || width) return;
    setWidth(1000);
    setHeight(1000);
    setPadding(16);
  }, [messages, width]);

  return (
    <motion.div
      animate={{ height, width, padding }}
      className="relative overflow-visible bg-stone-100 rounded-md max-w-[100%]"
    >
      {messages.length > 0 ? (
        <>
          <div className="absolute bottom-0 left-0 flex w-full">
            <ChatWindowInputForm />
          </div>
          {messages.map((msg) => (
            <ChatWindowBubble
              key={msg.id}
              type={msg.sender}
              success={"success" in msg ? msg.success : null}
            >
              <Markdown>{msg.text}</Markdown>
            </ChatWindowBubble>
          ))}
        </>
      ) : (
        children
      )}
    </motion.div>
  );
}

type BubbleType = "User" | "AI";

type ChatWindowBubbleProps = {
  children: React.ReactNode;
  type: BubbleType;
  success: boolean | null;
};

function ChatWindowBubble({ children, type, success }: ChatWindowBubbleProps) {
  return (
    <div className="flex flex-col w-full my-1">
      <div
        className={cn(
          "dark:bg-input/30 border-input flex min-h-9 w-[48%] min-w-0 rounded-md border bg-white px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none text-lg",
          type === "User" ? "self-end" : "",
          success === false ? "border-red-500" : "",
        )}
      >
        {children}
      </div>
    </div>
  );
}

type QuestionFormValues = {
  question: string;
};

function ChatWindowInputForm() {
  const { register, handleSubmit, resetField } = useForm<QuestionFormValues>();
  const { addMessage } = useChatStore();

  const [loading, setLoading] = useState(false);

  const sendToAI: SubmitHandler<QuestionFormValues> = async (data) => {
    setLoading(true);
    try {
      addMessage({
        text: data.question,
        sender: "User",
        success: true,
      });
      resetField("question");
      const res = await sendChatMessage(data.question);
      const message = await res.json();
      addMessage(message);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      className="relative w-full p-[16px]"
      onSubmit={handleSubmit(sendToAI)}
    >
      <Input
        {...register("question")}
        disabled={loading}
        placeholder="What would you like to know?"
      />
      {loading && (
        <div className="absolute -right-6 -top-6">
          <InitialChatFormLoadingSpinner />
        </div>
      )}
    </form>
  );
}
