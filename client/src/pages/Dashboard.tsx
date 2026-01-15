import { Layout } from "@/components/layout/Layout";
import { KPICard } from "@/components/dashboard/KPICard";
import { CityMap } from "@/components/dashboard/CityMap";
import { IncidentList } from "@/components/dashboard/IncidentList";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { AlertCircle, Car, Users, Clock, Camera, Construction, Download, Moon, Sun } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useTheme } from "@/hooks/use-theme";
import pptxgen from "pptxgenjs";

const CITY_STATS: Record<string, any> = {
  lahore: {
    incidents: "124",
    responseTime: "08m 32s",
    traffic: "Moderate",
    construction: "8 Active",
    population: "1,240,000",
    cameras: "4,500"
  },
  rawalpindi: {
    incidents: "85",
    responseTime: "10m 15s",
    traffic: "Low",
    construction: "3 Active",
    population: "850,000",
    cameras: "2,100"
  },
  gujranwala: {
    incidents: "92",
    responseTime: "12m 45s",
    traffic: "High",
    construction: "5 Active",
    population: "750,000",
    cameras: "1,800"
  }
};

const PSCA_LOGO_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAOoAAADXCAMAAAAjrj0PAAABhlBMVEX///8nHHDuLiTpKSwAAAAvPB0AAGDuLCEFBwjtDwDnAADuMSf84eAjFm7sAADv7vP0Lx9CO3w9N3oXG3KUJVV6enrtGwr6MBoAAGP3tLFPH2kcLQAhFG4AAF4QJQCjo6PoGh4dLgApNxQWKQAUAGnpISQAGnYdDmz09PToCxEAHgDV1dUJIQAbC2wdHR2zs7PAwMC4u7Tn6OaHh4dSUlLKyspYYU1+hHf+8/MwKHNlZWUxMTHNzc2kqJ9yeWoAGQD61tbOzdq2tchzcJk3QyaTk5OQjqxZVIlKRICFgqWopr1ycnJnY5LY1+K+vc5GRkaMkoZiYmLwg4PrTk70qanxjo71qqvuZ2n3wsKIhadPWUMpKSlVXkr4zc3ucnLxYFrZLDN1Il/HKj6LJFkAEQCZnpT"; // Cleaned base64 string

