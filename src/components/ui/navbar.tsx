"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Scale, LogIn, ArrowRight, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UserButton, useUser } from "@clerk/nextjs"
import { motion, AnimatePresence } from "framer-motion"
import { useIsMobile } from "@/hooks/use-mobile"

export function Navbar() {
  const { isLoaded, isSignedIn } = useUser()
  const pathname = usePathname()
  const isMobile = useIsMobile()
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Track scroll position for navbar effects
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navLinks = [
    { href: "/#features", label: "Features" },
    { href: "/#use-cases", label: "Use Cases" },
    { href: "/document-analysis", label: "Document Analysis" },
    { href: "/lawyer-connect", label: "Lawyer Connect" },
    { href: "/lawyer-registration", label: "Register as Lawyer" },
    { href: "/#faq", label: "FAQ" },
  ]

  const navVariants = {
    initial: { opacity: 0, y: -10 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4 }
    },
    exit: { 
      opacity: 0, 
      y: -10,
      transition: { duration: 0.2 } 
    }
  }

  const mobileMenuVariants = {
    closed: { 
      opacity: 0,
      height: 0,
      transition: { 
        duration: 0.3,
        when: "afterChildren" 
      }
    },
    open: { 
      opacity: 1,
      height: "auto",
      transition: { 
        duration: 0.4,
        when: "beforeChildren",
        staggerChildren: 0.1
      } 
    }
  }

  const linkVariants = {
    closed: { opacity: 0, x: -20 },
    open: { opacity: 1, x: 0 }
  }

  return (
    <motion.header 
      initial="initial"
      animate="animate"
      variants={navVariants}
      className={`sticky top-0 z-50 border-b px-3 flex justify-center backdrop-blur transition-all duration-300 ${
        isScrolled 
          ? "bg-background/95 border-border/40 shadow-sm" 
          : "bg-background/60 border-transparent"
      }`}
    >
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
          >
            <Scale className="h-6 w-6 text-law-secondary" />
          </motion.div>
          <Link href="/">
            <motion.span
              className="text-xl font-bold text-law-primary"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              JusticeHub
            </motion.span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <motion.span
                className={`text-sm font-medium ${
                  pathname === link.href || (pathname === "/" && link.href.startsWith("/#"))
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                } transition-colors relative`}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                {link.label}
                {(pathname === link.href || (pathname === "/" && link.href.startsWith("/#"))) && (
                  <motion.div
                    className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-law-primary rounded-full"
                    layoutId="navbar-indicator"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.span>
            </Link>
          ))}
        </nav>

        {/* User Authentication Section */}
        <div className="flex items-center gap-4">
          {isLoaded && isSignedIn ? (
            <>
              <Link href="/chat">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button variant="default" className="bg-law-primary hover:bg-law-primary/90">
                    Start Chat
                    <motion.div
                      initial={{ x: 0 }}
                      animate={{ x: [0, 5, 0] }}
                      transition={{ repeat: Infinity, repeatDelay: 3, duration: 1 }}
                    >
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </motion.div>
                  </Button>
                </motion.div>
              </Link>
              <motion.div whileHover={{ scale: 1.1 }}>
                <UserButton />
              </motion.div>
            </>
          ) : (
            <>
              <Link href="/sign-in" className="hidden sm:block">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button variant="ghost" className="text-law-primary hover:text-law-primary/90">
                    Sign In
                    <LogIn className="ml-2 h-4 w-4" />
                  </Button>
                </motion.div>
              </Link>
              <Link href="/sign-up">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button variant="default" className="bg-law-primary hover:bg-law-primary/90">
                    {isMobile ? "Sign Up" : "Sign Up"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </motion.div>
              </Link>
            </>
          )}

          {/* Mobile Menu Toggle */}
          {isMobile && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1 ml-2"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-law-primary" />
              ) : (
                <Menu className="h-6 w-6 text-law-primary" />
              )}
            </motion.button>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={mobileMenuVariants}
            className="absolute top-16 left-0 right-0 bg-background border-b border-border/40 shadow-lg overflow-hidden"
          >
            <div className="container py-4 flex flex-col space-y-3">
              {navLinks.map((link) => (
                <motion.div key={link.href} variants={linkVariants}>
                  <Link 
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block py-2 px-3 rounded-md ${
                      pathname === link.href || (pathname === "/" && link.href.startsWith("/#"))
                        ? "bg-law-primary/10 text-law-primary font-medium"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              
              {isLoaded && !isSignedIn && (
                <motion.div variants={linkVariants} className="pt-2">
                  <Link 
                    href="/sign-in"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-2 px-3 text-law-primary font-medium"
                  >
                    Sign In
                    <LogIn className="ml-2 h-4 w-4 inline" />
                  </Link>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}