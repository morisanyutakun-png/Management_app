"use client"

import { useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import { fetcher, api } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { useToast } from "@/components/toast-provider"
import {
  statusLabels,
  statusColors,
  formatDate,
  formatTime,
} from "@/lib/utils"
import { Plus, ArrowRight } from "lucide-react"

interface SessionItem {
  id: string
  student_id: string
  teacher_id: string
  substitute_teacher_id: string | null
  subject: string
  start_at: string
  end_at: string
  status: string
  student_name: string | null
  teacher_name: string | null
  substitute_teacher_name: string | null
  material_title: string | null
  handover: any | null
}

interface StudentItem {
  id: string
  name: string
}

interface TeacherItem {
  id: string
  name: string
}

interface MaterialItem {
  id: string
  title: string
  subject: string
}

export default function SessionsPage() {
  const { data: sessions, mutate } = useSWR<SessionItem[]>("/sessions", fetcher)
  const { data: students } = useSWR<StudentItem[]>("/students", fetcher)
  const { data: teachers } = useSWR<TeacherItem[]>(
    "/sessions/meta/teachers",
    fetcher
  )
  const { data: materials } = useSWR<MaterialItem[]>("/materials", fetcher)
  const { toast } = useToast()
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    student_id: "",
    teacher_id: "",
    subject: "",
    start_at: "",
    end_at: "",
    material_id: "",
    notes: "",
  })

  const handleCreate = async () => {
    if (!form.student_id || !form.teacher_id || !form.subject || !form.start_at || !form.end_at) {
      toast({ title: "必須項目を入力してください", variant: "destructive" })
      return
    }
    setCreating(true)
    try {
      await api.post("/sessions", {
        ...form,
        material_id: form.material_id || null,
      })
      toast({ title: "授業枠を作成しました" })
      mutate()
      setShowCreate(false)
      setForm({ student_id: "", teacher_id: "", subject: "", start_at: "", end_at: "", material_id: "", notes: "" })
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
          <h1 className="text-3xl font-bold tracking-tight">授業枠</h1>
          <p className="text-muted-foreground mt-1.5 text-[15px]">授業スケジュールと引き継ぎの管理</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="shadow-apple-md">
          <Plus className="mr-2 h-4 w-4" />
          授業枠を追加
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {!sessions ? (
            <div className="py-16 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
              <p className="text-sm text-muted-foreground mt-4 font-medium">読み込み中...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary mx-auto mb-4">
                <Plus className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">授業枠がありません</p>
              <p className="text-xs text-muted-foreground/60 mt-1">右上のボタンから追加してください</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {sessions.map((s) => (
                <Link
                  key={s.id}
                  href={`/sessions/${s.id}`}
                  className="flex items-center justify-between rounded-xl border border-border/50 p-4 hover:bg-secondary/30 hover:shadow-apple-sm transition-all duration-300 group"
                >
                  <div className="flex items-center gap-5">
                    <div className="text-center min-w-[88px] bg-secondary/50 rounded-xl py-2 px-3">
                      <p className="text-2xs text-muted-foreground">
                        {formatDate(s.start_at)}
                      </p>
                      <p className="text-sm font-bold mt-0.5">
                        {formatTime(s.start_at)} - {formatTime(s.end_at)}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">
                        {s.student_name}
                        <span className="ml-2 text-muted-foreground font-normal">
                          {s.subject}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        担当: {s.teacher_name}
                        {s.substitute_teacher_name && (
                          <span className="text-purple-600 font-medium">
                            {" "}→ 代講: {s.substitute_teacher_name}
                          </span>
                        )}
                        {s.material_title && ` | 教材: ${s.material_title}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Badge className={statusColors[s.status]}>
                      {statusLabels[s.status]}
                    </Badge>
                    {s.handover && (
                      <Badge variant="secondary">引き継ぎ有</Badge>
                    )}
                    <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all duration-300" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>授業枠を追加</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>生徒 *</Label>
              <Select value={form.student_id} onValueChange={(v) => setForm({ ...form, student_id: v })}>
                <SelectTrigger><SelectValue placeholder="生徒を選択" /></SelectTrigger>
                <SelectContent>
                  {students?.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>担当講師 *</Label>
              <Select value={form.teacher_id} onValueChange={(v) => setForm({ ...form, teacher_id: v })}>
                <SelectTrigger><SelectValue placeholder="講師を選択" /></SelectTrigger>
                <SelectContent>
                  {teachers?.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>科目 *</Label>
              <Input
                placeholder="数学"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>開始日時 *</Label>
                <Input
                  type="datetime-local"
                  value={form.start_at}
                  onChange={(e) => setForm({ ...form, start_at: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>終了日時 *</Label>
                <Input
                  type="datetime-local"
                  value={form.end_at}
                  onChange={(e) => setForm({ ...form, end_at: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>教材（任意）</Label>
              <Select value={form.material_id} onValueChange={(v) => setForm({ ...form, material_id: v })}>
                <SelectTrigger><SelectValue placeholder="教材を選択（任意）" /></SelectTrigger>
                <SelectContent>
                  {materials?.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.title}（{m.subject}）</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              {creating ? "作成中..." : "作成"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
