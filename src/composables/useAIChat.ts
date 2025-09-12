import ollama, { Tool } from "ollama/browser";
import type { Message } from "@/stores/chatStore";

const chatModel = "anthony-portfolio-bot"

export function useAIChat() {
  async function sendMessage(message: string): Promise<Message> {
    const ollamaMessage = { role: "user", content: message };


    const response = await ollama.chat({
      model: chatModel,
      messages: [ollamaMessage],
      options: {
        temperature: 1
      }
    })

    return {
      id: crypto.randomUUID(),
      text: response.message.content,
      sender: "AI",
    };
  }

  return {
    sendMessage,
  };
}
