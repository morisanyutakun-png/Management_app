"use client"

import { useAuth } from "@/lib/auth"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, ReactNode } from "react"
import { Sidebar } from "./sidebar"
import { Header } from "./header"

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user && pathname !== "/login") {
      router.push("/login")
    }
  }, [user, loading, pathname, router])

  if (pathname === "/login") {
    return <>{children}</>
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white text-lg font-bold shadow-apple-md animate-pulse">
            引
          </div>
          <p className="text-sm text-muted-foreground font-medium">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="ml-[260px]">
        <Header />
        <main className="p-8 max-w-7xl">{children}</main>
      </div>
    </div>
  )
}
