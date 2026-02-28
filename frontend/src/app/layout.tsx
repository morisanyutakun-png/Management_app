"use client"

import "./globals.css"
import { AuthProvider } from "@/lib/auth"
import { AppToastProvider } from "@/components/toast-provider"
import { AppLayout } from "@/components/app-layout"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="font-sans">
        <AuthProvider>
          <AppToastProvider>
            <AppLayout>{children}</AppLayout>
          </AppToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
