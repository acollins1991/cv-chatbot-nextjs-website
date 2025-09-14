import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { useAIChat } from "@/composables/useAIChat";
import { sendChatMessage } from "@/composables/useApi";
import { InitialChatForm } from "../initialChatForm";

// Hoist the mock call outside the describe block
vi.mock("@/composables/useApi");

describe.skip("InitialChatForm", () => {
  // Use beforeEach to reset and re-mock before each test
  beforeEach(() => {
    // Correctly mock the return value for the useAIChat composable
    // vi.mocked(sendChatMessage).mockReturnValue({
    //   sendMessage: vi.fn().mockResolvedValue({ response: "Mocked response" }),
    // });
    vi.mocked(sendChatMessage).mockImplementation(
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ response: "Mocked response" })),
        ),
    );
  });

  test("Renders input and sends ai chat request on input", async () => {
    render(<InitialChatForm />);
    const [formEl] = screen.getAllByTestId<HTMLFormElement>(
      "initial-question-form",
    );
    const [inputEl] = screen.getAllByTestId<HTMLInputElement>(
      "initial-question-input",
    );

    // Get a reference to the mock function after the mock is set
    const { sendMessage } = useAIChat();

    expect(formEl).toBeDefined();
    expect(inputEl).toBeDefined();

    fireEvent.input(inputEl, { target: { value: "This is a question" } });
    fireEvent.submit(formEl);

    // Wait for the mock to be called
    await vi.waitFor(() => expect(sendMessage).toHaveBeenCalled());

    // Check if it was called with the correct value
    expect(sendMessage).toHaveBeenCalledWith("This is a question");
  });
});
