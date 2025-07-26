"use client";

import React, { useState } from "react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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

  const sampleTestCases: TestCase[] = [
    {
      name: "Simple Greeting",
      message: "Hello, how are you?",
      type: "conversational"
    },
    {
      name: "Mental Health Question",
      message: "What are the symptoms of anxiety?",
      type: "informational"
    },
    {
      name: "Practical Advice",
      message: "How can I manage stress at work?",
      type: "practical"
    },
    {
      name: "Emotional Support",
      message: "I'm feeling overwhelmed and don't know what to do",
      type: "emotional"
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
        if (!Array.isArray(json)) throw new Error("File must be an array of test cases");
        setTestCases(json);
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
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const renderTable = (
    title: string,
    key1: keyof TestResultRow,
    key2: keyof TestResultRow,
    label1: string,
    label2: string
  ) => (
    <div className="my-8">
      <h2 className="text-lg font-semibold mb-2 text-gray-800">{title}</h2>
      <div className="overflow-x-auto rounded shadow-sm border border-gray-100 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/2">Test Case</TableHead>
              <TableHead>{label1}</TableHead>
              <TableHead>{label2}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((row, i) => (
              <TableRow key={i} className="even:bg-gray-50">
                <TableCell className="font-medium text-gray-700">{row.testCase}</TableCell>
                <TableCell className={getCellStyle(row[key1])}>
                  {formatValue(row[key1], key1)}
                </TableCell>
                <TableCell className={getCellStyle(row[key2])}>
                  {formatValue(row[key2], key2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  const formatValue = (value: number | string, key: keyof TestResultRow): string => {
    if (value === '-') return '-';
    if (typeof value === 'number') {
      if (key.includes('time')) {
        return `${value.toFixed(2)}s`;
      } else if (key.includes('confidence')) {
        return `${(value * 100).toFixed(1)}%`;
      } else if (key.includes('total')) {
        return value.toString();
      }
    }
    return value.toString();
  };

  const getCellStyle = (value: number | string): string => {
    if (value === '-') return 'text-red-500 font-medium';
    if (typeof value === 'number') {
      if (value > 0.8) return 'text-green-600 font-medium';
      if (value > 0.6) return 'text-yellow-600 font-medium';
      if (value > 0.4) return 'text-orange-600 font-medium';
      return 'text-red-600 font-medium';
    }
    return '';
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-purple-50">
      <Navbar currentPage="model-test" />
      <main className="flex-1 flex flex-col items-center justify-center py-10 px-2">
        <Card className="w-full max-w-3xl mx-auto shadow-lg border border-gray-100">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Model Comparison Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 items-center">
              <div className="flex gap-2 w-full max-w-xs">
                <Button
                  onClick={loadSampleData}
                  className="flex-1"
                >
                  Load Sample Data
                </Button>
                <Button
                  onClick={() => window.open('/sample-test-cases.json', '_blank')}
                  variant="outline"
                  className="flex-1"
                >
                  Download Sample
                </Button>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Or upload your own test cases:</p>
                <input
                  type="file"
                  accept="application/json"
                  onChange={handleFileUpload}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
              </div>
              {testCases.length > 0 && (
                <div className="text-sm text-gray-600">
                  Loaded {testCases.length} test case{testCases.length !== 1 ? 's' : ''}
                </div>
              )}
              <Button
                onClick={handleRunTest}
                disabled={testCases.length === 0 || loading}
                className="w-full max-w-xs"
              >
                {loading ? "Running Test..." : "Run Model Test"}
              </Button>
              {error && (
                <Alert variant="destructive" className="w-full max-w-md mx-auto">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
            {results.length > 0 && (
              <div className="mt-8">
                {renderTable("Confidence Scores", "groq_confidence", "local_confidence", "Groq", "Local")}
                {renderTable("Response Times (seconds)", "groq_time", "local_time", "Groq", "Local")}
                {renderTable("Total Scores", "groq_total", "local_total", "Groq", "Local")}
              </div>
            )}
            
            {loading && (
              <div className="mt-8 text-center">
                <div className="inline-flex items-center gap-2 text-gray-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                  <span>Running model tests, please wait...</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  This may take a few minutes depending on the number of test cases.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
} 