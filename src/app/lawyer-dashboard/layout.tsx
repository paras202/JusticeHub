import { Navbar } from "@/components/ui/navbar"

export default function LawyerDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Navbar />
      {children}
    </>
  )
}