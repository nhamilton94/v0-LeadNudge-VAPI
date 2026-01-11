import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createMiddlewareSupabaseClient } from "@/lib/supabase/middleware"

export async function middleware(request: NextRequest) {
  try {
    // Log request path and cookies
    console.log("Middleware processing path:", request.nextUrl.pathname)
    console.log("Request cookies:", Object.fromEntries(request.cookies.getAll().map((c) => [c.name, "Present"])))

    // Check if this is an OAuth callback at the root path
    if (request.nextUrl.pathname === "/" && request.nextUrl.searchParams.has("code")) {
      console.log("OAuth redirect detected at root path. Redirecting to proper callback handler.")

      // Create a new URL for the proper callback endpoint
      const callbackUrl = new URL("/auth/callback", request.url)

      // Copy all search params to preserve state, code, etc.
      request.nextUrl.searchParams.forEach((value, key) => {
        callbackUrl.searchParams.set(key, value)
      })

      console.log("Redirecting to:", callbackUrl.toString())

      // Use 307 to ensure the request method and body are preserved
      return NextResponse.redirect(callbackUrl, { status: 307 })
    }

    // Skip middleware for auth callback route completely
    if (request.nextUrl.pathname === "/auth/callback") {
      console.log("Skipping middleware for auth callback route")
      return NextResponse.next()
    }

    // Skip middleware for API routes - they should handle their own authentication
    if (request.nextUrl.pathname.startsWith("/api/")) {
      console.log("Skipping middleware for API route:", request.nextUrl.pathname)
      return NextResponse.next()
    }

    // Create the Supabase client for middleware
    const { supabase, response } = createMiddlewareSupabaseClient(request)

    // Log cookies in response
    console.log("Response cookies:", Object.fromEntries(response.cookies.getAll().map((c) => [c.name, "Present"])))

    // This line is critical - it ensures the session is refreshed
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Define public routes that don't require authentication
    const publicRoutes = ["/auth", "/auth/verify", "/auth/verify-success", "/invite"]
    const path = request.nextUrl.pathname
    const isPublicRoute = publicRoutes.some((route) => path.startsWith(route))

    // Check if we're in the process of signing out
    const isSigningOut = request.nextUrl.searchParams.has("signing-out") || request.cookies.has("signing_out")

    // Handle unauthenticated users
    if (!session && !isPublicRoute) {
      console.log("No session detected in middleware for path:", path)
      const redirectUrl = new URL("/auth", request.url)
      redirectUrl.searchParams.set("next", path)
      return NextResponse.redirect(redirectUrl)
    }

    // Check if authenticated user is deactivated
    if (session && !isPublicRoute && !isSigningOut) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('status')
          .eq('id', session.user.id)
          .single();

        if (profile && profile.status === 'inactive') {
          console.log("User is deactivated, logging out:", session.user.email);
          
          // Sign out the user
          await supabase.auth.signOut();
          
          // Redirect to login with error message
          const redirectUrl = new URL("/auth", request.url);
          redirectUrl.searchParams.set("error", "account_deactivated");
          redirectUrl.searchParams.set("message", "Your account has been deactivated. Please contact your administrator.");
          return NextResponse.redirect(redirectUrl);
        }
      } catch (error) {
        console.error("Error checking user status:", error);
        // Continue on error to not block access
      }
    }

    // Handle authenticated users on auth pages
    if (session && isPublicRoute) {
      // Skip the dashboard redirect if we're signing out
      if (isSigningOut) {
        return response
      }

      // If the user is already logged in and trying to access an auth page,
      // redirect them to the dashboard or the requested next URL
      const nextUrl = request.nextUrl.searchParams.get("next")

      // Only redirect to nextUrl if it's a valid internal path and not an auth route
      if (nextUrl && !nextUrl.startsWith("/auth") && !nextUrl.includes("://") && !nextUrl.startsWith("//")) {
        return NextResponse.redirect(new URL(nextUrl, request.url))
      }

      // Default redirect to dashboard
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    return response
  } catch (error) {
    // Log the error for debugging
    console.error("Middleware error:", error)

    // Return a response to prevent unhandled promise rejection
    // For errors, we'll just continue to the requested page
    // This prevents breaking the application completely on middleware errors
    return NextResponse.next()
  }
}

// Update the matcher to exclude API routes from middleware processing
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes handle their own auth)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/", // Explicitly match the root path
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
