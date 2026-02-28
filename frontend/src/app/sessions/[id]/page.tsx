"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import useSWR from "swr"
import { fetcher, api } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/toast-provider"
import {
  statusLabels,
  statusColors,
  progressLabels,
  progressColors,
  formatDate,
  formatTime,
  formatDateTime,
} from "@/lib/utils"
import {
  ArrowLeft,
  Save,
  AlertTriangle,
  BookOpen,
  ClipboardList,
  History,
  Star,
} from "lucide-react"

interface Handover {
  id: string
  session_id: string
  covered_range: string | null
  comprehension: number | null
  homework: string | null
  next_plan: string | null
  stumbling_points: string | null
  notes: string | null
}

interface SessionDetail {
  id: string
  student_id: string
  teacher_id: string
  substitute_teacher_id: string | null
  subject: string
  start_at: string
  end_at: string
  status: string
  material_id: string | null
  notes: string | null
  student_name: string | null
  teacher_name: string | null
  substitute_teacher_name: string | null
  material_title: string | null
  handover: Handover | null
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

interface TeacherItem {
  id: string
  name: string
}

export default function SessionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const sessionId = params.id as string

  const { data: session, mutate: mutateSession } = useSWR<SessionDetail>(
    `/sessions/${sessionId}`,
    fetcher
  )
  const { data: teachers } = useSWR<TeacherItem[]>("/sessions/meta/teachers", fetcher)
  const { data: history } = useSWR<SessionDetail[]>(
    session ? `/sessions?student_id=${session.student_id}` : null,
    fetcher
  )
  const { data: progress, mutate: mutateProgress } = useSWR<ProgressItem[]>(
    session ? `/progress/student/${session.student_id}` : null,
    fetcher
  )

  // Handover form state
  const [handoverForm, setHandoverForm] = useState<{
    covered_range: string
    comprehension: string
    homework: string
    next_plan: string
    stumbling_points: string
    notes: string
  } | null>(null)
  const [savingHandover, setSavingHandover] = useState(false)

  // Status update
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const initHandoverForm = () => {
    const h = session?.handover
    setHandoverForm({
      covered_range: h?.covered_range || "",
      comprehension: h?.comprehension?.toString() || "",
      homework: h?.homework || "",
      next_plan: h?.next_plan || "",
      stumbling_points: h?.stumbling_points || "",
      notes: h?.notes || "",
    })
  }

  const saveHandover = async () => {
    if (!handoverForm) return
    setSavingHandover(true)
    try {
      await api.put(`/sessions/${sessionId}/handover`, {
        covered_range: handoverForm.covered_range || null,
        comprehension: handoverForm.comprehension
          ? parseInt(handoverForm.comprehension)
          : null,
        homework: handoverForm.homework || null,
        next_plan: handoverForm.next_plan || null,
        stumbling_points: handoverForm.stumbling_points || null,
        notes: handoverForm.notes || null,
      })
      toast({ title: "引き継ぎノートを保存しました" })
      mutateSession()
      setHandoverForm(null)
    } catch (err: any) {
      toast({ title: err.message, variant: "destructive" })
    } finally {
      setSavingHandover(false)
    }
  }

  const updateStatus = async (newStatus: string) => {
    setUpdatingStatus(true)
    try {
      await api.patch(`/sessions/${sessionId}`, { status: newStatus })
      toast({ title: `ステータスを「${statusLabels[newStatus]}」に更新しました` })
      mutateSession()
    } catch (err: any) {
      toast({ title: err.message, variant: "destructive" })
    } finally {
      setUpdatingStatus(false)
    }
  }

  const updateSubstitute = async (teacherId: string) => {
    try {
      await api.patch(`/sessions/${sessionId}`, {
        substitute_teacher_id: teacherId,
        status: "substitute",
      })
      toast({ title: "代講講師を設定しました" })
      mutateSession()
    } catch (err: any) {
      toast({ title: err.message, variant: "destructive" })
    }
  }

