import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ja-JP", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const statusLabels: Record<string, string> = {
  scheduled: "予定",
  completed: "実施済",
  absent_student: "生徒欠席",
  absent_teacher: "講師欠席",
  substitute: "代講",
};

export const statusColors: Record<string, string> = {
  scheduled: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-green-50 text-green-700 border-green-200",
  absent_student: "bg-orange-50 text-orange-700 border-orange-200",
  absent_teacher: "bg-red-50 text-red-700 border-red-200",
  substitute: "bg-purple-50 text-purple-700 border-purple-200",
};

export const progressLabels: Record<string, string> = {
  not_started: "未着手",
  in_progress: "進行中",
  completed: "完了",
};

export const progressColors: Record<string, string> = {
  not_started: "bg-gray-100 text-gray-600",
  in_progress: "bg-blue-50 text-blue-700",
  completed: "bg-green-50 text-green-700",
};
