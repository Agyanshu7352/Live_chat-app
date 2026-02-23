import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getOrCreate = mutation({
  args: {
    otherUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const me = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!me) throw new Error("User not found");

    const allConversations = await ctx.db.query("conversations").collect();

    const existing = allConversations.find((conv) => {
      const parts = conv.participants;
      return (
        !conv.isGroup &&
        parts.length === 2 &&
        parts.includes(me._id) &&
        parts.includes(args.otherUserId)
      );
    });

    if (existing) {
      return existing._id;
    }

    const conversationId = await ctx.db.insert("conversations", {
      participants: [me._id, args.otherUserId],
      lastMessageTime: Date.now(),
      lastMessageText: undefined,
    });

    return conversationId;
  },
});

export const createGroup = mutation({
  args: {
    groupName: v.string(),
    memberIds: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const me = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!me) throw new Error("User not found");

    const participants = [me._id, ...args.memberIds.filter((id) => id !== me._id)];

    const conversationId = await ctx.db.insert("conversations", {
      participants,
      lastMessageTime: Date.now(),
      lastMessageText: undefined,
      isGroup: true,
      groupName: args.groupName.trim(),
      groupAdminId: me._id,
    });

    return conversationId;
  },
});

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const me = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!me) return [];

    const allConversations = await ctx.db.query("conversations").collect();
    const myConversations = allConversations.filter((conv) =>
      conv.participants.includes(me._id)
    );

    const enriched = await Promise.all(
      myConversations.map(async (conv) => {
        const readReceipt = await ctx.db
          .query("readReceipts")
          .withIndex("by_conversation_user", (q) =>
            q.eq("conversationId", conv._id).eq("userId", me._id)
          )
          .first();

        const lastReadTime = readReceipt?.lastReadTime ?? 0;
        const allMessages = await ctx.db
          .query("messages")
          .withIndex("by_conversation", (q) => q.eq("conversationId", conv._id))
          .collect();

        const unreadCount = allMessages.filter(
          (msg) => msg._creationTime > lastReadTime && msg.senderId !== me._id
        ).length;

        if (conv.isGroup) {
          const members = await Promise.all(
            conv.participants.map((id) => ctx.db.get(id))
          );
          return {
            ...conv,
            otherUser: null,
            groupMembers: members.filter(Boolean),
            unreadCount,
          };
        }

        const otherId = conv.participants.find((id) => id !== me._id);
        const otherUser = otherId ? await ctx.db.get(otherId) : null;

        return {
          ...conv,
          otherUser,
          groupMembers: [],
          unreadCount,
        };
      })
    );

    return enriched.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
  },
});

export const get = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const me = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!me) return null;

    const conv = await ctx.db.get(args.conversationId);
    if (!conv) return null;

    if (!conv.participants.includes(me._id)) return null;

    if (conv.isGroup) {
      const members = await Promise.all(
        conv.participants.map((id) => ctx.db.get(id))
      );
      return { ...conv, otherUser: null, groupMembers: members.filter(Boolean) };
    }

    const otherId = conv.participants.find((id) => id !== me._id);
    const otherUser = otherId ? await ctx.db.get(otherId) : null;

    return { ...conv, otherUser, groupMembers: [] };
  },
});