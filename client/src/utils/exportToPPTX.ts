import PptxGenJS from 'pptxgenjs';
import type { CityInstallationData } from '@/data/cityData';

interface ExportData {
  cityName: string;
  cityData: CityInstallationData;
  installationPhases: {
    key: string;
    title: string;
    percentage: number;
  }[];
}

export async function exportDashboardToPPTX(data: ExportData) {
  const pptx = new PptxGenJS();
  
  // Set presentation properties
  pptx.author = 'Punjab Safe City Authority';
  pptx.company = 'PSCA';
  pptx.title = `${data.cityName} - Installation Progress Report`;
  pptx.subject = 'Camera Installation Progress Dashboard';
  
  // Define colors
  const colors = {
    primary: '4472C4',
    secondary: '70AD47',
    accent: 'FFC000',
    text: '000000',
    background: 'FFFFFF',
  };

  // Slide 1: Title Slide
  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: colors.background };
  titleSlide.addText(data.cityName, {
    x: 0.5,
    y: 1.5,
    w: 9,
    h: 1.5,
    fontSize: 48,
    bold: true,
    color: colors.primary,
    align: 'center',
  });
  titleSlide.addText('Camera Installation Progress Dashboard', {
    x: 0.5,
    y: 3,
    w: 9,
    h: 0.8,
    fontSize: 24,
    color: colors.text,
    align: 'center',
  });
  titleSlide.addText(`Overall Progress: ${data.cityData.overall}%`, {
    x: 0.5,
    y: 4.5,
    w: 9,
    h: 0.8,
    fontSize: 32,
    bold: true,
    color: colors.secondary,
    align: 'center',
  });
  titleSlide.addText('Punjab Safe City Authority', {
    x: 0.5,
    y: 6,
    w: 9,
    h: 0.6,
    fontSize: 18,
    color: colors.text,
    align: 'center',
  });
  titleSlide.addText(new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }), {
    x: 0.5,
    y: 7,
    w: 9,
    h: 0.5,
    fontSize: 14,
    color: colors.text,
    align: 'center',
  });

  // Slide 2: Installation Phases Overview
  const phasesSlide = pptx.addSlide();
  phasesSlide.background = { color: colors.background };
  phasesSlide.addText('Installation Phases Progress', {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.6,
    fontSize: 32,
    bold: true,
    color: colors.primary,
  });

  // Create table for installation phases
  const phaseTableData = [
    ['Phase', 'Progress %', 'Status'],
    ...data.installationPhases.map(phase => [
      phase.title,
      `${phase.percentage}%`,
      phase.percentage === 100 ? 'Completed' : 
      phase.percentage >= 80 ? 'Near Complete' : 
      phase.percentage >= 50 ? 'In Progress' : 'Started'
    ])
  ];

  phasesSlide.addTable(phaseTableData, {
    x: 0.5,
    y: 1.2,
    w: 9,
    h: 5,
    colW: [4, 2, 3],
    fontSize: 14,
    border: { type: 'solid', color: 'CCCCCC', pt: 1 },
    fill: { color: 'F2F2F2' },
    color: colors.text,
  });

  // Slide 3: Overall Progress Summary
  const summarySlide = pptx.addSlide();
  summarySlide.background = { color: colors.background };
  summarySlide.addText('Overall Progress Summary', {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.6,
    fontSize: 32,
    bold: true,
    color: colors.primary,
  });

  const summaryData = [
    ['Metric', 'Value'],
    ['Overall Progress', `${data.cityData.overall}%`],
    ['Surveys', `${data.cityData.surveys}%`],
    ['Foundations', `${data.cityData.foundations}%`],
    ['Cabinet Installation', `${data.cityData.cabinet}%`],
    ['Cable Laying', `${data.cityData.cable}%`],
    ['Control Room', `${data.cityData.controlRoom}%`],
    ['PPIC3 Go Live', `${data.cityData.ppic3}%`],
  ];

  summarySlide.addTable(summaryData, {
    x: 0.5,
    y: 1.5,
    w: 9,
    h: 5,
    colW: [5, 4],
    fontSize: 16,
    border: { type: 'solid', color: 'CCCCCC', pt: 1 },
    fill: { color: 'F2F2F2' },
    color: colors.text,
  });

  // Slide 4: Timeline Progress
  if (data.cityData.timeline && data.cityData.timeline.length > 0) {
    const timelineSlide = pptx.addSlide();
    timelineSlide.background = { color: colors.background };
    timelineSlide.addText('Monthly Progress Timeline', {
      x: 0.5,
      y: 0.3,
      w: 9,
      h: 0.6,
      fontSize: 32,
      bold: true,
      color: colors.primary,
    });

    const timelineTableData = [
      ['Month', 'Overall %', 'Surveys %', 'Foundations %', 'Cabinet %', 'Cable %', 'Control Room %', 'PPIC3 %'],
      ...data.cityData.timeline.map(item => [
        item.month,
        `${item.overall}%`,
        `${item.surveys}%`,
        `${item.foundations}%`,
        `${item.cabinet}%`,
        `${item.cable}%`,
        `${item.controlRoom}%`,
        `${item.ppic3}%`,
      ])
    ];

    timelineSlide.addTable(timelineTableData, {
      x: 0.3,
      y: 1.2,
      w: 9.4,
      h: 5.5,
      colW: [0.8, 1, 1, 1, 1, 1, 1.2, 1],
      fontSize: 11,
      border: { type: 'solid', color: 'CCCCCC', pt: 1 },
      fill: { color: 'F2F2F2' },
      color: colors.text,
    });
  }

  // Slide 5: Phase Distribution
  const distributionSlide = pptx.addSlide();
  distributionSlide.background = { color: colors.background };
  distributionSlide.addText('Phase Distribution Analysis', {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.6,
    fontSize: 32,
    bold: true,
    color: colors.primary,
  });

  const distributionData = [
    ['Phase', 'Progress %', 'Remaining %'],
    ...data.installationPhases.map(phase => [
      phase.title,
      `${phase.percentage}%`,
      `${100 - phase.percentage}%`
    ])
  ];

  distributionSlide.addTable(distributionData, {
    x: 0.5,
    y: 1.5,
    w: 9,
    h: 5,
    colW: [5, 2, 2],
    fontSize: 14,
    border: { type: 'solid', color: 'CCCCCC', pt: 1 },
    fill: { color: 'F2F2F2' },
    color: colors.text,
  });

  // Slide 6: Key Insights
  const insightsSlide = pptx.addSlide();
  insightsSlide.background = { color: colors.background };
  insightsSlide.addText('Key Insights & Recommendations', {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.6,
    fontSize: 32,
    bold: true,
    color: colors.primary,
  });

  const completedPhases = data.installationPhases.filter(p => p.percentage === 100).length;
  const inProgressPhases = data.installationPhases.filter(p => p.percentage >= 50 && p.percentage < 100).length;
  const earlyPhases = data.installationPhases.filter(p => p.percentage < 50).length;

  const insights = [
    `Overall Progress: ${data.cityData.overall}%`,
    `Completed Phases: ${completedPhases} out of ${data.installationPhases.length}`,
    `In Progress Phases: ${inProgressPhases}`,
    `Early Stage Phases: ${earlyPhases}`,
    `Highest Progress: ${Math.max(...data.installationPhases.map(p => p.percentage))}%`,
    `Lowest Progress: ${Math.min(...data.installationPhases.map(p => p.percentage))}%`,
  ];

  insights.forEach((insight, index) => {
    insightsSlide.addText(`• ${insight}`, {
      x: 0.8,
      y: 1.5 + (index * 0.8),
      w: 8.4,
      h: 0.6,
      fontSize: 18,
      color: colors.text,
      bullet: { type: 'number', code: '1.' },
    });
  });

  // Generate and download
  const fileName = `${data.cityName}_Installation_Progress_${new Date().toISOString().split('T')[0]}.pptx`;
  await pptx.writeFile({ fileName });
}

