"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import { fetcher } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  statusLabels,
  statusColors,
  formatDateTime,
  formatTime,
} from "@/lib/utils"
import {
  Calendar,
  AlertTriangle,
  Users,
  ArrowRight,
  Clock,
  TrendingUp,
} from "lucide-react"

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

export default function DashboardPage() {
  const { data: sessions } = useSWR<SessionItem[]>("/sessions", fetcher)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const dayAfterTomorrow = new Date(tomorrow)
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1)

  const todaySessions = sessions?.filter((s) => {
    const d = new Date(s.start_at)
    return d >= today && d < tomorrow
  }) || []

  const upcomingSessions = sessions?.filter((s) => {
    const d = new Date(s.start_at)
    return d >= tomorrow && d < dayAfterTomorrow
  }) || []

  const absentSessions = sessions?.filter(
    (s) => s.status === "absent_teacher" || s.status === "absent_student"
  ) || []

  const substituteSessions = sessions?.filter(
    (s) => s.status === "substitute"
  ) || []

  const needsAttention = [...absentSessions, ...substituteSessions]

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">ダッシュボード</h1>
        <p className="text-muted-foreground mt-1.5 text-[15px]">
          {today.toLocaleDateString("ja-JP", {
            year: "numeric",
            month: "long",
            day: "numeric",
            weekday: "long",
          })}
        </p>
      </div>

      {/* Alert: Sessions needing attention */}
      {needsAttention.length > 0 && (
        <Card className="border-orange-200/60 bg-gradient-to-r from-orange-50/80 to-amber-50/40 shadow-apple-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2.5 text-orange-700 text-[15px]">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-100">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              </div>
              対応が必要な授業（{needsAttention.length}件）
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {needsAttention.map((s) => (
                <Link
                  key={s.id}
                  href={`/sessions/${s.id}`}
                  className="flex items-center justify-between rounded-xl bg-white/80 p-3.5 shadow-apple-sm hover:shadow-apple transition-all duration-300 hover-lift group"
                >
                  <div className="flex items-center gap-3">
                    <Badge className={statusColors[s.status]}>
                      {statusLabels[s.status]}
                    </Badge>
                    <span className="font-semibold text-sm">
                      {s.student_name} - {s.subject}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(s.start_at)}
                    </span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="hover-lift hover:shadow-apple-md">
          <CardContent className="pt-6 pb-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 shadow-apple-sm">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-[13px] font-medium text-muted-foreground">今日の授業</p>
                <p className="text-3xl font-bold tracking-tight mt-0.5">{todaySessions.length}<span className="text-base font-medium text-muted-foreground ml-1">件</span></p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover-lift hover:shadow-apple-md">
          <CardContent className="pt-6 pb-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 shadow-apple-sm">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-[13px] font-medium text-muted-foreground">明日の授業</p>
                <p className="text-3xl font-bold tracking-tight mt-0.5">{upcomingSessions.length}<span className="text-base font-medium text-muted-foreground ml-1">件</span></p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover-lift hover:shadow-apple-md">
          <CardContent className="pt-6 pb-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 shadow-apple-sm">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-[13px] font-medium text-muted-foreground">要対応</p>
                <p className="text-3xl font-bold tracking-tight mt-0.5">{needsAttention.length}<span className="text-base font-medium text-muted-foreground ml-1">件</span></p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's sessions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-[15px]">今日の授業</CardTitle>
          <Link href="/sessions">
            <Button variant="ghost" size="sm" className="text-primary">
              すべて見る <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {todaySessions.length === 0 ? (
            <div className="py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary mx-auto mb-4">
                <Calendar className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">
                今日の授業はありません
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {todaySessions.map((s) => (
                <Link
                  key={s.id}
                  href={`/sessions/${s.id}`}
                  className="flex items-center justify-between rounded-xl border border-border/50 p-4 hover:bg-secondary/30 hover:shadow-apple-sm transition-all duration-300 group"
                >
                  <div className="flex items-center gap-5">
                    <div className="text-center min-w-[64px] bg-secondary/50 rounded-xl py-2 px-3">
                      <p className="text-sm font-bold text-foreground">
                        {formatTime(s.start_at)}
                      </p>
                      <p className="text-2xs text-muted-foreground mt-0.5">
                        {formatTime(s.end_at)}
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
                        {s.substitute_teacher_name &&
                          ` → 代講: ${s.substitute_teacher_name}`}
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

      {/* Upcoming sessions */}
      {upcomingSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-[15px]">明日の授業</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {upcomingSessions.map((s) => (
                <Link
                  key={s.id}
                  href={`/sessions/${s.id}`}
                  className="flex items-center justify-between rounded-xl border border-border/50 p-4 hover:bg-secondary/30 hover:shadow-apple-sm transition-all duration-300 group"
                >
                  <div className="flex items-center gap-5">
                    <div className="text-center min-w-[64px] bg-secondary/50 rounded-xl py-2 px-3">
                      <p className="text-sm font-bold text-foreground">
                        {formatTime(s.start_at)}
                      </p>
                      <p className="text-2xs text-muted-foreground mt-0.5">
                        {formatTime(s.end_at)}
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
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Badge className={statusColors[s.status]}>
                      {statusLabels[s.status]}
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all duration-300" />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
