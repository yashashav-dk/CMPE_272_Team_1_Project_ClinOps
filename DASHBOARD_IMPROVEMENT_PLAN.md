# Dashboard Improvement Plan: Interactive LLM Data Visualization

## Current State Analysis

### Architecture Overview
```
LLM (Gemini) → Markdown Text → Manual Send → Parser/MCP → Dashboard Widgets → Static Display
```

### Components Involved
1. **LLM Generation** (`services/ai.ts`, `services/llm.ts`)
   - Generates markdown content for different tab types
   - Saves to `tabContent` state in ContextAwareChat
   - Currently streaming text-only output

2. **Data Processing** (`services/dashboard-parser.ts`, `services/mcp-data-restructurer.ts`)
   - **Legacy Mode**: Regex-based markdown parsing
   - **Structured Mode**: AI-powered JSON extraction (MCP)
   - Both triggered manually via "Send to Dashboard" button

3. **API Layer**
   - `/api/dashboard/add-content` - Adds parsed widgets to DB
   - `/api/dashboard/widget/[widgetId]/data` - Updates widget data
   - `/api/dashboard/[projectId]` - Fetches dashboard data

4. **Dashboard Display** (`app/trial-dashboard/[projectId]/`)
   - `WidgetRenderer.tsx` - Renders different widget types
   - Basic interactive widgets: Tables, Checklists, Timelines
   - Static display of KPIs and diagrams

### Key Issues

#### 1. **Disconnected Data Flow**
- ❌ LLM generates text → User manually sends → Dashboard updates
- ❌ No real-time connection between chat and dashboard
- ❌ Can only see text in chat until manual action

#### 2. **Limited Interactivity**
- ❌ Only basic editing (tables, checklists)
- ❌ No data filtering, sorting, or advanced views
- ❌ No drill-down capabilities
- ❌ No collaborative features

#### 3. **Poor Visualization**
- ❌ Widgets displayed as simple cards
- ❌ No charts, graphs (only Mermaid diagrams)
- ❌ No data analytics or insights
- ❌ Limited KPI visualization

#### 4. **Lack of Customization**
- ❌ Fixed layout (2-column grid)
- ❌ No widget resizing or reordering
- ❌ No personalized views
- ❌ No saved configurations

#### 5. **No Advanced Features**
- ❌ No export/share functionality
- ❌ No version history
- ❌ No notifications or alerts
- ❌ No integration with external tools

---

## Improvement Plan

### Phase 1: Real-Time Data Integration (HIGH PRIORITY)

#### 1.1 WebSocket/SSE for Live Updates
**Goal**: Stream LLM data directly to dashboard in real-time

**Implementation**:
```typescript
// services/dashboard-stream.ts
export class DashboardStreamService {
  private eventSource: EventSource | null = null
  
  // Stream structured data as LLM generates
  streamToDashboard(projectId: string, tabType: string) {
    this.eventSource = new EventSource(
      `/api/dashboard/stream?projectId=${projectId}&tabType=${tabType}`
    )
    
    this.eventSource.onmessage = (event) => {
      const widget = JSON.parse(event.data)
      this.updateDashboardWidget(widget)
    }
  }
}
```

**Changes Required**:
- Add Server-Sent Events (SSE) endpoint: `/api/dashboard/stream`
- Modify LLM response handler to parse and stream widgets incrementally
- Update dashboard to listen for live widget updates
- Add loading states and skeleton screens for streaming widgets

**Files to Modify**:
- `services/ai.ts` - Add streaming callback
- `app/trial-dashboard/[projectId]/page.tsx` - Add SSE listener
- Create `app/api/dashboard/stream/route.ts`

---

#### 1.2 Intelligent Auto-Send with Debouncing
**Goal**: Automatically send content to dashboard as it's generated

**Implementation**:
```typescript
// In ContextAwareChat.tsx
useEffect(() => {
  const debouncedSend = debounce(() => {
    if (tabContent[currentTab]) {
      handleSendToDashboard(true) // Use structured mode
    }
  }, 3000) // Wait 3s after LLM finishes
  
  if (tabContentGeneration[currentTab] === 'complete') {
    debouncedSend()
  }
}, [tabContent, tabContentGeneration, currentTab])
```

**Benefits**:
- No manual "Send to Dashboard" action needed
- Dashboard updates automatically
- User sees visualizations immediately

---

### Phase 2: Enhanced Visualization (HIGH PRIORITY)

#### 2.1 Rich Chart Library Integration
**Goal**: Add proper data visualizations beyond Mermaid diagrams

**Recommended Library**: Recharts or Chart.js

