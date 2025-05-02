import { Navbar } from "@/components/ui/navbar"

export default function DocumentAnalysisLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Navbar />
      {children}
      {/* <Toaster /> */}
    </>
  )
}