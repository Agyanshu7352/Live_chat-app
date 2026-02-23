"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUser, UserButton } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Image from "next/image";
import { formatTimestamp } from "@/lib/utils";
import { MessageSquare, Search, X, Users, Plus, Check, ArrowLeft } from "lucide-react";

interface SidebarProps {
  selectedConversationId: Id<"conversations"> | null;
  onSelectConversation: (id: Id<"conversations">) => void;
}

export function Sidebar({ selectedConversationId, onSelectConversation }: SidebarProps) {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<"chats" | "users">("chats");
  const [searchQuery, setSearchQuery] = useState("");

  // Group creation state
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<Id<"users">[]>([]);

  const conversations = useQuery(api.conversations.listMine);
  const allUsers = useQuery(api.users.listAll, { searchQuery });
  const getOrCreateConversation = useMutation(api.conversations.getOrCreate);
  const createGroup = useMutation(api.conversations.createGroup);

  const handleUserClick = async (userId: Id<"users">) => {
    if (creatingGroup) {
      setSelectedUserIds((prev) =>
        prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
      );
      return;
    }
    const conversationId = await getOrCreateConversation({ otherUserId: userId });
    onSelectConversation(conversationId);
    setActiveTab("chats");
    setSearchQuery("");
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUserIds.length === 0) return;
    const conversationId = await createGroup({
      groupName: groupName.trim(),
      memberIds: selectedUserIds,
    });
    onSelectConversation(conversationId);
    setCreatingGroup(false);
    setGroupName("");
    setSelectedUserIds([]);
    setSearchQuery("");
    setActiveTab("chats");
  };

  const cancelGroupCreation = () => {
    setCreatingGroup(false);
    setGroupName("");
    setSelectedUserIds([]);
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--surface)" }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-4 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "var(--accent)" }}
          >
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-base" style={{ color: "var(--text-primary)" }}>
            ChatFlow
          </span>
        </div>
        <UserButton />
      </div>

      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: "var(--border)" }}>
        <button
          onClick={() => { setActiveTab("chats"); cancelGroupCreation(); }}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === "chats" ? "border-b-2" : ""}`}
          style={{
            color: activeTab === "chats" ? "var(--accent)" : "var(--text-secondary)",
            borderColor: activeTab === "chats" ? "var(--accent)" : "transparent",
          }}
        >
          Chats
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === "users" ? "border-b-2" : ""}`}
          style={{
            color: activeTab === "users" ? "var(--accent)" : "var(--text-secondary)",
            borderColor: activeTab === "users" ? "var(--accent)" : "transparent",
          }}
        >
          New Chat
        </button>
      </div>

      {/* New Chat tab controls */}
      {activeTab === "users" && (
        <div className="px-3 py-2 space-y-2">
          {/* Group creation header */}
          {creatingGroup ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <button onClick={cancelGroupCreation}>
                  <ArrowLeft className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
                </button>
                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  New Group
                </span>
              </div>
              <input
                type="text"
                placeholder="Group name..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{
                  background: "var(--surface-2)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border)",
                }}
              />
              {selectedUserIds.length > 0 && (
                <button
                  onClick={handleCreateGroup}
                  disabled={!groupName.trim()}
                  className="w-full py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
                  style={{ background: "var(--accent)", color: "white" }}
                >
                  Create Group ({selectedUserIds.length + 1} members)
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => setCreatingGroup(true)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ background: "var(--surface-2)", color: "var(--accent)" }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <Plus className="w-4 h-4" />
              New Group Chat
            </button>
          )}

          {/* Search */}
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2"
            style={{ background: "var(--surface-2)" }}
          >
            <Search className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-secondary)" }} />
            <input
              type="text"
              placeholder={creatingGroup ? "Search members..." : "Search users..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none placeholder:opacity-50"
              style={{ color: "var(--text-primary)" }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")}>
                <X className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {/* CHATS TAB */}
        {activeTab === "chats" && (
          <>
            {conversations === undefined && (
              <div className="p-3 space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-2">
                    <div className="skeleton w-10 h-10 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <div className="skeleton h-3 w-24" />
                      <div className="skeleton h-3 w-36" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {conversations !== undefined && conversations.length === 0 && (
              <div className="flex flex-col items-center justify-center p-8 text-center" style={{ color: "var(--text-secondary)" }}>
                <MessageSquare className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm font-medium">No conversations yet</p>
                <p className="text-xs mt-1 opacity-70">Go to &quot;New Chat&quot; to start messaging</p>
              </div>
            )}

            {conversations?.map((conv) => {
              const isGroup = conv.isGroup;
              const displayName = isGroup
                ? (conv.groupName ?? "Group")
                : (conv.otherUser?.name ?? "Unknown");
              const isOnline = !isGroup && (conv.otherUser as any)?.isOnline;
              const imageUrl = !isGroup ? (conv.otherUser as any)?.imageUrl : null;

              return (
                <button
                  key={conv._id}
                  onClick={() => onSelectConversation(conv._id)}
                  className="w-full flex items-center gap-3 px-3 py-3 transition-colors text-left"
                  style={{
                    background: selectedConversationId === conv._id ? "var(--surface-2)" : "transparent",
                  }}
                >
                  <div className="relative flex-shrink-0">
                    {isGroup ? (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ background: "var(--accent)" }}
                      >
                        <Users className="w-5 h-5 text-white" />
                      </div>
                    ) : imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={displayName}
                        width={40}
                        height={40}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold"
                        style={{ background: "var(--accent)", color: "white" }}
                      >
                        {displayName[0]?.toUpperCase() ?? "?"}
                      </div>
                    )}
                    {isOnline && (
                      <span
                        className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                        style={{ background: "var(--online)", borderColor: "var(--surface)" }}
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                        {displayName}
                      </span>
                      <span className="text-xs ml-1 flex-shrink-0" style={{ color: "var(--text-secondary)" }}>
                        {formatTimestamp(conv.lastMessageTime)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
                        {conv.lastMessageText ?? "No messages yet"}
                      </span>
                      {conv.unreadCount > 0 && (
                        <span
                          className="ml-1 flex-shrink-0 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ background: "var(--accent)", color: "white" }}
                        >
                          {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </>
        )}

        {/* USERS TAB */}
        {activeTab === "users" && (
          <>
            {allUsers === undefined && (
              <div className="p-3 space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-2">
                    <div className="skeleton w-10 h-10 rounded-full" />
                    <div className="skeleton h-3 w-32" />
                  </div>
                ))}
              </div>
            )}

            {allUsers !== undefined && allUsers.length === 0 && (
              <div className="flex flex-col items-center justify-center p-8 text-center" style={{ color: "var(--text-secondary)" }}>
                <Users className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm font-medium">
                  {searchQuery ? "No users found" : "No other users yet"}
                </p>
                <p className="text-xs mt-1 opacity-70">
                  {searchQuery ? "Try a different search term" : "Invite friends to join ChatFlow"}
                </p>
              </div>
            )}

            {allUsers?.map((u) => {
              const isSelected = selectedUserIds.includes(u._id);
              return (
                <button
                  key={u._id}
                  onClick={() => handleUserClick(u._id)}
                  className="w-full flex items-center gap-3 px-3 py-3 transition-colors text-left"
                  style={{ background: "transparent" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = isSelected ? "var(--surface-2)" : "transparent")}
                >
                  <div className="relative flex-shrink-0">
                    {u.imageUrl ? (
                      <Image
                        src={u.imageUrl}
                        alt={u.name}
                        width={40}
                        height={40}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold"
                        style={{ background: "var(--accent)", color: "white" }}
                      >
                        {u.name[0]?.toUpperCase()}
                      </div>
                    )}
                    {u.isOnline && (
                      <span
                        className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                        style={{ background: "var(--online)", borderColor: "var(--surface)" }}
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {u.name}
                    </p>
                    <p className="text-xs" style={{ color: u.isOnline ? "var(--online)" : "var(--text-secondary)" }}>
                      {u.isOnline ? "Online" : "Offline"}
                    </p>
                  </div>
                  {/* Checkmark for group selection */}
                  {creatingGroup && (
                    <div
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                      style={{
                        borderColor: isSelected ? "var(--accent)" : "var(--border)",
                        background: isSelected ? "var(--accent)" : "transparent",
                      }}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                  )}
                </button>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}