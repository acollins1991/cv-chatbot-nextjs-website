import type { NextRequest } from "next/server";
import z from "zod";
import { useAIChat } from "@/composables/useAIChat";

const ChatPostReqSchema = z.object({
  message: z.string(),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { message } = ChatPostReqSchema.parse(body);
  const { sendMessage } = useAIChat();

  const res = await sendMessage(message);

  return Response.json(res);
}
