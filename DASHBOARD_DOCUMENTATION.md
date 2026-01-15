# SafeCity Dashboard - Complete Page Documentation

## Overview
This is a TypeScript-based dashboard application for Punjab Safe City Authority (PSCA) that tracks camera installation progress across multiple cities in Punjab, Pakistan.

---

## 📄 Page 1: Dashboard (`/` - Main Page)

### **Purpose**
Primary dashboard for monitoring camera installation progress across Punjab cities with real-time updates and comprehensive analytics.

### **Charts & Visualizations**

#### 1. **Installation Phase Cards (6 Cards)**
- **Type**: Progress Cards with Progress Bars
- **Implementation**: Custom `InstallationCard` component
- **Function**: 
  - Displays 6 installation phases: Surveys, Foundations, Cabinet, Cable, Control Room, PPIC3
  - Shows percentage completion for each phase
  - Color-coded by phase (Blue, Green, Orange, Purple, Red, Yellow)
  - Updates dynamically when city is selected
- **Data Source**: `CITY_INSTALLATION_DATA[selectedCity]`

#### 2. **Overall Progress Card**
- **Type**: Large Progress Card with Gradient
- **Implementation**: Custom Card component with progress bar
- **Function**:
  - Shows combined installation progress across all phases
  - Displays large percentage (6xl font)
  - Animated progress bar with shimmer effect
  - Status indicator (Completed, Near Completion, In Progress, Early Stage)

#### 3. **Installation Progress Map**
- **Type**: Interactive Leaflet Map
- **Implementation**: `InstallationMap` component using `react-leaflet`
- **Function**:
  - Shows all 10 Punjab cities on map
  - Color-coded markers based on progress (Green: 80-100%, Blue: 60-79%, Orange: 40-59%, Red: 0-39%)
  - Click markers to select city
  - Highlights selected city with circle
  - Popups show city name, progress percentage, and progress bar
- **Libraries**: `react-leaflet`, `leaflet`

#### 4. **Installation Progress Timeline Chart**
- **Type**: Area Chart (Dual Series)
- **Implementation**: `TrendChart` component using `recharts`
- **Function**:
  - Shows monthly progress over last 6 months (Jan-Jun)
  - Two series: Overall progress (solid line) and Surveys (dashed line)
  - Gradient fills for visual appeal
  - Updates based on selected city
- **Library**: `recharts` (AreaChart, Area)
- **Data**: `cityData.timeline` array

#### 5. **Phase Breakdown Chart**
- **Type**: Vertical Bar Chart
- **Implementation**: `PhaseBreakdownChart` component using `recharts`
- **Function**:
  - Shows installation progress for each phase as bars
  - Color-coded bars matching phase colors
  - Rotated labels for readability
  - Tooltips show exact percentages
- **Library**: `recharts` (BarChart, Bar)
- **Data**: Current city's phase percentages

#### 6. **City Comparison Chart**
- **Type**: Vertical Bar Chart
- **Implementation**: `CityComparisonChart` component using `recharts`
- **Function**:
  - Compares overall progress across all 10 cities
  - Sorted by progress (highest to lowest)
  - Color-coded by progress level
  - Shows all cities for comparison
- **Library**: `recharts` (BarChart, Bar)
- **Data**: All cities' overall progress

#### 7. **Phase Distribution Chart**
- **Type**: Pie Chart
- **Implementation**: `PhaseDistributionChart` component using `recharts`
- **Function**:
  - Shows phase distribution for selected city
  - Each phase has distinct color
  - Labels and tooltips with percentages
  - Legend with full phase names
- **Library**: `recharts` (PieChart, Pie)
- **Data**: Current city's phase percentages

### **Key Features**
- **City Selection**: Dropdown to select from 10 Punjab cities
- **Dynamic Updates**: All charts update when city changes
- **Real-time Data**: Mock data with varied percentages (not all 100%)
- **Responsive Design**: Works on all screen sizes
- **Theme Toggle**: Dark/Light mode support

