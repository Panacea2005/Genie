"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  AreaChart,
  Area,
  ComposedChart,
  Brush,
  ReferenceLine,
} from "recharts";
import { TrendingUp, Zap, Award, Target, CheckCircle, AlertCircle, Activity, BarChart3 } from "lucide-react";

interface TestResultRow {
  testCase: string;
  lyra_confidence: number | string;
  solace_confidence: number | string;
  lyra_time: number | string;
  solace_time: number | string;
  lyra_total: number | string;
  solace_total: number | string;
}

interface ModelComparisonChartsProps {
  results: TestResultRow[];
}

interface PerformanceMetrics {
  lyra: {
    avgConfidence: number;
    avgTime: number;
    avgScore: number;
    totalTests: number;
    successRate: number;
  };
  solace: {
    avgConfidence: number;
    avgTime: number;
    avgScore: number;
    totalTests: number;
    successRate: number;
  };
}

// Minimal, clean styling for professional charts
const chartColors = {
  lyra: '#3B82F6',
  solace: '#8B5CF6',
  grid: '#F1F5F9',
  text: '#64748B',
  background: '#FFFFFF',
};

const chartStyles = {
  fontSize: 11,
  fontFamily: 'Inter, system-ui, sans-serif',
  strokeWidth: 1.5,
  radius: 2,
};

