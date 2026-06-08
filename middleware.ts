import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const session = await auth()
  
  // 需要保护的 API 路由
  if (request.nextUrl.pathname.startsWith("/api/")) {
    // 检查是否是需要保护的 API 端点
    const protectedApis = [
      "/api/channels",
      "/api/endpoint-groups",
      "/api/endpoints"
    ]
    
    const isProtectedApi = protectedApis.some(api => 
      request.nextUrl.pathname.startsWith(api)
    )

    if (isProtectedApi && !session) {
      return NextResponse.json(
        { error: "未授权访问" },
        { status: 401 }
      )
    }
  }

  // 需要保护的页面路由
  if (request.nextUrl.pathname.startsWith("/moe")) {
    if (!session) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // 已登录用户不能访问登录和注册页面
  if (session && (request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/register")) {
    return NextResponse.redirect(new URL("/moe/endpoints", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // API 路由
    "/api/channels/:path*",
    "/api/endpoint-groups/:path*", 
    "/api/endpoints/:path*",
    // 页面路由
    "/moe/:path*",
    "/login",
    "/register"
  ]
} 