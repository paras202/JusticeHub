// src/components/navbar.tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Scale, LogIn, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UserButton, useUser } from "@clerk/nextjs"

export function Navbar() {
  const { isLoaded, isSignedIn } = useUser()
  const pathname = usePathname()
  
  return (
    <header className="border-b px-3 flex justify-center border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <Scale className="h-6 w-6 text-law-secondary" />
          <Link href="/">
            <span className="text-xl font-bold text-law-primary">JusticeHub</span>
          </Link>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/#features"
            className={`text-sm font-medium ${
              pathname === "/" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            } transition-colors`}
          >
            Features
          </Link>
          <Link
            href="/#use-cases"
            className={`text-sm font-medium ${
              pathname === "/" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            } transition-colors`}
          >
            Use Cases
          </Link>
          <Link
            href="/document-analysis"
            className={`text-sm font-medium ${
              pathname === "/document-analysis" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            } transition-colors`}
          >
            Document Analysis
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          {isLoaded && isSignedIn ? (
            <>
              <Link href="/chat">
                <Button variant="default" className="bg-law-primary hover:bg-law-primary/90">
                  Start Chat
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <UserButton />
            </>
          ) : (
            <>
              <Link href="/sign-in">
                <Button variant="ghost" className="text-law-primary hover:text-law-primary/90">
                  Sign In
                  <LogIn className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button variant="default" className="bg-law-primary hover:bg-law-primary/90">
                  Sign Up
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}