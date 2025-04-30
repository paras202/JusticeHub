'use client'

import Link from 'next/link'
import { Scale } from 'lucide-react'

interface FooterProps {
  isDark?: boolean
}

const Footer: React.FC<FooterProps> = ({ isDark = false }) => {
  return (
    <footer
      className={`border-t flex justify-center py-12 ${
        isDark ? 'bg-gray-950 border-gray-800' : 'bg-gray-50'
      }`}
    >
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
              {/* Twitter */}
              <a
                href="#"
                className="text-muted-foreground hover:text-law-primary transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 4.557c-..." />
                </svg>
              </a>
              {/* Facebook */}
              <a
                href="#"
                className="text-muted-foreground hover:text-law-primary transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M22.675 0h-21.35c..." />
                </svg>
              </a>
              {/* Instagram */}
              <a
                href="#"
                className="text-muted-foreground hover:text-law-primary transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2.163c..." />
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-4">Features</h3>
            <ul className="space-y-2">
              <li><Link href="/chat" className="text-sm text-muted-foreground hover:text-law-primary transition-colors">AI Assistant</Link></li>
              <li><Link href="/document-analysis" className="text-sm text-muted-foreground hover:text-law-primary transition-colors">Document Analysis</Link></li>
              <li><Link href="/lawyer-connect" className="text-sm text-muted-foreground hover:text-law-primary transition-colors">Lawyer Connect</Link></li>
              <li><Link href="/templates" className="text-sm text-muted-foreground hover:text-law-primary transition-colors">Document Templates</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium mb-4">Resources</h3>
            <ul className="space-y-2">
              <li><Link href="/blog" className="text-sm text-muted-foreground hover:text-law-primary transition-colors">Legal Blog</Link></li>
              <li><Link href="/guides" className="text-sm text-muted-foreground hover:text-law-primary transition-colors">Legal Guides</Link></li>
              <li><Link href="/faq" className="text-sm text-muted-foreground hover:text-law-primary transition-colors">FAQ</Link></li>
              <li><Link href="/support" className="text-sm text-muted-foreground hover:text-law-primary transition-colors">Support</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium mb-4">Company</h3>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-sm text-muted-foreground hover:text-law-primary transition-colors">About Us</Link></li>
              <li><Link href="/careers" className="text-sm text-muted-foreground hover:text-law-primary transition-colors">Careers</Link></li>
              <li><Link href="/privacy" className="text-sm text-muted-foreground hover:text-law-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-sm text-muted-foreground hover:text-law-primary transition-colors">Terms of Service</Link></li>
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
  )
}

export default Footer
