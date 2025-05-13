// lib/auth.ts
import NextAuth, { type NextAuthOptions, type User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { User as UserModel } from './models/User';
import dbConnect from './dbConnect';

// Extend the User type with your custom fields
interface IUser extends User {
    id: string;
    role?: string;
    group?: string;
}

// Extend the default session types
declare module 'next-auth' {
    interface Session {
        user: {
            id: string;
            name?: string;
            email?: string;
            role?: string;
            group?: string;
        };
    }
}

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials): Promise<IUser | null> {
                await dbConnect();

                if (!credentials?.email || !credentials.password) {
                    throw new Error('Email and password are required');
                }

                const user = await UserModel.findOne({ email: credentials.email });
                if (!user){
                    throw new Error('No user found with the given email');
                }

                const isValid = await bcrypt.compare(credentials.password, user.password);
                if (!isValid){
                    throw new Error('Invalid password');
                }

                return {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    group: user.group?.toString()
                };
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = (user as IUser).id;
                token.role = (user as IUser).role;
                token.group = (user as IUser).group;
            }
            console.log('JWT Callback:', token);
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
                session.user.group = token.group as string;
            }
            console.log('Session Callback:', session);
            return session;
        }
    },
    pages: {
        signIn: '/login',
    },
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: "jwt",
    },
};

export default NextAuth(authOptions);