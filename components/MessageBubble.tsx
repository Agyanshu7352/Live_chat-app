"use client";

import { useState, useRef, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { formatMessageTime } from "@/lib/utils";
import Image from "next/image";
import { Trash2, Smile } from "lucide-react";

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢"];

interface MessageBubbleProps {
  message: {
    _id: Id<"messages">;
    text: string;
    isDeleted: boolean;
    senderId: Id<"users">;
    _creationTime: number;
    reactions?: Record<string, string[]>;
    sender?: {
      _id: Id<"users">;
      name: string;
      imageUrl: string;
    } | null;
  };
  isOwn: boolean;
  isGroup?: boolean;
}

export function MessageBubble({ message, isOwn, isGroup }: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false); // ✅ FIX 1: was missing entirely
  const [popupPos, setPopupPos] = useState<{ x: number; y: number } | null>(null);

  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);

  const deleteMessage = useMutation(api.messages.deleteMessage);
  const toggleReaction = useMutation(api.messages.toggleReaction);

  const openActions = useCallback((clientX: number, clientY: number) => {
    if (message.isDeleted) return;
    setPopupPos({ x: clientX, y: clientY });
    setShowActions(true);
    setShowEmojiPicker(false);
  }, [message.isDeleted]);

  const closeActions = useCallback(() => {
    setShowActions(false);
    setShowEmojiPicker(false);
    setPopupPos(null);
  }, []);

  // --- Mouse long-press ---
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const { clientX, clientY } = e;
    holdTimerRef.current = setTimeout(() => {
      openActions(clientX, clientY);
    }, 500);
  };

  const handleMouseUp = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  // --- Touch long-press ---
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const { clientX, clientY } = touch;
    holdTimerRef.current = setTimeout(() => {
      openActions(clientX, clientY);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  const handleDelete = async () => {
    closeActions();
    await deleteMessage({ messageId: message._id });
  };

  const handleReaction = async (emoji: string) => {
    closeActions();
    await toggleReaction({ messageId: message._id, emoji });
  };

  // ✅ FIX 2: reactionSummary is now INSIDE the component (was outside before)
  const reactionSummary: Record<string, { count: number; users: string[] }> = {};
  if (message.reactions) {
    Object.entries(message.reactions).forEach(([userId, emojis]) => {
      emojis.forEach((emoji) => {
        if (!reactionSummary[emoji]) {
          reactionSummary[emoji] = { count: 0, users: [] };
        }
        reactionSummary[emoji].count++;
        reactionSummary[emoji].users.push(userId);
      });
    });
  }

  // ✅ FIX 3: getPopupStyle is now INSIDE the component (was outside before)
  const getPopupStyle = () => {
    if (!popupPos) return {};
    const popupW = 160;
    const popupH = 80;
    let x = popupPos.x - popupW / 2;
    let y = popupPos.y - popupH - 12;
    // Clamp to viewport so popup doesn't go off screen
    x = Math.max(8, Math.min(x, (typeof window !== "undefined" ? window.innerWidth : 400) - popupW - 8));
    y = Math.max(8, y);
    return { left: x, top: y };
  };

  // Everything below is the return — now correctly inside the component
  return (
    <>
      <div
        ref={bubbleRef}
        className={`flex items-end gap-2 mb-2 message-animate select-none ${isOwn ? "flex-row-reverse" : "flex-row"}`}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {!isOwn && (
          <div className="flex-shrink-0 mb-1">
            {message.sender?.imageUrl ? (
              <Image
                src={message.sender.imageUrl}
                alt={message.sender.name}
                width={28}
                height={28}
                className="rounded-full object-cover"
              />
            ) : (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
                style={{ background: "var(--accent)", color: "white" }}
              >
                {message.sender?.name?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
          </div>
        )}

        <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"} max-w-[70%]`}>
          {/* Show sender name in group chats */}
          {isGroup && !isOwn && message.sender?.name && (
            <span className="text-xs mb-0.5 px-1 font-medium" style={{ color: "var(--accent)" }}>
              {message.sender.name}
            </span>
          )}

          {/* Message bubble */}
          <div
            className={`px-3 py-2 rounded-2xl text-sm leading-relaxed cursor-pointer ${isOwn ? "rounded-br-sm" : "rounded-bl-sm"}`}
            style={
              isOwn
                ? { background: "var(--accent)", color: "white" }
                : { background: "var(--surface)", color: "var(--text-primary)" }
            }
          >
            {message.isDeleted ? (
              <span className="italic opacity-50">This message was deleted</span>
            ) : (
              <span style={{ whiteSpace: "pre-wrap" }}>{message.text}</span>
            )}
          </div>

          {/* Timestamp */}
          <span className="text-xs mt-0.5 px-1" style={{ color: "var(--text-secondary)" }}>
            {formatMessageTime(message._creationTime)}
          </span>

          {/* Reaction counts */}
          {Object.keys(reactionSummary).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {Object.entries(reactionSummary).map(([emoji, data]) => (
                <button
                  key={emoji}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={() => handleReaction(emoji)}
                  className="flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full transition-colors"
                  style={{ background: "var(--surface)", color: "var(--text-primary)" }}
                >
                  <span>{emoji}</span>
                  <span style={{ color: "var(--text-secondary)" }}>{data.count}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fixed-position action popup (WhatsApp style) */}
      {showActions && !message.isDeleted && popupPos && (
        <div
          className="fixed z-50 rounded-2xl shadow-2xl p-2 flex flex-col gap-1"
          style={{
            ...getPopupStyle(),
            background: "var(--surface)",
            border: "1px solid var(--border)",
            minWidth: 160,
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Emoji row */}
          <div className="flex items-center justify-between px-1 py-1 gap-1">
            {REACTION_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className="text-xl hover:scale-125 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>

          <div style={{ borderTop: "1px solid var(--border)", margin: "2px 0" }} />

          {/* React button */}
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors w-full text-left"
            style={{ color: "var(--text-primary)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <Smile className="w-4 h-4" />
            React
          </button>

          {/* Delete button — only for own messages */}
          {isOwn && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors w-full text-left"
              style={{ color: "var(--danger)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          )}
        </div>
      )}

      {/* Backdrop — clicking outside closes the popup */}
      {showActions && (
        <div
          className="fixed inset-0 z-40"
          onMouseDown={closeActions}
          onTouchStart={closeActions}
        />
      )}
    </>
  );
}