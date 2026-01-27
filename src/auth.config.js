import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

// Login schema validation
const loginSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(1),
});

export const authConfig = {
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          // Validate input
          const { username, password } = loginSchema.parse(credentials);

          // Find user in database
          const user = await prisma.user.findUnique({
            where: { username },
            select: {
              userid: true,
              username: true,
              email: true,
              firstname: true,
              lastname: true,
              isadmin: true,
              canrequest: true,
              password: true,
            },
          });

          if (!user) {
            console.log("User not found:", username);
            return null;
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(password, user.password);

          if (!isValidPassword) {
            console.log("Invalid password for user:", username);
            return null;
          }

          // Return user object (password excluded)
          return {
            id: user.userid,
            name: `${user.firstname} ${user.lastname}`,
            email: user.email,
            username: user.username,
            isAdmin: user.isadmin,
            canRequest: user.canrequest,
            firstname: user.firstname,
            lastname: user.lastname,
          };
        } catch (error) {
          console.error("Authorization error:", error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      // Add user info to JWT token
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.isAdmin = user.isAdmin;
        token.canRequest = user.canRequest;
        token.firstname = user.firstname;
        token.lastname = user.lastname;
      }
      return token;
    },
    async session({ session, token }) {
      // Add user info to session
      if (token) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.isAdmin = token.isAdmin;
        session.user.canRequest = token.canRequest;
        session.user.firstname = token.firstname;
        session.user.lastname = token.lastname;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
};
