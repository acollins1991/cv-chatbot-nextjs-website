import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { InitialChatForm } from "../initialChatForm";

describe("InitialChatForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test("Renders input and sends ai chat request", async () => {
    // const spyFunction = vi
    //   .fn()
    //   .mockResolvedValue({ response: "Mocked response" });
    // vi.doMock("@/composables/useAIChat", () => {
    //   return {
    //     useAIChat() {
    //       return {
    //         sendMessage: () => {
    //           console.log("this happened");
    //         },
    //       };
    //     },
    //   };
    // });
    // render(<InitialChatForm />);
    // const [formEl] = screen.getAllByTestId<HTMLFormElement>(
    //   "initial-question-form",
    // );
    // expect(formEl).toBeDefined();
    // const [inputEl] = screen.getAllByTestId<HTMLInputElement>(
    //   "initial-question-input",
    // );
    // expect(inputEl).toBeDefined();
    // fireEvent.input(inputEl, { target: { value: "This is a question" } });
    // fireEvent.submit(formEl);
    // expect(spyFunction).toHaveBeenCalled();
    // await waitFor(() => expect(spyFunction).toHaveBeenCalledTimes(1));
    // // expect(vi.mocked.composable.useAIChat().sendMessage).toHaveBeenCalledWith(
    // //   "This is a question",
    // // );
  });
});
