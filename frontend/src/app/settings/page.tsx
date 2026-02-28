"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth"

export default function SettingsPage() {
  const { user } = useAuth()

  return (
    <div className="space-y-6 max-w-2xl animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">設定</h1>
        <p className="text-muted-foreground mt-1.5 text-[15px]">アカウント情報</p>
      </div>

      <Card className="shadow-apple-md">
        <CardHeader>
          <CardTitle className="text-[15px]">プロフィール</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-secondary/30 rounded-xl p-4">
            <p className="text-2xs font-semibold text-muted-foreground uppercase tracking-wider">
              氏名
            </p>
            <p className="font-semibold mt-1">{user?.name}</p>
          </div>
          <div className="bg-secondary/30 rounded-xl p-4">
            <p className="text-2xs font-semibold text-muted-foreground uppercase tracking-wider">
              メールアドレス
            </p>
            <p className="font-semibold mt-1">{user?.email}</p>
          </div>
          <div className="bg-secondary/30 rounded-xl p-4">
            <p className="text-2xs font-semibold text-muted-foreground uppercase tracking-wider">
              ロール
            </p>
            <p className="font-semibold mt-1">
              {user?.role === "admin" ? "管理者" : "講師"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-[15px]">バージョン情報</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground font-medium">
            引き継ぎ管理 MVP v1.0.0
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
