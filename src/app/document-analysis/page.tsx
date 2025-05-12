"use client"
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { 
  uploadDocuments, 
  searchDocuments, 
  submitLegalQuery, 
  checkStatus,
  UploadResponse,
  SearchResponse,
  LegalQueryResponse,
  ApiStatus,
  LegalAnalysisResult
} from '@/lib/api';

import { 
  Upload, 
  Search, 
  File, 
  Trash2, 
  UploadCloud,
  X,
  AlertCircle,
  FileText,
  AlertTriangle,
  Check,
  Zap
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useTheme } from "next-themes";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const DocumentAnalysisPage: React.FC = () => {
  // Theme handling
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { toast } = useToast();
  
  // State management
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [legalQuery, setLegalQuery] = useState<string>('');
  const [contextSize, setContextSize] = useState<number>(3);
  const [isQueryingLegal, setIsQueryingLegal] = useState<boolean>(false);
  const [legalQueryResults, setLegalQueryResults] = useState<LegalQueryResponse | null>(null);
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'search' | 'legalQuery' | 'analysis'>('upload');
  const [selectedDocument, setSelectedDocument] = useState<LegalAnalysisResult | null>(null);
  const [isResultsDialogOpen, setIsResultsDialogOpen] = useState<boolean>(false);
  const [selectedPresetQuery, setSelectedPresetQuery] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preset legal queries
  const presetQueries = [
    "What are the main legal rights mentioned?",
    "Summarize the key points of this document",
    "Find information about liabilities and obligations",
    "Extract any deadlines or important dates",
    "What are the termination clauses?",
    "Find information about payment terms"
  ];

  // Check API status on component mount
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const status = await checkStatus();
        setApiStatus(status);
        
      } catch (error) {
        console.log(error);
        setError('Failed to connect to the API server. Please try again later.');
        toast({
          title: "Connection Error",
          description: "Failed to connect to the API server. Please try again later.",
          variant: "destructive"
        });
      }
    };

    fetchStatus();
    
    // Poll status every 30 seconds
    const intervalId = setInterval(fetchStatus, 30000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [toast]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      // Convert FileList to array and filter for PDFs only
      const newFiles = Array.from(e.target.files).filter(
        file => file.type === 'application/pdf'
      );
      
      if (newFiles.length === 0) {
        toast({
          title: "Invalid file type",
          description: "Only PDF files are allowed",
          variant: "destructive"
        });
        return;
      }
      
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  // Remove file from selection
  const removeFile = (indexToRemove: number) => {
    setFiles(files.filter((_, index) => index !== indexToRemove));
  };

  // Handle document upload
  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Please select at least one PDF file to upload.');
      toast({
        title: "No files selected",
        description: "Please select at least one PDF file to upload",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const result = await uploadDocuments(files);
      setUploadResult(result);
      setActiveTab('analysis');
      
      // Refresh API status after upload
      const status = await checkStatus();
      setApiStatus(status);
      
      toast({
        title: "Documents processed successfully",
        description: `Processed ${result.chunk_count || 0} text chunks`,
        variant: "default"
      });
    } catch (error) {
      setError(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle document search
  const handleSearch = async () => {
    if (!searchQuery.trim() && !selectedPresetQuery) {
      setError('Please enter a search query or select a preset question.');
      toast({
        title: "Empty query",
        description: "Please enter a search query or select a preset question",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const finalQuery = searchQuery.trim() || selectedPresetQuery;
      const results = await searchDocuments(finalQuery);
      setSearchResults(results);
      setIsResultsDialogOpen(true);
    } catch (error) {
      setError(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast({
        title: "Search failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Handle preset query selection
  const handleSelectPresetQuery = (query: string) => {
    setSelectedPresetQuery(query);
    setSearchQuery("");
    setLegalQuery(query);
  };

  // Handle legal query submission
  const handleLegalQuery = async () => {
    const finalQuery = legalQuery.trim() || selectedPresetQuery;
    
    if (!finalQuery) {
      setError('Please enter a legal query or select a preset question.');
      toast({
        title: "Empty query",
        description: "Please enter a legal query or select a preset question",
        variant: "destructive"
      });
      return;
    }

    setIsQueryingLegal(true);
    setError(null);

    try {
      const results = await submitLegalQuery(finalQuery, contextSize);
      setLegalQueryResults(results);
    } catch (error) {
      setError(`Legal query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast({
        title: "Legal query failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsQueryingLegal(false);
    }
  };

  // Animation variants for motion components
  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } },
    exit: { opacity: 0, transition: { duration: 0.3 } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  // Render document analysis results
  const renderAnalysisResults = () => {
    if (!uploadResult?.analysis || uploadResult.analysis.length === 0) {
      return (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="flex flex-col items-center justify-center py-12"
        >
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-center text-muted-foreground">No analysis results available.</p>
        </motion.div>
      );
    }

    return (
      <motion.div 
        className="space-y-6"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        <h3 className="text-lg font-semibold">Document Analysis Results</h3>
        
        <motion.div 
          className="flex flex-wrap gap-4 mb-4"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {uploadResult.analysis.map((doc, idx) => (
            <motion.button
              key={idx}
              variants={itemVariants}
              className={`px-4 py-2 rounded-md transition-all duration-200 flex items-center ${
                selectedDocument?.document_name === doc.document_name 
                ? 'bg-law-secondary text-black shadow-md' 
                : isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
              }`}
              onClick={() => setSelectedDocument(doc)}
            >
              <FileText className="h-4 w-4 mr-2" />
              {doc.document_name}
            </motion.button>
          ))}
        </motion.div>

        {selectedDocument ? (
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-lg overflow-hidden`}>
              <CardContent className="p-6">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="named-entities" className="border-b">
                    <AccordionTrigger className="py-4 flex items-center">
                      <span className="flex items-center">
                        <Search className="h-5 w-5 mr-2 text-law-secondary" />
                        Named Entities
                        <span className="ml-2 text-xs rounded-full px-2 py-1 bg-law-secondary/20 text-law-secondary">
                          {selectedDocument.named_entities.length}
                        </span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      {selectedDocument.named_entities.length > 0 ? (
                        <motion.div 
                          className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2"
                          variants={staggerContainer}
                          initial="hidden"
                          animate="visible"
                        >
                          {selectedDocument.named_entities.map((entity, idx) => (
                            <motion.div 
                              key={idx} 
                              className={`border p-3 rounded-md ${isDark ? 'border-gray-700 bg-gray-800' : 'bg-gray-50'}`}
                              variants={itemVariants}
                            >
                              <span className="font-medium">{entity.name}</span>
                              <span className="text-sm text-gray-500 ml-2">({entity.type})</span>
                            </motion.div>
                          ))}
                        </motion.div>
                      ) : (
                        <p className="p-2 text-muted-foreground">No named entities found.</p>
                      )}
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="potential-issues" className="border-b">
                    <AccordionTrigger className="py-4">
                      <span className="flex items-center">
                        <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                        Potential Issues
                        <span className="ml-2 text-xs rounded-full px-2 py-1 bg-red-100 text-red-500">
                          {selectedDocument.potential_issues.length}
                        </span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      {selectedDocument.potential_issues.length > 0 ? (
                        <motion.div 
                          className="space-y-2 p-2"
                          variants={staggerContainer}
                          initial="hidden"
                          animate="visible"
                        >
                          {selectedDocument.potential_issues.map((issue, idx) => (
                            <motion.div 
                              key={idx} 
                              className={`border p-3 rounded-md ${isDark ? 'border-gray-700 bg-gray-800' : 'bg-gray-50'}`}
                              variants={itemVariants}
                            >
                              <div className="font-medium text-red-500">{issue.type}: {issue.term}</div>
                              <div className={`text-sm mt-1 p-2 rounded-md ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                <span className="text-gray-400">Context: </span>
                                <span>{issue.context}</span>
                              </div>
                            </motion.div>
                          ))}
                        </motion.div>
                      ) : (
                        <p className="p-2 text-muted-foreground">No potential issues found.</p>
                      )}
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="clause-analysis">
                    <AccordionTrigger className="py-4">
                      <span className="flex items-center">
                        <Check className="h-5 w-5 mr-2 text-law-primary" />
                        Clause Analysis
                        <span className="ml-2 text-xs rounded-full px-2 py-1 bg-law-primary/20 text-law-primary">
                          {selectedDocument.clause_analysis.length}
                        </span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      {selectedDocument.clause_analysis.length > 0 ? (
                        <motion.div 
                          className="space-y-2 p-2"
                          variants={staggerContainer}
                          initial="hidden"
                          animate="visible"
                        >
                          {selectedDocument.clause_analysis.map((clause, idx) => (
                            <motion.div 
                              key={idx} 
                              className={`border p-3 rounded-md ${isDark ? 'border-gray-700 bg-gray-800' : 'bg-gray-50'}`}
                              variants={itemVariants}
                            >
                              <div className="font-medium">
                                {clause.type}: <span className="text-law-primary">{clause.term}</span>
                              </div>
                              {clause.context && (
                                <div className={`text-sm mt-1 p-2 rounded-md ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                  <span className="text-gray-400">Context: </span>
                                  <span>{clause.context}</span>
                                </div>
                              )}
                            </motion.div>
                          ))}
                        </motion.div>
                      ) : (
                        <p className="p-2 text-muted-foreground">No clause analysis available.</p>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.p 
            className="text-center text-muted-foreground py-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Select a document to view analysis.
          </motion.p>
        )}
      </motion.div>
    );
  };

  // Render legal query results
  const renderLegalQueryResults = () => {
    if (!legalQueryResults) {
      return (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="flex flex-col items-center justify-center py-12"
        >
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-center text-muted-foreground">No legal query results available.</p>
        </motion.div>
      );
    }

    return (
      <motion.div 
        className="space-y-4"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        <motion.h3 
          className="text-lg font-semibold"
          variants={itemVariants}
        >
          Legal Query Results
        </motion.h3>
        
        <motion.div 
          className={`bg-white p-4 rounded-md shadow-md ${isDark ? 'bg-gray-800 border-gray-700' : ''}`}
          variants={itemVariants}
        >
          <h4 className="font-medium">Original Query</h4>
          <p className="text-gray-700 dark:text-gray-300 mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-md">{legalQueryResults.query}</p>
        </motion.div>
        
        <motion.div 
          className={`bg-white p-4 rounded-md shadow-md ${isDark ? 'bg-gray-800 border-gray-700' : ''}`}
          variants={itemVariants}
        >
          <h4 className="font-medium mb-2">Relevant Context</h4>
          {legalQueryResults.context.map((text, idx) => (
            <motion.div 
              key={idx} 
              className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md mb-2 text-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <strong>Context #{idx + 1}:</strong>
              <p className="mt-1">{text}</p>
            </motion.div>
          ))}
        </motion.div>
        
        <motion.div 
          className={`bg-white p-4 rounded-md shadow-md ${isDark ? 'bg-gray-800 border-gray-700' : ''}`}
          variants={itemVariants}
        >
          <h4 className="font-medium mb-2">Analysis</h4>
          
          {legalQueryResults.analysis.relevant_clauses && (
            <div className="mb-4">
              <h5 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Relevant Clauses</h5>
              
              {legalQueryResults.analysis.relevant_clauses.named_entities.length > 0 && (
                <div className="mb-2">
                  <h6 className="text-xs font-medium">Named Entities</h6>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {legalQueryResults.analysis.relevant_clauses.named_entities.map((entity, idx) => (
                      <motion.span 
                        key={idx} 
                        className="bg-gray-100 dark:bg-gray-700 text-xs px-2 py-1 rounded-md"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        {entity.name} ({entity.type})
                      </motion.span>
                    ))}
                  </div>
                </div>
              )}
              
              {legalQueryResults.analysis.relevant_clauses.potential_issues.length > 0 && (
                <div className="mb-2">
                  <h6 className="text-xs font-medium">Potential Issues</h6>
                  <div className="space-y-1 mt-1">
                    {legalQueryResults.analysis.relevant_clauses.potential_issues.map((issue, idx) => (
                      <motion.div 
                        key={idx} 
                        className="text-xs"
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <span className="text-red-600">{issue.term}</span>: {issue.context}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
              
              {legalQueryResults.analysis.relevant_clauses.clause_analysis.length > 0 && (
                <div>
                  <h6 className="text-xs font-medium">Clause Analysis</h6>
                  <div className="space-y-1 mt-1">
                    {legalQueryResults.analysis.relevant_clauses.clause_analysis.map((clause, idx) => (
                      <motion.div 
                        key={idx} 
                        className="text-xs"
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <span className="text-law-primary">{clause.term}</span>
                        {clause.context && `: ${clause.context}`}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div>
            <h5 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Suggested Answer</h5>
            <p className="italic text-gray-700 dark:text-gray-300 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
              {legalQueryResults.analysis.suggested_answer}
            </p>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  // Main render
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <section className={`relative flex justify-center px-3 py-12 ${isDark ? 'bg-gradient-to-b from-gray-900 to-gray-950' : 'bg-gradient-to-b from-white to-gray-50'}`}>
          <div className="container relative z-10">
            <motion.div 
              className="flex flex-col items-center text-center mb-10"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs w-fit font-semibold bg-law-secondary/10 text-law-secondary mb-4">
                <Zap className="mr-1 h-3.5 w-3.5" />
                AI-Powered Analysis
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-law-primary mb-4">
                Legal Document Analysis
              </h1>
              <p className="text-lg text-muted-foreground max-w-[600px]">
                Upload your legal documents for AI analysis and get insights from your documents with powerful search.
              </p>
            </motion.div>

            {/* API Status Indicator */}
            <motion.div 
              className="mb-6 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <span className="mr-2">API Status:</span>
              {apiStatus ? (
                <>
                  <span className={`inline-block w-3 h-3 rounded-full mr-2 ${apiStatus.documents_processed ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {apiStatus.documents_processed ? 'Ready' : 'No documents processed yet'}
                    {apiStatus.model_loaded && ` • Model: ${apiStatus.model_name}`}
                  </span>
                </>
              ) : (
                <>
                  <span className="inline-block w-3 h-3 rounded-full mr-2 bg-red-500"></span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Connecting...</span>
                </>
              )}
            </motion.div>
            
            {/* Error Display */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-md mb-6 max-w-3xl mx-auto"
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                >
                  <p>{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="max-w-5xl mx-auto">
              <Tabs 
                defaultValue="upload" 
                value={activeTab} 
               onValueChange={(value) => setActiveTab(value as 'upload' | 'search' | 'legalQuery' | 'analysis')}
                className="w-full"
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <TabsList className={`grid w-full grid-cols-4 mb-8 ${isDark ? 'bg-gray-800' : ''}`}>
                    <TabsTrigger value="upload">Upload Documents</TabsTrigger>
                    <TabsTrigger 
                      value="search" 
                      disabled={!apiStatus?.documents_processed}
                    >
                      Search
                    </TabsTrigger>
                    <TabsTrigger 
                      value="legalQuery" 
                      disabled={!apiStatus?.documents_processed}
                    >
                      Legal Query
                    </TabsTrigger>
                    <TabsTrigger 
                      value="analysis" 
                      disabled={!uploadResult}
                    >
                      Analysis Results
                    </TabsTrigger>
                  </TabsList>
                </motion.div>
                
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Upload Tab */}
                    <TabsContent value="upload" className="space-y-6">
                      <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-lg`}>
                        <CardContent className="pt-6">
                          <motion.div 
                            className={`border-2 border-dashed rounded-lg p-8 text-center ${
                              isDark ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'
                            } cursor-pointer transition-colors`}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
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
                            <motion.div
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: 0.2 }}
                            >
                              <UploadCloud className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                              <h3 className="text-lg font-medium mb-2">Drop files here or click to browse</h3>
                              <p className="text-muted-foreground text-sm">
                                Upload PDF files (maximum 10MB each)
                              </p>
                            </motion.div>
                          </motion.div>

                          {/* File List */}
                          {files.length > 0 && (
                            <motion.div 
                              className="mt-6"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.3 }}
                            >
                              <h3 className="text-md font-medium mb-2">Selected Files:</h3>
                              <motion.div 
                                className="space-y-2"
                                variants={staggerContainer}
                                initial="hidden"
                                animate="visible"
                              >
                                {files.map((file, index) => (
                                  <motion.div 
                                    key={index} 
                                    className={`flex items-center justify-between p-3 rounded-md ${
                                      isDark ? 'bg-gray-700' : 'bg-gray-100'
                                    }`}
                                    variants={itemVariants}
                                  >
                                    <div className="flex items-center">
                                      <File className="h-5 w-5 mr-2 text-gray-500" />
                                      <span className="text-sm truncate max-w-xs">{file.name}</span>
                                      <span className="ml-2 text-xs text-gray-500">
                                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                      </span>
                                    </div>
                                    <button
                                      onClick={() => removeFile(index)}
                                      className="text-gray-500 hover:text-red-500 transition-colors"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </motion.div>
                                ))}
                              </motion.div>
                            </motion.div>
                          )}

                          <motion.div 
                            className="mt-6 flex justify-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                          >
                            <Button
                              onClick={handleUpload}
                              disabled={isUploading || files.length === 0}
                              className="w-full"
                              variant="default"
                            >
                              {isUploading ? (
                                <>
                                  <span className="mr-2">Uploading...</span>
                                  <div className="animate-spin inline-block w-4 h-4 border-2 border-b-transparent rounded-full"></div>
                                </>
                              ) : (
                                <>
                                  <Upload className="mr-2 h-4 w-4" />
                                  Process Documents
                                </>
                              )}
                            </Button>
                          </motion.div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    

                    {/* Search Tab */}
                    <TabsContent value="search" className="space-y-6">
                      <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-lg`}>
                        <CardContent className="pt-6">
                          <h2 className="text-xl font-semibold mb-4">Search Documents</h2>
                          
                          {/* Preset Queries */}
                          <div className="mb-4">
                            <h3 className="text-sm font-medium mb-2">Preset Questions</h3>
                            <div className="flex flex-wrap gap-2">
                              {presetQueries.map((query, index) => (
                                <motion.button
                                  key={index}
                                  className={`px-3 py-1 text-xs rounded-full ${
                                    selectedPresetQuery === query
                                      ? 'bg-law-secondary text-white'
                                      : isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                                  }`}
                                  whileHover={{ scale: 1.03 }}
                                  whileTap={{ scale: 0.97 }}
                                  onClick={() => handleSelectPresetQuery(query)}
                                >
                                  {query}
                                </motion.button>
                              ))}
                            </div>
                          </div>
                          
                          <div className="flex items-center">
                            <div className="relative flex-1">
                              <Textarea
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Enter search terms or select a preset question..."
                                className="w-full resize-none"
                                rows={3}
                              />
                              {searchQuery && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-2 top-2"
                                  onClick={() => setSearchQuery('')}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                          
                          <div className="mt-4">
                            <Button
                              onClick={handleSearch}
                              disabled={isSearching || (!searchQuery.trim() && !selectedPresetQuery)}
                              className="w-full"
                              variant="default"
                            >
                              {isSearching ? (
                                <>
                                  <span className="mr-2">Searching...</span>
                                  <div className="animate-spin inline-block w-4 h-4 border-2 border-b-transparent rounded-full"></div>
                                </>
                              ) : (
                                <>
                                  <Search className="mr-2 h-4 w-4" />
                                  Search
                                </>
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Search Results Dialog */}
                      <Dialog open={isResultsDialogOpen} onOpenChange={setIsResultsDialogOpen}>
                        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Search Results</DialogTitle>
                            <DialogDescription>
                              Results for: <span className="font-medium">{searchQuery || selectedPresetQuery}</span>
                            </DialogDescription>
                          </DialogHeader>
                          
                          {searchResults?.results && searchResults.results.length > 0 ? (
                            <div className="space-y-4 mt-4">
                              {searchResults.results.map((result, idx) => (
                                <div key={idx} className={`p-4 rounded-md ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="font-medium">Result #{idx + 1}</span>
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                      isDark ? 'bg-law-secondary/20 text-law-secondary' : 'bg-law-secondary/20 text-law-secondary'
                                    }`}>
                                      Similarity: {(result.similarity * 100).toFixed(2)}%
                                    </span>
                                  </div>
                                  <p className={`whitespace-pre-line text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {result.content}
                                  </p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="py-8 text-center">
                              <p className="text-muted-foreground">No results found</p>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TabsContent>

                    {/* Legal Query Tab */}
                    <TabsContent value="legalQuery" className="space-y-6">
                      <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-lg`}>
                        <CardContent className="pt-6">
                          <h2 className="text-xl font-semibold mb-4">Submit Legal Query</h2>
                          
                          {/* Preset Queries - Same as in Search tab */}
                          <div className="mb-4">
                            <h3 className="text-sm font-medium mb-2">Preset Questions</h3>
                            <div className="flex flex-wrap gap-2">
                              {presetQueries.map((query, index) => (
                                <motion.button
                                  key={index}
                                  className={`px-3 py-1 text-xs rounded-full ${
                                    selectedPresetQuery === query
                                      ? 'bg-law-secondary text-white'
                                      : isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                                  }`}
                                  whileHover={{ scale: 1.03 }}
                                  whileTap={{ scale: 0.97 }}
                                  onClick={() => handleSelectPresetQuery(query)}
                                >
                                  {query}
                                </motion.button>
                              ))}
                            </div>
                          </div>
                          
                          <div className="mb-4">
                            <label htmlFor="legalQuery" className="block text-sm font-medium mb-1">
                              Legal Question
                            </label>
                            <Textarea
                              id="legalQuery"
                              rows={3}
                              value={legalQuery}
                              onChange={(e) => setLegalQuery(e.target.value)}
                              placeholder="E.g., What are the obligations of the tenant in this lease?"
                              className="w-full resize-none"
                            />
                          </div>
                          
                          <div className="mb-4">
                            <label htmlFor="contextSize" className="block text-sm font-medium mb-1">
                              Context Size <span className="text-gray-500">({contextSize})</span>
                            </label>
                            <div className="flex items-center">
                              <input
                                type="range"
                                id="contextSize"
                                min="1"
                                max="10"
                                value={contextSize}
                                onChange={(e) => setContextSize(parseInt(e.target.value))}
                                className="flex-1 accent-law-primary"
                              />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Number of document chunks to use for context (higher provides more context but may be slower)
                            </p>
                          </div>
                          
                          <Button
                            onClick={handleLegalQuery}
                            disabled={isQueryingLegal || (!legalQuery.trim() && !selectedPresetQuery)}
                            className="w-full"
                            variant="default"
                          >
                            {isQueryingLegal ? (
                              <>
                                <span className="mr-2">Processing Query...</span>
                                <div className="animate-spin inline-block w-4 h-4 border-2 border-b-transparent rounded-full"></div>
                              </>
                            ) : (
                              <>
                                <Zap className="mr-2 h-4 w-4" />
                                Submit Query
                              </>
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                      
                      {renderLegalQueryResults()}
                    </TabsContent>

                    {/* Analysis Results Tab */}
                    <TabsContent value="analysis" className="space-y-6">
                      {renderAnalysisResults()}
                    </TabsContent>
                  </motion.div>
                </AnimatePresence>
                </Tabs>
              </div>
            </div>
          </section>
        </main>
      </div>
  );
};

export default DocumentAnalysisPage;