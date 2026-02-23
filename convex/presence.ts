import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const update = mutation({
  args: {
    isOnline: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const me = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!me) return;

    await ctx.db.patch(me._id, {
      isOnline: args.isOnline,
      lastSeen: Date.now(),
    });
  },
});

export const getPresence = query({
  args: { userIds: v.array(v.id("users")) },
  handler: async (ctx, args) => {
    const now = Date.now();
    const TWO_MINUTES = 2 * 60 * 1000;

    const presenceMap: Record<string, boolean> = {};

    for (const userId of args.userIds) {
      const user = await ctx.db.get(userId);
      if (user) {
        const isRecentlyActive = now - user.lastSeen < TWO_MINUTES;
        presenceMap[userId] = user.isOnline && isRecentlyActive;
      } else {
        presenceMap[userId] = false;
      }
    }

    return presenceMap;
  },
});