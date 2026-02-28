"use client"

import { useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import { fetcher, api } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { useToast } from "@/components/toast-provider"
import { Plus, ArrowRight, User } from "lucide-react"

interface StudentItem {
  id: string
  name: string
  grade: string | null
  notes: string | null
}

export default function StudentsPage() {
  const { data: students, mutate } = useSWR<StudentItem[]>("/students", fetcher)
  const { toast } = useToast()
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: "", grade: "", notes: "" })

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast({ title: "氏名は必須です", variant: "destructive" })
      return
    }
    setCreating(true)
    try {
      await api.post("/students", {
        name: form.name,
        grade: form.grade || null,
        notes: form.notes || null,
      })
      toast({ title: "生徒を登録しました" })
      mutate()
      setShowCreate(false)
      setForm({ name: "", grade: "", notes: "" })
    } catch (err: any) {
      toast({ title: err.message, variant: "destructive" })
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">生徒</h1>
          <p className="text-muted-foreground mt-1.5 text-[15px]">生徒情報の管理</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="shadow-apple-md">
          <Plus className="mr-2 h-4 w-4" />
          生徒を登録
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {!students ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground font-medium">読み込み中...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <User className="h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground font-medium">生徒が登録されていません</p>
            </div>
          ) : (
            <div className="space-y-2">
              {students.map((s) => (
                <Link
                  key={s.id}
                  href={`/students/${s.id}`}
                  className="flex items-center justify-between rounded-xl border border-border/50 p-4 hover:bg-secondary/50 hover:shadow-apple-sm transition-all duration-300 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-50 to-indigo-100 shadow-apple-sm">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{s.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {s.grade || "学年未設定"}
                        {s.notes && ` / ${s.notes.substring(0, 30)}...`}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-300" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>生徒を登録</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>氏名 *</Label>
              <Input
                placeholder="山田 太郎"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>学年</Label>
              <Input
                placeholder="中学3年"
                value={form.grade}
                onChange={(e) => setForm({ ...form, grade: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>メモ</Label>
              <Textarea
                placeholder="備考"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              キャンセル
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? "登録中..." : "登録"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
