import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    // On sign-in, store the stable Google account ID in the token
    jwt({ token, account }) {
      console.log("[auth jwt]", { sub: token.sub, userId: token.userId, providerAccountId: account?.providerAccountId });
      if (account?.providerAccountId) {
        token.userId = account.providerAccountId;
      }
      return token;
    },
    // Expose the stable ID on the session
    session({ session, token }) {
      console.log("[auth session]", { sub: token.sub, userId: token.userId });
      if (token.userId) session.user.id = token.userId as string;
      return session;
    },
  },
});
