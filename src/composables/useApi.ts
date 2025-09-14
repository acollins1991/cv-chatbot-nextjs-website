export async function sendChatMessage(message: string) {
  return fetch("/api/chat", {
    method: "POST",
    body: JSON.stringify({
      message,
    }),
  });
}