**New Widget Types**:
- **Line Charts**: Timeline trends, enrollment progress
- **Bar Charts**: Site performance, metrics comparison
- **Pie Charts**: Distribution (gender, age groups, sites)
- **Area Charts**: Cumulative metrics
- **Scatter Plots**: Correlation analysis
- **Heatmaps**: Risk matrices, compliance status

**Implementation**:
```typescript
// components/widgets/ChartWidget.tsx
import { LineChart, BarChart, PieChart } from 'recharts'

interface ChartWidgetProps {
  type: 'line' | 'bar' | 'pie' | 'area'
  data: Array<Record<string, any>>
  config: ChartConfig
}

export function ChartWidget({ type, data, config }: ChartWidgetProps) {
  const ChartComponent = getChartComponent(type)
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ChartComponent data={data} {...config} />
    </ResponsiveContainer>
  )
}
```

**MCP Schema Update**:
```typescript
// Add to structured-output-schema.ts
export interface ChartWidget extends BaseWidget {
  type: 'chart'
  content: {
    chartType: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'heatmap'
    data: Array<Record<string, any>>
    xAxis: string
    yAxis: string | string[]
    config?: ChartConfig
  }
}
```

**Files to Create/Modify**:
- Create `app/trial-dashboard/[projectId]/components/ChartWidget.tsx`
- Update `services/structured-output-schema.ts`
- Modify `services/mcp-data-restructurer.ts` to extract chart data
- Update `app/trial-dashboard/[projectId]/components/WidgetRenderer.tsx`

---

#### 2.2 Enhanced KPI Cards
**Goal**: Make KPI widgets more visually appealing and informative

**Features**:
- Trend indicators (up/down arrows)
- Sparklines showing historical data
- Color coding based on status
- Comparison to targets/benchmarks
- Drill-down to detailed view

**Implementation**:
```typescript
// components/widgets/EnhancedKPICard.tsx
export function EnhancedKPICard({ kpi }: { kpi: KPIData }) {
  return (
    <div className="kpi-card">
      <div className="kpi-header">
        <span>{kpi.label}</span>
        <StatusBadge status={kpi.status} />
      </div>
      
      <div className="kpi-value">
        {kpi.value}
        <TrendIndicator trend={kpi.trend} />
      </div>
      
      {kpi.historical && (
        <Sparkline data={kpi.historical} />
      )}
      
      <ProgressBar value={kpi.value} target={kpi.target} />
      
      <button onClick={() => openDetails(kpi)}>
        View Details
      </button>
    </div>
  )
}
```

---

#### 2.3 Interactive Data Tables
**Goal**: Upgrade tables with advanced features

**Features to Add**:
- Column sorting (ascending/descending)
- Multi-column filtering
- Search across all columns
- Pagination for large datasets
- Column visibility toggle
- Export to CSV/Excel
- Row selection and bulk actions
- Conditional formatting (highlight cells)

**Recommended Library**: TanStack Table (React Table v8)

**Implementation**:
```typescript
// components/widgets/AdvancedTable.tsx
import { useReactTable, getCoreRowModel, getSortedRowModel } from '@tanstack/react-table'

export function AdvancedTable({ data, columns }: TableProps) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    // ... other features
  })
  
  return (
    <div className="advanced-table">
      <TableToolbar table={table} />
      <table>
        {/* Render headers, rows with sorting, filtering */}
      </table>
      <TablePagination table={table} />
    </div>
  )
}
```

---

### Phase 3: Customizable Dashboard Layout

#### 3.1 Drag-and-Drop Widget Positioning
**Goal**: Allow users to customize dashboard layout

**Recommended Library**: react-grid-layout

**Implementation**:
```typescript
// app/trial-dashboard/[projectId]/page.tsx
import GridLayout from 'react-grid-layout'

export default function CustomizableDashboard() {
  const [layout, setLayout] = useState(loadLayoutFromDB())
  
  return (
    <GridLayout
      layout={layout}
      onLayoutChange={(newLayout) => {
        setLayout(newLayout)
        saveLayoutToDB(newLayout)
      }}
      cols={12}
      rowHeight={30}
      isDraggable
      isResizable
    >
      {widgets.map(widget => (
        <div key={widget.id} data-grid={widget.layout}>
          <WidgetRenderer widget={widget} />
        </div>
      ))}
    </GridLayout>
  )
}
```

**Database Changes**:
```prisma
// Update DashboardWidget model
model DashboardWidget {
  // ... existing fields
  layoutX     Int      @default(0)
  layoutY     Int      @default(0)
  layoutW     Int      @default(6)
  layoutH     Int      @default(4)
}
```

---

