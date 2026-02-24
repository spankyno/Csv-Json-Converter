import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export type Format = 'csv' | 'json' | 'unknown';

export interface ConversionResult {
  data: any;
  format: Format;
  error?: string;
}

export function detectFormat(content: string): Format {
  const trimmed = content.trim();
  if (!trimmed) return 'unknown';

  // Try JSON first as it's more specific
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      JSON.parse(trimmed);
      return 'json';
    } catch {
      // Not valid JSON, might be CSV
    }
  }

  // Check for CSV-like structure
  // PapaParse can be used to sniff, but a simple check for common delimiters works as a hint
  const lines = trimmed.split('\n');
  if (lines.length > 0) {
    const firstLine = lines[0];
    if (firstLine.includes(',') || firstLine.includes(';') || firstLine.includes('\t') || firstLine.includes('|')) {
      return 'csv';
    }
  }

  return 'unknown';
}

export function csvToJson(csv: string, options: Papa.ParseConfig = {}): ConversionResult {
  try {
    const result = Papa.parse(csv, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      ...options,
    });

    if (result.errors.length > 0) {
      return {
        data: result.data,
        format: 'json',
        error: result.errors[0].message,
      };
    }

    return {
      data: result.data,
      format: 'json',
    };
  } catch (err: any) {
    return {
      data: null,
      format: 'json',
      error: err.message || 'Error parsing CSV',
    };
  }
}

export function jsonToCsv(json: any): ConversionResult {
  try {
    let dataToConvert = json;
    if (typeof json === 'string') {
      dataToConvert = JSON.parse(json);
    }

    // Ensure it's an array for PapaParse
    const arrayData = Array.isArray(dataToConvert) ? dataToConvert : [dataToConvert];
    
    const csv = Papa.unparse(arrayData);
    return {
      data: csv,
      format: 'csv',
    };
  } catch (err: any) {
    return {
      data: null,
      format: 'csv',
      error: err.message || 'Error converting JSON to CSV',
    };
  }
}

export function downloadFile(content: string, fileName: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToXlsx(data: any[], fileName: string) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

export function jsonToXml(json: any): string {
  const data = Array.isArray(json) ? json : [json];
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n';
  
  data.forEach((item: any) => {
    xml += '  <item>\n';
    for (const key in item) {
      const value = item[key];
      xml += `    <${key}>${value === null ? '' : escapeXml(String(value))}</${key}>\n`;
    }
    xml += '  </item>\n';
  });
  
  xml += '</root>';
  return xml;
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}
