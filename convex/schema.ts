import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    imageUrl: v.string(),
    isOnline: v.boolean(),
    lastSeen: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"]),

  conversations: defineTable({
    participants: v.array(v.id("users")),
    lastMessageTime: v.number(),
    lastMessageText: v.optional(v.string()),
    isGroup: v.optional(v.boolean()),
    groupName: v.optional(v.string()),
    groupAdminId: v.optional(v.id("users")),
  })
    .index("by_participants", ["participants"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    text: v.string(),
    isDeleted: v.boolean(),
    reactions: v.optional(v.record(v.string(), v.array(v.string()))),
  })
    .index("by_conversation", ["conversationId"]),

  readReceipts: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    lastReadTime: v.number(),
  })
    .index("by_conversation_user", ["conversationId", "userId"]),

  typingIndicators: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    lastTypedAt: v.number(),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_conversation_user", ["conversationId", "userId"]),
});