#### 3.2 Widget Library & Quick Add
**Goal**: Easy widget creation and management

**Features**:
- Widget library panel (sidebar)
- Drag from library to add new widget
- Widget templates (common layouts)
- Quick actions: duplicate, delete, export widget

**Implementation**:
```typescript
// components/WidgetLibrary.tsx
export function WidgetLibrary({ onAddWidget }: Props) {
  const widgetTemplates = [
    { type: 'kpi', icon: '📊', label: 'KPI Card' },
    { type: 'chart', icon: '📈', label: 'Chart' },
    { type: 'table', icon: '📋', label: 'Table' },
    // ... more templates
  ]
  
  return (
    <div className="widget-library">
      {widgetTemplates.map(template => (
        <WidgetTemplate
          key={template.type}
          template={template}
          onDragEnd={(position) => onAddWidget(template, position)}
        />
      ))}
    </div>
  )
}
```

---

### Phase 4: Advanced Interactivity

#### 4.1 Widget Interactions & Filtering
**Goal**: Connect widgets for dynamic filtering

**Example Flow**:
1. User clicks on a site in a table
2. All other widgets filter to show data for that site
3. Charts, KPIs, checklists update accordingly

**Implementation**:
```typescript
// contexts/DashboardFilterContext.tsx
export function DashboardFilterProvider({ children }) {
  const [filters, setFilters] = useState<DashboardFilters>({})
  
  const applyFilter = (filterKey: string, value: any) => {
    setFilters(prev => ({ ...prev, [filterKey]: value }))
  }
  
  const clearFilters = () => setFilters({})
  
  return (
    <DashboardFilterContext.Provider value={{ filters, applyFilter, clearFilters }}>
      {children}
    </DashboardFilterContext.Provider>
  )
}

// In widgets
export function InteractiveTable({ data }: Props) {
  const { filters, applyFilter } = useDashboardFilters()
  
  const filteredData = useMemo(() => 
    applyFiltersToData(data, filters), 
    [data, filters]
  )
  
  return (
    <Table
      data={filteredData}
      onRowClick={(row) => applyFilter('site', row.siteName)}
    />
  )
}
```

---

#### 4.2 Drill-Down & Modal Views
**Goal**: Deep-dive into widget data without leaving dashboard

**Features**:
- Click widget → Opens detailed modal
- Multi-level drill-down (overview → detail → specifics)
- Breadcrumb navigation
- Quick actions in modal

**Implementation**:
```typescript
// components/WidgetDetailModal.tsx
export function WidgetDetailModal({ widget, onClose }: Props) {
  return (
    <Modal size="xl" onClose={onClose}>
      <ModalHeader>
        <Breadcrumbs path={widget.path} />
        <ModalActions widget={widget} />
      </ModalHeader>
      
      <ModalBody>
        <DetailedWidgetView widget={widget} />
        {widget.relatedData && (
          <RelatedWidgets data={widget.relatedData} />
        )}
      </ModalBody>
    </Modal>
  )
}
```

---

#### 4.3 Collaborative Features
**Goal**: Multiple users can interact with dashboard simultaneously

**Features**:
- Real-time updates across users (WebSocket)
- User presence indicators
- Comments on widgets
- Activity feed
- Version history with rollback

**Implementation**:
```typescript
// services/collaboration.ts
export class CollaborationService {
  private socket: WebSocket
  
  connect(projectId: string) {
    this.socket = new WebSocket(`/ws/dashboard/${projectId}`)
    
    this.socket.on('widget:updated', (data) => {
      updateWidgetInState(data.widgetId, data.changes)
      showNotification(`${data.user} updated ${data.widgetTitle}`)
    })
    
    this.socket.on('user:joined', (user) => {
      addActiveUser(user)
    })
  }
  
  broadcastWidgetChange(widgetId: string, changes: any) {
    this.socket.send({
      type: 'widget:update',
      widgetId,
      changes
    })
  }
}
```

---

### Phase 5: Analytics & Insights

#### 5.1 Dashboard Analytics
**Goal**: Track dashboard usage and generate insights

**Features**:
- Widget interaction tracking
- Most viewed/edited widgets
- Time spent on dashboard
- User behavior patterns
- Dashboard health score

**Implementation**:
```typescript
// services/analytics.ts
export class DashboardAnalytics {
  trackWidgetView(widgetId: string) {
    // Send to analytics service
  }
  
  trackWidgetInteraction(widgetId: string, action: string) {
    // Track clicks, edits, exports, etc.
  }
  
  async generateInsights(projectId: string) {
    // Use AI to analyze dashboard data and suggest improvements
    const insights = await fetch('/api/dashboard/insights', {
      method: 'POST',
      body: JSON.stringify({ projectId })
    })
    
    return insights.json()
  }
}
```

