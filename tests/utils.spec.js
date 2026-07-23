import { test, expect } from '@playwright/test';
import { detectMultivariateAnomalies, runDataQualitySuite, generateSyntheticData } from '../legacy/dataAnalysis.js';
import { calculatePanchangam } from '../legacy/panchangam.js';
import { generateRegex, testRegex } from '../legacy/regexGen.js';
import { RecursiveCharacterTextSplitter } from '../legacy/textSplitter.js';

test.describe('Data Analysis Utilities (`dataAnalysis.js`)', () => {
  test('detectMultivariateAnomalies - standard multivariate anomaly detection', () => {
    const data = [
      { x: 1.0, y: 1.0 },
      { x: 1.1, y: 1.1 },
      { x: 1.2, y: 1.2 },
      { x: 1.05, y: 1.05 },
      { x: 10.0, y: 10.0 } // Clear outlier
    ];
    const anomalies = detectMultivariateAnomalies(data, 0.2);
    expect(anomalies.length).toBeGreaterThanOrEqual(1);
    expect(anomalies.some(a => a.row === 4)).toBe(true);
  });

  test('detectMultivariateAnomalies - handles singular/uniform matrix fallback gracefully', () => {
    const data = [
      { x: 1, y: 1 },
      { x: 1, y: 1 }
    ];
    // Under uniform rows, the covariance matrix becomes singular, triggering fallback
    const anomalies = detectMultivariateAnomalies(data, 0.5);
    expect(anomalies).toBeDefined();
    expect(Array.isArray(anomalies)).toBe(true);
  });

  test('detectMultivariateAnomalies - empty/invalid datasets', () => {
    expect(detectMultivariateAnomalies([])).toEqual([]);
    expect(detectMultivariateAnomalies(null)).toEqual([]);
    expect(detectMultivariateAnomalies([{ x: 1 }])).toEqual([]); // < 2 dimensions
  });

  test('runDataQualitySuite - empty or null validation', () => {
    expect(runDataQualitySuite([])).toEqual([]);
    expect(runDataQualitySuite(null)).toEqual([]);
  });

  test('runDataQualitySuite - executes correct validation rules', () => {
    const data = [
      { id: 1, val: 10, category: 'A' },
      { id: 2, val: 11, category: 'B' },
      { id: 3, val: null, category: '' }
    ];
    const report = runDataQualitySuite(data);
    expect(report.length).toBeGreaterThan(0);

    // Check null rules
    const idNullExpectation = report.find(r => r.column === 'id' && r.expectation === 'not_null');
    expect(idNullExpectation.success).toBe(true);

    const valNullExpectation = report.find(r => r.column === 'val' && r.expectation === 'not_null');
    expect(valNullExpectation.success).toBe(false);
    expect(valNullExpectation.unexpected_count).toBe(1);
  });

  test('generateSyntheticData - generates correct schema and row counts', () => {
    const data = [
      { age: 25, salary: 50000, name: 'Alice' },
      { age: 30, salary: 60000, name: 'Bob' }
    ];
    const synthetic = generateSyntheticData(data, 10);
    expect(synthetic.length).toBe(10);
    synthetic.forEach(row => {
      expect(row).toHaveProperty('age');
      expect(row).toHaveProperty('salary');
      expect(row).toHaveProperty('name');
    });
  });

  test('generateSyntheticData - handles empty inputs gracefully', () => {
    expect(generateSyntheticData([])).toEqual([]);
    expect(generateSyntheticData(null)).toEqual([]);
  });
});

test.describe('Panchangam Astronomical Utility (`panchangam.js`)', () => {
  test('calculatePanchangam - computes standard metrics for valid input', () => {
    const p = calculatePanchangam('2026-07-22', '12:00:00', 17.3850, 78.4867, 5.5);
    expect(p).toHaveProperty('samvatsara');
    expect(p).toHaveProperty('tithi');
    expect(p).toHaveProperty('nakshatra');
    expect(p).toHaveProperty('rasi');
    expect(p).toHaveProperty('sunrise');
    expect(p).toHaveProperty('sunset');
    expect(p).toHaveProperty('rahukalam');
  });

  test('calculatePanchangam - gracefully handles malformed/empty dates', () => {
    const p = calculatePanchangam('invalid-date', 'invalid-time', null, undefined, NaN);
    expect(p).toBeDefined();
    expect(p.samvatsara).not.toBeNull();
    expect(p.tithi).not.toBeNull();
  });
});

test.describe('Regex Generation Utility (`regexGen.js`)', () => {
  test('generateRegex - generates character groupings correctly', () => {
    const regexStr = generateRegex('Abc123');
    expect(regexStr).toBe('^[A-Z][a-z]{2}\\d{3}$');
  });

  test('generateRegex - escapes special/literal punctuation characters', () => {
    const regexStr = generateRegex('Hello, World! (123)');
    // Ensures that special chars like '(', ')', ',', '!' are escaped with '\'
    expect(regexStr).toContain('\\,');
    expect(regexStr).toContain('\\!');
    expect(regexStr).toContain('\\(');
    expect(regexStr).toContain('\\)');
  });

  test('generateRegex - handles empty and long inputs safely', () => {
    expect(generateRegex('')).toBe('');
    expect(generateRegex(null)).toBe('');

    const longInput = 'A'.repeat(500);
    const regexStr = generateRegex(longInput);
    expect(regexStr.length).toBeLessThan(100); // truncated inside generateRegex
  });

  test('testRegex - validates correct matches and escapes errors', () => {
    const regex = '^[A-Z][a-z]{3}\\d{2}$';
    expect(testRegex(regex, 'Test12')).toBe(true);
    expect(testRegex(regex, 'Wrong123')).toBe(false);
    expect(testRegex('[invalid-regex', 'test')).toBe(false); // Should not crash
  });
});

test.describe('LangChain Text Splitter (`textSplitter.js`)', () => {
  test('splitText - correctly splits text with overlapping chunks', () => {
    const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 15, chunkOverlap: 3 });
    const text = 'Hello world this is amazing';
    const chunks = splitter.splitText(text);

    expect(chunks.length).toBeGreaterThan(1);
    chunks.forEach(chunk => {
      expect(chunk.length).toBeLessThanOrEqual(15);
    });
  });

  test('splitDocuments - processes document objects with metadata', () => {
    const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 12, chunkOverlap: 2 });
    const docs = [
      { pageContent: 'Doc one content here', metadata: { source: 'source1' } },
      { pageContent: 'Doc two is short', metadata: { source: 'source2' } }
    ];
    const chunkedDocs = splitter.splitDocuments(docs);
    expect(chunkedDocs.length).toBeGreaterThan(0);
    chunkedDocs.forEach(chunk => {
      expect(chunk).toHaveProperty('pageContent');
      expect(chunk).toHaveProperty('metadata');
      expect(chunk.metadata).toHaveProperty('source');
      expect(chunk.metadata).toHaveProperty('chunkIndex');
    });
  });
});
