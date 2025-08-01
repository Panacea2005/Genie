"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import GradientSphere from "@/components/gradient-sphere";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, Download, Upload, Play, Clock, Target, TrendingUp, Zap, Award } from "lucide-react";
import ModelComparisonCharts from "@/components/model-test/model-comparison-charts";

interface TestCase {
  name: string;
  message: string;
  type: string;
}

interface TestResultRow {
  testCase: string;
  groq_confidence: number | string;
  local_confidence: number | string;
  groq_time: number | string;
  local_time: number | string;
  groq_total: number | string;
  local_total: number | string;
}

export default function ModelTestPage() {
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [results, setResults] = useState<TestResultRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCharts, setShowCharts] = useState(false);

  const sampleTestCases: TestCase[] = [
    {
      name: "Happy - General",
      message: "I'm feeling really happy today!",
      type: "emotional"
    },
    {
      name: "Sad - General",
      message: "I've been feeling really down lately.",
      type: "emotional"
    },
    {
      name: "Anxious - Social",
      message: "I get really nervous in social situations.",
      type: "emotional"
    },
    {
      name: "Supportive - Motivation",
      message: "I need some motivation to keep going.",
      type: "emotional"
    },
    {
      name: "Neutral - Hobbies",
      message: "What are some fun hobbies to try?",
      type: "neutral"
    },
    {
      name: "Factual - Health",
      message: "What are the benefits of regular exercise?",
      type: "factual"
    }
  ];

  const loadSampleData = () => {
    setTestCases(sampleTestCases);
    setError(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!Array.isArray(json)) {
          throw new Error("File must be an array of test cases");
        }
        
        // Validate test case format
        for (let i = 0; i < json.length; i++) {
          const testCase = json[i];
          if (!testCase.name || !testCase.message) {
            throw new Error(`Test case ${i + 1} must have 'name' and 'message' fields`);
          }
          if (typeof testCase.name !== 'string' || typeof testCase.message !== 'string') {
            throw new Error(`Test case ${i + 1}: 'name' and 'message' must be strings`);
          }
        }
        
        setTestCases(json);
        console.log(`Loaded ${json.length} test cases successfully`);
      } catch (err: any) {
        setError("Invalid JSON file: " + err.message);
        setTestCases([]);
      }
    };
    reader.readAsText(file);
  };

  const handleRunTest = async () => {
    setError(null);
    setLoading(true);
    setResults([]);
    setShowCharts(false);
    try {
      // Replace with your backend endpoint
      const res = await fetch("/api/model-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test_cases: testCases }),
      });
      if (!res.ok) throw new Error("Failed to run model test");
      const data = await res.json();
      setResults(data.results || []);
      setShowCharts(true);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const renderCompactTable = (
    title: string,
    key1: keyof TestResultRow,
    key2: keyof TestResultRow,
    label1: string,
    label2: string,
    icon: React.ReactNode
  ) => (
    <motion.div 
      className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/60 shadow-sm hover:shadow-md transition-all duration-300"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="px-4 py-3 border-b border-gray-100/50">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-medium text-gray-800">{title}</h3>
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-100/50">
              <TableHead className="text-xs text-gray-600 font-medium px-3 py-2">Test Case</TableHead>
              <TableHead className="text-xs text-blue-600 font-medium px-3 py-2">{label1}</TableHead>
              <TableHead className="text-xs text-purple-600 font-medium px-3 py-2">{label2}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.slice(0, 4).map((row, i) => (
              <TableRow key={i} className="border-gray-100/50 hover:bg-gray-50/30 transition-colors">
                <TableCell className="text-xs font-medium text-gray-700 px-3 py-2 truncate max-w-[120px]">
                  {row.testCase}
                </TableCell>
                <TableCell className={`text-xs px-3 py-2 ${getCellStyle(row[key1], key1)}`}>
                  {formatValue(row[key1], key1)}
                </TableCell>
                <TableCell className={`text-xs px-3 py-2 ${getCellStyle(row[key2], key2)}`}>
                  {formatValue(row[key2], key2)}
                </TableCell>
              </TableRow>
            ))}
            {results.length > 4 && (
              <TableRow className="border-gray-100/50">
                <TableCell colSpan={3} className="text-xs text-gray-500 px-3 py-2 text-center">
                  +{results.length - 4} more results
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );

  const renderSummaryCard = (
    title: string,
    value: string,
    subtitle: string,
    icon: React.ReactNode,
    color: string
  ) => (
    <motion.div 
      className={`bg-white/80 backdrop-blur-sm rounded-xl border border-white/60 shadow-sm hover:shadow-md transition-all duration-300 ${color}`}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="p-4">
        <div className="flex items-center gap-3 mb-2">
          {icon}
          <h3 className="text-sm font-medium text-gray-800">{title}</h3>
        </div>
        <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
        <p className="text-xs text-gray-600">{subtitle}</p>
      </div>
    </motion.div>
  );

  const formatValue = (value: number | string, key: keyof TestResultRow): string => {
    if (value === '-') return '-';
    if (typeof value === 'number') {
      if (key.includes('time')) {
        return `${value.toFixed(2)}s`;
      } else if (key.includes('confidence')) {
        return `${(value * 100).toFixed(1)}%`;
      } else if (key.includes('total')) {
        return `${value.toFixed(2)}`;
      }
    }
    return value.toString();
  };

  const getCellStyle = (value: number | string, key: keyof TestResultRow): string => {
    if (value === '-') return 'text-gray-400 font-medium';
    if (typeof value === 'number') {
      if (key.includes('confidence')) {
        if (value > 0.8) return 'text-green-600 font-medium';
        if (value > 0.6) return 'text-emerald-600 font-medium';
        if (value > 0.4) return 'text-amber-600 font-medium';
        return 'text-rose-600 font-medium';
      } else if (key.includes('time')) {
        if (value < 1) return 'text-green-600 font-medium';
        if (value < 2) return 'text-emerald-600 font-medium';
        if (value < 3) return 'text-amber-600 font-medium';
        if (value < 5) return 'text-orange-600 font-medium';
        return 'text-rose-600 font-medium';
      } else if (key.includes('total')) {
        if (value > 80) return 'text-green-600 font-medium';
        if (value > 60) return 'text-emerald-600 font-medium';
        if (value > 40) return 'text-amber-600 font-medium';
        if (value > 20) return 'text-orange-600 font-medium';
        return 'text-rose-600 font-medium';
      }
    }
    return 'text-gray-700';
  };

  const calculateAverages = () => {
    if (results.length === 0) return null;
    
    const groqConfidence = results.filter(r => typeof r.groq_confidence === 'number').map(r => r.groq_confidence as number);
    const localConfidence = results.filter(r => typeof r.local_confidence === 'number').map(r => r.local_confidence as number);
    const groqTime = results.filter(r => typeof r.groq_time === 'number').map(r => r.groq_time as number);
    const localTime = results.filter(r => typeof r.local_time === 'number').map(r => r.local_time as number);
    
    return {
      groqConfidence: groqConfidence.length > 0 ? groqConfidence.reduce((a, b) => a + b, 0) / groqConfidence.length : 0,
      localConfidence: localConfidence.length > 0 ? localConfidence.reduce((a, b) => a + b, 0) / localConfidence.length : 0,
      groqTime: groqTime.length > 0 ? groqTime.reduce((a, b) => a + b, 0) / groqTime.length : 0,
      localTime: localTime.length > 0 ? localTime.reduce((a, b) => a + b, 0) / localTime.length : 0,
    };
  };

  const averages = calculateAverages();

  return (
    <main className="min-h-screen flex flex-col bg-white overflow-hidden">
      {/* Dynamic gradient background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30" />
      
      <Navbar currentPage="model-test" />
      
      {/* Hero Section with Gradient Sphere */}
      <section className="relative flex-1 flex items-center justify-center px-6 py-16">
        {/* Background Gradient Sphere */}
        <motion.div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] z-0 opacity-60"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.6 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          <GradientSphere />
        </motion.div>

        {/* Main Content */}
        <motion.div 
          className="relative z-10 w-full max-w-7xl mx-auto"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex items-center justify-center gap-3 mb-4"
            >
              <BarChart3 className="w-6 h-6 text-purple-600" />
              <h1 className="text-3xl font-light text-gray-900">
                Model Performance <span className="font-normal text-purple-600">Comparison</span>
              </h1>
            </motion.div>
            <motion.p 
              className="text-base text-gray-600 max-w-2xl mx-auto leading-relaxed"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Compare performance between Lyra (cloud-based) and Solace (local) models with scientific analysis
            </motion.p>
          </div>

          {/* Models Info Cards */}
          <motion.div 
            className="grid md:grid-cols-2 gap-4 mb-6"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
                <h3 className="text-sm font-medium text-gray-900">Lyra (Cloud)</h3>
              </div>
              <p className="text-gray-600 text-xs leading-relaxed">
                Cloud-hosted model optimized for speed and accuracy.
              </p>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                <h3 className="text-sm font-medium text-gray-900">Solace (Local)</h3>
              </div>
              <p className="text-gray-600 text-xs leading-relaxed">
                Locally-processed model for privacy and independence.
              </p>
            </div>
          </motion.div>

          {/* Test Controls */}
          <motion.div 
            className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/50 shadow-sm mb-6"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div className="flex flex-col items-center space-y-4">
              {/* Control Buttons */}
              <div className="flex flex-wrap justify-center gap-3">
                <Button
                  onClick={loadSampleData}
                  variant="outline"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 transition-all duration-200 text-sm"
                >
                  <Target className="w-3 h-3" />
                  Load Sample Data
                </Button>
                <Button
                  onClick={() => window.open('/sample-test-cases.json', '_blank')}
                  variant="outline"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200 text-sm"
                >
                  <Download className="w-3 h-3" />
                  Download Sample
                </Button>
              </div>

              {/* File Upload */}
              <div className="text-center">
                <p className="text-gray-600 mb-2 text-sm">Or upload your own test cases</p>
                <div className="text-xs text-gray-500 mb-3 font-mono bg-gray-50 px-2 py-1 rounded inline-block">
                  {`[{"name": "Test Name", "message": "Test message", "type": "emotional"}]`}
                </div>
                <div className="relative flex justify-center">
                  <input
                    type="file"
                    accept="application/json"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border-gray-200 hover:border-green-300 hover:bg-green-50/50 transition-all duration-200 text-sm"
                  >
                    <Upload className="w-3 h-3" />
                    Choose JSON File
                  </Button>
                </div>
              </div>

              {/* Test Cases Count */}
              {testCases.length > 0 && (
                <motion.div 
                  className="flex items-center gap-2 text-xs text-gray-600 bg-green-50 px-3 py-1 rounded-lg"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500 }}
                >
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  Loaded {testCases.length} test case{testCases.length !== 1 ? 's' : ''}
                </motion.div>
              )}

              {/* Run Test Button */}
              <Button
                onClick={handleRunTest}
                disabled={testCases.length === 0 || loading}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Running Test...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Play className="w-3 h-3" />
                    Run Model Test
                  </div>
                )}
              </Button>

              {/* Error Display */}
              {error && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-full max-w-md"
                >
                  <Alert variant="destructive" className="border-red-200 bg-red-50/50">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Results Section - Charts and Analysis */}
          <AnimatePresence>
            {results.length > 0 && showCharts && (
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -50, opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-6"
              >
                {/* Scientific Charts and Analysis */}
                <ModelComparisonCharts results={results as any} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading State */}
          {loading && (
            <motion.div 
              className="text-center py-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-6 h-6 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                <div className="space-y-1">
                  <p className="text-gray-700 font-medium text-sm">Running model tests, please wait...</p>
                  <p className="text-xs text-gray-500">This may take a few minutes depending on the number of test cases.</p>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </section>
      
      <Footer />
    </main>
  );
} 