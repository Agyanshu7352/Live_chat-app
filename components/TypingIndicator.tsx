"use client";

import Image from "next/image";

interface TypingUser {
  _id: string;
  name: string;
  imageUrl: string;
}

interface TypingIndicatorProps {
  users: TypingUser[];
}

export function TypingIndicator({ users }: TypingIndicatorProps) {
  if (users.length === 0) return null;

  const typingText =
    users.length === 1
      ? `${users[0].name} is typing`
      : users.length === 2
        ? `${users[0].name} and ${users[1].name} are typing`
        : `${users.length} people are typing`;

  return (
    <div className="flex items-end gap-2 mb-2 message-animate">
      <div className="flex-shrink-0">
        {users[0]?.imageUrl ? (
          <Image
            src={users[0].imageUrl}
            alt={users[0].name}
            width={28}
            height={28}
            className="rounded-full object-cover"
          />
        ) : (
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
            style={{ background: "var(--accent)", color: "white" }}
          >
            {users[0]?.name?.[0]?.toUpperCase()}
          </div>
        )}
      </div>

      <div className="flex flex-col items-start">
        <div
          className="px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-2"
          style={{ background: "var(--surface)" }}
        >
          <div className="flex items-center gap-1">
            <div className="typing-dot w-2 h-2 rounded-full" style={{ background: "var(--text-secondary)" }} />
            <div className="typing-dot w-2 h-2 rounded-full" style={{ background: "var(--text-secondary)" }} />
            <div className="typing-dot w-2 h-2 rounded-full" style={{ background: "var(--text-secondary)" }} />
          </div>
        </div>
        <span className="text-xs mt-0.5 px-1" style={{ color: "var(--text-secondary)" }}>
          {typingText}...
        </span>
      </div>
    </div>
  );
}