---

#### 5.2 AI-Powered Insights
**Goal**: LLM analyzes dashboard data and provides recommendations

**Features**:
- Anomaly detection (unusual trends)
- Predictive analytics (forecast enrollment)
- Risk identification (delayed milestones)
- Optimization suggestions
- Natural language insights

**Implementation**:
```typescript
// In MCP restructurer - add insights widget
export interface InsightWidget extends BaseWidget {
  type: 'insight'
  content: {
    severity: 'info' | 'warning' | 'critical'
    title: string
    description: string
    recommendation: string
    affectedWidgets: string[]
    confidence: number
  }
}

// Generate insights from dashboard data
async function generateDashboardInsights(dashboardData: DashboardData) {
  const prompt = `Analyze this clinical trial dashboard data and identify:
    1. Anomalies or concerning trends
    2. Risks to timeline or enrollment
    3. Opportunities for optimization
    
    Data: ${JSON.stringify(dashboardData)}
    
    Return structured insights with severity, description, and recommendations.`
  
  const insights = await generateAIResponse(prompt)
  return parseInsights(insights)
}
```

---

### Phase 6: Export & Integration

#### 6.1 Export Functionality
**Goal**: Export dashboard data and visualizations

**Features**:
- Export individual widgets (PNG, PDF, CSV)
- Export entire dashboard (PDF report)
- Scheduled exports (daily/weekly reports)
- Custom report builder

**Implementation**:
```typescript
// services/export.ts
export class DashboardExportService {
  async exportWidget(widgetId: string, format: 'png' | 'pdf' | 'csv') {
    const widget = await fetchWidget(widgetId)
    
    switch (format) {
      case 'png':
        return await captureWidgetAsImage(widget)
      case 'pdf':
        return await generateWidgetPDF(widget)
      case 'csv':
        return await exportWidgetDataAsCSV(widget)
    }
  }
  
  async exportDashboard(projectId: string) {
    const dashboard = await fetchDashboard(projectId)
    return await generateDashboardReport(dashboard)
  }
}
```

---

#### 6.2 External Integrations
**Goal**: Connect dashboard to external tools

**Integrations**:
- Slack notifications (alerts, updates)
- Email reports
- Webhook triggers
- API for custom integrations
- Export to BI tools (Tableau, PowerBI)

**Implementation**:
```typescript
// app/api/dashboard/webhook/route.ts
export async function POST(request: Request) {
  const { event, data } = await request.json()
  
  // Trigger webhook for external systems
  if (event === 'widget:updated') {
    await triggerWebhook(data.webhookUrl, {
      type: 'widget_update',
      widget: data.widget,
      timestamp: new Date()
    })
  }
}
```

---

## Implementation Priority

### 🔴 Phase 1 (Immediate - Week 1-2)
1. ✅ Real-time dashboard updates (SSE)
2. ✅ Auto-send with debouncing
3. ✅ Basic chart integration (Recharts)

**Expected Outcome**: Dashboard shows visualizations in real-time as LLM generates content

---

### 🟡 Phase 2 (Short-term - Week 3-4)
1. ✅ Enhanced KPI cards with trends
2. ✅ Advanced table with sorting/filtering
3. ✅ Widget library
4. ✅ Drag-and-drop layout

**Expected Outcome**: Highly interactive, customizable dashboard

---

### 🟢 Phase 3 (Mid-term - Week 5-6)
1. ✅ Widget interactions & cross-filtering
2. ✅ Drill-down modals
3. ✅ Collaborative features
4. ✅ Activity tracking

**Expected Outcome**: Multi-user collaborative dashboard with advanced interactions

---

### 🔵 Phase 4 (Long-term - Week 7-8)
1. ✅ AI-powered insights
2. ✅ Export functionality
3. ✅ External integrations
4. ✅ Advanced analytics

**Expected Outcome**: Intelligent, integrated dashboard ecosystem

---

## Technical Stack Additions

### Required npm Packages
```json
{
  "dependencies": {
    "recharts": "^2.10.0",           // Charts
    "@tanstack/react-table": "^8.11.0", // Advanced tables
    "react-grid-layout": "^1.4.4",    // Drag-and-drop layout
    "html2canvas": "^1.4.1",          // Screenshot widgets
    "jspdf": "^2.5.1",                // PDF export
    "papaparse": "^5.4.1",            // CSV export
    "socket.io-client": "^4.5.4",     // Real-time collaboration
    "date-fns": "^2.30.0",            // Date formatting
    "lodash": "^4.17.21",             // Utility functions
    "framer-motion": "^10.16.0"       // Animations
  }
}
```

