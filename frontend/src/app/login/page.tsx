"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await login(email, password)
      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message || "ログインに失敗しました")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 right-0 h-[50vh] bg-gradient-to-b from-blue-500/5 to-transparent" />
      <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-blue-400/10 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-indigo-400/10 blur-3xl" />

      <Card className="w-full max-w-[420px] shadow-apple-xl border-white/80 bg-white/90 backdrop-blur-xl relative z-10">
        <CardHeader className="text-center pb-2 pt-10">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white text-2xl font-bold shadow-apple-lg">
            引
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">引き継ぎ管理</CardTitle>
          <CardDescription className="mt-2 text-[13px] leading-relaxed">
            個別指導の引き継ぎを、もっとスムーズに。
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                placeholder="パスワードを入力"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12"
              />
            </div>
            {error && (
              <div className="rounded-xl bg-destructive/5 border border-destructive/10 p-3 text-center">
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
            )}
            <Button type="submit" className="w-full h-12 text-[15px]" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ログイン中...
                </span>
              ) : (
                "ログイン"
              )}
            </Button>
          </form>
          <div className="mt-8 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/80 p-5 border border-slate-200/50">
            <p className="font-semibold text-xs text-foreground/60 mb-2.5">テストアカウント</p>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center justify-between bg-white/80 rounded-lg px-3 py-2">
                <span className="font-medium text-foreground/70">管理者</span>
                <span className="font-mono text-2xs">admin@example.com / admin123</span>
              </div>
              <div className="flex items-center justify-between bg-white/80 rounded-lg px-3 py-2">
                <span className="font-medium text-foreground/70">講師</span>
                <span className="font-mono text-2xs">teacher@example.com / teacher123</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
