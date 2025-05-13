//app/consultations/[id]/page.tsx
"use client"

// import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import UpcomingConsultations from "@/components/consultations/upcoming-consultations"

export default function ConsultationsPage() {
//   const router = useRouter()
  const params = useParams()
  const lawyerId = params.id as string
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-10 border-b ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
        <div className="container flex items-center h-16 px-4">
          <Link href={`/lawyer-chat/${lawyerId}`} className="mr-2">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="font-semibold">Upcoming Consultations</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4">
        <div className="container max-w-4xl mx-auto">
          <UpcomingConsultations lawyerId={lawyerId} />
        </div>
      </main>
    </div>
  )
}