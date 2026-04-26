import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import {
  getPendingInvite,
  deletePendingInvite,
  getHousehold,
  saveHousehold,
  setUserHouseholdId,
} from "@/lib/household";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  pages: {
    signIn: "/login",
  },
  session: {
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
  cookies: {
    sessionToken: {
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: true,
        maxAge: 60 * 60 * 24 * 30,
      },
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      // Resolve a pending household invite when user logs in for the first time
      if (account?.providerAccountId && user.email) {
        const invite = await getPendingInvite(user.email);
        if (invite) {
          const household = await getHousehold(invite.householdId);
          if (household) {
            household.members.push({
              userId: account.providerAccountId,
              email: user.email,
              name: user.name ?? user.email,
              role: invite.role,
              joinedAt: new Date().toISOString(),
            });
            household.pendingInvites = household.pendingInvites.filter(
              (p) => p.email.toLowerCase() !== user.email!.toLowerCase()
            );
            await saveHousehold(household);
            await setUserHouseholdId(account.providerAccountId, invite.householdId);
            await deletePendingInvite(user.email);
          }
        }
      }
      return true;
    },
    jwt({ token, account }) {
      if (account?.providerAccountId) {
        token.userId = account.providerAccountId;
      }
      return token;
    },
    session({ session, token }) {
      if (token.userId) session.user.id = token.userId as string;
      return session;
    },
  },
});
