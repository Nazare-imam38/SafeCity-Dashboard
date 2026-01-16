// Professional PowerPoint Export with All Charts and KPIs
// Creates proper PPTX file using JSZip to manually construct PowerPoint structure

import JSZip from 'jszip';
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

const COLORS = ['#4472C4', '#70AD47', '#FFC000', '#ED7D31', '#C00000', '#FFD966'];

// Icon SVG paths for each phase type
const ICON_PATHS: Record<string, string> = {
  surveys: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', // ClipboardCheck
  foundations: 'M3.75 21h16.5M4.5 3h15m-15 0v18m15-18v18M9 6.75h6m-6 3h6m-6 3h6', // Building2
  cabinet: 'M6.827 6.175a2.31 2.31 0 011.826 0l5.347 2.09a2.31 2.31 0 001.826 0V12a2.31 2.31 0 01-1.826 0l-5.347-2.09a2.31 2.31 0 00-1.826 0V6.175z M12 6.5v5.5', // Camera
  cable: 'M13 10V3L4 14h7v7l9-11h-7z', // Zap
  controlRoom: 'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25', // Home
  ppic3: 'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z', // Radio
};

// Convert image data URL to base64
function dataURLToBase64(dataURL: string): string {
  return dataURL.split(',')[1];
}

// Create chart images as base64
async function createChartImage(type: string, data: any, title: string): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 700;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Title
  ctx.fillStyle = '#2C3E50';
  ctx.font = 'bold 36px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(title, canvas.width / 2, 50);

  if (type === 'bar') {
    const chartArea = { x: 100, y: 120, width: 1000, height: 520 };
    const maxValue = Math.max(...data.map((d: any) => d.value));
    const barWidth = 120;
    const spacing = (chartArea.width - (data.length * barWidth)) / (data.length + 1);

    // Grid
    ctx.strokeStyle = '#E8E8E8';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = chartArea.y + (chartArea.height / 5) * i;
      ctx.beginPath();
      ctx.moveTo(chartArea.x, y);
      ctx.lineTo(chartArea.x + chartArea.width, y);
      ctx.stroke();
    }

    // Bars
    data.forEach((item: any, index: number) => {
      const barHeight = (item.value / maxValue) * chartArea.height;
      const x = chartArea.x + spacing + index * (barWidth + spacing);
      const y = chartArea.y + chartArea.height - barHeight;

      const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
      gradient.addColorStop(0, COLORS[index % COLORS.length]);
      gradient.addColorStop(1, COLORS[index % COLORS.length] + 'DD');
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth, barHeight);

      ctx.fillStyle = '#2C3E50';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${item.value}%`, x + barWidth / 2, y - 15);

      ctx.fillStyle = '#666666';
      ctx.font = '16px Arial';
      const label = item.label.length > 18 ? item.label.substring(0, 15) + '...' : item.label;
      ctx.fillText(label, x + barWidth / 2, chartArea.y + chartArea.height + 35);
    });

    // Axes
    ctx.strokeStyle = '#CCCCCC';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(chartArea.x, chartArea.y);
    ctx.lineTo(chartArea.x, chartArea.y + chartArea.height);
    ctx.lineTo(chartArea.x + chartArea.width, chartArea.y + chartArea.height);
    ctx.stroke();
  }

  if (type === 'pie') {
    const centerX = 500;
    const centerY = 400;
    const outerRadius = 250;
    const innerRadius = 150;
    let currentAngle = -Math.PI / 2;
    const total = data.reduce((sum: number, d: any) => sum + d.value, 0);

    data.forEach((item: any, index: number) => {
      const sliceAngle = (item.value / total) * 2 * Math.PI;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;

      ctx.fillStyle = COLORS[index % COLORS.length];
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
      ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 4;
      ctx.stroke();

      const labelAngle = startAngle + sliceAngle / 2;
      const labelRadius = (outerRadius + innerRadius) / 2;
      const labelX = centerX + labelRadius * Math.cos(labelAngle);
      const labelY = centerY + labelRadius * Math.sin(labelAngle);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${item.value}%`, labelX, labelY);

      currentAngle = endAngle;
    });

    // Legend
    let legendY = 200;
    data.forEach((item: any, index: number) => {
      ctx.fillStyle = COLORS[index % COLORS.length];
      ctx.fillRect(850, legendY, 30, 30);
      ctx.fillStyle = '#2C3E50';
      ctx.font = '18px Arial';
      ctx.textAlign = 'left';
      const label = item.label.length > 30 ? item.label.substring(0, 27) + '...' : item.label;
      ctx.fillText(label, 890, legendY + 22);
      ctx.fillStyle = COLORS[index % COLORS.length];
      ctx.font = 'bold 18px Arial';
      ctx.fillText(`${item.value}%`, 890, legendY + 45);
      legendY += 70;
    });
  }

  if (type === 'area') {
    const chartArea = { x: 100, y: 150, width: 1000, height: 480 };
    const maxValue = Math.max(...data.values);
    const pointSpacing = chartArea.width / (data.labels.length - 1);

    // Grid
    ctx.strokeStyle = '#E8E8E8';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = chartArea.y + (chartArea.height / 5) * i;
      ctx.beginPath();
      ctx.moveTo(chartArea.x, y);
      ctx.lineTo(chartArea.x + chartArea.width, y);
      ctx.stroke();
    }

    // Area
    const gradient = ctx.createLinearGradient(0, chartArea.y, 0, chartArea.y + chartArea.height);
    gradient.addColorStop(0, COLORS[0] + '80');
    gradient.addColorStop(1, COLORS[0] + '20');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(chartArea.x, chartArea.y + chartArea.height);
    data.values.forEach((value: number, index: number) => {
      const x = chartArea.x + index * pointSpacing;
      const y = chartArea.y + chartArea.height - (value / maxValue) * chartArea.height;
      if (index === 0) ctx.lineTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(chartArea.x + chartArea.width, chartArea.y + chartArea.height);
    ctx.closePath();
    ctx.fill();

    // Line
    ctx.strokeStyle = COLORS[0];
    ctx.lineWidth = 5;
    ctx.beginPath();
    data.values.forEach((value: number, index: number) => {
      const x = chartArea.x + index * pointSpacing;
      const y = chartArea.y + chartArea.height - (value / maxValue) * chartArea.height;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Points
    data.values.forEach((value: number, index: number) => {
      const x = chartArea.x + index * pointSpacing;
      const y = chartArea.y + chartArea.height - (value / maxValue) * chartArea.height;
      ctx.fillStyle = COLORS[0];
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // X-axis labels
    data.labels.forEach((label: string, index: number) => {
      const x = chartArea.x + index * pointSpacing;
      ctx.fillStyle = '#666666';
      ctx.font = '18px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(label, x, chartArea.y + chartArea.height + 35);
    });
  }

  return canvas.toDataURL('image/png', 1.0);
}

// Create KPI Cards with proper icons
async function createKPICards(data: ExportData): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = 1600;
  canvas.height = 500;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#2C3E50';
  ctx.font = 'bold 42px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Installation Phases Progress', canvas.width / 2, 50);

  const cardWidth = 240;
  const cardHeight = 380;
  const spacing = 20;
  const totalWidth = (data.installationPhases.length * cardWidth) + ((data.installationPhases.length - 1) * spacing);
  const startX = (canvas.width - totalWidth) / 2;
  const startY = 100;

  data.installationPhases.forEach((phase, index) => {
    const x = startX + index * (cardWidth + spacing);
    const y = startY;
    const iconPath = ICON_PATHS[phase.key] || ICON_PATHS.surveys;

    // Card shadow
    ctx.fillStyle = '#E0E0E0';
    ctx.fillRect(x + 4, y + 4, cardWidth, cardHeight);

    // Card background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x, y, cardWidth, cardHeight);
    ctx.strokeStyle = '#E0E0E0';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, cardWidth, cardHeight);

    // Colored top border
    ctx.fillStyle = COLORS[index % COLORS.length];
    ctx.fillRect(x, y, cardWidth, 6);

    // Icon background
    ctx.fillStyle = COLORS[index % COLORS.length] + '20';
    ctx.fillRect(x + 15, y + 20, 50, 50);
    ctx.strokeStyle = COLORS[index % COLORS.length];
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 15, y + 20, 50, 50);

    // Draw icon (simplified SVG path rendering)
    ctx.strokeStyle = COLORS[index % COLORS.length];
    ctx.fillStyle = COLORS[index % COLORS.length];
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Draw icon based on phase key
    const iconX = x + 40;
    const iconY = y + 45;
    const iconSize = 30;
    
    if (phase.key === 'surveys') {
      // Clipboard check icon
      ctx.strokeRect(iconX - 12, iconY - 12, 24, 30);
      ctx.beginPath();
      ctx.moveTo(iconX - 8, iconY - 8);
      ctx.lineTo(iconX - 8, iconY - 20);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(iconX - 4, iconY + 4);
      ctx.lineTo(iconX + 4, iconY + 8);
      ctx.lineTo(iconX + 12, iconY - 4);
      ctx.stroke();
    } else if (phase.key === 'foundations') {
      // Building icon
      ctx.fillRect(iconX - 15, iconY - 10, 30, 30);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(iconX - 10, iconY - 5, 8, 8);
      ctx.fillRect(iconX + 2, iconY - 5, 8, 8);
      ctx.fillRect(iconX - 10, iconY + 5, 8, 8);
      ctx.fillRect(iconX + 2, iconY + 5, 8, 8);
      ctx.fillStyle = COLORS[index % COLORS.length];
    } else if (phase.key === 'cabinet') {
      // Camera icon
      ctx.beginPath();
      ctx.arc(iconX, iconY, 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillRect(iconX - 8, iconY - 15, 16, 10);
    } else if (phase.key === 'cable') {
      // Lightning icon
      ctx.beginPath();
      ctx.moveTo(iconX - 8, iconY - 15);
      ctx.lineTo(iconX + 2, iconY);
      ctx.lineTo(iconX - 4, iconY);
      ctx.lineTo(iconX + 8, iconY + 15);
      ctx.lineTo(iconX - 2, iconY);
      ctx.lineTo(iconX + 4, iconY);
      ctx.closePath();
      ctx.fill();
    } else if (phase.key === 'controlRoom') {
      // Home icon
      ctx.beginPath();
      ctx.moveTo(iconX, iconY - 15);
      ctx.lineTo(iconX - 12, iconY - 5);
      ctx.lineTo(iconX - 12, iconY + 10);
      ctx.lineTo(iconX + 12, iconY + 10);
      ctx.lineTo(iconX + 12, iconY - 5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(iconX - 6, iconY, 12, 10);
      ctx.fillStyle = COLORS[index % COLORS.length];
    } else if (phase.key === 'ppic3') {
      // Radio/Wifi icon
      ctx.beginPath();
      ctx.arc(iconX, iconY, 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(iconX, iconY, 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(iconX, iconY, 16, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Percentage
    ctx.fillStyle = COLORS[index % COLORS.length];
    ctx.font = 'bold 56px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${phase.percentage}%`, x + cardWidth / 2, y + 180);

    // Title
    ctx.fillStyle = '#2C3E50';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    const words = phase.title.toUpperCase().split(' ');
    words.forEach((word, wordIdx) => {
      ctx.fillText(word, x + cardWidth / 2, y + 220 + wordIdx * 18);
    });

    // Status
    const status = phase.percentage === 100 ? 'Completed' : 
                   phase.percentage >= 80 ? 'Near Complete' : 
                   phase.percentage >= 50 ? 'In Progress' : 'Started';
    ctx.fillStyle = '#666666';
    ctx.font = '14px Arial';
    ctx.fillText(status, x + cardWidth / 2, y + 310);

    // Progress bar
    const barWidth = cardWidth - 60;
    const barHeight = 12;
    const barX = x + 30;
    const barY = y + 340;

    ctx.fillStyle = '#E0E0E0';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    const progressWidth = (phase.percentage / 100) * barWidth;
    const gradient = ctx.createLinearGradient(barX, barY, barX + progressWidth, barY);
    gradient.addColorStop(0, COLORS[index % COLORS.length]);
    gradient.addColorStop(1, COLORS[index % COLORS.length] + 'CC');
    ctx.fillStyle = gradient;
    ctx.fillRect(barX, barY, progressWidth, barHeight);
  });

  return canvas.toDataURL('image/png', 1.0);
}

// Create PPTX file structure
export async function exportDashboardToPPTX(data: ExportData) {
  try {
    const zip = new JSZip();

    // Generate all chart images
    const kpiCardsImage = await createKPICards(data);
    
    const barChartData = data.installationPhases.map(phase => ({
      label: phase.title,
      value: phase.percentage
    }));
    const barChartImage = await createChartImage('bar', barChartData, 'Phase Breakdown - Installation Progress by Phase');
    
    const pieChartData = data.installationPhases.map(phase => ({
      label: phase.title,
      value: phase.percentage
    }));
    const pieChartImage = await createChartImage('pie', pieChartData, 'Phase Distribution Analysis');

    let areaChartImage: string | null = null;
    if (data.cityData.timeline && data.cityData.timeline.length > 0) {
      const timelineData = {
        labels: data.cityData.timeline.map((t: any) => t.month),
        values: data.cityData.timeline.map((t: any) => t.overall)
      };
      areaChartImage = await createChartImage('area', timelineData, 'Monthly Progress Timeline');
    }

    // Convert images to base64
    const kpiBase64 = dataURLToBase64(kpiCardsImage);
    const barBase64 = dataURLToBase64(barChartImage);
    const pieBase64 = dataURLToBase64(pieChartImage);
    const areaBase64 = areaChartImage ? dataURLToBase64(areaChartImage) : null;

    // Create PPTX structure
    zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
<Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
<Override PartName="/ppt/slides/slide2.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
<Override PartName="/ppt/slides/slide3.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
<Override PartName="/ppt/slides/slide4.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
${areaBase64 ? '<Override PartName="/ppt/slides/slide5.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>' : ''}
${areaBase64 ? '<Override PartName="/ppt/slides/slide6.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>' : ''}
<Override PartName="/ppt/media/image1.png" ContentType="image/png"/>
<Override PartName="/ppt/media/image2.png" ContentType="image/png"/>
<Override PartName="/ppt/media/image3.png" ContentType="image/png"/>
${areaBase64 ? '<Override PartName="/ppt/media/image4.png" ContentType="image/png"/>' : ''}
</Types>`);

    // Create _rels folder
    const relsFolder = zip.folder('_rels');
    relsFolder?.file('.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`);

    // Create ppt folder structure
    const pptFolder = zip.folder('ppt');
    const slidesFolder = pptFolder?.folder('slides');
    const mediaFolder = pptFolder?.folder('media');
    const pptRelsFolder = pptFolder?.folder('_rels');
    const slidesRelsFolder = slidesFolder?.folder('_rels');

    // Add images
    mediaFolder?.file('image1.png', kpiBase64, { base64: true });
    mediaFolder?.file('image2.png', barBase64, { base64: true });
    mediaFolder?.file('image3.png', pieBase64, { base64: true });
    if (areaBase64) {
      mediaFolder?.file('image4.png', areaBase64, { base64: true });
    }

    // Create slide XMLs with embedded images
    const createSlideXML = (slideNum: number, title: string, imageNum: number, imageWidth: number = 9144000, imageHeight: number = 5143500) => {
      return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="9144000" cy="6858000"/><a:chOff x="0" y="0"/><a:chExt cx="9144000" cy="6858000"/></a:xfrm></p:grpSpPr>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="2" name="Title"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="title"/></p:nvPr></p:nvSpPr>
        <p:spPr/>
        <p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="en-US" sz="4400" b="1"><a:solidFill><a:srgbClr val="2C3E50"/></a:solidFill></a:rPr><a:t>${title}</a:t></a:r><a:endParaRPr lang="en-US"/></a:p></p:txBody>
      </p:sp>
      <p:pic>
        <p:nvPicPr><p:cNvPr id="${imageNum + 1}" name="Picture ${imageNum}"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr>
        <p:blipFill><a:blip r:embed="rId${imageNum + 1}"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>
        <p:spPr><a:xfrm><a:off x="457200" y="1828800"/><a:ext cx="${imageWidth}" cy="${imageHeight}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr>
      </p:pic>
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>`;
    };

    // Title slide
    slidesFolder?.file('slide1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="9144000" cy="6858000"/></a:xfrm></p:grpSpPr>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="2" name="Title"/><p:cNvSpPr/><p:nvPr><p:ph type="ctrTitle"/></p:nvPr></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="1828800" y="1828800"/><a:ext cx="5486400" cy="914400"/></a:xfrm></p:spPr>
        <p:txBody><a:bodyPr anchor="ctr"/><a:lstStyle/><a:p><a:r><a:rPr lang="en-US" sz="7200" b="1"><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill></a:rPr><a:t>${data.cityName}</a:t></a:r><a:endParaRPr lang="en-US"/></a:p></p:txBody>
      </p:sp>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="3" name="Subtitle"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="1828800" y="3048000"/><a:ext cx="5486400" cy="457200"/></a:xfrm></p:spPr>
        <p:txBody><a:bodyPr anchor="ctr"/><a:lstStyle/><a:p><a:r><a:rPr lang="en-US" sz="3600"><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill></a:rPr><a:t>Camera Installation Progress Dashboard</a:t></a:r><a:endParaRPr lang="en-US"/></a:p></p:txBody>
      </p:sp>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="4" name="Progress"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="1828800" y="3962400"/><a:ext cx="5486400" cy="914400"/></a:xfrm></p:spPr>
        <p:txBody><a:bodyPr anchor="ctr"/><a:lstStyle/><a:p><a:r><a:rPr lang="en-US" sz="5600" b="1"><a:solidFill><a:srgbClr val="FFD700"/></a:solidFill></a:rPr><a:t>Overall Progress: ${data.cityData.overall}%</a:t></a:r><a:endParaRPr lang="en-US"/></a:p></p:txBody>
      </p:sp>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="5" name="Authority"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="1828800" y="5181600"/><a:ext cx="5486400" cy="457200"/></a:xfrm></p:spPr>
        <p:txBody><a:bodyPr anchor="ctr"/><a:lstStyle/><a:p><a:r><a:rPr lang="en-US" sz="2800"><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill></a:rPr><a:t>Punjab Safe City Authority</a:t></a:r><a:endParaRPr lang="en-US"/></a:p></p:txBody>
      </p:sp>
    </p:spTree>
    <p:bg><p:bgPr><a:solidFill><a:srgbClr val="4472C4"/></a:solidFill></a:bgPr></p:bg>
  </p:cSld>
</p:sld>`);

    // KPI Cards slide
    slidesFolder?.file('slide2.xml', createSlideXML(2, 'Installation Phases Progress', 1));
    
    // Bar Chart slide
    slidesFolder?.file('slide3.xml', createSlideXML(3, 'Phase Breakdown Analysis', 2));
    
    // Pie Chart slide
    slidesFolder?.file('slide4.xml', createSlideXML(4, 'Phase Distribution Analysis', 3));

    let slideCount = 4;
    if (areaBase64) {
      slidesFolder?.file('slide5.xml', createSlideXML(5, 'Monthly Progress Timeline', 4));
      slideCount = 5;
    }

    // Insights slide
    const insights = generateInsights(data);
    slidesFolder?.file(`slide${slideCount + 1}.xml`, `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="9144000" cy="6858000"/></a:xfrm></p:grpSpPr>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="2" name="Title"/><p:cNvSpPr/><p:nvPr><p:ph type="title"/></p:nvPr></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="457200" y="457200"/><a:ext cx="8236800" cy="914400"/></a:xfrm></p:spPr>
        <p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="en-US" sz="4000" b="1"><a:solidFill><a:srgbClr val="2C3E50"/></a:solidFill></a:rPr><a:t>Key Insights &amp; Recommendations</a:t></a:r><a:endParaRPr lang="en-US"/></a:p></p:txBody>
      </p:sp>
      ${insights.map((insight, idx) => `
      <p:sp>
        <p:nvSpPr><p:cNvPr id="${idx + 3}" name="Insight ${idx + 1}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="914400" y="${1828800 + idx * 800000}"/><a:ext cx="7315200" cy="457200"/></a:xfrm></p:spPr>
        <p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="en-US" sz="2400"><a:solidFill><a:srgbClr val="2C3E50"/></a:solidFill></a:rPr><a:t>${insight}</a:t></a:r><a:endParaRPr lang="en-US"/></a:p></p:txBody>
      </p:sp>
      `).join('')}
    </p:spTree>
  </p:cSld>
</p:sld>`);

    // Create slide relationships
    for (let i = 1; i <= slideCount + 1; i++) {
      const slideRels: string[] = [
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`
      ];
      
      if (i === 2) slideRels.push('<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image1.png"/>');
      if (i === 3) slideRels.push('<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image2.png"/>');
      if (i === 4) slideRels.push('<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image3.png"/>');
      if (i === 5 && areaBase64) slideRels.push('<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image4.png"/>');
      
      slideRels.push('</Relationships>');
      slidesRelsFolder?.file(`slide${i}.xml.rels`, slideRels.join('\n'));
    }

    // Create presentation.xml
    pptFolder?.file('presentation.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst><p:sldMasterId r:id="rId1"/></p:sldMasterIdLst>
  <p:sldIdLst>
    <p:sldId id="256" r:id="rId1"/>
    <p:sldId id="257" r:id="rId2"/>
    <p:sldId id="258" r:id="rId3"/>
    <p:sldId id="259" r:id="rId4"/>
    ${areaBase64 ? '<p:sldId id="260" r:id="rId5"/>' : ''}
    <p:sldId id="261" r:id="rId${areaBase64 ? '6' : '5'}"/>
  </p:sldIdLst>
  <p:sldSz cx="9144000" cy="6858000" type="screen16x9"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>`);

    // Create presentation relationships
    pptRelsFolder?.file('presentation.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide1.xml"/>
<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide2.xml"/>
<Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide3.xml"/>
<Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide4.xml"/>
${areaBase64 ? '<Relationship Id="rId6" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide5.xml"/>' : ''}
<Relationship Id="rId${areaBase64 ? '7' : '6'}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${slideCount + 1}.xml"/>
</Relationships>`);

    // Create master slide (simplified)
    const slideMastersFolder = pptFolder?.folder('slideMasters');
    slideMastersFolder?.file('slideMaster1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="9144000" cy="6858000"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld>
  <p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
</p:sldMaster>`);

    // Generate and download PPTX
    const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const sanitizedName = data.cityName.replace(/[^a-zA-Z0-9]/g, '_');
    link.href = url;
    link.download = `${sanitizedName}_Installation_Progress_${new Date().toISOString().split('T')[0]}.pptx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Success - dialog will be shown by the calling component
  } catch (error) {
    console.error('Error exporting presentation:', error);
    throw error; // Re-throw so calling component can handle it
  }
}

function generateInsights(data: ExportData): string[] {
  const completedPhases = data.installationPhases.filter(p => p.percentage === 100).length;
  const inProgressPhases = data.installationPhases.filter(p => p.percentage >= 50 && p.percentage < 100).length;
  const earlyPhases = data.installationPhases.filter(p => p.percentage < 50).length;

  return [
    `Overall Progress: ${data.cityData.overall}% - ${data.cityData.overall >= 80 ? 'Excellent' : data.cityData.overall >= 60 ? 'Good' : 'Needs Improvement'}`,
    `Completed Phases: ${completedPhases} out of ${data.installationPhases.length} phases fully completed`,
    `In Progress Phases: ${inProgressPhases} phases actively under implementation`,
    `Early Stage Phases: ${earlyPhases} phases requiring attention and acceleration`,
    `Highest Progress Phase: ${Math.max(...data.installationPhases.map(p => p.percentage))}% - Leading phase performance`,
    `Lowest Progress Phase: ${Math.min(...data.installationPhases.map(p => p.percentage))}% - Requires immediate focus`,
  ];
}