### **Cities Tracked**
1. Sheikhupura (77% overall)
2. Sialkot (72% overall)
3. Gujrat (68% overall)
4. Jehlum (66% overall)
5. Attock (62% overall)
6. Hassan Abdal (59% overall)
7. Sahiwal (72% overall)
8. Okara (68% overall)
9. Jhang (64% overall)
10. Muzaffargarh (60% overall)

---

## 📄 Page 2: Comparison (`/comparison`)

### **Purpose**
Compare performance metrics across major cities (Lahore, Rawalpindi, Faisalabad).

### **Charts & Visualizations**

#### 1. **Performance Ranking Card**
- **Type**: List/Table View
- **Implementation**: Custom Card with list items
- **Function**:
  - Shows city rankings by efficiency score
  - Displays trend indicators (+/-)
  - Color-coded trends (green for positive, red for negative)

#### 2. **Response Time Comparison Chart**
- **Type**: Horizontal Bar Chart
- **Implementation**: `recharts` BarChart with `layout="vertical"`
- **Function**:
  - Compares response times across cities
  - Horizontal bars for easy comparison
  - Shows average minutes per priority incident
  - Summary stats below chart
- **Library**: `recharts` (BarChart, Bar)
- **Data**: Static comparison data

#### 3. **Metric Overview Chart**
- **Type**: Vertical Bar Chart (Grouped)
- **Implementation**: `recharts` BarChart
- **Function**:
  - Compares multiple metrics: Response Time, Incidents, Staff Count, Camera Uptime
  - Grouped bars for each city
  - Color-coded by city
- **Library**: `recharts` (BarChart, Bar)
- **Data**: `comparisonData` array

### **Key Features**
- City selection dropdown (currently static)
- Multiple metric comparisons
- Visual ranking system

---

## 📄 Page 3: Finance (`/finance`)

### **Purpose**
Track budget allocation, utilization, and financial analytics for the Safe City project.

### **Charts & Visualizations**

#### 1. **Budget KPI Cards (3 Cards)**
- **Type**: Stat Cards
- **Implementation**: Custom Card components
- **Function**:
  - Total Budget Allocated: $12.5M
  - YTD Utilization: $8.2M with progress bar
  - Projected Variance: -$150K (under budget)

#### 2. **Budget vs Actual Chart**
- **Type**: Composed Chart (Bar + Line)
- **Implementation**: `recharts` ComposedChart
- **Function**:
  - Bar chart shows budgeted amounts
  - Line chart shows actual spending
  - Monthly breakdown (Jan-Jul)
  - Visual comparison of planned vs actual
- **Library**: `recharts` (ComposedChart, Bar, Line)
- **Data**: `budgetData` array

#### 3. **Department Drill-down**
- **Type**: Progress Bars (Custom)
- **Implementation**: Custom progress bars
- **Function**:
  - Shows expense breakdown by department
  - Departments: Infrastructure, Personnel, Maintenance, Software Lic
  - Color-coded progress bars
  - Shows dollar amounts

### **Key Features**
- Export report functionality
- Budget tracking and variance analysis
- Department-wise expense breakdown

---

## 📄 Page 4: GIS Layers (`/gis`)

### **Purpose**
Advanced Geographic Information System (GIS) for spatial data visualization and analysis.

### **Charts & Visualizations**

#### 1. **GIS Statistics Cards (4 Cards)**
- **Type**: Stat Cards with Icons
- **Implementation**: Custom Card components
- **Function**:
  - CCTV Uptime: 98.4%
  - Patrol Coverage: 92%
  - Construction Radius: 1.8km
  - Station Nodes: 24
  - Shows change indicators (+/-)

#### 2. **Interactive City Map**
- **Type**: Leaflet Map
- **Implementation**: `CityMap` component
- **Function**:
  - Shows cameras, incidents, patrols, stations, traffic, construction
  - Layer controls for different data types
  - Interactive markers with popups
  - File upload for construction sites
- **Library**: `react-leaflet`, `leaflet`

#### 3. **Spatial Inventory Sidebar**
- **Type**: List View
- **Implementation**: ScrollArea with list items
- **Function**:
  - Lists all spatial assets
  - CCTV Network, Construction Sites, Hotspot Zones, Patrol Fleet, Police Stations, Traffic Sensors
  - Click to filter map layers

