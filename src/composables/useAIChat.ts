import type { Message } from "@/stores/chatStore";

type AIResponse = {
  response: Message;
};

export function useAIChat() {
  async function sendMessage(message: string): Promise<AIResponse> {
    // Simulate an API call to an AI service
    return new Promise<AIResponse>((resolve) => {
      setTimeout(() => {
        resolve({
          response: {
            id: crypto.randomUUID(),
            text: `AI response to: ${message}`,
            sender: "AI",
          },
        });
      }, 1000);
    });
  }

  return {
    sendMessage,
  };
}
