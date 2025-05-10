import { Navbar } from "@/components/ui/navbar"

export default function LawyerChatLayout({
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