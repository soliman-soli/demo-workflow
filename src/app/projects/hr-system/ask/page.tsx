import type { Metadata } from "next";
import { DemoPageHeader } from "@/components/demo-page-header";
import { Chat } from "@/features/ask/components/chat";

export const metadata: Metadata = { title: "Ask HR · HR Demo" };

export default function AskPage() {
  return (
    <>
      <DemoPageHeader
        label="Ask · 1"
        title="Ask HR a question"
        description="Every answer comes from the selected company's policies and names the policy it's based on."
      />
      <Chat />
    </>
  );
}

