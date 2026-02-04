// Script to parse Bahawalpur Excel data and convert to structured format
import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Convert Excel serial date to JavaScript date
function excelDateToJSDate(serial) {
  if (!serial || serial === null) return null;
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);
  return date_info;
}

// Format date to YYYY-MM-DD
function formatDate(date) {
  if (!date) return null;
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const excelPath = path.join(__dirname, '..', 'client', 'public', 'Assets', 'Data Files', 'Safe City.xlsx');

try {
  const workbook = XLSX.readFile(excelPath);
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
    header: 1,
    defval: null
  });

  // Skip header rows (first 3 rows)
  const dataRows = jsonData.slice(3);
  
  const structuredData = {
    division: "Bahawalpur",
    districts: {}
  };

  let currentDistrict = null;
  let currentTehsil = null;
  let currentProject = null;
  let currentSubProject = null;
  let projectCounter = 0;
  let subProjectCounter = 0;
  let activityCounter = 0;

  dataRows.forEach((row, index) => {
    const activityId = row[0]?.toString().trim() || '';
    const activityName = row[1]?.toString().trim() || '';
    const duration = row[2];
    const startDate = row[3] ? excelDateToJSDate(row[3]) : null;
    const finishDate = row[4] ? excelDateToJSDate(row[4]) : null;

    // Skip empty rows or rows without activity ID
    if (!activityId) return;
    
    // Skip header-like rows
    if (activityId === 'Activity ID' || activityId.includes('Smart Safe Cities')) return;

    // Parse hierarchy from activity ID
    // Note: Activity IDs may have leading spaces like "  SC.2.1"
    const cleanId = activityId.trim();
    
    // Check if it's a milestone/activity (starts with A)
    if (cleanId.startsWith('A') && currentSubProject) {
      activityCounter++;
      
      const milestone = {
        id: cleanId,
        name: activityName || cleanId,
        duration: duration || 0,
        startDate: startDate ? formatDate(startDate) : null,
        finishDate: finishDate ? formatDate(finishDate) : null
      };
      
      currentSubProject.milestones.push(milestone);
      return;
    }
    
    // Check if it contains SC pattern
    if (!cleanId.includes('SC')) return;
    
    // Extract the SC pattern (handle spaces)
    const scMatch = cleanId.match(/SC\.(\d+)\.(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:\.(\d+))?/);
    if (!scMatch) return;
    
    const [, level1, level2, level3, level4, level5] = scMatch;
    
    // District level (SC.2.1, SC.2.2, SC.2.3)
    if (level1 === '2' && level2 && !level3) {
      let districtName = '';
      
      if (level2 === '1') districtName = 'Bahawalnagar';
      else if (level2 === '2') districtName = 'Bahawalpur';
      else if (level2 === '3') districtName = 'Rahim Yar Khan';
      
      if (districtName) {
        if (!structuredData.districts[districtName]) {
          structuredData.districts[districtName] = {
            tehsils: {}
          };
        }
        currentDistrict = districtName;
        currentTehsil = null;
        currentProject = null;
        currentSubProject = null;
      }
    }
    // Tehsil level (SC.2.1.1, SC.2.1.2, etc.)
    else if (level1 === '2' && level2 && level3 && !level4 && currentDistrict) {
      // Extract tehsil name from activity name (e.g., "Chishtian" from "      SC.2.1.1  Chishtian")
      let tehsilName = activityName.trim();
      // If activity name is empty, try to extract from activityId
      if (!tehsilName && cleanId.includes('  ')) {
        const parts = cleanId.split(/\s{2,}/);
        if (parts.length > 1) {
          tehsilName = parts[parts.length - 1].trim();
        }
      }
      
      if (tehsilName) {
        if (!structuredData.districts[currentDistrict].tehsils[tehsilName]) {
          structuredData.districts[currentDistrict].tehsils[tehsilName] = {
            projects: []
          };
        }
        currentTehsil = tehsilName;
        currentProject = null;
        currentSubProject = null;
      }
    }
    // Project level (SC.2.1.1.1, SC.2.1.1.2, etc.) - Main project categories
    else if (level1 === '2' && level2 && level3 && level4 && !level5 && currentTehsil) {
      let projectName = activityName.trim();
      // If activity name is empty, try to extract from activityId
      if (!projectName && cleanId.includes('  ')) {
        const parts = cleanId.split(/\s{2,}/);
        if (parts.length > 1) {
          projectName = parts[parts.length - 1].trim();
        }
      }
      
      if (projectName) {
        projectCounter++;
        
        const project = {
          id: `project-${projectCounter}`,
          name: projectName,
          duration: duration || 0,
          startDate: startDate ? formatDate(startDate) : null,
          finishDate: finishDate ? formatDate(finishDate) : null,
          subProjects: []
        };
        
        structuredData.districts[currentDistrict].tehsils[currentTehsil].projects.push(project);
        currentProject = project;
        currentSubProject = null;
      }
    }
    // Sub-project level (SC.2.1.1.1.1, SC.2.1.1.1.2, etc.)
    else if (level1 === '2' && level2 && level3 && level4 && level5 && currentProject) {
      let subProjectName = activityName.trim();
      // If activity name is empty, try to extract from activityId
      if (!subProjectName && cleanId.includes('  ')) {
        const parts = cleanId.split(/\s{2,}/);
        if (parts.length > 1) {
          subProjectName = parts[parts.length - 1].trim();
        }
      }
      
      if (subProjectName) {
        subProjectCounter++;
        
        const subProject = {
          id: `subproject-${subProjectCounter}`,
          name: subProjectName,
          duration: duration || 0,
          startDate: startDate ? formatDate(startDate) : null,
          finishDate: finishDate ? formatDate(finishDate) : null,
          milestones: []
        };
        
        currentProject.subProjects.push(subProject);
        currentSubProject = subProject;
      }
    }
  });

  // Save structured data
  const outputPath = path.join(__dirname, '..', 'client', 'src', 'data', 'bahawalpurProjectsData.json');
  fs.writeFileSync(outputPath, JSON.stringify(structuredData, null, 2));
  
  console.log('✅ Parsed Bahawalpur Excel data successfully!');
  console.log(`\nSummary:`);
  console.log(`- Districts: ${Object.keys(structuredData.districts).length}`);
  
  let totalTehsils = 0;
  let totalProjects = 0;
  let totalSubProjects = 0;
  let totalMilestones = 0;
  
  Object.values(structuredData.districts).forEach(district => {
    totalTehsils += Object.keys(district.tehsils).length;
    Object.values(district.tehsils).forEach(tehsil => {
      totalProjects += tehsil.projects.length;
      tehsil.projects.forEach(project => {
        totalSubProjects += project.subProjects.length;
        project.subProjects.forEach(subProject => {
          totalMilestones += subProject.milestones.length;
        });
      });
    });
  });
  
  console.log(`- Tehsils: ${totalTehsils}`);
  console.log(`- Projects: ${totalProjects}`);
  console.log(`- Sub-projects: ${totalSubProjects}`);
  console.log(`- Milestones: ${totalMilestones}`);
  console.log(`\nData saved to: bahawalpurProjectsData.json`);
  
} catch (error) {
  console.error('Error parsing Excel file:', error);
  process.exit(1);
}