export default function Dashboard() {
  const [selectedCity, setSelectedCity] = useState("lahore");
  const { theme, toggleTheme } = useTheme();
  const stats = CITY_STATS[selectedCity] || CITY_STATS.lahore;

  const handleDownloadPPT = () => {
    const pres = new pptxgen();
    // LAYOUT_16x9 = 10" width × 5.625" height
    pres.layout = "LAYOUT_16x9";
    
    // Define layout constants
    const SLIDE_WIDTH = 10;
    const SLIDE_HEIGHT = 5.625;
    const HEADER_HEIGHT = 0.5;
    const FOOTER_HEIGHT = 0.25;
    const CONTENT_START_Y = HEADER_HEIGHT; // 0.5
    const CONTENT_END_Y = SLIDE_HEIGHT - FOOTER_HEIGHT; // 5.375
    const CONTENT_HEIGHT = CONTENT_END_Y - CONTENT_START_Y; // 4.875
    
    // Master Slide / Theme - Properly positioned
    pres.defineSlideMaster({
      title: "PSCA_MASTER",
      background: { color: "FFFFFF" },
      objects: [
        // Header at top
        { rect: { x: 0, y: 0, w: "100%", h: HEADER_HEIGHT, fill: { color: "1A365D" } } },
        { text: { text: "PSCA SAFE CITY MONITORING SYSTEM", options: { x: 0.2, y: 0.1, w: 7.5, h: 0.3, color: "FFFFFF", fontSize: 14, bold: true, fontFace: "Arial" } } },
        { image: { x: 8.5, y: 0.05, w: 0.5, h: 0.4, data: PSCA_LOGO_BASE64 } },
        // Footer at bottom
        { rect: { x: 0, y: CONTENT_END_Y, w: "100%", h: FOOTER_HEIGHT, fill: { color: "E53E3E" } } },
        { text: { text: "Government of Punjab - Public Safety & Security", options: { x: 0.2, y: CONTENT_END_Y + 0.02, w: 5, h: 0.2, color: "FFFFFF", fontSize: 7 } } },
        { text: { text: "PSCA SAFE CITY PORTAL - CONFIDENTIAL", options: { x: 6.5, y: CONTENT_END_Y + 0.02, w: 3.3, h: 0.2, color: "FFFFFF", fontSize: 7, align: "right", bold: true } } }
      ]
    });

    // Helper function to create icon using shapes (no emojis for better compatibility)
    const createIcon = (slide: any, x: number, y: number, w: number, h: number, type: string, color: string) => {
      switch(type) {
        case "alert":
          // Alert triangle with exclamation
          slide.addShape(pres.ShapeType.triangle, { 
            x: x + w*0.15, y: y + h*0.05, w: w*0.7, h: h*0.7, 
            fill: { color }, 
            line: { color: "FFFFFF", width: 2 },
            rotate: 0
          });
          slide.addText("!", { 
            x: x, y: y + h*0.2, w, h: h*0.5, 
            fontSize: Math.round(w*3), bold: true, color: "FFFFFF", 
            align: "center", valign: "middle" 
          });
          break;
        case "clock":
          // Clock icon - circle with hands
          slide.addShape(pres.ShapeType.ellipse, { 
            x: x + w*0.1, y: y + h*0.1, w: w*0.8, h: h*0.8, 
            fill: { color }, 
            line: { color: "FFFFFF", width: 3 } 
          });
          // Clock hands
          slide.addShape(pres.ShapeType.line, { 
            x: x + w*0.5, y: y + h*0.3, w: 0, h: h*0.2, 
            line: { color: "FFFFFF", width: 2 } 
          });
          slide.addShape(pres.ShapeType.line, { 
            x: x + w*0.5, y: y + h*0.5, w: w*0.15, h: 0, 
            line: { color: "FFFFFF", width: 2 } 
          });
          break;
        case "construction":
          // Construction icon - warning sign with lines
          slide.addShape(pres.ShapeType.triangle, { 
            x: x + w*0.1, y: y + h*0.1, w: w*0.8, h: h*0.8, 
            fill: { color }, 
            line: { color: "FFFFFF", width: 2 },
            rotate: 0
          });
          // Diagonal lines
          slide.addShape(pres.ShapeType.line, { 
            x: x + w*0.2, y: y + h*0.3, w: w*0.6, h: h*0.4, 
            line: { color: "FFFFFF", width: 3 } 
          });
          slide.addShape(pres.ShapeType.line, { 
            x: x + w*0.2, y: y + h*0.7, w: w*0.6, h: -h*0.4, 
            line: { color: "FFFFFF", width: 3 } 
          });
          break;
        case "camera":
          // Camera icon - rounded rectangle with lens
          slide.addShape(pres.ShapeType.roundRect, { 
            x: x + w*0.15, y: y + h*0.2, w: w*0.7, h: h*0.6, 
            fill: { color }, 
            line: { color: "FFFFFF", width: 2 } 
          });
          // Camera lens
          slide.addShape(pres.ShapeType.ellipse, { 
            x: x + w*0.25, y: y + h*0.3, w: w*0.5, h: h*0.4, 
            fill: { color: "FFFFFF", transparency: 30 }, 
            line: { color: "FFFFFF", width: 2 } 
          });
          // Flash
          slide.addShape(pres.ShapeType.roundRect, { 
            x: x + w*0.65, y: y + h*0.15, w: w*0.2, h: h*0.15, 
            fill: { color: "FFFFFF" } 
          });
          break;
        case "traffic":
          // Traffic/Vehicle icon - car shape
          // Car body
          slide.addShape(pres.ShapeType.roundRect, { 
            x: x + w*0.1, y: y + h*0.35, w: w*0.8, h: h*0.4, 
            fill: { color }, 
            line: { color: "FFFFFF", width: 2 } 
          });
          // Car windows
          slide.addShape(pres.ShapeType.roundRect, { 
            x: x + w*0.2, y: y + h*0.4, w: w*0.25, h: h*0.25, 
            fill: { color: "FFFFFF", transparency: 40 } 
          });
          slide.addShape(pres.ShapeType.roundRect, { 
            x: x + w*0.55, y: y + h*0.4, w: w*0.25, h: h*0.25, 
            fill: { color: "FFFFFF", transparency: 40 } 
          });
          // Wheels
          slide.addShape(pres.ShapeType.ellipse, { 
            x: x + w*0.15, y: y + h*0.6, w: w*0.25, h: h*0.25, 
            fill: { color: "FFFFFF" } 
          });
          slide.addShape(pres.ShapeType.ellipse, { 
            x: x + w*0.6, y: y + h*0.6, w: w*0.25, h: h*0.25, 
            fill: { color: "FFFFFF" } 
          });
          break;
        default:
          slide.addShape(pres.ShapeType.roundRect, { 
            x: x + w*0.2, y: y + h*0.2, w: w*0.6, h: h*0.6, 
            fill: { color }, 
            line: { color: "FFFFFF", width: 2 } 
          });
      }
    };

    // SLIDE 1: Executive Summary - Properly positioned with layout constants
    const s1 = pres.addSlide({ masterName: "PSCA_MASTER" });
    
    // Title Section - Positioned after header
    const titleY = CONTENT_START_Y + 0.15; // 0.65
    s1.addText(`${selectedCity.toUpperCase()} METROPOLITAN - OPERATIONAL DASHBOARD`, { 
      x: 0.2, y: titleY, w: 7.5, h: 0.3, fontSize: 20, bold: true, color: "1A365D" 
    });
    s1.addText(`Real-Time Report | ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, {
      x: 0.2, y: titleY + 0.3, w: 7.5, h: 0.15, fontSize: 8, color: "666666"
    });
    
    // City Info Badge
    s1.addShape(pres.ShapeType.roundRect, {
      x: 8.0, y: titleY, w: 1.8, h: 0.45,
      fill: { color: "1A365D" },
      line: { color: "1A365D", width: 1 }
    });
    s1.addText("ZONE A-1", { x: 8.0, y: titleY + 0.05, w: 1.8, h: 0.2, fontSize: 9, bold: true, color: "FFFFFF", align: "center" });
    s1.addText("CENTRAL", { x: 8.0, y: titleY + 0.25, w: 1.8, h: 0.2, fontSize: 8, color: "FFFFFF", align: "center" });
    
    // KPI Cards - Properly Aligned
    const metrics = [
      { label: "Active Incidents", value: stats.incidents, color: "E53E3E", iconType: "alert", trend: "+12%", subtitle: "Live Alerts" },
      { label: "Avg Response Time", value: stats.responseTime, color: "2B6CB0", iconType: "clock", trend: "-5%", subtitle: "Improvement" },
      { label: "Traffic Index", value: stats.traffic, color: "F59E0B", iconType: "traffic", trend: "+2%", subtitle: "Current Status" },
      { label: "Construction Sites", value: stats.construction, color: "DD6B20", iconType: "construction", trend: "+15%", subtitle: "Active Projects" },
      { label: "CCTV Cameras", value: stats.cameras, color: "38A169", iconType: "camera", trend: "+0.2%", subtitle: "Online Status" }
    ];

    // Calculate card dimensions and spacing
    const cardW = 2.8;
    const cardH = 1.4;
    const cardGap = 0.2;
    const row1Y = titleY + 0.6; // 1.25
    const totalWidth = (cardW * 3) + (cardGap * 2);
    const leftMargin = (SLIDE_WIDTH - totalWidth) / 2;
    
    // Row 1: First 3 cards - Centered
    metrics.slice(0, 3).forEach((m, i) => {
      const xPos = leftMargin + (i * (cardW + cardGap));
      
      // Card
      s1.addShape(pres.ShapeType.roundRect, { 
        x: xPos, y: row1Y, w: cardW, h: cardH, 
        fill: { color: "FFFFFF" }, 
        line: { color: m.color, width: 2.5 },
        shadow: { type: "outer", angle: 45, blur: 5, offset: 2, color: "000000", opacity: 0.1 }
      });
      
      // Icon
      const iconSize = 0.35;
      const iconX = xPos + 0.12;
      const iconY = row1Y + 0.2;
      s1.addShape(pres.ShapeType.ellipse, {
        x: iconX - 0.02, y: iconY - 0.02, w: iconSize + 0.04, h: iconSize + 0.04,
        fill: { color: m.color, transparency: 10 }
      });
      createIcon(s1, iconX, iconY, iconSize, iconSize, m.iconType, m.color);
      
      // Label & Subtitle
      s1.addText(m.label.toUpperCase(), { 
        x: xPos + 0.55, y: row1Y + 0.2, w: cardW - 0.6, h: 0.18, 
        fontSize: 8, bold: true, color: "1A365D", align: "left" 
      });
      s1.addText(m.subtitle, {
        x: xPos + 0.55, y: row1Y + 0.38, w: cardW - 0.6, h: 0.12,
        fontSize: 6.5, color: "666666", align: "left"
      });
      
      // Value
      s1.addText(m.value, { 
        x: xPos + 0.12, y: row1Y + 0.6, w: cardW - 0.24, h: 0.5, 
        fontSize: 24, bold: true, color: m.color, align: "center", valign: "middle"
      });
      
      // Trend
      const trendSymbol = m.trend.startsWith("+") ? "↑" : "↓";
      const trendColor = m.trend.startsWith("+") ? (m.color === "E53E3E" ? "E53E3E" : "38A169") : "38A169";
      s1.addText(`${trendSymbol} ${m.trend}`, { 
        x: xPos + 0.12, y: row1Y + 1.1, w: cardW - 0.24, h: 0.18, 
        fontSize: 9, bold: true, color: trendColor, align: "center" 
      });
    });

    // Row 2: Last 2 cards - Centered
    const row2Y = row1Y + cardH + 0.3; // 2.95
    const row2TotalWidth = (cardW * 2) + cardGap;
    const row2LeftMargin = (SLIDE_WIDTH - row2TotalWidth) / 2;
    
    metrics.slice(3).forEach((m, i) => {
      const xPos = row2LeftMargin + (i * (cardW + cardGap));
      
      s1.addShape(pres.ShapeType.roundRect, { 
        x: xPos, y: row2Y, w: cardW, h: cardH, 
        fill: { color: "FFFFFF" }, 
        line: { color: m.color, width: 2.5 },
        shadow: { type: "outer", angle: 45, blur: 5, offset: 2, color: "000000", opacity: 0.1 }
      });
      
      const iconSize = 0.35;
      const iconX = xPos + 0.12;
      const iconY = row2Y + 0.2;
      s1.addShape(pres.ShapeType.ellipse, {
        x: iconX - 0.02, y: iconY - 0.02, w: iconSize + 0.04, h: iconSize + 0.04,
        fill: { color: m.color, transparency: 10 }
      });
      createIcon(s1, iconX, iconY, iconSize, iconSize, m.iconType, m.color);
      
      s1.addText(m.label.toUpperCase(), { 
        x: xPos + 0.55, y: row2Y + 0.2, w: cardW - 0.6, h: 0.18, 
        fontSize: 8, bold: true, color: "1A365D", align: "left" 
      });
      s1.addText(m.subtitle, {
        x: xPos + 0.55, y: row2Y + 0.38, w: cardW - 0.6, h: 0.12,
        fontSize: 6.5, color: "666666", align: "left"
      });
      
      s1.addText(m.value, { 
        x: xPos + 0.12, y: row2Y + 0.6, w: cardW - 0.24, h: 0.5, 
        fontSize: 24, bold: true, color: m.color, align: "center", valign: "middle"
      });
      
      const trendSymbol = m.trend.startsWith("+") ? "↑" : "↓";
      const trendColor = m.trend.startsWith("+") ? (m.color === "E53E3E" ? "E53E3E" : "38A169") : "38A169";
      s1.addText(`${trendSymbol} ${m.trend}`, { 
        x: xPos + 0.12, y: row2Y + 1.1, w: cardW - 0.24, h: 0.18, 
        fontSize: 9, bold: true, color: trendColor, align: "center" 
      });
    });

    // Bottom Stats Bar - Above footer
    const statsBarY = CONTENT_END_Y - 0.2; // 5.175
    s1.addShape(pres.ShapeType.roundRect, {
      x: 0.2, y: statsBarY, w: 9.6, h: 0.15,
      fill: { color: "F0F4F8" },
      line: { color: "CBD5E0", width: 1 }
    });
    s1.addText(`Population: ${stats.population} | Coverage: 450 km² | Updated: ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`, {
      x: 0.3, y: statsBarY + 0.02, w: 9.4, h: 0.12,
      fontSize: 7, color: "4A5568", align: "center"
    });

    // SLIDE 2: Infrastructure Development & Trends - Using layout constants
    const s2 = pres.addSlide({ masterName: "PSCA_MASTER" });
    
    const slide2TitleY = CONTENT_START_Y + 0.15; // 0.65
    s2.addText("INFRASTRUCTURE DEVELOPMENT & OPERATIONAL TRENDS", { 
      x: 0.2, y: slide2TitleY, w: 9.6, h: 0.25, fontSize: 16, bold: true, color: "1A365D" 
    });
    s2.addText("Project Status & Weekly Performance Analysis", {
      x: 0.2, y: slide2TitleY + 0.25, w: 9.6, h: 0.15, fontSize: 8, color: "666666"
    });
    
    const chartData = [
      { name: "Surveys", value: 100, status: "Completed" },
      { name: "Foundation", value: 85, status: "In Progress" },
      { name: "Cabinet", value: 95, status: "Near Complete" },
      { name: "Cabling", value: 70, status: "In Progress" },
      { name: "Control Room", value: 40, status: "Active" }
    ];

    // Charts positioned properly
    const chartStartY = slide2TitleY + 0.5; // 1.15
    const chartHeight = CONTENT_END_Y - chartStartY - 0.4; // ~3.8
    
    // Left Chart - Infrastructure Progress
    s2.addChart(pres.ChartType.bar, [
      { name: "Phase Progress", labels: chartData.map(d => d.name), values: chartData.map(d => d.value) }
    ], { 
      x: 0.2, y: chartStartY, w: 4.3, h: chartHeight,
      showValue: false,
      barGapWidthPct: 50,
      chartColors: ["1A365D"],
      valAxisMaxVal: 110,
      showLegend: false,
      title: "Infrastructure Progress (%)",
      titleFontSize: 10,
      titleColor: "1A365D",
      catAxisMaxVal: chartData.length + 0.5
    });

    // Status indicators
    chartData.forEach((item, i) => {
      const yPos = chartStartY + 0.1 + (i * (chartHeight / chartData.length));
      const statusColor = item.value === 100 ? "38A169" : item.value >= 80 ? "2B6CB0" : "F59E0B";
      s2.addShape(pres.ShapeType.ellipse, {
        x: 4.6, y: yPos, w: 0.1, h: 0.1,
        fill: { color: statusColor }
      });
      s2.addText(`${item.name}: ${item.value}%`, {
        x: 4.75, y: yPos - 0.02, w: 2.0, h: 0.15,
        fontSize: 7.5, color: "4A5568"
      });
    });

    // Right Chart - Weekly Incident Trend
    s2.addChart(pres.ChartType.line, [
      { name: "Daily Incidents", labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], values: [120, 150, 110, 180, 140, 95, 105] }
    ], { 
      x: 5.0, y: chartStartY, w: 4.8, h: chartHeight,
      showLegend: true,
      chartColors: ["E53E3E"],
      title: "Weekly Incident Trend",
      titleFontSize: 10,
      titleColor: "1A365D",
      showValue: true,
      valAxisMaxVal: 200
    });

    // Summary Box - Above footer
    const summaryY = CONTENT_END_Y - 0.3;
    s2.addShape(pres.ShapeType.roundRect, {
      x: 0.2, y: summaryY, w: 9.6, h: 0.25,
      fill: { color: "1A365D" },
      line: { color: "1A365D", width: 1 }
    });
    s2.addText("KEY INSIGHTS", {
      x: 0.3, y: summaryY + 0.02, w: 1.0, h: 0.2,
      fontSize: 9, bold: true, color: "FFFFFF"
    });
    s2.addText("Infrastructure: 78% Complete | Peak: Thu (180 incidents) | Daily Avg: 128 | Efficiency: 92%", {
      x: 1.4, y: summaryY + 0.02, w: 8.2, h: 0.2,
      fontSize: 7.5, color: "FFFFFF"
    });

    // SLIDE 3: Resource Allocation - Using layout constants
    const s3 = pres.addSlide({ masterName: "PSCA_MASTER" });
    
    const slide3TitleY = CONTENT_START_Y + 0.15; // 0.65
    s3.addText("RESOURCE ALLOCATION & PERSONNEL MANAGEMENT", { 
      x: 0.2, y: slide3TitleY, w: 9.6, h: 0.25, fontSize: 16, bold: true, color: "1A365D" 
    });
    s3.addText("Departmental Distribution & Operational Readiness", {
      x: 0.2, y: slide3TitleY + 0.25, w: 9.6, h: 0.15, fontSize: 8, color: "666666"
    });
    
    const contentStartY = slide3TitleY + 0.5; // 1.15
    const contentHeight = CONTENT_END_Y - contentStartY - 0.3; // ~3.9
    
    // Pie Chart - Left Side
    s3.addChart(pres.ChartType.pie, [
      { name: "Personnel Distribution", labels: ["Dolphin Force", "Traffic Police", "PRU Units", "Admin Staff"], values: [40, 30, 20, 10] }
    ], {
      x: 0.2, y: contentStartY, w: 4.0, h: contentHeight,
      showLegend: true,
      legendPos: "b",
      showValue: true,
      chartColors: ["1A365D", "2B6CB0", "4A5568", "E53E3E"],
      title: "Personnel Allocation (%)",
      titleFontSize: 10,
      titleColor: "1A365D"
    });

    // Right Side - Unit Status Cards
    s3.addText("OPERATIONAL UNITS STATUS", {
      x: 4.5, y: contentStartY, w: 5.3, h: 0.2,
      fontSize: 10, bold: true, color: "1A365D"
    });

    const units = [
      { name: "Dolphin Force", active: 450, total: 500, color: "1A365D" },
      { name: "Traffic Police", active: 820, total: 900, color: "2B6CB0" },
      { name: "PRU Units", active: 115, total: 120, color: "4A5568" },
      { name: "Emergency Response", active: 45, total: 50, color: "E53E3E" }
    ];

    const unitCardHeight = (contentHeight - 0.2) / units.length;
    units.forEach((unit, i) => {
      const yPos = contentStartY + 0.25 + (i * unitCardHeight);
      const percentage = Math.round((unit.active / unit.total) * 100);
      
      s3.addShape(pres.ShapeType.roundRect, {
        x: 4.5, y: yPos, w: 5.3, h: unitCardHeight - 0.05,
        fill: { color: "FFFFFF" },
        line: { color: unit.color, width: 2 },
        shadow: { type: "outer", angle: 45, blur: 4, offset: 1, color: "000000", opacity: 0.08 }
      });
      
      s3.addShape(pres.ShapeType.roundRect, {
        x: 4.5, y: yPos, w: 0.1, h: unitCardHeight - 0.05,
        fill: { color: unit.color }
      });
      
      s3.addText(unit.name, {
        x: 4.65, y: yPos + 0.05, w: 3.5, h: 0.18,
        fontSize: 9, bold: true, color: "1A365D"
      });
      
      s3.addText(`${unit.active}/${unit.total} Active`, {
        x: 4.65, y: yPos + 0.23, w: 2.5, h: 0.12,
        fontSize: 7.5, color: "666666"
      });
      
      s3.addShape(pres.ShapeType.roundRect, {
        x: 4.65, y: yPos + 0.38, w: 3.2, h: 0.1,
        fill: { color: "E2E8F0" }
      });
      s3.addShape(pres.ShapeType.roundRect, {
        x: 4.65, y: yPos + 0.38, w: (3.2 * percentage) / 100, h: 0.1,
        fill: { color: unit.color }
      });
      
      s3.addText(`${percentage}%`, {
        x: 7.9, y: yPos + 0.35, w: 1.8, h: 0.18,
        fontSize: 8.5, bold: true, color: unit.color, align: "right"
      });
    });

    // Bottom Summary
    const summary3Y = CONTENT_END_Y - 0.25;
    s3.addShape(pres.ShapeType.roundRect, {
      x: 0.2, y: summary3Y, w: 9.6, h: 0.2,
      fill: { color: "F0F4F8" },
      line: { color: "CBD5E0", width: 1 }
    });
    s3.addText("TOTAL: 1,430 Units | AVAILABILITY: 94.2% | STATUS: OPERATIONAL", {
      x: 0.3, y: summary3Y + 0.02, w: 9.4, h: 0.16,
      fontSize: 8.5, bold: true, color: "1A365D", align: "center"
    });

    // SLIDE 4: Live Incident Monitoring - Using layout constants
    const s4 = pres.addSlide({ masterName: "PSCA_MASTER" });
    
    const slide4TitleY = CONTENT_START_Y + 0.15; // 0.65
    s4.addText("LIVE INCIDENT MONITORING & RESPONSE STATUS", { 
      x: 0.2, y: slide4TitleY, w: 9.6, h: 0.25, fontSize: 16, bold: true, color: "1A365D" 
    });
    s4.addText("Real-Time Alert Management System", {
      x: 0.2, y: slide4TitleY + 0.25, w: 9.6, h: 0.15, fontSize: 8, color: "666666"
    });

    const tableStartY = slide4TitleY + 0.5; // 1.15
    const tableHeight = CONTENT_END_Y - tableStartY - 0.3; // ~3.9
    
    // Header Row
    s4.addShape(pres.ShapeType.roundRect, {
      x: 0.2, y: tableStartY, w: 9.6, h: 0.25,
      fill: { color: "1A365D" },
      line: { color: "1A365D", width: 1 }
    });
    s4.addText("TYPE", { x: 0.3, y: tableStartY + 0.05, w: 2.0, h: 0.15, fontSize: 8.5, bold: true, color: "FFFFFF" });
    s4.addText("LOCATION", { x: 2.4, y: tableStartY + 0.05, w: 2.8, h: 0.15, fontSize: 8.5, bold: true, color: "FFFFFF" });
    s4.addText("TIME", { x: 5.3, y: tableStartY + 0.05, w: 1.0, h: 0.15, fontSize: 8.5, bold: true, color: "FFFFFF", align: "center" });
    s4.addText("PRIORITY", { x: 6.4, y: tableStartY + 0.05, w: 1.3, h: 0.15, fontSize: 8.5, bold: true, color: "FFFFFF", align: "center" });
    s4.addText("STATUS", { x: 7.8, y: tableStartY + 0.05, w: 1.8, h: 0.15, fontSize: 8.5, bold: true, color: "FFFFFF", align: "center" });

    const incidents = [
      { type: "Traffic Accident", location: "Mall Road Junction", time: "2m", priority: "High", status: "Responding" },
      { type: "Crowd Management", location: "Liberty Market", time: "5m", priority: "Medium", status: "Monitoring" },
      { type: "Emergency Response", location: "General Hospital", time: "12m", priority: "Critical", status: "Active" },
      { type: "Traffic Congestion", location: "Canal Bank Road", time: "15m", priority: "Low", status: "Resolved" },
      { type: "Security Alert", location: "Gaddafi Stadium", time: "22m", priority: "Medium", status: "Patrolling" },
      { type: "Fire Emergency", location: "Ferozepur Road", time: "30m", priority: "High", status: "Resolved" }
    ];

    const rowHeight = (tableHeight - 0.25) / incidents.length;
    incidents.forEach((inc, i) => {
      const yPos = tableStartY + 0.25 + (i * rowHeight);
      const priorityColor = inc.priority === "Critical" ? "E53E3E" : inc.priority === "High" ? "F59E0B" : inc.priority === "Medium" ? "2B6CB0" : "38A169";
      const bgColor = i % 2 === 0 ? "FFFFFF" : "F8F9FA";
      
      s4.addShape(pres.ShapeType.roundRect, {
        x: 0.2, y: yPos, w: 9.6, h: rowHeight - 0.02,
        fill: { color: bgColor },
        line: { color: "E2E8F0", width: 0.5 }
      });
      
      s4.addShape(pres.ShapeType.roundRect, {
        x: 0.2, y: yPos, w: 0.08, h: rowHeight - 0.02,
        fill: { color: priorityColor }
      });
      
      s4.addText(inc.type, { 
        x: 0.3, y: yPos + 0.05, w: 2.0, h: rowHeight - 0.1, 
        fontSize: 8.5, bold: true, color: "1A365D" 
      });
      
      s4.addText(inc.location, { 
        x: 2.4, y: yPos + 0.05, w: 2.8, h: rowHeight - 0.1, 
        fontSize: 7.5, color: "4A5568" 
      });
      
      s4.addText(inc.time, { 
        x: 5.3, y: yPos + 0.08, w: 1.0, h: rowHeight - 0.16, 
        fontSize: 7.5, color: "666666", align: "center" 
      });
      
      s4.addShape(pres.ShapeType.roundRect, {
        x: 6.4, y: yPos + 0.06, w: 1.3, h: rowHeight - 0.12,
        fill: { color: priorityColor }
      });
      s4.addText(inc.priority.toUpperCase(), { 
        x: 6.4, y: yPos + 0.08, w: 1.3, h: rowHeight - 0.16, 
        fontSize: 6.5, bold: true, color: "FFFFFF", align: "center" 
      });
      
      const statusColor = inc.status === "Resolved" ? "38A169" : inc.status === "Active" ? "E53E3E" : "2B6CB0";
      s4.addText(inc.status, { 
        x: 7.8, y: yPos + 0.08, w: 1.8, h: rowHeight - 0.16, 
        fontSize: 7.5, bold: true, color: statusColor, align: "center" 
      });
    });

    // Summary Footer
    const summary4Y = CONTENT_END_Y - 0.25;
    s4.addShape(pres.ShapeType.roundRect, {
      x: 0.2, y: summary4Y, w: 9.6, h: 0.2,
      fill: { color: "F0F4F8" },
      line: { color: "CBD5E0", width: 1 }
    });
    s4.addText(`ACTIVE: ${incidents.filter(i => i.status !== "Resolved").length} | RESPONSE RATE: 94% | AVG TIME: ${stats.responseTime}`, {
      x: 0.3, y: summary4Y + 0.02, w: 9.4, h: 0.16,
      fontSize: 8.5, bold: true, color: "1A365D", align: "center"
    });

    // SLIDE 5: Daily Trend Analysis - Using layout constants
    const s5 = pres.addSlide({ masterName: "PSCA_MASTER" });
    
    const slide5TitleY = CONTENT_START_Y + 0.15; // 0.65
    s5.addText("DAILY TREND ANALYSIS & PERFORMANCE METRICS", { 
      x: 0.2, y: slide5TitleY, w: 9.6, h: 0.25, fontSize: 16, bold: true, color: "1A365D" 
    });
    s5.addText("24-Hour Operational Correlation Analysis", {
      x: 0.2, y: slide5TitleY + 0.25, w: 9.6, h: 0.15, fontSize: 8, color: "666666"
    });

    const trendData = [
      { time: "00:00", incidents: 12, traffic: 45 },
      { time: "04:00", incidents: 8, traffic: 20 },
      { time: "08:00", incidents: 34, traffic: 120 },
      { time: "12:00", incidents: 45, traffic: 150 },
      { time: "16:00", incidents: 52, traffic: 180 },
      { time: "20:00", incidents: 38, traffic: 110 },
      { time: "23:59", incidents: 25, traffic: 60 }
    ];

    const chart5StartY = slide5TitleY + 0.5; // 1.15
    const chart5Height = 2.5;
    
    // Main Chart
    s5.addChart(pres.ChartType.line, [
      { name: "Traffic Volume", labels: trendData.map(d => d.time), values: trendData.map(d => d.traffic) },
      { name: "Incidents", labels: trendData.map(d => d.time), values: trendData.map(d => d.incidents) }
    ], {
      x: 0.2, y: chart5StartY, w: 9.6, h: chart5Height,
      showLegend: true,
      chartColors: ["1A365D", "E53E3E"],
      title: "Traffic vs Incidents (24 Hours)",
      titleFontSize: 10,
      titleColor: "1A365D",
      showValue: true,
      valAxisMaxVal: 220
    });

    // Key Metrics Boxes
    const peakTraffic = Math.max(...trendData.map(d => d.traffic));
    const peakIncidents = Math.max(...trendData.map(d => d.incidents));
    const avgTraffic = Math.round(trendData.reduce((sum, d) => sum + d.traffic, 0) / trendData.length);
    const avgIncidents = Math.round(trendData.reduce((sum, d) => sum + d.incidents, 0) / trendData.length);

    const trendMetrics = [
      { label: "Peak Traffic", value: `${peakTraffic}`, unit: "units", time: "4:00 PM", color: "1A365D" },
      { label: "Peak Incidents", value: `${peakIncidents}`, unit: "cases", time: "4:00 PM", color: "E53E3E" },
      { label: "Avg Traffic", value: `${avgTraffic}`, unit: "units", time: "24h", color: "2B6CB0" },
      { label: "Avg Incidents", value: `${avgIncidents}`, unit: "cases", time: "24h", color: "F59E0B" }
    ];

    const metricsY = chart5StartY + chart5Height + 0.15; // 3.8
    const metricW = 2.2;
    const metricGap = 0.2;
    const totalMetricsWidth = (metricW * 4) + (metricGap * 3);
    const metricsLeftMargin = (SLIDE_WIDTH - totalMetricsWidth) / 2;

    trendMetrics.forEach((metric, i) => {
      const xPos = metricsLeftMargin + (i * (metricW + metricGap));
      s5.addShape(pres.ShapeType.roundRect, {
        x: xPos, y: metricsY, w: metricW, h: 0.45,
        fill: { color: "FFFFFF" },
        line: { color: metric.color, width: 2 },
        shadow: { type: "outer", angle: 45, blur: 4, offset: 1, color: "000000", opacity: 0.08 }
      });
      
      s5.addText(metric.label, {
        x: xPos + 0.1, y: metricsY + 0.05, w: metricW - 0.2, h: 0.12,
        fontSize: 7.5, bold: true, color: "4A5568"
      });
      
      s5.addText(`${metric.value} ${metric.unit}`, {
        x: xPos + 0.1, y: metricsY + 0.17, w: metricW - 0.2, h: 0.18,
        fontSize: 11, bold: true, color: metric.color
      });
      
      s5.addText(metric.time, {
        x: xPos + 0.1, y: metricsY + 0.35, w: metricW - 0.2, h: 0.1,
        fontSize: 6.5, color: "666666"
      });
    });

    // Insights Box - Above footer
    const insightsY = CONTENT_END_Y - 0.35;
    s5.addShape(pres.ShapeType.roundRect, {
      x: 0.2, y: insightsY, w: 9.6, h: 0.3,
      fill: { color: "FFF4E6" },
      line: { color: "F59E0B", width: 2 }
    });
    s5.addText("KEY INSIGHTS", {
      x: 0.3, y: insightsY + 0.05, w: 1.2, h: 0.2,
      fontSize: 9, bold: true, color: "1A365D"
    });
    s5.addText("Strong correlation: Traffic ↑ = Incidents ↑ | Peak hours: 12PM-8PM need enhanced monitoring | Low activity: 12AM-6AM allows resource reallocation", {
      x: 1.6, y: insightsY + 0.05, w: 8.0, h: 0.2,
      fontSize: 7.5, color: "4A5568"
    });

    pres.writeFile({ fileName: `PSCA_${selectedCity}_Operational_Brief.pptx` });
  };

  return (
    <Layout title="City Control Center">
      <div className="flex flex-col gap-6">
        {/* Top Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-4 rounded-xl border border-primary/10 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold font-heading capitalize">{selectedCity} Metropolitan</h2>
              <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">Zone A-1 (Central)</Badge>
            </div>
            <p className="text-sm text-muted-foreground">Monitoring active for {stats.population} residents • {stats.cameras} active cameras</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full w-9 h-9 border-primary/20"
              onClick={() => toggleTheme()}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadPPT} className="bg-secondary/10 text-secondary border-secondary/20 font-bold hover:bg-secondary hover:text-white transition-all shadow-sm">
              <Download className="mr-2 h-4 w-4" /> Export Operations PPT
            </Button>
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="w-[140px] h-9 border-primary/20 font-bold tracking-wider">
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lahore">Lahore</SelectItem>
                <SelectItem value="rawalpindi">Rawalpindi</SelectItem>
                <SelectItem value="gujranwala">Gujranwala</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <KPICard 
            title="Active Incidents" 
            value={stats.incidents}
            trend={12} 
            icon={AlertCircle} 
            className="border-b-4 border-b-destructive hover:shadow-lg transition-all"
          />
          <KPICard 
            title="Avg Response" 
            value={stats.responseTime}
            trend={-5} 
            trendLabel="improvement"
            icon={Clock}
            className="border-b-4 border-b-emerald-500 hover:shadow-lg transition-all"
          />
          <KPICard 
            title="Traffic Index" 
            value={stats.traffic}
            trend={2} 
            icon={Car}
            className="border-b-4 border-b-orange-500 hover:shadow-lg transition-all"
          />
          <KPICard 
            title="Construction" 
            value={stats.construction}
            trend={15} 
            icon={Construction}
            className="border-b-4 border-b-secondary hover:shadow-lg transition-all"
          />
          <KPICard 
            title="Uptime (CCTV)" 
            value="98.4%" 
            trend={0.2} 
            icon={Camera}
            className="border-b-4 border-b-blue-500 hover:shadow-lg transition-all"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Map & Chart Section */}
          <div className="lg:col-span-8 space-y-6">
            <CityMap city={selectedCity} />
            <TrendChart />
          </div>
          
          {/* Side Panels */}
          <div className="lg:col-span-4 space-y-6">
            <IncidentList />
            
            {/* Quick Actions / System Health */}
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Patrol Status
              </h3>
              <div className="space-y-4">
                 {[
                   { name: "Dolphin Force", active: 450, total: 500 },
                   { name: "Traffic Police", active: 820, total: 900 },
                   { name: "Emergency Units", active: 115, total: 120 },
                 ].map((unit) => (
                   <div key={unit.name} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium">{unit.name}</span>
                        <span className="font-mono text-[10px]">{unit.active}/{unit.total}</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-secondary transition-all duration-1000" 
                          style={{ width: `${(unit.active/unit.total)*100}%` }}
                        />
                      </div>
                   </div>
                 ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}