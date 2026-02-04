// Script to read Bahawalpur Excel file and convert to JSON
import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const excelPath = path.join(__dirname, '..', 'client', 'public', 'Assets', 'Data Files', 'Safe City.xlsx');
const outputPath = path.join(__dirname, '..', 'client', 'src', 'data', 'bahawalpurProjectsData.json');

try {
  // Read the Excel file
  const workbook = XLSX.readFile(excelPath);
  
  // Get all sheet names
  const sheetNames = workbook.SheetNames;
  console.log('Sheet names:', sheetNames);
  
  // Read the first sheet (or you can specify which sheet)
  const firstSheetName = sheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  // Convert to JSON
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
    header: 1, // Use array of arrays format
    defval: null // Default value for empty cells
  });
  
  // Log first few rows to understand structure
  console.log('First 10 rows:');
  console.log(JSON.stringify(jsonData.slice(0, 10), null, 2));
  
  // Save raw data for inspection
  fs.writeFileSync(
    path.join(__dirname, '..', 'client', 'src', 'data', 'bahawalpurExcelRaw.json'),
    JSON.stringify(jsonData, null, 2)
  );
  
  console.log('\nExcel file read successfully!');
  console.log(`Total rows: ${jsonData.length}`);
  console.log(`Raw data saved to: bahawalpurExcelRaw.json`);
  
} catch (error) {
  console.error('Error reading Excel file:', error);
  process.exit(1);
}

