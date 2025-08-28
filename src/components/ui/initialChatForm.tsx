"use client";

import { useState } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { useAIChat } from "@/composables/useAIChat";
import { useChatStore } from "@/stores/chatStore";
import { InitialChatFormLoadingSpinner } from "./initialChatFormLoadingSpinner";
import { Input } from "./input";

type QuestionFormValues = {
  question: string;
};

export function InitialChatForm() {
  const { register, handleSubmit } = useForm<QuestionFormValues>();
  const { sendMessage } = useAIChat();
  const { addMessage } = useChatStore();

  const [loading, setLoading] = useState(false);

  const sendToAI: SubmitHandler<QuestionFormValues> = async (data) => {
    setLoading(true);
    try {
      const res = await sendMessage(data.question);

      addMessage({
        text: data.question,
        sender: "User",
        success: true,
      });
      addMessage(res.response);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      data-testid="initial-question-form"
      className="relative"
      onSubmit={handleSubmit(sendToAI)}
    >
      <Input
        {...register("question")}
        data-testid="initial-question-input"
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
