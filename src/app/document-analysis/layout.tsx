// src/app/document-analysis/layout.tsx
import { Navbar } from "@/components/ui/navbar"
import { Toaster } from "@/components/ui/toaster"

export default function DocumentAnalysisLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Navbar />
      {children}
      <Toaster />
    </>
  )
}