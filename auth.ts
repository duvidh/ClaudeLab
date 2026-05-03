import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET, // וידוא אבטחה מוחלט מול ורסל
  providers: [
    Credentials({
      credentials: {
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const expected = process.env.ADMIN_PASSWORD
        if (!expected || credentials?.password !== expected) return null
        
        // החלפתי את 'מנהל' לאנגלית. עברית בעוגיות רשת גורמת לפעמים לקריסה של הטוקן
        return { id: 'admin', name: 'Admin' } 
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // שבוע
  },
  callbacks: {
    // אלו הפונקציות שוודאות שהשרת באמת זוכר אותך אחרי רענון הדף!
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id
      }
      return session
    }
  }
})
