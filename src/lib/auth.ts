import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { NextAuthOptions } from "next-auth";
import {
  LOGIN_MAX_PER_ACCOUNT,
  LOGIN_MAX_PER_IP,
  LOGIN_WINDOW_MS,
  allowRequest,
  clientIp,
} from "@/lib/rateLimit";

export const normalizeEmail = (email: string): string =>
  email.trim().toLowerCase();

const DAY = 24 * 60 * 60;
const THIRTY_DAYS = 30 * DAY;
const REMEMBERED_SESSION_MS = THIRTY_DAYS * 1000;
const SHORT_SESSION_MS = DAY * 1000;
const REVALIDATE_MS = 5 * 60 * 1000;
const LOGIN_FAILED = "Email or password is incorrect";
const TOO_MANY = "Too many sign-in attempts. Please try again later.";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        remember: { label: "Remember", type: "text" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error(LOGIN_FAILED);
        }
        const email = normalizeEmail(credentials.email);
        const ip = clientIp(req?.headers);
        if (
          !allowRequest(`login:ip:${ip}`, LOGIN_MAX_PER_IP, LOGIN_WINDOW_MS) ||
          !allowRequest(`login:email:${email}`, LOGIN_MAX_PER_ACCOUNT, LOGIN_WINDOW_MS)
        ) {
          throw new Error(TOO_MANY);
        }

        await dbConnect();
        const user =
          (await User.findOne({ email })) ??
          (email !== credentials.email
            ? await User.findOne({ email: credentials.email })
            : null);
        if (!user) throw new Error(LOGIN_FAILED);

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );
        if (!isPasswordValid) throw new Error(LOGIN_FAILED);

        if (user.email !== email) {
          user.email = email;
          await user.save().catch(() => undefined);
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          remember: credentials.remember === "true",
          sessionVersion: user.sessionVersion ?? 0,
        };
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: THIRTY_DAYS },
  jwt: { maxAge: THIRTY_DAYS },
  pages: { signIn: "/login", signOut: "/" },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    jwt: async ({ token, user }) => {
      const now = Date.now();
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.remember = user.remember;
        token.sessionVersion = user.sessionVersion;
        token.loginAt = now;
        token.checkedAt = now;
        return token;
      }

      const loginAt = token.loginAt ?? 0;
      const maxAgeMs = token.remember ? REMEMBERED_SESSION_MS : SHORT_SESSION_MS;
      if (!token.id || now - loginAt > maxAgeMs) {
        throw new Error("Session expired");
      }

      if (now - (token.checkedAt ?? 0) > REVALIDATE_MS) {
        await dbConnect();
        const current = await User.findById(token.id).select("sessionVersion");
        if (!current || (current.sessionVersion ?? 0) !== token.sessionVersion) {
          throw new Error("Session revoked");
        }
        token.checkedAt = now;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session?.user && token.id) {
        session.user.id = token.id;
        session.user.email = token.email ?? null;
        session.user.name = token.name ?? null;
      }
      return session;
    },
  },
};
