import { create } from "zustand";

export type MessagePayload = {
  text: string;
} & ({ sender: "User"; success: boolean } | { sender: "AI" });

export type Message = MessagePayload & { id: string };

type Store = {
  messages: Message[];
};

type Action = {
  deleteMessage: (id: Message["id"]) => void;
  addMessage: (message: MessagePayload) => Message;
  updateMessage: (
    id: Message["id"],
    { text, success }: { text: string; success?: boolean },
  ) => void;
  setMessageId: (index: number, id: Message["id"]) => void;
};

export const useChatStore = create<Store & Action>()((set) => ({
  messages: [],
  addMessage: (message) => {
    const newMessage = { id: crypto.randomUUID(), ...message };
    set((state) => ({ messages: [...state.messages, newMessage] }));
    return newMessage;
  },
  deleteMessage: (id) =>
    set((state) => ({
      messages: state.messages.filter((msg) => msg.id !== id),
    })),
  updateMessage: (id, updateArgs) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, ...updateArgs } : msg,
      ),
    })),
  setMessageId: (index, id) => {
    set((state) => {
      const allMessagesClone = state.messages.copyWithin(-1, 0);
      allMessagesClone[index].id = id;
      return { messages: allMessagesClone };
    });
  },
}));
