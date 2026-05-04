import { auth } from "./auth"

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isLoginPage = req.nextUrl.pathname === '/login';

  // אם המשתמש לא מחובר ומנסה להיכנס לדף מוגן -> שלח אותו לדף ההתחברות
  if (!isLoggedIn && !isLoginPage) {
    return Response.redirect(new URL('/login', req.nextUrl));
  }

  // אם המשתמש כבר מחובר אבל מנסה להגיע לדף ההתחברות -> שלח אותו פנימה לדאשבורד
  if (isLoggedIn && isLoginPage) {
    return Response.redirect(new URL('/', req.nextUrl));
  }
})

// ההגדרה הזו אומרת ל"שומר" מאילו קבצים להתעלם (תמונות, קבצי מערכת) כדי לא לגרום לקריסות
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
