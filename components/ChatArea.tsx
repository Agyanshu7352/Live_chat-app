"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { Send, ArrowLeft, ChevronDown, Users } from "lucide-react";
import Image from "next/image";
import { formatHeaderTimestamp } from "@/lib/utils";

interface ChatAreaProps {
  conversationId: Id<"conversations"> | null;
  onBack: () => void;
}

export function ChatArea({ conversationId, onBack }: ChatAreaProps) {
  const [messageText, setMessageText] = useState("");
  const [showScrollButton, setShowScrollButton] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const conversation = useQuery(
    api.conversations.get,
    conversationId ? { conversationId } : "skip"
  );
  const messages = useQuery(
    api.messages.list,
    conversationId ? { conversationId } : "skip"
  );
  const typingUsers = useQuery(
    api.typing.getTyping,
    conversationId ? { conversationId } : "skip"
  );
  const me = useQuery(api.users.getMe);

  const sendMessage = useMutation(api.messages.send);
  const setTyping = useMutation(api.typing.setTyping);
  const markRead = useMutation(api.readReceipts.markRead);

  // Mark read on conversation open
  useEffect(() => {
    if (conversationId) {
      markRead({ conversationId });
    }
  }, [conversationId, markRead]);

  // Mark read whenever new messages arrive while this chat is visible
  useEffect(() => {
    if (!conversationId || !messages?.length) return;
    if (document.visibilityState === "hidden") return;
    markRead({ conversationId });
  }, [messages, conversationId, markRead]);

  // Mark read when tab regains focus
  useEffect(() => {
    if (!conversationId) return;
    const onFocus = () => markRead({ conversationId });
    document.addEventListener("visibilitychange", onFocus);
    return () => document.removeEventListener("visibilitychange", onFocus);
  }, [conversationId, markRead]);

  const isNearBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    const { scrollTop, scrollHeight, clientHeight } = container;
    return scrollHeight - scrollTop - clientHeight < 150;
  }, []);

  useEffect(() => {
    if (!messages) return;
    if (isNearBottom()) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setShowScrollButton(false);
    } else {
      setShowScrollButton(true);
    }
  }, [messages, isNearBottom]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
    setShowScrollButton(false);
  }, [conversationId]);

  const handleScroll = useCallback(() => {
    if (isNearBottom()) {
      setShowScrollButton(false);
    }
  }, [isNearBottom]);

  const handleSend = async () => {
    if (!messageText.trim() || !conversationId) return;

    const text = messageText.trim();
    setMessageText("");

    try {
      await sendMessage({ conversationId, text });
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessageText(text);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageText(e.target.value);
    if (!conversationId) return;

    setTyping({ conversationId, isTyping: true });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      setTyping({ conversationId, isTyping: false });
    }, 2000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollButton(false);
  };

  if (!conversationId) {
    return (
      <div
        className="flex-1 flex flex-col items-center justify-center"
        style={{ background: "var(--background)" }}
      >
        <div className="text-center" style={{ color: "var(--text-secondary)" }}>
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "var(--surface)" }}
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-1" style={{ color: "var(--text-primary)" }}>
            Select a conversation
          </h3>
          <p className="text-sm">Choose from the sidebar or start a new chat</p>
        </div>
      </div>
    );
  }

  const isGroup = !!(conversation as any)?.isGroup;
  const groupMembers: any[] = (conversation as any)?.groupMembers ?? [];

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--background)" }}>
      <div
        className="flex items-center gap-3 px-4 py-3 border-b flex-shrink-0"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <button
          onClick={onBack}
          className="md:hidden p-1 rounded-lg transition-colors"
          style={{ color: "var(--text-secondary)" }}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="relative">
          {isGroup ? (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "var(--accent)" }}
            >
              <Users className="w-5 h-5 text-white" />
            </div>
          ) : conversation?.otherUser?.imageUrl ? (
            <Image
              src={conversation.otherUser.imageUrl}
              alt={conversation.otherUser?.name ?? "User"}
              width={40}
              height={40}
              className="rounded-full object-cover"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-semibold"
              style={{ background: "var(--accent)", color: "white" }}
            >
              {conversation?.otherUser?.name?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}
          {!isGroup && conversation?.otherUser?.isOnline && (
            <span
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
              style={{ background: "var(--online)", borderColor: "var(--surface)" }}
            />
          )}
        </div>

        <div>
          <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
            {isGroup
              ? ((conversation as any)?.groupName ?? "Group")
              : (conversation?.otherUser?.name ?? "Loading...")}
          </p>
          <p className="text-xs" style={{ color: isGroup ? "var(--text-secondary)" : (conversation?.otherUser?.isOnline ? "var(--online)" : "var(--text-secondary)") }}>
            {isGroup
              ? `${groupMembers.length} members`
              : (conversation?.otherUser?.isOnline ? "Online" : "Offline")}
          </p>
        </div>
      </div>

      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
        style={{ background: "var(--background)" }}
      >
        {messages === undefined && (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}
              >
                <div className="skeleton h-10 rounded-2xl" style={{ width: `${100 + i * 40}px` }} />
              </div>
            ))}
          </div>
        )}

        {messages !== undefined && messages.length === 0 && (
          <div className="flex items-center justify-center h-full" style={{ color: "var(--text-secondary)" }}>
            <div className="text-center">
              <p className="text-sm">No messages yet</p>
              <p className="text-xs mt-1 opacity-70">Say hi to start the conversation! 👋</p>
            </div>
          </div>
        )}

        {messages?.map((msg, index) => {
          const prevMsg = messages[index - 1];
          const showDateSeparator =
            !prevMsg ||
            formatHeaderTimestamp(msg._creationTime) !== formatHeaderTimestamp(prevMsg._creationTime);

          return (
            <div key={msg._id}>
              {showDateSeparator && (
                <div className="flex items-center justify-center my-3">
                  <span
                    className="text-xs px-3 py-1 rounded-full"
                    style={{ background: "var(--surface)", color: "var(--text-secondary)" }}
                  >
                    {formatHeaderTimestamp(msg._creationTime)}
                  </span>
                </div>
              )}
              <MessageBubble
                message={msg}
                isOwn={msg.senderId === me?._id}
                isGroup={!!(conversation as any)?.isGroup}
              />
            </div>
          );
        })}

        {typingUsers && typingUsers.length > 0 && conversationId && (
          <TypingIndicator users={typingUsers as any[]} />
        )}

        <div ref={messagesEndRef} />
      </div>

      {showScrollButton && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2">
          <button
            onClick={scrollToBottom}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium shadow-lg transition-all"
            style={{ background: "var(--accent)", color: "white" }}
          >
            <ChevronDown className="w-4 h-4" />
            New messages
          </button>
        </div>
      )}

      <div
        className="flex-shrink-0 px-4 py-3 border-t"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <div
          className="flex items-end gap-2 rounded-2xl px-4 py-2"
          style={{ background: "var(--surface-2)" }}
        >
          <textarea
            value={messageText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 bg-transparent text-sm outline-none resize-none py-1.5 max-h-32"
            style={{ color: "var(--text-primary)" }}
          />
          <button
            onClick={handleSend}
            disabled={!messageText.trim()}
            className="mb-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-30"
            style={{ background: messageText.trim() ? "var(--accent)" : "transparent" }}
          >
            <Send className="w-4 h-4" style={{ color: messageText.trim() ? "white" : "var(--text-secondary)" }} />
          </button>
        </div>
        <p className="text-xs mt-1 opacity-40 text-center" style={{ color: "var(--text-secondary)" }}>
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}