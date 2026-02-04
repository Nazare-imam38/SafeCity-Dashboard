// Script to parse Bahawalpur JSON data and convert to structured format
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Convert date string "19-Jan-26" to "2026-01-19"
function parseDate(dateStr) {
  if (!dateStr || dateStr === null || dateStr === 'null') return null;
  
  try {
    // Handle format like "19-Jan-26"
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames.indexOf(parts[1]) + 1;
      const year = 2000 + parseInt(parts[2], 10);
      
      if (month > 0 && day > 0 && year > 2000) {
        const monthStr = String(month).padStart(2, '0');
        const dayStr = String(day).padStart(2, '0');
        return `${year}-${monthStr}-${dayStr}`;
      }
    }
  } catch (error) {
    console.warn(`Error parsing date: ${dateStr}`, error);
  }
  
  return null;
}

const jsonPath = path.join(__dirname, '..', 'client', 'public', 'Assets', 'Data Files', 'Safe City.json');

try {
  const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
  // The file appears to be an array but might have formatting issues
  // Try to extract just the array part
  let cleanedContent = jsonContent.trim();
  
  // Remove leading null, newlines, and commas
  cleanedContent = cleanedContent.replace(/^[\s\n]*null\s*,?\s*/, '');
  
  // Find the first [ or { and last ] or }
  const firstBracket = cleanedContent.indexOf('[');
  const lastBracket = cleanedContent.lastIndexOf(']');
  const firstBrace = cleanedContent.indexOf('{');
  const lastBrace = cleanedContent.lastIndexOf('}');
  
  if (firstBracket !== -1 && lastBracket !== -1) {
    cleanedContent = cleanedContent.substring(firstBracket, lastBracket + 1);
  } else if (firstBrace !== -1 && lastBrace !== -1) {
    // If it's an object, wrap it in array
    cleanedContent = '[' + cleanedContent.substring(firstBrace, lastBrace + 1) + ']';
  }
  
  // Parse JSON - it's an array
  const jsonData = JSON.parse(cleanedContent);
  
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

  // Skip first two rows (null and header)
  const dataRows = jsonData.slice(2);

  dataRows.forEach((row, index) => {
    const activityId = row["SC  Smart Safe Cities - CM Tehsils Project (Bahawalpur Division)"]?.toString().trim() || '';
    const activityName = row["Column2"]?.toString().trim() || '';
    const duration = row["Column3"] || 0;
    const startDate = row["Column4"] ? parseDate(row["Column4"]) : null;
    const finishDate = row["Column5"] ? parseDate(row["Column5"]) : null;

    // Skip empty rows or header rows
    if (!activityId || activityId === 'Activity ID' || activityId.includes('Smart Safe Cities')) return;

    // Parse hierarchy from activity ID
    const cleanId = activityId.trim();
    
    // Check if it's a milestone/activity (starts with A)
    if (cleanId.startsWith('A') && currentSubProject) {
      activityCounter++;
      
      const milestone = {
        id: cleanId,
        name: activityName || cleanId,
        duration: duration || 0,
        startDate: startDate,
        finishDate: finishDate
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
      // Extract tehsil name from activityId (e.g., "      SC.2.1.1  Chishtian")
      let tehsilName = activityId.trim();
      // Remove the SC pattern part
      tehsilName = tehsilName.replace(/SC\.\d+\.\d+\.\d+\s*/, '').trim();
      
      // Normalize tehsil names to match hierarchy
      const nameMap = {
        'Haroon Abad': 'Haroonabad',
        'Liaquatpur': 'Liaqatpur'
      };
      tehsilName = nameMap[tehsilName] || tehsilName;
      
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
      // Extract project name from activityId
      let projectName = activityId.trim();
      projectName = projectName.replace(/SC\.\d+\.\d+\.\d+\.\d+\s*/, '').trim();
      
      if (projectName) {
        projectCounter++;
        
        const project = {
          id: `project-${projectCounter}`,
          name: projectName,
          duration: duration || 0,
          startDate: startDate,
          finishDate: finishDate,
          subProjects: []
        };
        
        structuredData.districts[currentDistrict].tehsils[currentTehsil].projects.push(project);
        currentProject = project;
        currentSubProject = null;
      }
    }
    // Sub-project level (SC.2.1.1.1.1, SC.2.1.1.1.2, etc.)
    else if (level1 === '2' && level2 && level3 && level4 && level5 && currentProject) {
      // Extract sub-project name from activityId
      let subProjectName = activityId.trim();
      subProjectName = subProjectName.replace(/SC\.\d+\.\d+\.\d+\.\d+\.\d+\s*/, '').trim();
      
      if (subProjectName) {
        subProjectCounter++;
        
        const subProject = {
          id: `subproject-${subProjectCounter}`,
          name: subProjectName,
          duration: duration || 0,
          startDate: startDate,
          finishDate: finishDate,
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
  
  console.log('✅ Parsed Bahawalpur JSON data successfully!');
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
  console.error('Error parsing JSON file:', error);
  process.exit(1);
}

