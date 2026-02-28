"use client"

import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { LogOut, User } from "lucide-react"

export function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-border/50 glass-heavy px-8">
      <div />
      <div className="flex items-center gap-3">
        {user && (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 shadow-apple-sm">
              <User className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-sm">
              <span className="font-semibold text-foreground">{user.name}</span>
              <span className="ml-2 text-xs text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded-full">
                {user.role === "admin" ? "管理者" : "講師"}
              </span>
            </div>
            <Button variant="ghost" size="icon" onClick={logout} title="ログアウト" className="ml-1 text-muted-foreground hover:text-destructive">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}
