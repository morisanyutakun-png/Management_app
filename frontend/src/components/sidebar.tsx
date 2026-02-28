"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Calendar,
  Users,
  BookOpen,
  Settings,
} from "lucide-react"

const navItems = [
  { href: "/dashboard", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/sessions", label: "授業枠", icon: Calendar },
  { href: "/students", label: "生徒", icon: Users },
  { href: "/materials", label: "教材", icon: BookOpen },
  { href: "/settings", label: "設定", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-[260px] border-r border-border/50 glass-heavy">
      <div className="flex h-[72px] items-center px-7">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-bold shadow-apple transition-all duration-300 group-hover:shadow-apple-md group-hover:scale-105">
            引
          </div>
          <span className="text-[15px] font-bold tracking-tight text-foreground">引き継ぎ管理</span>
        </Link>
      </div>
      <nav className="flex flex-col gap-1 px-4 mt-3">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold transition-all duration-300",
                isActive
                  ? "bg-primary/10 text-primary shadow-apple-sm"
                  : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-[18px] w-[18px]", isActive && "text-primary")} strokeWidth={isActive ? 2.5 : 2} />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="absolute bottom-6 left-4 right-4">
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 p-4 border border-blue-100/50">
          <p className="text-2xs font-semibold text-blue-800/70">塾引き継ぎ管理 v1.0</p>
          <p className="text-2xs text-blue-600/50 mt-0.5">スムーズな引き継ぎを</p>
        </div>
      </div>
    </aside>
  )
}