### **Key Features**
- Tabbed interface (Operations View / Data Explorer)
- Layer controls for map visualization
- Spatial data inventory
- Real-time sync status

---

## 📄 Page 5: Settings (`/settings`)

### **Purpose**
System configuration and user preferences management.

### **Charts & Visualizations**
- **None** - Configuration page only

### **Sections**

#### 1. **Appearance & Display**
- Dark mode toggle
- Map tile provider selection
- Theme customization

#### 2. **Operational Alerts**
- Critical incident pulse toggle
- Audio warnings toggle
- Notification preferences

#### 3. **Authentication & Access**
- Officer ID display
- Session timeout configuration
- Access credentials management

### **Key Features**
- Save all changes button
- Theme integration
- User preference management

---

## 📄 Page 6: Not Found (`/404`)

### **Purpose**
Error page for invalid routes.

### **Charts & Visualizations**
- **None** - Simple error message

### **Function**
- Shows 404 error message
- User-friendly error handling

---

## 🛠️ Technical Implementation

### **Technology Stack**
- **Framework**: React 19 with TypeScript
- **Routing**: Wouter
- **Charts**: Recharts
- **Maps**: React Leaflet
- **UI Components**: Radix UI + Custom components
- **Styling**: Tailwind CSS
- **State Management**: React Hooks (useState)
- **Build Tool**: Vite

### **Key Libraries**
```json
{
  "recharts": "^2.15.4",           // Chart library
  "react-leaflet": "^5.0.0",       // Map components
  "leaflet": "^1.9.4",             // Map engine
  "@tanstack/react-query": "^5.60.5", // Data fetching
  "wouter": "^3.3.5"               // Routing
}
```

### **Chart Implementation Pattern**
All charts follow this pattern:
1. Receive data as props
2. Use `ResponsiveContainer` for responsiveness
3. Configure with `recharts` components
4. Apply custom styling via Tailwind
5. Include tooltips and legends
6. Use unique keys for re-rendering

### **Data Flow**
1. User selects city from dropdown
2. `selectedCity` state updates
3. `cityData` recalculates from `CITY_INSTALLATION_DATA`
4. All components receive new data
5. React keys force re-renders
6. Charts update with new data

### **Responsive Design**
- Mobile: Single column layout
- Tablet: 2-3 column grid
- Desktop: Full multi-column layout
- Charts: Responsive containers adapt to screen size

---

## 📊 Chart Summary Table

| Page | Chart Type | Library | Purpose | Updates Dynamically |
|------|-----------|---------|---------|---------------------|
| Dashboard | Area Chart | Recharts | Timeline progress | ✅ Yes |
| Dashboard | Bar Chart | Recharts | Phase breakdown | ✅ Yes |
| Dashboard | Bar Chart | Recharts | City comparison | ❌ No (shows all) |
| Dashboard | Pie Chart | Recharts | Phase distribution | ✅ Yes |
| Dashboard | Map | Leaflet | Geographic view | ✅ Yes |
| Comparison | Bar Chart | Recharts | Response time | ❌ No |
| Comparison | Bar Chart | Recharts | Metric overview | ❌ No |
| Finance | Composed Chart | Recharts | Budget vs Actual | ❌ No |
| GIS | Map | Leaflet | Spatial data | ❌ No |

---

## 🎨 Design Features

### **Visual Enhancements**
- Gradient backgrounds
- Shimmer animations on progress bars
- Hover effects on cards
- Smooth transitions
- Color-coded data visualization
- Professional shadows and borders

### **User Experience**
- Intuitive navigation
- Clear visual hierarchy
- Responsive layouts
- Interactive elements
- Real-time updates
- Accessible design

---

## 📝 Notes

- All data is currently **mock data** for demonstration
- Charts use **Recharts** library for consistency
- Maps use **Leaflet** for geographic visualization
- All components are **TypeScript** typed
- Dashboard is the **main page** with most functionality
- City selection updates **all dashboard charts** dynamically

