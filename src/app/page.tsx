"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { 
  ArrowRight, 
  CheckCircle, 
  LogIn, 
  Scale, 
  Shield, 
  Sparkles, 
  Users, 
  FileText, 
  Briefcase,
  MessageSquare,
  User,
  Calendar,
  Video,
  Globe,
  Star,
  ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { UserButton } from "@clerk/nextjs"
import { useUser } from "@clerk/nextjs"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export default function HomePage() {
  const { isLoaded, isSignedIn } = useUser()
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [activeSection, setActiveSection] = useState(0)

  // Only show theme-dependent content after mounting to prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
    
    // Auto-rotate hero sections
    const interval = setInterval(() => {
      setActiveSection(prev => (prev + 1) % 3);
    }, 8000);
    
    return () => clearInterval(interval);
  }, [])

  const isDark = mounted && theme === 'dark'

  const heroSections = [
    {
      id: "main",
      badge: "AI-Powered Legal Assistant",
      badgeIcon: <Sparkles className="mr-1 h-3.5 w-3.5" />,
      title: "Legal Guidance",
      highlight: "Simplified",
      description: "Get instant answers to your legal questions with our AI-powered assistant. Understand complex legal concepts in simple terms.",
      buttonText: isLoaded && isSignedIn ? "Start Chatting Now" : "Sign Up Free",
      buttonLink: isLoaded && isSignedIn ? "/chat" : "/sign-up",
      image: (
        <div className={`relative ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl overflow-hidden border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="bg-law-primary p-3 flex items-center">
            <div className="flex space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <div className="flex-1 text-center text-white text-sm font-medium">JusticeHub Assistant</div>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex justify-end">
              <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg p-3 max-w-[80%]`}>
                <p className="text-sm">What are my rights as a tenant?</p>
              </div>
            </div>
            <div className="flex">
              <div className={`${isDark ? 'bg-law-primary/20' : 'bg-law-primary/10'} rounded-lg p-3 max-w-[80%]`}>
                <p className="text-sm">
                  As a tenant, you generally have the following rights:
                  <br />
                  <br />
                  1. Right to habitable housing
                  <br />
                  2. Right to privacy
                  <br />
                  3. Protection against discrimination
                  <br />
                  4. Security deposit protections
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "document-analysis",
      badge: "Smart Document Analysis",
      badgeIcon: <FileText className="mr-1 h-3.5 w-3.5" />,
      title: "Legal Documents",
      highlight: "Decoded",
      description: "Upload any legal document and get instant analysis, summaries, and explanations in plain language you can understand.",
      buttonText: "Try Document Analysis",
      buttonLink: "/document-analysis",
      image: (
        <div className={`relative ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl overflow-hidden border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="bg-law-secondary p-3 flex items-center">
            <div className="flex space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <div className="flex-1 text-center text-white text-sm font-medium">Document Analysis</div>
          </div>
          <div className="p-4">
            <div className={`${isDark ? 'bg-gray-700/50' : 'bg-gray-100'} rounded-lg p-3 mb-3 flex items-center`}>
              <FileText className="h-6 w-6 mr-2 text-law-secondary" />
              <p className="text-sm font-medium">Lease_Agreement.pdf</p>
            </div>
            <div className={`${isDark ? 'bg-law-secondary/10' : 'bg-law-secondary/5'} rounded-lg p-3`}>
              <p className="text-sm font-medium mb-2 text-law-secondary">Key Terms:</p>
              <div className="space-y-2">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-law-secondary mr-2" />
                  <p className="text-sm">12-month lease term</p>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-law-secondary mr-2" />
                  <p className="text-sm">60-day notice required</p>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-law-secondary mr-2" />
                  <p className="text-sm">Pet fee: $500 (non-refundable)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "lawyer-connect",
      badge: "Expert Legal Support",
      badgeIcon: <Briefcase className="mr-1 h-3.5 w-3.5" />,
      title: "Connect with",
      highlight: "Real Lawyers",
      description: "When AI isn't enough, seamlessly connect with experienced attorneys specialized in your specific legal issue.",
      buttonText: "Find a Lawyer",
      buttonLink: "/lawyer-connect",
      image: (
        <div className={`relative ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl overflow-hidden border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="bg-law-primary p-3 flex items-center">
            <div className="flex space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <div className="flex-1 text-center text-white text-sm font-medium">Lawyer Connect</div>
          </div>
          <div className="p-4 space-y-3">
            <div className={`${isDark ? 'bg-gray-700/50' : 'bg-gray-100'} rounded-lg p-3 flex items-center`}>
              <div className="h-10 w-10 rounded-full bg-law-primary/20 flex items-center justify-center mr-3">
                <User className="h-6 w-6 text-law-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Sarah Johnson, Esq.</p>
                <p className="text-xs text-muted-foreground">Family Law Specialist</p>
              </div>
              <div className="ml-auto flex items-center">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                <span className="text-xs ml-1">4.9</span>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" className="flex-1 text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                Schedule
              </Button>
              <Button variant="outline" size="sm" className="flex-1 text-xs">
                <MessageSquare className="h-3 w-3 mr-1" />
                Message
              </Button>
              <Button variant="outline" size="sm" className="flex-1 text-xs">
                <Video className="h-3 w-3 mr-1" />
                Video
              </Button>
            </div>
          </div>
        </div>
      )
    }
  ]

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 border-b px-3 flex justify-center border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <Scale className="h-6 w-6 text-law-secondary" />
            <span className="text-xl font-bold text-law-primary">JusticeHub</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="#features"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </Link>
            <Link
              href="#use-cases"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Use Cases
            </Link>
            <Link
              href="/document-analysis"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Document Analysis
            </Link>
            <Link
              href="/lawyer-connect"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Lawyer Connect
            </Link>
            <Link
              href="#faq"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              FAQ
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

      <main className="flex-1">
        {/* Hero Section with Carousel */}
        <section className={`relative flex justify-center px-3 overflow-hidden py-20 md:py-32 ${isDark ? 'bg-gradient-to-b from-gray-900 to-gray-950' : 'bg-gradient-to-b from-white to-gray-50'}`}>
          <div className="container relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col gap-6"
              >
                <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs w-fit font-semibold bg-law-secondary/10 text-law-secondary">
                  {heroSections[activeSection].badgeIcon}
                  {heroSections[activeSection].badge}
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-law-primary">
                  {heroSections[activeSection].title} <br />
                  <span className="text-law-secondary">{heroSections[activeSection].highlight}</span>
                </h1>
                <p className="text-lg text-muted-foreground max-w-[600px]">
                  {heroSections[activeSection].description}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 mt-2">
                  <Link href={heroSections[activeSection].buttonLink}>
                    <Button size="lg" className="bg-law-primary hover:bg-law-primary/90">
                      {heroSections[activeSection].buttonText}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                
                {/* Hero section indicators */}
                <div className="flex gap-2 mt-6">
                  {heroSections.map((_, index) => (
                    <button 
                      key={index}
                      onClick={() => setActiveSection(index)}
                      className={`w-8 h-2 rounded-full transition-all ${activeSection === index ? 'bg-law-secondary' : 'bg-gray-300 dark:bg-gray-700'}`}
                      aria-label={`Switch to ${heroSections[index].id} section`}
                    />
                  ))}
                </div>
              </motion.div>
              
              <motion.div
                key={`image-${activeSection}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="relative mx-6"
              >
                {heroSections[activeSection].image}
                <div className="absolute -z-10 -bottom-6 -right-6 w-full h-full bg-law-secondary/20 rounded-xl"></div>
              </motion.div>
            </div>
          </div>

          {/* Background elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <motion.div 
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.5, 0.7, 0.5] 
              }}
              transition={{ 
                duration: 15,
                repeat: Infinity,
                repeatType: "reverse"
              }}
              className={`absolute -top-[10%] -right-[10%] w-[40%] h-[40%] ${isDark ? 'bg-law-secondary/5' : 'bg-law-secondary/10'} rounded-full blur-3xl`}
            ></motion.div>
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.6, 0.5] 
              }}
              transition={{ 
                duration: 20,
                repeat: Infinity,
                repeatType: "reverse"
              }}
              className={`absolute top-[60%] -left-[5%] w-[30%] h-[40%] ${isDark ? 'bg-law-primary/5' : 'bg-law-primary/10'} rounded-full blur-3xl`}
            ></motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section className={`py-16 flex justify-center ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
          <div className="container">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mx-4">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-center"
              >
                <div className="text-4xl font-bold text-law-primary mb-2">10K+</div>
                <div className="text-sm text-muted-foreground">Legal Questions Answered</div>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-center"
              >
                <div className="text-4xl font-bold text-law-primary mb-2">500+</div>
                <div className="text-sm text-muted-foreground">Documents Analyzed</div>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-center"
              >
                <div className="text-4xl font-bold text-law-primary mb-2">98%</div>
                <div className="text-sm text-muted-foreground">User Satisfaction</div>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="text-center"
              >
                <div className="text-4xl font-bold text-law-primary mb-2">50+</div>
                <div className="text-sm text-muted-foreground">Expert Attorneys</div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className={`py-20 flex justify-center ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
          <div className="container">
            <div className="text-center mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm mb-4 w-fit mx-auto font-medium bg-law-primary/10 text-law-primary">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Powerful Features
                </div>
                <h2 className="text-3xl font-bold text-law-primary mb-4">Everything You Need</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Our comprehensive legal platform provides powerful tools to help you navigate the complexities of law.
                </p>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mx-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card className={`${isDark ? 'bg-gray-800 border-gray-700 hover:bg-gray-700/50' : 'bg-white border-none'} shadow-lg hover:shadow-xl transition-all h-full group`}>
                  <CardHeader className="pb-2">
                    <div className="w-12 h-12 rounded-lg bg-law-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-all">
                      <Scale className="h-6 w-6 text-law-primary" />
                    </div>
                    <CardTitle className="text-xl flex items-center">
                      Legal Research
                      <ChevronRight className="h-5 w-5 ml-2 opacity-0 group-hover:opacity-100 group-hover:ml-3 transition-all" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Get insights on legal precedents, statutes, and regulations across various practice areas.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Link href="/document-analysis" className="block h-full">
                  <Card className={`${isDark ? 'bg-gray-800 border-gray-700 hover:bg-gray-700/50' : 'bg-white border-none'} shadow-lg hover:shadow-xl transition-all h-full group`}>
                    <CardHeader className="pb-2">
                      <div className="w-12 h-12 rounded-lg bg-law-secondary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-all">
                        <Shield className="h-6 w-6 text-law-secondary" />
                      </div>
                      <CardTitle className="text-xl flex items-center">
                        Document Analysis
                        <ChevronRight className="h-5 w-5 ml-2 opacity-0 group-hover:opacity-100 group-hover:ml-3 transition-all" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        Understand legal documents, contracts, and agreements with simplified explanations.
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Link href="/lawyer-connect" className="block h-full">
                  <Card className={`${isDark ? 'bg-gray-800 border-gray-700 hover:bg-gray-700/50' : 'bg-white border-none'} shadow-lg hover:shadow-xl transition-all h-full group`}>
                    <CardHeader className="pb-2">
                      <div className="w-12 h-12 rounded-lg bg-law-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-all">
                        <Users className="h-6 w-6 text-law-primary" />
                      </div>
                      <CardTitle className="text-xl flex items-center">
                        Lawyer Connect
                        <ChevronRight className="h-5 w-5 ml-2 opacity-0 group-hover:opacity-100 group-hover:ml-3 transition-all" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        Connect with experienced attorneys specialized in your specific legal needs.
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mx-4 mt-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Card className={`${isDark ? 'bg-gray-800 border-gray-700 hover:bg-gray-700/50' : 'bg-white border-none'} shadow-lg hover:shadow-xl transition-all h-full group`}>
                  <CardHeader className="pb-2">
                    <div className="w-12 h-12 rounded-lg bg-law-secondary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-all">
                      <Globe className="h-6 w-6 text-law-secondary" />
                    </div>
                    <CardTitle className="text-xl flex items-center">
                      Multilingual Support
                      <ChevronRight className="h-5 w-5 ml-2 opacity-0 group-hover:opacity-100 group-hover:ml-3 transition-all" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Get legal assistance in multiple languages to ensure everyone has access to legal information.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <Card className={`${isDark ? 'bg-gray-800 border-gray-700 hover:bg-gray-700/50' : 'bg-white border-none'} shadow-lg hover:shadow-xl transition-all h-full group`}>
                  <CardHeader className="pb-2">
                    <div className="w-12 h-12 rounded-lg bg-law-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-all">
                      <FileText className="h-6 w-6 text-law-primary" />
                    </div>
                    <CardTitle className="text-xl flex items-center">
                      Document Templates
                      <ChevronRight className="h-5 w-5 ml-2 opacity-0 group-hover:opacity-100 group-hover:ml-3 transition-all" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Access a library of customizable legal templates for common documents and agreements.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section id="use-cases" className={`py-20 flex justify-center ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
          <div className="container">
            <div className="text-center mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm mb-4 w-fit mx-auto font-medium bg-law-secondary/10 text-law-secondary">
                  <Users className="mr-2 h-4 w-4" />
                  Use Cases
                </div>
                <h2 className="text-3xl font-bold text-law-primary mb-4">How It Helps</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Explore how our AI legal platform serves different needs.
                </p>
              </motion.div>
            </div>

            <Tabs defaultValue="individuals" className="max-w-3xl mx-4 sm:mx-auto">
              <TabsList className={`grid w-full grid-cols-3 mb-8 ${isDark ? 'bg-gray-800' : ''}`}>
                <TabsTrigger value="individuals">Individuals</TabsTrigger>
                <TabsTrigger value="businesses">Businesses</TabsTrigger>
                <TabsTrigger value="students">Law Students</TabsTrigger>
              </TabsList>
              <TabsContent value="individuals" className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  <Card className={isDark ? 'border-gray-700' : ''}>
                    <CardHeader>
                      <CardTitle>Personal Legal Matters</CardTitle>
                      <CardDescription>Get guidance on everyday legal questions</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <p>Understand your rights in landlord-tenant disputes</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <p>Navigate employment law questions and workplace issues</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <p>Get clarity on family law matters like divorce and custody</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

                <TabsContent value="businesses" className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  <Card className={isDark ? 'border-gray-700' : ''}>
                    <CardHeader>
                      <CardTitle>Business Legal Support</CardTitle>
                      <CardDescription>Help with business legal questions</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <p>Understand contract terms and legal obligations</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <p>Get information on business formation and compliance</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <p>Learn about intellectual property protection</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
              <TabsContent value="students" className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  <Card className={isDark ? 'border-gray-700' : ''}>
                    <CardHeader>
                      <CardTitle>Law Education</CardTitle>
                      <CardDescription>Support for law students and legal education</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <p>Get explanations of complex legal concepts and terminology</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <p>Find summaries of important case law and precedents</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <p>Practice legal reasoning with hypothetical scenarios</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className={`py-20 flex justify-center ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
          <div className="container">
            <div className="text-center mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm mb-4 w-fit mx-auto font-medium bg-law-primary/10 text-law-primary">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Common Questions
                </div>
                <h2 className="text-3xl font-bold text-law-primary mb-4">Frequently Asked Questions</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Find answers to common questions about our AI legal assistant.
                </p>
              </motion.div>
            </div>

            <div className="max-w-3xl mx-4 sm:mx-auto">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>Is this actual legal advice?</AccordionTrigger>
                  <AccordionContent>
                    No, our AI assistant provides legal information and education only. It is not a substitute for
                    professional legal advice from a qualified attorney. Always consult with a licensed attorney for
                    specific legal matters.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>How accurate is the information?</AccordionTrigger>
                  <AccordionContent>
                    Our AI is trained on a wide range of legal resources and is designed to provide general legal
                    information. However, laws vary by jurisdiction and change over time. Always verify information with
                    official sources.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>Is my conversation private?</AccordionTrigger>
                  <AccordionContent>
                    We take privacy seriously. Your conversations are encrypted and we do not store personally
                    identifiable information. However, anonymized data may be used to improve our service.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger>What areas of law does it cover?</AccordionTrigger>
                  <AccordionContent>
                    Our AI assistant covers a wide range of legal topics including but not limited to: family law,
                    employment law, housing law, business law, intellectual property, and consumer rights. However, its
                    knowledge has limitations and may not cover highly specialized areas.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-5">
                  <AccordionTrigger>Can I use this for my legal documents?</AccordionTrigger>
                  <AccordionContent>
                    While our AI can help explain legal documents, it should not be used to draft or finalize important
                    legal documents without professional review. For critical legal documents, always consult with a
                    qualified attorney.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-6">
                  <AccordionTrigger>How do I connect with a real lawyer?</AccordionTrigger>
                  <AccordionContent>
                    Our Lawyer Connect feature allows you to browse profiles of licensed attorneys specializing in various
                    legal fields. You can schedule consultations, message them directly, or have video calls based on your
                    needs and preferences.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className={`py-20 flex justify-center ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
          <div className="container">
            <div className="text-center mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm mb-4 w-fit mx-auto font-medium bg-law-secondary/10 text-law-secondary">
                  <Star className="mr-2 h-4 w-4" />
                  Testimonials
                </div>
                <h2 className="text-3xl font-bold text-law-primary mb-4">What Users Say</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Hear from people who have used JusticeHub to solve their legal questions.
                </p>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mx-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className={`${isDark ? 'bg-gray-800' : 'bg-gray-50'} p-6 rounded-xl`}
              >
                <div className="flex items-center gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">
                 `&quot;`JusticeHub helped me understand my lease agreement in minutes. I was able to negotiate better terms with my landlord thanks to the clear explanations.`&quot;`
                </p>
                <p className="font-medium">Sarah T.</p>
                <p className="text-sm text-muted-foreground">Tenant</p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className={`${isDark ? 'bg-gray-800' : 'bg-gray-50'} p-6 rounded-xl`}
              >
                <div className="flex items-center gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">
                `&quot;`As a small business owner, I don`&apos;`t have budget for full-time legal counsel. JusticeHub helps me understand legal requirements without breaking the bank.`&quot;`
                </p>
                <p className="font-medium">Michael R.</p>
                <p className="text-sm text-muted-foreground">Small Business Owner</p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className={`${isDark ? 'bg-gray-800' : 'bg-gray-50'} p-6 rounded-xl`}
              >
                <div className="flex items-center gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">
                `&quot;`When I needed more specialized help, the Lawyer Connect feature paired me with an attorney who was perfect for my situation. Truly a comprehensive legal solution.`&quot;`
                </p>
                <p className="font-medium">Jennifer L.</p>
                <p className="text-sm text-muted-foreground">Legal Professional</p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 flex justify-center bg-law-primary text-white">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
                <p className="text-lg text-white/80 mb-8">
                  Start chatting with our AI legal assistant today and get the legal information you need.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href={isSignedIn ? "/chat" : "/sign-up"}>
                    <Button size="lg" className="bg-law-secondary hover:bg-law-secondary/90 text-black">
                      {isSignedIn ? "Start Chatting Now" : "Sign Up Free"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/document-analysis">
                    <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10">
                      Try Document Analysis
                      <FileText className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      <footer className={`border-t flex justify-center py-12 ${isDark ? 'bg-gray-950 border-gray-800' : 'bg-gray-50'}`}>
        <div className="container mx-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Scale className="h-6 w-6 text-law-secondary" />
                <span className="text-xl font-bold text-law-primary">JusticeHub</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Making legal information accessible to everyone through AI-powered assistance.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-muted-foreground hover:text-law-primary transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                  </svg>
                </a>
                <a href="#" className="text-muted-foreground hover:text-law-primary transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" />
                  </svg>
                </a>
                <a href="#" className="text-muted-foreground hover:text-law-primary transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-4">Features</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/chat" className="text-sm text-muted-foreground hover:text-law-primary transition-colors">
                    AI Assistant
                  </Link>
                </li>
                <li>
                  <Link href="/document-analysis" className="text-sm text-muted-foreground hover:text-law-primary transition-colors">
                    Document Analysis
                  </Link>
                </li>
                <li>
                  <Link href="/lawyer-connect" className="text-sm text-muted-foreground hover:text-law-primary transition-colors">
                    Lawyer Connect
                  </Link>
                </li>
                <li>
                  <Link href="/templates" className="text-sm text-muted-foreground hover:text-law-primary transition-colors">
                    Document Templates
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium mb-4">Resources</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/blog" className="text-sm text-muted-foreground hover:text-law-primary transition-colors">
                    Legal Blog
                  </Link>
                </li>
                <li>
                  <Link href="/guides" className="text-sm text-muted-foreground hover:text-law-primary transition-colors">
                    Legal Guides
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="text-sm text-muted-foreground hover:text-law-primary transition-colors">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="/support" className="text-sm text-muted-foreground hover:text-law-primary transition-colors">
                    Support
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium mb-4">Company</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/about" className="text-sm text-muted-foreground hover:text-law-primary transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/careers" className="text-sm text-muted-foreground hover:text-law-primary transition-colors">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-sm text-muted-foreground hover:text-law-primary transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-sm text-muted-foreground hover:text-law-primary transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} JusticeHub. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground mt-2 md:mt-0">
              Build with <span className="text-law-primary">♥</span> by{' '}
              <a href="https://example.com" className="text-law-primary hover:underline">Paras Singla</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}