  const updateProgress = async (progressId: string, newStatus: string) => {
    try {
      await api.patch(`/progress/${progressId}`, {
        status: newStatus,
        last_session_id: sessionId,
      })
      toast({ title: "進捗を更新しました" })
      mutateProgress()
    } catch (err: any) {
      toast({ title: err.message, variant: "destructive" })
    }
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground font-medium">読み込み中...</p>
        </div>
      </div>
    )
  }

  const recentHistory = history
    ?.filter((h) => h.id !== session.id)
    .slice(0, 3)

  const isAbsentOrSubstitute =
    session.status === "absent_teacher" || session.status === "substitute"

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      {/* Back nav */}
      <Button variant="ghost" onClick={() => router.back()} className="gap-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        戻る
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {session.student_name} - {session.subject}
          </h1>
          <p className="text-muted-foreground mt-1.5 text-[15px]">
            {formatDate(session.start_at)} {formatTime(session.start_at)} -{" "}
            {formatTime(session.end_at)}
          </p>
        </div>
        <Badge className={`text-sm px-4 py-1.5 ${statusColors[session.status]}`}>
          {statusLabels[session.status]}
        </Badge>
      </div>

      {/* ★ Summary Card (最重要 — 代講者が一目で分かる) */}
      <Card className="border-primary/10 bg-gradient-to-br from-blue-50/60 to-indigo-50/30 shadow-apple-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-[15px] flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
              <ClipboardList className="h-4 w-4 text-primary" />
            </div>
            一枚サマリー — 代講者向け
          </CardTitle>
          <CardDescription className="text-[13px]">
            この授業に入る前に確認してください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-4">
              <div className="bg-white/60 rounded-xl p-3.5">
                <p className="text-2xs font-semibold text-muted-foreground uppercase tracking-wider">生徒</p>
                <p className="font-semibold mt-1">
                  <Link href={`/students/${session.student_id}`} className="text-primary hover:underline">
                    {session.student_name}
                  </Link>
                </p>
              </div>
              <div className="bg-white/60 rounded-xl p-3.5">
                <p className="text-2xs font-semibold text-muted-foreground uppercase tracking-wider">担当講師</p>
                <p className="font-semibold mt-1">{session.teacher_name}</p>
              </div>
              {session.substitute_teacher_name && (
                <div className="bg-purple-50/60 rounded-xl p-3.5 border border-purple-100/50">
                  <p className="text-2xs font-semibold text-purple-600 uppercase tracking-wider">代講講師</p>
                  <p className="font-semibold mt-1 text-purple-700">
                    {session.substitute_teacher_name}
                  </p>
                </div>
              )}
              <div className="bg-white/60 rounded-xl p-3.5">
                <p className="text-2xs font-semibold text-muted-foreground uppercase tracking-wider">教材</p>
                <p className="font-semibold mt-1">
                  {session.material_title || "未設定"}
                </p>
              </div>
            </div>
            <div className="space-y-4">
              {session.handover ? (
                <>
                  <div className="bg-white/60 rounded-xl p-3.5">
                    <p className="text-2xs font-semibold text-muted-foreground uppercase tracking-wider">前回やった範囲</p>
                    <p className="font-semibold mt-1">
                      {session.handover.covered_range || "—"}
                    </p>
                  </div>
                  <div className="bg-white/60 rounded-xl p-3.5">
                    <p className="text-2xs font-semibold text-muted-foreground uppercase tracking-wider">理解度</p>
                    <div className="flex items-center gap-1 mt-1.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          className={`h-5 w-5 transition-colors ${n <= (session.handover?.comprehension || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`}
                        />
                      ))}
                      <span className="ml-2 text-sm text-muted-foreground font-medium">
                        {session.handover.comprehension || 0}/5
                      </span>
                    </div>
                  </div>
                  <div className="bg-primary/5 rounded-xl p-3.5 border border-primary/10">
                    <p className="text-2xs font-semibold text-primary uppercase tracking-wider">次回やること</p>
                    <p className="font-semibold mt-1 text-primary">
                      {session.handover.next_plan || "—"}
                    </p>
                  </div>
                  {session.handover.stumbling_points && (
                    <div className="bg-orange-50/80 rounded-xl p-3.5 border border-orange-200/50">
                      <p className="text-2xs font-semibold text-orange-600 uppercase tracking-wider flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        つまずきポイント
                      </p>
                      <p className="text-sm mt-1.5 text-orange-800 font-medium">
                        {session.handover.stumbling_points}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-white/60 rounded-xl p-8 text-center">
                  <ClipboardList className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground font-medium">
                    引き継ぎノートはまだ作成されていません
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-[15px]">ステータス変更</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {["scheduled", "completed", "absent_student", "absent_teacher"].map(
              (st) => (
                <Button
                  key={st}
                  variant={session.status === st ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateStatus(st)}
                  disabled={updatingStatus}
                  className="transition-all duration-300"
                >
                  {statusLabels[st]}
                </Button>
              )
            )}
          </div>
          {(session.status === "absent_teacher" ||
            session.status === "substitute") && (
            <div className="mt-4 space-y-2">
              <Label>代講講師を指定</Label>
              <Select
                value={session.substitute_teacher_id || ""}
                onValueChange={updateSubstitute}
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="講師を選択" />
                </SelectTrigger>
                <SelectContent>
                  {teachers
                    ?.filter((t) => t.id !== session.teacher_id)
                    .map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs: Handover / Progress / History */}
      <Tabs defaultValue="handover">
        <TabsList>
          <TabsTrigger value="handover">引き継ぎノート</TabsTrigger>
          <TabsTrigger value="progress">進捗</TabsTrigger>
          <TabsTrigger value="history">直近の履歴</TabsTrigger>
        </TabsList>

        {/* Handover tab */}
        <TabsContent value="handover">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">引き継ぎノート</CardTitle>
              {!handoverForm ? (
                <Button size="sm" onClick={initHandoverForm}>
                  {session.handover ? "編集" : "作成"}
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setHandoverForm(null)}
                  >
                    キャンセル
                  </Button>
                  <Button
                    size="sm"
                    onClick={saveHandover}
                    disabled={savingHandover}
                  >
                    <Save className="mr-1 h-4 w-4" />
                    {savingHandover ? "保存中..." : "保存"}
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {handoverForm ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>前回やった範囲</Label>
                    <Textarea
                      value={handoverForm.covered_range}
                      onChange={(e) =>
                        setHandoverForm({
                          ...handoverForm,
                          covered_range: e.target.value,
                        })
                      }
                      placeholder="例: p.82〜p.85 例題1〜3"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>理解度（1〜5）</Label>
                    <Select
                      value={handoverForm.comprehension}
                      onValueChange={(v) =>
                        setHandoverForm({ ...handoverForm, comprehension: v })
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <SelectItem key={n} value={n.toString()}>
                            {"★".repeat(n)} ({n})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>宿題</Label>
                    <Textarea
                      value={handoverForm.homework}
                      onChange={(e) =>
                        setHandoverForm({
                          ...handoverForm,
                          homework: e.target.value,
                        })
                      }
                      placeholder="例: p.86 練習問題 1〜5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>次回やること</Label>
                    <Textarea
                      value={handoverForm.next_plan}
                      onChange={(e) =>
                        setHandoverForm({
                          ...handoverForm,
                          next_plan: e.target.value,
                        })
                      }
                      placeholder="例: p.86 答え合わせ → p.87 応用問題"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>つまずきポイント</Label>
                    <Textarea
                      value={handoverForm.stumbling_points}
                      onChange={(e) =>
                        setHandoverForm({
                          ...handoverForm,
                          stumbling_points: e.target.value,
                        })
                      }
                      placeholder="例: 因数分解の公式の使い分けが曖昧"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>その他メモ</Label>
                    <Textarea
                      value={handoverForm.notes}
                      onChange={(e) =>
                        setHandoverForm({
                          ...handoverForm,
                          notes: e.target.value,
                        })
                      }
                      placeholder="自由メモ"
                    />
                  </div>
                </div>
              ) : session.handover ? (
                <div className="space-y-4">
                  <InfoRow label="前回やった範囲" value={session.handover.covered_range} />
                  <InfoRow
                    label="理解度"
                    value={
                      session.handover.comprehension
                        ? `${"★".repeat(session.handover.comprehension)}${"☆".repeat(5 - session.handover.comprehension)} (${session.handover.comprehension}/5)`
                        : null
                    }
                  />
                  <InfoRow label="宿題" value={session.handover.homework} />
                  <InfoRow label="次回やること" value={session.handover.next_plan} />
                  <InfoRow
                    label="つまずきポイント"
                    value={session.handover.stumbling_points}
                    highlight
                  />
                  <InfoRow label="その他メモ" value={session.handover.notes} />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  引き継ぎノートはまだ作成されていません。「作成」ボタンを押してください。
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Progress tab */}
        <TabsContent value="progress">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                関連教材の進捗
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!progress || progress.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  この生徒の進捗データはありません
                </p>
              ) : (
                <div className="space-y-3">
                  {progress.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-xl border p-4"
                    >
                      <div>
                        <p className="font-medium text-sm">
                          {p.material_title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {p.material_subject}
                        </p>
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

        {/* History tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-5 w-5" />
                直近の授業履歴
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!recentHistory || recentHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  過去の授業履歴はありません
                </p>
              ) : (
                <div className="space-y-3">
                  {recentHistory.map((h) => (
                    <Link
                      key={h.id}
                      href={`/sessions/${h.id}`}
                      className="block rounded-xl border p-4 hover:bg-secondary/50 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">
                            {formatDate(h.start_at)} {formatTime(h.start_at)} -{" "}
                            {formatTime(h.end_at)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {h.subject} | 担当: {h.teacher_name}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={statusColors[h.status]}>
                            {statusLabels[h.status]}
                          </Badge>
                          {h.handover && (
                            <Badge variant="secondary">引き継ぎ有</Badge>
                          )}
                        </div>
                      </div>
                      {h.handover && (
                        <div className="mt-3 rounded-lg bg-secondary/50 p-3 text-sm space-y-1">
                          {h.handover.covered_range && (
                            <p>
                              <span className="text-muted-foreground">範囲:</span>{" "}
                              {h.handover.covered_range}
                            </p>
                          )}
                          {h.handover.next_plan && (
                            <p>
                              <span className="text-muted-foreground">次回:</span>{" "}
                              {h.handover.next_plan}
                            </p>
                          )}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function InfoRow({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string | null | undefined
  highlight?: boolean
}) {
  if (!value) return null
  return (
    <div
      className={
        highlight
          ? "rounded-xl bg-orange-50/80 border border-orange-200/50 p-4"
          : "bg-secondary/30 rounded-xl p-4"
      }
    >
      <p
        className={`text-2xs font-semibold uppercase tracking-wider ${
          highlight ? "text-orange-600" : "text-muted-foreground"
        }`}
      >
        {label}
      </p>
      <p className={`text-sm mt-1.5 font-medium leading-relaxed ${highlight ? "text-orange-800" : ""}`}>
        {value}
      </p>
    </div>
  )
}
