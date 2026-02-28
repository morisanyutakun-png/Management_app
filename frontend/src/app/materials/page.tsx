"use client"

import { useState } from "react"
import useSWR from "swr"
import { fetcher, api } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { useToast } from "@/components/toast-provider"
import { Plus, BookOpen, Edit, Trash2 } from "lucide-react"

interface MaterialItem {
  id: string
  subject: string
  title: string
  chapter: string | null
  notes: string | null
}

export default function MaterialsPage() {
  const { data: materials, mutate } = useSWR<MaterialItem[]>(
    "/materials",
    fetcher
  )
  const { toast } = useToast()
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({
    subject: "",
    title: "",
    chapter: "",
    notes: "",
  })

  const resetForm = () =>
    setForm({ subject: "", title: "", chapter: "", notes: "" })

  const handleCreate = async () => {
    if (!form.subject.trim() || !form.title.trim()) {
      toast({ title: "科目と教材名は必須です", variant: "destructive" })
      return
    }
    setCreating(true)
    try {
      await api.post("/materials", {
        subject: form.subject,
        title: form.title,
        chapter: form.chapter || null,
        notes: form.notes || null,
      })
      toast({ title: "教材を登録しました" })
      mutate()
      setShowCreate(false)
      resetForm()
    } catch (err: any) {
      toast({ title: err.message, variant: "destructive" })
    } finally {
      setCreating(false)
    }
  }

  const startEdit = (m: MaterialItem) => {
    setEditId(m.id)
    setForm({
      subject: m.subject,
      title: m.title,
      chapter: m.chapter || "",
      notes: m.notes || "",
    })
  }

  const handleEdit = async () => {
    if (!editId) return
    try {
      await api.patch(`/materials/${editId}`, {
        subject: form.subject,
        title: form.title,
        chapter: form.chapter || null,
        notes: form.notes || null,
      })
      toast({ title: "教材を更新しました" })
      mutate()
      setEditId(null)
      resetForm()
    } catch (err: any) {
      toast({ title: err.message, variant: "destructive" })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("この教材を削除しますか？")) return
    try {
      await api.delete(`/materials/${id}`)
      toast({ title: "教材を削除しました" })
      mutate()
    } catch (err: any) {
      toast({ title: err.message, variant: "destructive" })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">教材</h1>
          <p className="text-muted-foreground mt-1.5 text-[15px]">教材の管理</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="shadow-apple-md">
          <Plus className="mr-2 h-4 w-4" />
          教材を登録
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {!materials ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground font-medium">読み込み中...</p>
            </div>
          ) : materials.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <BookOpen className="h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground font-medium">教材が登録されていません</p>
            </div>
          ) : (
            <div className="space-y-2">
              {materials.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-xl border border-border/50 p-4 hover:shadow-apple-sm transition-all duration-300"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-teal-100 shadow-apple-sm">
                      <BookOpen className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-semibold">{m.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        <Badge variant="secondary" className="mr-2">
                          {m.subject}
                        </Badge>
                        {m.chapter && `${m.chapter}`}
                        {m.notes && ` / ${m.notes}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => startEdit(m)}
                      className="rounded-xl hover:bg-secondary"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(m.id)}
                      className="rounded-xl hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>教材を登録</DialogTitle>
          </DialogHeader>
          <MaterialForm form={form} setForm={setForm} />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreate(false)
                resetForm()
              }}
            >
              キャンセル
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? "登録中..." : "登録"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editId} onOpenChange={() => { setEditId(null); resetForm() }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>教材を編集</DialogTitle>
          </DialogHeader>
          <MaterialForm form={form} setForm={setForm} />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditId(null)
                resetForm()
              }}
            >
              キャンセル
            </Button>
            <Button onClick={handleEdit}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function MaterialForm({
  form,
  setForm,
}: {
  form: { subject: string; title: string; chapter: string; notes: string }
  setForm: (f: any) => void
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>科目 *</Label>
        <Input
          placeholder="数学"
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>教材名 *</Label>
        <Input
          placeholder="新中学問題集 数学3年"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>章/単元（任意）</Label>
        <Input
          placeholder="第5章 二次方程式"
          value={form.chapter}
          onChange={(e) => setForm({ ...form, chapter: e.target.value })}
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
  )
}
