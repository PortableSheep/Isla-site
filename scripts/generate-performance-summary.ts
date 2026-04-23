#!/usr/bin/env ts-node
/**
 * Generate a summary of performance test results
 */

import * as fs from 'fs';
import * as path from 'path';

interface PerformanceMetric {
  testName: string;
  timestamp: string;
  metrics: Record<string, number | string>;
}

function generatePerformanceSummary() {
  const resultsDir = path.join(__dirname, '..', 'test-results', 'performance');
  
  if (!fs.existsSync(resultsDir)) {
    console.log('❌ No performance test results found');
    return;
  }

  const files = fs.readdirSync(resultsDir).filter(f => f.endsWith('.json') && f !== 'performance-report.json');
  
  if (files.length === 0) {
    console.log('❌ No performance test results found');
    return;
  }

  const results: PerformanceMetric[] = [];
  
  for (const file of files) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(resultsDir, file), 'utf-8'));
      results.push(data);
    } catch (error) {
      console.error(`Failed to read ${file}:`, error);
    }
  }

  // Generate summary
  console.log('\n📊 Performance Test Summary');
  console.log('═'.repeat(50));
  
  for (const result of results) {
    console.log(`\n${result.testName}`);
    console.log('─'.repeat(50));
    console.log(`Time: ${new Date(result.timestamp).toLocaleString()}`);
    
    for (const [key, value] of Object.entries(result.metrics)) {
      if (typeof value === 'number') {
        if (key.includes('Time') || key.includes('time')) {
          console.log(`  ${key}: ${(value as number).toFixed(2)}ms`);
        } else if (key.includes('MB')) {
          console.log(`  ${key}: ${(value as number).toFixed(2)}MB`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      } else {
        console.log(`  ${key}: ${value}`);
      }
    }
  }

  console.log('\n' + '═'.repeat(50) + '\n');
}

generatePerformanceSummary();
