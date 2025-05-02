// src/app/document-analysis/page.tsx
"use client"

import { useState, useRef } from "react"
// import { useRouter } from "next/navigation"
import { 
  Upload, 
  Search, 
  File, 
  Trash2, 
  UploadCloud, 
  // CheckCircle,
  X,
  AlertCircle,
  ChevronDown 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
// import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useTheme } from "next-themes"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"

interface SearchResult {
  content: string;
  similarity: number;
}

export default function DocumentAnalysisPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [files, setFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  // const [isProcessing, setIsProcessing] = useState(false)
  const [isDocumentsProcessed, setIsDocumentsProcessed] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedPresetQuery, setSelectedPresetQuery] = useState("")
  const [isResultsDialogOpen, setIsResultsDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("upload")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const presetQueries = [
    "What are the main legal rights mentioned?",
    "Summarize the key points of this document",
    "Find information about liabilities and obligations",
    "Extract any deadlines or important dates",
    "What are the termination clauses?",
    "Find information about payment terms"
  ]

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      const pdfFiles = newFiles.filter(file => file.type === "application/pdf")
      
      if (pdfFiles.length !== newFiles.length) {
        toast({
          title: "Invalid file type",
          description: "Only PDF files are allowed",
          variant: "destructive"
        })
      }
      
      setFiles(prev => [...prev, ...pdfFiles])
    }
  }

  const removeFile = (indexToRemove: number) => {
    setFiles(files.filter((_, index) => index !== indexToRemove))
  }

  const uploadFiles = async () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one PDF file to upload",
        variant: "destructive"
      })
      return
    }

    setIsUploading(true)
    // setIsProcessing(true)

    try {
      const formData = new FormData()
      files.forEach(file => {
        formData.append("files", file)
      })
      
      const response = await fetch("https://justicehub-backend.onrender.com/upload-documents/", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`)
      }

      const result = await response.json()
      setIsDocumentsProcessed(true)
      toast({
        title: "Documents processed successfully",
        description: `Processed ${result.chunk_count} text chunks`,
        variant: "default"
      })
      setActiveTab("search")
    } catch (error) {
      console.error("Error uploading files:", error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
      // setIsProcessing(false)
    }
  }

  const searchDocuments = async () => {
    if (!searchQuery && !selectedPresetQuery) {
      toast({
        title: "Empty query",
        description: "Please enter a search query or select a preset question",
        variant: "destructive"
      })
      return
    }

    setIsSearching(true)

    try {
      const finalQuery = searchQuery || selectedPresetQuery
      const response = await fetch("https://justicehub-backend.onrender.com/search/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: finalQuery }),
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`)
      }

      const result = await response.json()
      setSearchResults(result.results)
      setIsResultsDialogOpen(true)
    } catch (error) {
      console.error("Error searching:", error)
      toast({
        title: "Search failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      })
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectPresetQuery = (query: string) => {
    setSelectedPresetQuery(query)
    setSearchQuery("")
  }

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <section className={`relative flex justify-center px-3 py-12 ${isDark ? 'bg-gradient-to-b from-gray-900 to-gray-950' : 'bg-gradient-to-b from-white to-gray-50'}`}>
          <div className="container relative z-10">
            <div className="flex flex-col items-center text-center mb-10">
              <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs w-fit font-semibold bg-law-secondary/10 text-law-secondary mb-4">
                <Search className="mr-1 h-3.5 w-3.5" />
                AI-Powered Analysis
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-law-primary mb-4">
                Document Analysis
              </h1>
              <p className="text-lg text-muted-foreground max-w-[600px]">
                Upload your legal documents for AI analysis and get insights from your documents with powerful search.
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <Tabs 
                defaultValue="upload" 
                value={activeTab} 
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className={`grid w-full grid-cols-2 mb-8 ${isDark ? 'bg-gray-800' : ''}`}>
                  <TabsTrigger value="upload">Upload Documents</TabsTrigger>
                  <TabsTrigger value="search" disabled={!isDocumentsProcessed}>Search & Analyze</TabsTrigger>
                </TabsList>
                
                <TabsContent value="upload" className="space-y-6">
                  <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-lg`}>
                    <CardContent className="pt-6">
                      <div 
                        className={`border-2 border-dashed rounded-lg p-8 text-center ${isDark ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'} cursor-pointer transition-colors`}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          multiple
                          accept="application/pdf"
                          onChange={handleFileChange}
                        />
                        <UploadCloud className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">Drop files here or click to browse</h3>
                        <p className="text-muted-foreground text-sm">
                          Upload PDF files (maximum 10MB each)
                        </p>
                      </div>

                      {files.length > 0 && (
                        <div className="mt-6 space-y-4">
                          <h3 className="font-medium">Selected Files ({files.length})</h3>
                          <div className="space-y-2">
                            {files.map((file, index) => (
                              <div 
                                key={index} 
                                className={`flex items-center justify-between p-3 rounded-md ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
                              >
                                <div className="flex items-center">
                                  <File className="h-5 w-5 mr-2 text-law-secondary" />
                                  <span className="text-sm truncate max-w-[250px] sm:max-w-sm">
                                    {file.name}
                                  </span>
                                </div>
                                <button 
                                  onClick={() => removeFile(index)}
                                  className="text-red-500 hover:text-red-700 transition-colors"
                                >
                                  <Trash2 className="h-5 w-5" />
                                </button>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-end mt-4">
                            <Button
                              onClick={uploadFiles}
                              disabled={isUploading}
                              className="bg-law-primary hover:bg-law-primary/90"
                            >
                              {isUploading ? (
                                <>Processing...</>
                              ) : (
                                <>
                                  <Upload className="mr-2 h-4 w-4" />
                                  Upload & Process
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="search" className="space-y-6">
                  <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-lg`}>
                    <CardContent className="pt-6">
                      <div className="space-y-6">
                        <div>
                          <h3 className="font-medium mb-2">Custom Query</h3>
                          <div className="flex space-x-2">
                            <Textarea 
                              placeholder="Enter your question about the documents..."
                              className="resize-none"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              disabled={!!selectedPresetQuery}
                            />
                          </div>
                        </div>

                        <div>
                          <h3 className="font-medium mb-2">Or Select a Preset Question</h3>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" className="w-full justify-between">
                                {selectedPresetQuery || "Select a question"}
                                <ChevronDown className="h-4 w-4 ml-2" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-full">
                              {presetQueries.map((query, index) => (
                                <DropdownMenuItem 
                                  key={index}
                                  onClick={() => handleSelectPresetQuery(query)}
                                >
                                  {query}
                                </DropdownMenuItem>
                              ))}
                              {selectedPresetQuery && (
                                <DropdownMenuItem 
                                  onClick={() => setSelectedPresetQuery("")}
                                  className="text-red-500"
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Clear selection
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="flex justify-end mt-4">
                          <Button
                            onClick={searchDocuments}
                            disabled={isSearching || (!searchQuery && !selectedPresetQuery)}
                            className="bg-law-secondary hover:bg-law-secondary/90 text-black"
                          >
                            {isSearching ? (
                              <>Searching...</>
                            ) : (
                              <>
                                <Search className="mr-2 h-4 w-4" />
                                Search Documents
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Background elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className={`absolute -top-[10%] -right-[10%] w-[40%] h-[40%] ${isDark ? 'bg-law-secondary/5' : 'bg-law-secondary/10'} rounded-full blur-3xl`}></div>
            <div className={`absolute top-[60%] -left-[5%] w-[30%] h-[40%] ${isDark ? 'bg-law-primary/5' : 'bg-law-primary/10'} rounded-full blur-3xl`}></div>
          </div>
        </section>
      </main>

      <Dialog open={isResultsDialogOpen} onOpenChange={setIsResultsDialogOpen}>
        <DialogContent className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'} max-w-4xl max-h-[80vh] overflow-y-auto`}>
          <DialogHeader>
            <DialogTitle className="text-law-primary text-xl">Search Results</DialogTitle>
            <DialogDescription>
              Showing {searchResults.length} most relevant passages from your documents
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {searchResults.length > 0 ? (
              searchResults.map((result, index) => (
                <div 
                  key={index} 
                  className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Passage {index + 1}</span>
                    <span className="text-sm text-muted-foreground">
                      Relevance: {Math.round(result.similarity * 100)}%
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{result.content}</p>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-center text-muted-foreground">No results found. Try a different query.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}