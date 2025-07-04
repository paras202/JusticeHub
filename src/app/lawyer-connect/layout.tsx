import { Navbar } from "@/components/ui/navbar"

export default function LawyerConnectLayout({
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