---

## Database Schema Updates

```prisma
model DashboardWidget {
  id          String   @id @default(uuid())
  projectId   String
  userId      String
  tabType     String
  widgetType  String
  title       String
  content     Json
  rawContent  String   @db.Text
  order       Int
  
  // NEW: Layout properties
  layoutX     Int      @default(0)
  layoutY     Int      @default(0)
  layoutW     Int      @default(6)
  layoutH     Int      @default(4)
  
  // NEW: Metadata
  views       Int      @default(0)
  lastViewed  DateTime?
  isPinned    Boolean  @default(false)
  isHidden    Boolean  @default(false)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
}

// NEW: Widget interactions
model WidgetInteraction {
  id         String   @id @default(uuid())
  widgetId   String
  userId     String
  action     String   // 'view', 'edit', 'export', 'filter'
  metadata   Json?
  timestamp  DateTime @default(now())
}

// NEW: Dashboard comments
model WidgetComment {
  id         String   @id @default(uuid())
  widgetId   String
  userId     String
  comment    String   @db.Text
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

// NEW: Dashboard layouts (saved configurations)
model DashboardLayout {
  id         String   @id @default(uuid())
  projectId  String
  userId     String
  name       String
  layout     Json
  isDefault  Boolean  @default(false)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

---

## API Endpoints to Add/Modify

### New Endpoints
- `GET /api/dashboard/stream` - SSE for real-time updates
- `POST /api/dashboard/insights` - Generate AI insights
- `POST /api/dashboard/export` - Export dashboard
- `POST /api/dashboard/layout` - Save layout configuration
- `GET /api/dashboard/analytics` - Get dashboard analytics
- `POST /api/dashboard/webhook` - Webhook triggers

### Modified Endpoints
- `POST /api/dashboard/add-content` - Add streaming support
- `PUT /api/dashboard/widget/[id]/data` - Add collaboration events
- `GET /api/dashboard/[projectId]` - Include layout & metadata

---

## Testing Strategy

### Unit Tests
- Widget rendering
- Data parsing/transformation
- Filter logic
- Export functions

### Integration Tests
- LLM → Dashboard flow
- Widget interactions
- Real-time updates
- Database operations

### E2E Tests (Playwright)
- Create dashboard from chat
- Customize layout
- Export dashboard
- Collaborative editing

---

## Performance Considerations

### Optimizations
1. **Virtualization**: Large tables/lists (react-virtual)
2. **Memoization**: Expensive computations (useMemo, React.memo)
3. **Code Splitting**: Lazy load widgets (React.lazy)
4. **Caching**: API responses, computed data
5. **Debouncing**: User interactions, autosave
6. **WebSocket**: Efficient real-time updates vs polling

### Monitoring
- Widget render times
- API response times
- WebSocket connection health
- User interaction latency

---

## Success Metrics

### User Experience
- Time to first visualization: < 2 seconds
- Dashboard load time: < 3 seconds
- Widget interaction response: < 100ms

### Functionality
- Widget types available: 10+
- Customization options: 20+
- Export formats: 5+

### Adoption
- % of users using dashboard: > 80%
- Average time on dashboard: > 10 min/session
- Dashboard interactions per session: > 15

---

## Next Steps

1. **Review this plan** with the team
2. **Prioritize phases** based on business needs
3. **Set up development environment** with new packages
4. **Create feature branches** for each phase
5. **Start with Phase 1** (real-time updates)
6. **Iterate based on user feedback**

---

## Questions to Consider

1. Should we support multiple dashboard templates (e.g., "Trial Manager View" vs "Site View")?
2. Do we need role-based access control for widgets?
3. Should widgets support custom themes/styling?
4. Do we want to support dashboard sharing/publishing?
5. Should we add mobile/tablet responsive layouts?
6. Do we need offline support?

---

## Conclusion

This plan transforms the dashboard from a **static text display** to a **rich, interactive, real-time data visualization platform**. The phased approach ensures we deliver value incrementally while building toward a comprehensive solution.

Key improvements:
✅ **Real-time**: LLM data streams directly to dashboard
✅ **Interactive**: Rich charts, filters, drill-downs
✅ **Customizable**: Drag-and-drop, personalized layouts
✅ **Collaborative**: Multi-user, real-time updates
✅ **Intelligent**: AI-powered insights and recommendations
✅ **Integrated**: Export, webhooks, external tools

The end result is a **world-class clinical trial management dashboard** that makes complex data accessible, actionable, and engaging.
