import type { RequestCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { cookies } from "next/headers";
import type { Message } from "@/stores/chatStore";

const webhookUrl = process.env.NEXT_PUBLIC_N8N_CHAT_WEBHOOK as string;

async function getChatSessionCookie() {
  const cookieStore = await cookies();
  if (!cookieStore.has("anthonyCollinsChatSessionId")) {
    cookieStore.set("anthonyCollinsChatSessionId", crypto.randomUUID());
  }

  return cookieStore.get("anthonyCollinsChatSessionId") as RequestCookie;
}

export function useAIChat() {
  async function sendMessage(message: string): Promise<Message> {
    const sessionId = await getChatSessionCookie();
    const chatResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Session-ID": sessionId.value,
      },
      body: JSON.stringify({
        message,
      }),
    });

    const [{ output }] = (await chatResponse.json()) as {
      output: string;
    }[];

    return {
      id: crypto.randomUUID(),
      text: output,
      sender: "AI",
    };
  }

  return {
    sendMessage,
  };
}
