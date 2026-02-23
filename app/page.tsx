"use client";

import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Sidebar } from "@/components/Sidebar";
import { ChatArea } from "@/components/ChatArea";

export default function HomePage() {
  const { user, isLoaded } = useUser();
  const [selectedConversationId, setSelectedConversationId] = useState<Id<"conversations"> | null>(null);
  const [mobileView, setMobileView] = useState<"sidebar" | "chat">("sidebar");

  const storeUser = useMutation(api.users.store);
  const updatePresence = useMutation(api.presence.update);

  useEffect(() => {
    if (!isLoaded || !user) return;
    storeUser({
      clerkId: user.id,
      name: user.fullName ?? user.username ?? "Anonymous",
      email: user.primaryEmailAddress?.emailAddress ?? "",
      imageUrl: user.imageUrl,
    });
  }, [isLoaded, user, storeUser]);

  useEffect(() => {
    if (!user) return;

    updatePresence({ isOnline: true });

    const handleUnload = () => updatePresence({ isOnline: false });
    window.addEventListener("beforeunload", handleUnload);

    const interval = setInterval(() => {
      updatePresence({ isOnline: true });
    }, 30000);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      clearInterval(interval);
    };
  }, [user, updatePresence]);

  const handleSelectConversation = (id: Id<"conversations">) => {
    setSelectedConversationId(id);
    setMobileView("chat");
  };

  const handleBack = () => setMobileView("sidebar");

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <div className="w-8 h-8 border-2 rounded-full border-t-transparent animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden" style={{ background: "var(--background)" }}>
      <div
        className={`
          ${mobileView === "sidebar" ? "flex" : "hidden"}
          md:flex
          border-r
        `}
        style={{ borderColor: "var(--border)" }}
      >
        <Sidebar
          selectedConversationId={selectedConversationId}
          onSelectConversation={handleSelectConversation}
        />
      </div>

      <div className={`
        flex-1 flex flex-col
        ${mobileView === "chat" ? "flex" : "hidden"}
        md:flex
      `}>
        <ChatArea
          conversationId={selectedConversationId}
          onBack={handleBack}
        />
      </div>
    </div>
  );
}