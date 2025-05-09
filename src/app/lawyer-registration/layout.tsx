import { Navbar } from "@/components/ui/navbar"

export default function LawyerRegistrationLayout({
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