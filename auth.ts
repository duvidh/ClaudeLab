import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const expected = process.env.ADMIN_PASSWORD
        if (!expected || credentials?.password !== expected) return null
        return { id: 'admin', name: 'מנהל' }
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60,
  },
})