export default function ModelComparisonCharts({ results }: ModelComparisonChartsProps) {
  const calculateMetrics = (): PerformanceMetrics => {
    const lyraData = results.filter(r => typeof r.lyra_confidence === 'number' && typeof r.lyra_time === 'number' && typeof r.lyra_total === 'number');
    const solaceData = results.filter(r => typeof r.solace_confidence === 'number' && typeof r.solace_time === 'number' && typeof r.solace_total === 'number');

    const lyraMetrics = {
      avgConfidence: lyraData.length > 0 ? lyraData.reduce((sum, r) => sum + (r.lyra_confidence as number), 0) / lyraData.length : 0,
      avgTime: lyraData.length > 0 ? lyraData.reduce((sum, r) => sum + (r.lyra_time as number), 0) / lyraData.length : 0,
      avgScore: lyraData.length > 0 ? lyraData.reduce((sum, r) => sum + (r.lyra_total as number), 0) / lyraData.length : 0,
      totalTests: lyraData.length,
      successRate: (lyraData.length / results.length) * 100
    };

    const solaceMetrics = {
      avgConfidence: solaceData.length > 0 ? solaceData.reduce((sum, r) => sum + (r.solace_confidence as number), 0) / solaceData.length : 0,
      avgTime: solaceData.length > 0 ? solaceData.reduce((sum, r) => sum + (r.solace_time as number), 0) / solaceData.length : 0,
      avgScore: solaceData.length > 0 ? solaceData.reduce((sum, r) => sum + (r.solace_total as number), 0) / solaceData.length : 0,
      totalTests: solaceData.length,
      successRate: (solaceData.length / results.length) * 100
    };

    return { lyra: lyraMetrics, solace: solaceMetrics };
  };

  const metrics = calculateMetrics();

  // Prepare data for various chart types
  const performanceData = [
    { metric: 'Confidence', Lyra: metrics.lyra.avgConfidence * 100, Solace: metrics.solace.avgConfidence * 100 },
    { metric: 'Speed', Lyra: Math.max(0, 100 - (metrics.lyra.avgTime * 10)), Solace: Math.max(0, 100 - (metrics.solace.avgTime * 10)) },
    { metric: 'Overall Score', Lyra: (metrics.lyra.avgScore / 100) * 100, Solace: (metrics.solace.avgScore / 100) * 100 },
    { metric: 'Success Rate', Lyra: metrics.lyra.successRate, Solace: metrics.solace.successRate },
  ];

  // Fixed scatter plot data - combine both models in single array with model identifier
  const scatterData = results.filter(r => 
    typeof r.lyra_confidence === 'number' && 
    typeof r.lyra_time === 'number' &&
    typeof r.solace_confidence === 'number' && 
    typeof r.solace_time === 'number'
  ).flatMap((result, index) => [
    {
      testCase: `Test ${index + 1}`,
      confidence: (result.lyra_confidence as number) * 100,
      time: result.lyra_time as number,
      model: 'Lyra'
    },
    {
      testCase: `Test ${index + 1}`,
      confidence: (result.solace_confidence as number) * 100,
      time: result.solace_time as number,
      model: 'Solace'
    }
  ]);

  const areaData = results.map((result, index) => ({
    testCase: `Test ${index + 1}`,
    lyraScore: typeof result.lyra_total === 'number' ? result.lyra_total : 0,
    solaceScore: typeof result.solace_total === 'number' ? result.solace_total : 0,
  }));

  const lineChartData = results.map((result, index) => ({
    testCase: `Test ${index + 1}`,
    lyraConfidence: typeof result.lyra_confidence === 'number' ? result.lyra_confidence * 100 : 0,
    solaceConfidence: typeof result.solace_confidence === 'number' ? result.solace_confidence * 100 : 0,
    lyraTime: typeof result.lyra_time === 'number' ? result.lyra_time : 0,
    solaceTime: typeof result.solace_time === 'number' ? result.solace_time : 0,
  }));

  const composedData = results.map((result, index) => ({
    testCase: `Test ${index + 1}`,
    lyraConfidence: typeof result.lyra_confidence === 'number' ? result.lyra_confidence * 100 : 0,
    solaceConfidence: typeof result.solace_confidence === 'number' ? result.solace_confidence * 100 : 0,
    lyraTime: typeof result.lyra_time === 'number' ? result.lyra_time : 0,
    solaceTime: typeof result.solace_time === 'number' ? result.solace_time : 0,
  }));

  const determineWinner = () => {
    const lyraTotal = (metrics.lyra.avgConfidence * 0.4) + (Math.max(0, 1 - metrics.lyra.avgTime / 10) * 0.3) + (metrics.lyra.avgScore / 100 * 0.3);
    const solaceTotal = (metrics.solace.avgConfidence * 0.4) + (Math.max(0, 1 - metrics.solace.avgTime / 10) * 0.3) + (metrics.solace.avgScore / 100 * 0.3);
    
    if (lyraTotal > solaceTotal) {
      return { winner: 'Lyra', score: lyraTotal, margin: ((lyraTotal - solaceTotal) / solaceTotal) * 100 };
    } else if (solaceTotal > lyraTotal) {
      return { winner: 'Solace', score: solaceTotal, margin: ((solaceTotal - lyraTotal) / lyraTotal) * 100 };
    } else {
      return { winner: 'Tie', score: lyraTotal, margin: 0 };
    }
  };

  const winner = determineWinner();

  return (
    <div className="space-y-8">
      {/* Performance Summary Cards */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 border border-gray-200/50 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-medium text-gray-800">Lyra Confidence</h3>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {(metrics.lyra.avgConfidence * 100).toFixed(1)}%
          </div>
          <p className="text-xs text-gray-600">Average confidence score</p>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 border border-gray-200/50 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-medium text-gray-800">Solace Confidence</h3>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {(metrics.solace.avgConfidence * 100).toFixed(1)}%
          </div>
          <p className="text-xs text-gray-600">Average confidence score</p>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 border border-gray-200/50 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-medium text-gray-800">Lyra Speed</h3>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {metrics.lyra.avgTime.toFixed(2)}s
          </div>
          <p className="text-xs text-gray-600">Average response time</p>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 border border-gray-200/50 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-medium text-gray-800">Solace Speed</h3>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {metrics.solace.avgTime.toFixed(2)}s
          </div>
          <p className="text-xs text-gray-600">Average response time</p>
        </div>
      </motion.div>

      {/* Winner Analysis */}
      <motion.div 
        className="bg-white/90 backdrop-blur-sm rounded-lg p-6 border border-gray-200/50 shadow-sm"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <Award className="w-5 h-5 text-amber-600" />
          <h3 className="text-lg font-medium text-gray-900">Performance Analysis</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className={`text-3xl font-bold mb-2 ${
              winner.winner === 'Lyra' ? 'text-blue-600' : 
              winner.winner === 'Solace' ? 'text-purple-600' : 'text-gray-600'
            }`}>
              {winner.winner}
            </div>
            <p className="text-sm text-gray-600">Overall Winner</p>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {winner.score.toFixed(2)}
            </div>
            <p className="text-sm text-gray-600">Combined Score</p>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {winner.margin > 0 ? `+${winner.margin.toFixed(1)}%` : '0%'}
            </div>
            <p className="text-sm text-gray-600">Performance Margin</p>
          </div>
        </div>

        <div className="mt-4 p-4 bg-gray-50/50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Scientific Conclusion</h4>
          <p className="text-sm text-gray-700 leading-relaxed">
            Based on the comprehensive analysis of {results.length} test cases, {winner.winner} demonstrates superior performance 
            with a {winner.margin > 0 ? `${winner.margin.toFixed(1)}%` : 'marginal'} advantage. The evaluation considers 
            confidence scores (40% weight), response speed (30% weight), and source relevance (30% weight). 
            {winner.winner === 'Lyra' ? ' The Groq Llama-3.3 model shows better reliability and consistency.' : 
             winner.winner === 'Solace' ? ' The Groq Llama-4 model demonstrates excellent performance with enhanced capabilities.' : 
             ' Both Groq models show comparable performance across all metrics.'}
          </p>
        </div>
      </motion.div>

      {/* Charts Grid - Professional Scientific Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart - Performance Overview */}
        <motion.div 
          className="bg-white/90 backdrop-blur-sm rounded-lg p-4 border border-gray-200/50 shadow-sm"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <h3 className="text-sm font-medium text-gray-800">Multi-Dimensional Performance Analysis</h3>
          </div>
          <p className="text-xs text-gray-600 mb-4">
            Radar chart showing performance across confidence, speed, overall score, and success rate metrics.
          </p>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={performanceData}>
              <PolarGrid stroke={chartColors.grid} />
              <PolarAngleAxis dataKey="metric" stroke={chartColors.text} fontSize={chartStyles.fontSize} />
              <PolarRadiusAxis stroke={chartColors.text} fontSize={chartStyles.fontSize} />
              <Radar 
                name="Lyra" 
                dataKey="Lyra" 
                stroke={chartColors.lyra} 
                fill={chartColors.lyra} 
                fillOpacity={0.2} 
                strokeWidth={chartStyles.strokeWidth}
              />
              <Radar 
                name="Solace" 
                dataKey="Solace" 
                stroke={chartColors.solace} 
                fill={chartColors.solace} 
                fillOpacity={0.2} 
                strokeWidth={chartStyles.strokeWidth}
              />
              <Tooltip 
                formatter={(value: number) => [`${value.toFixed(1)}`, 'Score']}
                labelStyle={{ color: chartColors.text }}
                contentStyle={{ 
                  backgroundColor: chartColors.background,
                  border: `1px solid ${chartColors.grid}`,
                  borderRadius: '6px',
                  fontSize: chartStyles.fontSize
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Scatter Plot - Confidence vs Time for both models */}
        <motion.div 
          className="bg-white/90 backdrop-blur-sm rounded-lg p-4 border border-gray-200/50 shadow-sm"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-medium text-gray-800">Confidence vs Response Time Correlation</h3>
          </div>
          <p className="text-xs text-gray-600 mb-4">
            Scatter plot showing the relationship between confidence scores and response times for each test case.
          </p>
          <ResponsiveContainer width="100%" height={250}>
            <ScatterChart data={scatterData}>
              <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
              <XAxis 
                dataKey="time" 
                stroke={chartColors.text} 
                fontSize={chartStyles.fontSize}
                tick={{ fontSize: chartStyles.fontSize }}
                name="Response Time (seconds)"
              />
              <YAxis 
                dataKey="confidence" 
                stroke={chartColors.text} 
                fontSize={chartStyles.fontSize}
                tick={{ fontSize: chartStyles.fontSize }}
                name="Confidence (%)"
                label={{ value: "Confidence (%)", angle: -90, position: "left", offset: 15 }}
              />
              <Tooltip 
                labelStyle={{ color: chartColors.text }}
                contentStyle={{ 
                  backgroundColor: chartColors.background,
                  border: `1px solid ${chartColors.grid}`,
                  borderRadius: '6px',
                  fontSize: chartStyles.fontSize
                }}
                formatter={(value: number, name: string) => [
                  name.includes('Confidence') ? `${value.toFixed(1)}%` : `${value.toFixed(2)}s`,
                  name
                ]}
              />
              <Legend />
              <Scatter 
                name="Lyra" 
                dataKey="confidence" 
                fill={chartColors.lyra} 
                stroke={chartColors.lyra}
                strokeWidth={chartStyles.strokeWidth}
                shape="circle"
                data={scatterData.filter(item => item.model === 'Lyra')}
              />
              <Scatter 
                name="Solace" 
                dataKey="confidence" 
                fill={chartColors.solace} 
                stroke={chartColors.solace}
                strokeWidth={chartStyles.strokeWidth}
                shape="triangle"
                data={scatterData.filter(item => item.model === 'Solace')}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Area Chart - Performance Trends */}
        <motion.div 
          className="bg-white/90 backdrop-blur-sm rounded-lg p-4 border border-gray-200/50 shadow-sm"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-medium text-gray-800">Performance Score Trends</h3>
          </div>
          <p className="text-xs text-gray-600 mb-4">
            Area chart showing how overall performance scores vary across different test cases.
          </p>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={areaData}>
              <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
              <XAxis 
                dataKey="testCase" 
                stroke={chartColors.text} 
                fontSize={chartStyles.fontSize}
                tick={{ fontSize: chartStyles.fontSize }}
                name="Test Cases"
              />
              <YAxis 
                stroke={chartColors.text} 
                fontSize={chartStyles.fontSize}
                tick={{ fontSize: chartStyles.fontSize }}
                name="Performance Score"
                label={{ value: "Performance Score", angle: -90, position: "left", offset: 15 }}
              />
              <Tooltip 
                labelStyle={{ color: chartColors.text }}
                contentStyle={{ 
                  backgroundColor: chartColors.background,
                  border: `1px solid ${chartColors.grid}`,
                  borderRadius: '6px',
                  fontSize: chartStyles.fontSize
                }}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="lyraScore" 
                stroke={chartColors.lyra} 
                fill={chartColors.lyra} 
                fillOpacity={0.3}
                strokeWidth={chartStyles.strokeWidth}
              />
              <Area 
                type="monotone" 
                dataKey="solaceScore" 
                stroke={chartColors.solace} 
                fill={chartColors.solace} 
                fillOpacity={0.3}
                strokeWidth={chartStyles.strokeWidth}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Line Chart - Confidence and Time Trends */}
        <motion.div 
          className="bg-white/90 backdrop-blur-sm rounded-lg p-4 border border-gray-200/50 shadow-sm"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-medium text-gray-800">Confidence & Response Time Trends</h3>
          </div>
          <p className="text-xs text-gray-600 mb-4">
            Line chart with dual Y-axes showing confidence scores (left) and response times (right) across test cases.
          </p>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={lineChartData}>
              <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
              <XAxis 
                dataKey="testCase" 
                stroke={chartColors.text} 
                fontSize={chartStyles.fontSize}
                tick={{ fontSize: chartStyles.fontSize }}
                name="Test Cases"
              />
              <YAxis 
                yAxisId="left"
                stroke={chartColors.text} 
                fontSize={chartStyles.fontSize}
                tick={{ fontSize: chartStyles.fontSize }}
                name="Confidence (%)"
                label={{ value: "Confidence (%)", angle: -90, position: "left", offset: 15 }}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right"
                stroke={chartColors.text} 
                fontSize={chartStyles.fontSize}
                tick={{ fontSize: chartStyles.fontSize }}
                name="Response Time (seconds)"
                label={{ value: "Response Time (seconds)", angle: 90, position: "right", offset: 15 }}
              />
              <Tooltip 
                labelStyle={{ color: chartColors.text }}
                contentStyle={{ 
                  backgroundColor: chartColors.background,
                  border: `1px solid ${chartColors.grid}`,
                  borderRadius: '6px',
                  fontSize: chartStyles.fontSize
                }}
                formatter={(value: number, name: string) => [
                  name.includes('Confidence') ? `${value.toFixed(1)}%` : `${value.toFixed(2)}s`,
                  name
                ]}
              />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="lyraConfidence" 
                stroke={chartColors.lyra} 
                strokeWidth={chartStyles.strokeWidth}
                name="Lyra Confidence"
                dot={{ fill: chartColors.lyra, strokeWidth: 2, r: chartStyles.radius }}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="solaceConfidence" 
                stroke={chartColors.solace} 
                strokeWidth={chartStyles.strokeWidth}
                name="Solace Confidence"
                dot={{ fill: chartColors.solace, strokeWidth: 2, r: chartStyles.radius }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="lyraTime" 
                stroke={chartColors.lyra} 
                strokeWidth={chartStyles.strokeWidth}
                name="Lyra Time"
                strokeDasharray="5 5"
                dot={{ fill: chartColors.lyra, strokeWidth: 2, r: chartStyles.radius }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="solaceTime" 
                stroke={chartColors.solace} 
                strokeWidth={chartStyles.strokeWidth}
                name="Solace Time"
                strokeDasharray="5 5"
                dot={{ fill: chartColors.solace, strokeWidth: 2, r: chartStyles.radius }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Composed Chart - Multi-Metric Analysis */}
      <motion.div 
        className="bg-white/90 backdrop-blur-sm rounded-lg p-4 border border-gray-200/50 shadow-sm"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <h3 className="text-sm font-medium text-gray-800">Comprehensive Multi-Metric Analysis</h3>
        </div>
        <p className="text-xs text-gray-600 mb-4">
          Combined chart showing confidence scores (bars) and response times (lines) for detailed performance comparison.
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={composedData}>
            <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
            <XAxis 
              dataKey="testCase" 
              stroke={chartColors.text} 
              fontSize={chartStyles.fontSize}
              tick={{ fontSize: chartStyles.fontSize }}
              name="Test Cases"
            />
            <YAxis 
              yAxisId="left"
              stroke={chartColors.text} 
              fontSize={chartStyles.fontSize}
              tick={{ fontSize: chartStyles.fontSize }}
              name="Confidence (%)"
              label={{ value: "Confidence (%)", angle: -90, position: "left", offset: 15 }}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right"
              stroke={chartColors.text} 
              fontSize={chartStyles.fontSize}
              tick={{ fontSize: chartStyles.fontSize }}
              name="Response Time (seconds)"
              label={{ value: "Response Time (seconds)", angle: 90, position: "right", offset: 15 }}
            />
            <Tooltip 
              labelStyle={{ color: chartColors.text }}
              contentStyle={{ 
                backgroundColor: chartColors.background,
                border: `1px solid ${chartColors.grid}`,
                borderRadius: '6px',
                fontSize: chartStyles.fontSize
              }}
            />
            <Legend />
            <Bar 
              yAxisId="left"
              dataKey="lyraConfidence" 
              fill={chartColors.lyra} 
              fillOpacity={0.7}
              radius={[chartStyles.radius, chartStyles.radius, 0, 0]}
            />
            <Bar 
              yAxisId="left"
              dataKey="solaceConfidence" 
              fill={chartColors.solace} 
              fillOpacity={0.7}
              radius={[chartStyles.radius, chartStyles.radius, 0, 0]}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="lyraTime" 
              stroke={chartColors.lyra} 
              strokeWidth={chartStyles.strokeWidth}
              dot={{ fill: chartColors.lyra, strokeWidth: 2, r: chartStyles.radius }}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="solaceTime" 
              stroke={chartColors.solace} 
              strokeWidth={chartStyles.strokeWidth}
              dot={{ fill: chartColors.solace, strokeWidth: 2, r: chartStyles.radius }}
            />
            <ReferenceLine y={0} stroke={chartColors.grid} yAxisId="left" />
          </ComposedChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
