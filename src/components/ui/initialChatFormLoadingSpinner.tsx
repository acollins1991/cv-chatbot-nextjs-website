import { Loader2Icon } from "lucide-react";

export function InitialChatFormLoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-1 size-12 rounded-full bg-radial from-white from-5% to-transparent">
      <Loader2Icon className="animate-spin" />
    </div>
  );
}
