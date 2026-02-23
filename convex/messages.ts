import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .order("asc")
      .collect();

    const enriched = await Promise.all(
      messages.map(async (msg) => {
        const sender = await ctx.db.get(msg.senderId);
        return { ...msg, sender };
      })
    );

    return enriched;
  },
});

export const send = mutation({
  args: {
    conversationId: v.id("conversations"),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const me = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!me) throw new Error("User not found");

    const conv = await ctx.db.get(args.conversationId);
    if (!conv || !conv.participants.includes(me._id)) {
      throw new Error("Not a participant in this conversation");
    }

    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: me._id,
      text: args.text.trim(),
      isDeleted: false,
      reactions: {},
    });

    await ctx.db.patch(args.conversationId, {
      lastMessageTime: Date.now(),
      lastMessageText: args.text.trim().slice(0, 50),
    });

    const typingRecord = await ctx.db
      .query("typingIndicators")
      .withIndex("by_conversation_user", (q) =>
        q.eq("conversationId", args.conversationId).eq("userId", me._id)
      )
      .first();

    if (typingRecord) {
      await ctx.db.delete(typingRecord._id);
    }

    return messageId;
  },
});

export const deleteMessage = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const me = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!me) throw new Error("User not found");

    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");

    if (message.senderId !== me._id) {
      throw new Error("Cannot delete someone else's message");
    }

    await ctx.db.patch(args.messageId, { isDeleted: true });
  },
});

export const toggleReaction = mutation({
  args: {
    messageId: v.id("messages"),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const me = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!me) throw new Error("User not found");

    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");

    const reactions = { ...(message.reactions ?? {}) };
    const myReactions = reactions[me._id] ?? [];

    if (myReactions.includes(args.emoji)) {
      reactions[me._id] = myReactions.filter((e) => e !== args.emoji);
      if (reactions[me._id].length === 0) {
        delete reactions[me._id];
      }
    } else {
      reactions[me._id] = [...myReactions, args.emoji];
    }

    await ctx.db.patch(args.messageId, { reactions });
  },
});