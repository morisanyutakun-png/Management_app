"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/toast-provider"
import {
  statusLabels,
  statusColors,
  progressLabels,
  progressColors,
  formatDate,
  formatTime,
} from "@/lib/utils"
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  Edit,
  Plus,
} from "lucide-react"

interface StudentDetail {
  id: string
  name: string
  grade: string | null
  notes: string | null
}

interface SessionItem {
  id: string
  subject: string
  start_at: string
  end_at: string
  status: string
  teacher_name: string | null
  material_title: string | null
  handover: any | null
}

interface ProgressItem {
  id: string
  student_id: string
  material_id: string
  status: string
  notes: string | null
  material_title: string | null
  material_subject: string | null
}

interface MaterialItem {
  id: string
  title: string
  subject: string
}

export default function StudentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const studentId = params.id as string

  const { data: student, mutate: mutateStudent } = useSWR<StudentDetail>(
    `/students/${studentId}`,
    fetcher
  )
  const { data: sessions } = useSWR<SessionItem[]>(
    `/sessions?student_id=${studentId}`,
    fetcher
  )
  const { data: progress, mutate: mutateProgress } = useSWR<ProgressItem[]>(
    `/progress/student/${studentId}`,
    fetcher
  )
  const { data: materials } = useSWR<MaterialItem[]>("/materials", fetcher)

  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: "", grade: "", notes: "" })
  const [showAddProgress, setShowAddProgress] = useState(false)
  const [addProgressForm, setAddProgressForm] = useState({
    material_id: "",
    status: "not_started",
  })

  const startEdit = () => {
    if (!student) return
    setEditForm({
      name: student.name,
      grade: student.grade || "",
      notes: student.notes || "",
    })
    setEditing(true)
  }

  const saveEdit = async () => {
    try {
      await api.patch(`/students/${studentId}`, {
        name: editForm.name,
        grade: editForm.grade || null,
        notes: editForm.notes || null,
      })
      toast({ title: "生徒情報を更新しました" })
      mutateStudent()
      setEditing(false)
    } catch (err: any) {
      toast({ title: err.message, variant: "destructive" })
    }
  }

  const addProgress = async () => {
    if (!addProgressForm.material_id) {
      toast({ title: "教材を選択してください", variant: "destructive" })
      return
    }
    try {
      await api.post("/progress", {
        student_id: studentId,
        material_id: addProgressForm.material_id,
        status: addProgressForm.status,
      })
      toast({ title: "進捗を追加しました" })
      mutateProgress()
      setShowAddProgress(false)
      setAddProgressForm({ material_id: "", status: "not_started" })
    } catch (err: any) {
      toast({ title: err.message, variant: "destructive" })
    }
  }

  const updateProgress = async (progressId: string, newStatus: string) => {
    try {
      await api.patch(`/progress/${progressId}`, { status: newStatus })
      toast({ title: "進捗を更新しました" })
      mutateProgress()
    } catch (err: any) {
      toast({ title: err.message, variant: "destructive" })
    }
  }

  if (!student) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground font-medium">読み込み中...</p>
        </div>
      </div>
    )
  }

  // Materials not yet in progress
  const existingMaterialIds = new Set(progress?.map((p) => p.material_id) || [])
  const availableMaterials = materials?.filter(
    (m) => !existingMaterialIds.has(m.id)
  )

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      <Button variant="ghost" onClick={() => router.back()} className="gap-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        戻る
      </Button>

      {/* Student info */}
      <Card className="shadow-apple-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">{student.name}</CardTitle>
            <p className="text-muted-foreground mt-1.5 text-[15px]">
              {student.grade || "学年未設定"}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={startEdit} className="shadow-apple-sm">
            <Edit className="mr-1.5 h-4 w-4" />
            編集
          </Button>
        </CardHeader>
        {student.notes && (
          <CardContent>
            <div className="bg-secondary/30 rounded-xl p-4">
              <p className="text-sm text-muted-foreground leading-relaxed">{student.notes}</p>
            </div>
          </CardContent>
        )}
      </Card>

      <Tabs defaultValue="progress">
        <TabsList>
          <TabsTrigger value="progress">進度表</TabsTrigger>
          <TabsTrigger value="sessions">授業履歴</TabsTrigger>
        </TabsList>

        {/* Progress tab — 進度表 */}
        <TabsContent value="progress">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-[15px] flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                  <BookOpen className="h-4 w-4 text-primary" />
                </div>
                進度表
              </CardTitle>
              {availableMaterials && availableMaterials.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAddProgress(true)}
                  className="shadow-apple-sm"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  教材を追加
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {!progress || progress.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground font-medium mb-4">
                    まだ進捗データがありません
                  </p>
                  {availableMaterials && availableMaterials.length > 0 && (
                    <Button
                      size="sm"
                      onClick={() => setShowAddProgress(true)}
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      教材を追加して開始
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {progress.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-xl border border-border/50 p-4 hover:shadow-apple-sm transition-all duration-300"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`flex h-3.5 w-3.5 rounded-full ring-4 ${
                            p.status === "completed"
                              ? "bg-green-500 ring-green-500/20"
                              : p.status === "in_progress"
                              ? "bg-blue-500 ring-blue-500/20"
                              : "bg-gray-300 ring-gray-300/20"
                          }`}
                        />
                        <div>
                          <p className="font-semibold text-sm">
                            {p.material_title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {p.material_subject}
                            {p.notes && ` — ${p.notes}`}
                          </p>
                        </div>
                      </div>
                      <Select
                        value={p.status}
                        onValueChange={(v) => updateProgress(p.id, v)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not_started">未着手</SelectItem>
                          <SelectItem value="in_progress">進行中</SelectItem>
                          <SelectItem value="completed">完了</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sessions tab */}
        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle className="text-[15px] flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                授業履歴
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!sessions || sessions.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-12">
                  <Calendar className="h-10 w-10 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground font-medium">授業履歴がありません</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sessions.map((s) => (
                    <Link
                      key={s.id}
                      href={`/sessions/${s.id}`}
                      className="flex items-center justify-between rounded-xl border border-border/50 p-4 hover:bg-secondary/50 hover:shadow-apple-sm transition-all duration-300 group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-center min-w-[80px] bg-secondary/50 rounded-xl py-1.5 px-2">
                          <p className="text-2xs text-muted-foreground font-medium">
                            {formatDate(s.start_at)}
                          </p>
                          <p className="text-sm font-bold">
                            {formatTime(s.start_at)}
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{s.subject}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            担当: {s.teacher_name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={statusColors[s.status]}>
                          {statusLabels[s.status]}
                        </Badge>
                        {s.handover && (
                          <Badge variant="secondary">引き継ぎ有</Badge>
                        )}
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-300" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit dialog */}
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>生徒情報を編集</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>氏名</Label>
              <Input
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>学年</Label>
              <Input
                value={editForm.grade}
                onChange={(e) =>
                  setEditForm({ ...editForm, grade: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>メモ</Label>
              <Textarea
                value={editForm.notes}
                onChange={(e) =>
                  setEditForm({ ...editForm, notes: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(false)}>
              キャンセル
            </Button>
            <Button onClick={saveEdit}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add progress dialog */}
      <Dialog open={showAddProgress} onOpenChange={setShowAddProgress}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>教材を進度表に追加</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>教材</Label>
              <Select
                value={addProgressForm.material_id}
                onValueChange={(v) =>
                  setAddProgressForm({ ...addProgressForm, material_id: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="教材を選択" />
                </SelectTrigger>
                <SelectContent>
                  {availableMaterials?.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.title}（{m.subject}）
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>初期ステータス</Label>
              <Select
                value={addProgressForm.status}
                onValueChange={(v) =>
                  setAddProgressForm({ ...addProgressForm, status: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">未着手</SelectItem>
                  <SelectItem value="in_progress">進行中</SelectItem>
                  <SelectItem value="completed">完了</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddProgress(false)}
            >
              キャンセル
            </Button>
            <Button onClick={addProgress}>追加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
