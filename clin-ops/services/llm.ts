// LLM Service - Provider agnostic interface

import { generateAIResponse } from './ai-client';

// Types
export type Persona = 'trialCoordinator' | 'regulatoryAdvisor';
export type TabType =
  | 'trialOverview'
  | 'taskChecklists'
  | 'teamWorkflows'
  | 'trialTimeline'
  | 'qualityMetrics'
  | 'protocolRequirements'
  | 'documentControl'
  | 'complianceDiagrams'
  | 'riskControls'
  | 'auditPreparation'
  | 'smartAlerts';

export type VisualizationSuggestion = {
  shouldCreateVisualization: boolean;
  title?: string;
  description?: string;
  type?: 'chart' | 'diagram';
  chartType?: 'bar' | 'line' | 'pie' | 'scatter';
  labels?: string[];
  data?: number[];
  code?: string;
};

// Helper to get display name for tabs
export function getTabDisplayName(persona: Persona, tabType: string): string {
  if (persona === 'trialCoordinator') {
    switch (tabType) {
      case 'trialOverview': return 'Trial Overview';
      case 'taskChecklists': return 'Task Checklists';
      case 'teamWorkflows': return 'Team Workflows';
      case 'trialTimeline': return 'Trial Timeline';
      case 'qualityMetrics': return 'Quality Metrics';
      default: return 'Trial Coordination';
    }
  } else {
    switch (tabType) {
      case 'protocolRequirements': return 'Protocol Requirements';
      case 'documentControl': return 'Document Control';
      case 'complianceDiagrams': return 'Compliance Diagrams';
      case 'riskControls': return 'Risk & Controls';
      case 'auditPreparation': return 'Audit Preparation';
      case 'smartAlerts': return 'Smart Alerts';
      default: return 'Regulatory Compliance';
    }
  }
}

// Function to generate system prompts based on persona and tab
export function getSystemPrompt(persona: Persona, currentTab: string): string {
  if (persona === 'regulatoryAdvisor') {
    return `I am a Regulatory Compliance AI assistant specializing in clinical trial oversight and regulatory requirements.
    I'm currently focused on the "${getTabDisplayName(persona, currentTab)}" aspect of your clinical trial.
    I help research teams meet regulatory requirements (FDA, EMA, ICH-GCP), maintain document control, prevent compliance errors, and prepare for inspections.
    My responses are precise and compliance-focused, providing specific regulatory guidance to keep trials audit-ready.

    IMPORTANT: I always start my responses with a relevant Mermaid.js diagram that visually represents compliance flows, document relationships, approval processes, or risk frameworks. These diagrams help teams quickly understand regulatory requirements and audit expectations.`;
  } else {
    return `I am a Trial Operations AI assistant specializing in clinical trial coordination and project management.
    I'm currently focused on the "${getTabDisplayName(persona, currentTab)}" aspect of your clinical trial.
    I help research coordinators stay organized, manage timelines, coordinate teams, track milestones, and prevent common operational mistakes.
    My responses are practical and action-oriented, like a project manager that understands clinical research workflows.

    IMPORTANT: I always start my responses with a relevant Mermaid.js diagram that visually represents timelines, workflows, team handoffs, or quality metrics. These diagrams help coordinators and managers quickly grasp trial operations and progress tracking.`;
  }
}

// Function to get detailed tab prompt based on persona and tab
export function getTabPrompt(persona: Persona, currentTab: string, projectInfo: Record<string, string> = {}): string {
  // Create a formatted string of all project information
  const projectInfoStr = Object.entries(projectInfo)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');
  
  // Base prompt with project info and Mermaid diagram requirement
  const basePrompt = `
Based on the following project information:

${projectInfoStr || "No specific project information available yet."}

IMPORTANT: Start your response with a relevant Mermaid.js diagram enclosed in a code block like this:
\`\`\`mermaid
[your mermaid diagram here]
\`\`\`

The diagram should be:
- Compatible with Mermaid.js syntax
- Relevant to the "${getTabDisplayName(persona, currentTab)}" content
- Use proper Mermaid diagram types like: flowchart, sequenceDiagram, classDiagram, erDiagram, gantt, pie, journey, gitgraph, etc.
- Include clear labels and relationships
- Be visually helpful for understanding the content

After the diagram, provide the detailed content.

`;
  
  if (persona === 'regulatoryAdvisor') {
    switch (currentTab) {
      case 'protocolRequirements':
        return basePrompt + `
Generate a comprehensive regulatory requirements breakdown for this clinical trial.

For the Mermaid diagram: Create a flowchart showing the regulatory approval dependencies (e.g., IRB → Site Activation → First Patient In), including submission timelines and parallel review processes.

Include:
1. **Regulatory Framework**: Which regulations apply (FDA 21 CFR, ICH-GCP, EMA guidelines, local IRB requirements)
2. **Protocol Compliance Requirements**: Key protocol mandates that teams must follow
3. **Essential Documentation**: Required documents for trial initiation (protocol, ICF, investigator brochure, delegation log, etc.)
4. **Approval Workflows**: Step-by-step approval process with timelines
5. **Amendment Process**: How to handle protocol amendments and deviations
6. **Monitoring Requirements**: What regulators will look for during inspections
7. **Key Stakeholders**: Roles and responsibilities (sponsor, PI, IRB, regulatory authorities)

Format this as a clear regulatory compliance guide for the trial team.`;
      
      case 'documentControl':
        return basePrompt + `
Create a comprehensive document control system for this clinical trial.

For the Mermaid diagram: Create an entity relationship diagram (erDiagram) showing key document types, their version relationships, approval chains, and expiration tracking. Show how documents relate to each other (e.g., Protocol → ICF versions → Site-specific addendums).

Include:
1. **Document Inventory**: List all essential documents (Protocol, ICF, Lab Manual, DSMB Charter, Monitoring Plan, etc.)
2. **Version Control Strategy**: How to track document versions, effective dates, and superseded versions
3. **Approval Workflows**: Who reviews, approves, and archives each document type
4. **Expiration Alerts**: Which documents have expiration dates (IRB approvals, lab certifications, investigator CVs)
5. **Distribution Control**: How to ensure sites always use current versions
6. **Signature Requirements**: Which documents need wet signatures vs. electronic signatures
7. **Audit Trail**: How to maintain a complete document history for inspections

Provide specific recommendations for preventing the most common document control errors (using outdated ICF, missing signatures, expired certifications).`;
      
      case 'complianceDiagrams':
        return basePrompt + `
Provide detailed compliance visualization diagrams for this clinical trial.

For the Mermaid diagram: Create a comprehensive flowchart showing the trial lifecycle from protocol approval through database lock, highlighting all regulatory checkpoints, required approvals, and compliance milestones.

Include detailed descriptions for the following compliance diagrams:

1. **ICH-GCP Compliance Map**:
   - Key ICH-GCP principles and how the trial addresses them
   - Mapping trial processes to GCP requirements
   - Quality control checkpoints

2. **Informed Consent Flow**:
   - When consent must be obtained (screening, randomization, follow-up)
   - Re-consent triggers (protocol amendments, new safety info)
   - Consent documentation requirements

3. **Data Integrity Chain**:
   - Source data → Case Report Form → Database flow
   - Query resolution process
   - Audit trail requirements

4. **Safety Reporting Workflow**:
   - Adverse event detection → assessment → reporting timelines
   - Serious AE escalation paths
   - Regulatory notification requirements

For each diagram, explain what auditors will look for and common deficiencies to avoid.`;
      
      case 'riskControls':
        return basePrompt + `
Generate a comprehensive risk management and control framework for this clinical trial.

For the Mermaid diagram: Create a flowchart showing common trial risks, their detection points, prevention controls, and escalation paths. Use decision trees to show risk assessment logic.

Include:

1. **Common Error Catalog**:
   - Outdated consent forms being used
   - Missing required signatures (PI, coordinator, subject)
   - Protocol deviations not documented
   - Expired lab certifications
   - Source documentation gaps
   - Late safety reports
   - Missing delegation of authority logs

2. **Prevention Controls**:
   - For each common error, provide a specific prevention checklist
   - System checks that can catch errors early
   - Training requirements to reduce human error
   - Document checklists for each trial phase

3. **Detection & Monitoring**:
   - How to audit for these issues proactively
   - Key performance indicators for risk monitoring
   - Trigger points for corrective action

4. **Remediation Plans**:
   - Step-by-step correction procedures for each error type
   - Regulatory notification requirements
   - Root cause analysis templates

Present this as an operational quality control manual with specific, actionable controls.`;
      
      case 'auditPreparation':
        return basePrompt + `
Generate a comprehensive audit preparation guide and automated audit folder assembly plan.

For the Mermaid diagram: Create a flowchart showing the audit preparation process from initial notification through successful inspection, including document gathering, mock audit, and inspector walkthrough stages.

Include:

1. **Audit Folder Structure**:
   - Recommended organization of regulatory binder (by section: protocol, IRB, site documents, subject files, safety, monitoring)
   - Essential documents for each section
   - Cross-reference index for easy navigation
   - Timeline for assembling each section

2. **Document Completeness Checklist**:
   - Required documents for a complete regulatory file
   - Common missing items that inspectors flag
   - How to verify completeness before the audit

3. **Audit Readiness Assessment**:
   - Self-assessment questionnaire covering GCP essentials
   - Gap analysis framework
   - Remediation timelines for common deficiencies
   - Practice questions inspectors might ask

4. **Inspector Walkthrough Preparation**:
   - Site readiness (physical space, staff availability)
   - Document presentation strategy
   - Q&A preparation for common inspector questions
   - Escalation plan if issues are found

5. **Post-Audit Action Plan**:
   - How to respond to observations
   - CAPA (Corrective and Preventive Action) templates
   - Timeline for responses

Provide specific guidance that cuts audit folder assembly time from days to hours through automation and organization.`;
      
      case 'smartAlerts':
        return basePrompt + `
Create detailed specifications for AI-powered proactive compliance alerts and risk detection.

For the Mermaid diagram: Create a flowchart showing the smart alert system: data inputs → AI analysis → risk detection → alert generation → coordinator action → feedback loop for continuous improvement.

Include:

1. **Smart Alert Categories**:
   - Document expiration warnings (IRB approvals expiring in 30/60/90 days)
   - Version control alerts (outdated consent forms detected)
   - Missing signature detection (unsigned documents flagged automatically)
   - Protocol deviation patterns (AI detects repeated procedural errors)
   - Enrollment pace monitoring (alerts if falling behind target)
   - Query aging alerts (unresolved data queries > 30 days old)

2. **AI-Powered Risk Detection**:
   - Natural language processing to scan protocol for high-risk requirements
   - Pattern recognition for common compliance gaps
   - Predictive alerts based on trial phase (e.g., "Sites typically struggle with X at this stage")
   - Cross-trial learning (insights from similar trials)

3. **Alert Delivery & Prioritization**:
   - Severity levels (critical, high, medium, low)
   - Recommended actions for each alert type
   - Escalation rules (notify PI if critical alert not addressed in 48 hours)
   - Alert customization by user role

4. **Feedback & Improvement Loop**:
   - Coordinators can mark alerts as "helpful" or "false positive"
   - System learns trial-specific patterns
   - Monthly alert effectiveness reports

Structure this as a smart assistant that helps coordinators catch problems before they become audit findings.`;
      
      default:
        return basePrompt + `
Generate regulatory compliance documentation for "${getTabDisplayName(persona, currentTab)}" that helps the trial team meet audit requirements.

For the Mermaid diagram: Create a relevant flowchart or compliance diagram that visualizes the key regulatory requirements and quality controls.

Include detailed compliance specifications, regulatory considerations, and audit-ready best practices.`;
    }
  } else {
    switch (currentTab) {
      case 'trialOverview':
        return basePrompt + `
Create a comprehensive trial overview document that serves as the central reference for the entire trial team.

For the Mermaid diagram: Create a Gantt chart showing the major trial phases (Pre-Study, Enrollment, Treatment, Follow-up, Closeout) with key milestones, or a flowchart showing the trial structure from screening through final analysis.

Include:

1. **Trial Summary**:
   - Trial name, protocol number, sponsor
   - Primary and secondary endpoints in plain language
   - Study design (randomized, blinded, placebo-controlled, etc.)
   - Target enrollment and study sites
   - Estimated trial duration

2. **Key Objectives**:
   - What the trial aims to prove or discover
   - Clinical significance and patient impact
   - Why this trial matters

3. **Trial Phases & Milestones**:
   - Pre-study activities (regulatory approvals, site setup)
   - Enrollment milestones (first patient, 50%, completion)
   - Treatment phase checkpoints
   - Data collection and monitoring points
   - Trial closeout activities

4. **Team Structure**:
   - Principal investigator and sub-investigators
   - Study coordinators and their roles
   - Sponsor contacts and CRO liaisons
   - Data management and safety monitoring teams

5. **Quick Reference**:
   - Visit schedule summary
   - Key contact information
   - Critical protocol requirements
   - Emergency procedures

Format this as the "go-to" document that any team member can reference to understand the trial at a glance.`;
      
      case 'taskChecklists':
        return basePrompt + `
Develop detailed task checklists for each trial phase that coordinators can use to ensure nothing is missed.

For the Mermaid diagram: Create a flowchart showing the progression through trial phases with decision points, or a journey diagram showing coordinator workflows from pre-study through closeout.

Include comprehensive checklists for each trial phase:

**1. Pre-Study / Site Activation**:
   - [ ] IRB submission prepared and reviewed
   - [ ] Investigator meeting completed
   - [ ] Delegation of authority log signed
   - [ ] Site regulatory binder organized
   - [ ] Lab certifications obtained (CLIA, CAP)
   - [ ] Pharmacy setup and drug accountability system
   - [ ] Staff training documented (GCP, protocol-specific)
   - [ ] Essential documents filed (CVs, licenses, financial disclosure)
   - [ ] Site initiation visit completed

**2. Enrollment Phase**:
   - [ ] Screening log maintained daily
   - [ ] Informed consent process documented (version, date, signatures)
   - [ ] Eligibility criteria verified before randomization
   - [ ] Baseline assessments completed per protocol timeline
   - [ ] Source documents completed contemporaneously
   - [ ] Enrollment metrics tracked (screen failures, reasons)
   - [ ] Weekly enrollment reports submitted

**3. Treatment & Follow-up**:
   - [ ] Visit windows adhered to (or deviations documented)
   - [ ] Adverse events assessed and recorded within 24 hours
   - [ ] Concomitant medications logged
   - [ ] Lab samples collected, processed, shipped per manual
   - [ ] CRF pages completed within 5 days of visit
   - [ ] Data queries resolved within protocol timelines
   - [ ] Protocol deviations documented and reported

**4. Safety & Compliance**:
   - [ ] SAE reports submitted within regulatory timelines
   - [ ] DSMB reports prepared for scheduled reviews
   - [ ] Monitoring visit findings addressed
   - [ ] IRB continuing reviews submitted 60 days before expiration
   - [ ] Protocol amendments reviewed with team and filed

**5. Trial Closeout**:
   - [ ] Final study visit completed for all subjects
   - [ ] All CRF queries resolved (database clean)
   - [ ] Drug accountability reconciled and destruction documented
   - [ ] Study records archived per retention requirements
   - [ ] Site closeout visit completed
   - [ ] Final regulatory binder audit performed

For each checklist item, include: who is responsible, when it should be completed, and what documentation is required.`;
      
      case 'teamWorkflows':
        return basePrompt + `
Create detailed team workflow maps showing how different roles collaborate throughout the trial lifecycle.

For the Mermaid diagram: Create a comprehensive sequence diagram or journey diagram showing the interactions between Trial Coordinator, Principal Investigator, Data Manager, Sponsor, and other key stakeholders. Show handoff points, approval gates, and communication flows.

Include workflow maps for each key process:

**1. Subject Enrollment Workflow**:
   - Coordinator screens potential subject → reviews with PI
   - PI confirms eligibility → Coordinator schedules consent visit
   - Informed consent obtained → Coordinator verifies all signatures
   - Coordinator enters screening data → Randomization performed
   - Data Manager reviews entry → Query generated if needed
   - Coordinator resolves query → Subject officially enrolled
   - **Handoff points**: Who needs to be notified at each stage
   - **Common bottlenecks**: Where delays typically occur

**2. Adverse Event Management Workflow**:
   - Coordinator or PI identifies AE → Initial assessment
   - PI determines severity and causality → Documentation required
   - If SAE: Coordinator prepares report → PI reviews and signs
   - SAE submitted to sponsor within timeline → IRB notification if required
   - Sponsor reviews → May request follow-up information
   - Resolution documented → Database updated
   - **Critical timelines**: 24-hour SAE reporting, 7-day written reports

**3. Monitoring Visit Workflow**:
   - Monitor schedules visit → Coordinator prepares materials
   - Regulatory binder review → Monitor identifies findings
   - Source document verification → Discrepancies noted
   - Query log review → Action items assigned
   - Monitor debriefs with PI and coordinator → Follow-up plan created
   - Coordinator addresses findings → Monitor confirms resolution
   - **Preparation checklist**: Documents to have ready

**4. Data Query Resolution Workflow**:
   - Data Manager raises query → Coordinator receives notification
   - Coordinator reviews source documents → Identifies resolution
   - If clinical question: Escalate to PI for review
   - Response entered in EDC system → Query marked resolved
   - **Aging metrics**: Queries by age (0-30, 31-60, >60 days)

**5. IRB Amendment Submission Workflow**:
   - Sponsor initiates protocol amendment → Documents sent to site
   - Coordinator reviews changes → Schedules PI review meeting
   - PI approves amendment → IRB submission prepared
   - Coordinator submits to IRB → Tracks approval status
   - IRB approval received → Site regulatory binder updated
   - Team training on changes → Documentation filed
   - **Version control critical**: New consent forms, protocol pages

For each workflow, include: roles involved, decision points, required documentation, typical timelines, and common mistakes to avoid.`;
      
      case 'trialTimeline':
        return basePrompt + `
Develop a comprehensive trial timeline with detailed milestones, dependencies, and risk mitigation strategies.

For the Mermaid diagram: Create a Gantt chart showing all trial phases from regulatory submission through database lock, with key milestones, parallel activities, and critical path highlighted. Show dependencies between activities.

Include detailed timeline for each phase:

**1. Pre-Study Phase (Months -6 to 0)**:
   - **Regulatory Submissions**:
     - IRB submission preparation (Week -24)
     - IRB review period (Weeks -20 to -16, allow 30-45 days)
     - IRB approval and activation (Week -16)
     - Site contract negotiations (parallel, Weeks -20 to -12)

   - **Site Setup**:
     - Site selection and feasibility (Weeks -24 to -20)
     - Site initiation visit scheduling (Week -12)
     - Staff training completion (Week -8)
     - Pharmacy setup and drug delivery (Weeks -8 to -4)
     - Site activation (Week 0 - ready for first patient)

   - **Risk mitigation**: Buffer time for IRB revisions, backup sites identified

**2. Enrollment Phase (Months 1-12)**:
   - **Target enrollment**: [X] subjects over [Y] months
   - **Enrollment milestones**:
     - First patient screened (Month 1, Week 1)
     - First patient randomized (Month 1, Week 2)
     - 25% enrollment (Month 3)
     - 50% enrollment (Month 6)
     - 75% enrollment (Month 9)
     - Last patient enrolled (Month 12)

   - **Enrollment monitoring**:
     - Weekly screening reports (identify slow enrollment early)
     - Monthly enrollment forecast updates
     - Trigger points for enrollment rescue plan (if <80% of target by Month 6)

   - **Risk mitigation**: Identify additional sites if enrollment falls behind, screen failure rate assumptions

**3. Treatment Phase (Months 1-18)**:
   - Treatment duration per subject: [X] weeks/months
   - Overlap with enrollment (subjects at different treatment stages)
   - **Key monitoring points**:
     - Interim safety review (after first 10 subjects complete 4 weeks)
     - DSMB review milestones (if applicable)
     - Data cleaning checkpoints (monthly CRF review)

   - **Risk mitigation**: Protocol deviation tracking, query resolution timelines

**4. Follow-up Phase (Months 12-24)**:
   - Last patient last visit (LPLV) target date
   - Extended follow-up requirements
   - Safety follow-up for discontinued subjects

   - **Risk mitigation**: Subject retention strategies, backup contact procedures

**5. Data Lock & Analysis (Months 22-24)**:
   - All CRF queries resolved (Month 22)
   - Database QC and final cleaning (Month 23, Weeks 1-2)
   - Database lock (Month 23, Week 3)
   - Statistical analysis (Month 23, Weeks 3-4)
   - Final study report (Month 24)

   - **Risk mitigation**: Query resolution deadlines with escalation, dedicated data cleaning resources

**6. Closeout Phase (Months 23-24)**:
   - Site closeout visits scheduled (after LPLV + 30 days)
   - Drug accountability finalized
   - Essential documents archived
   - Regulatory binder final audit

**Critical Path Analysis**:
- Identify activities that cannot be delayed without pushing trial completion
- Parallel activities that can help compress timeline
- Dependencies (e.g., can't randomize until IRB approval, can't lock database until all queries resolved)

**Risk Factors & Contingencies**:
- Slow enrollment: Plan to add sites if needed
- High screen failure rate: Protocol eligibility criteria review
- Data quality issues: More frequent monitoring visits
- Regulatory delays: IRB submission buffer time
- Subject retention: Engagement strategies, visit reminders

For each milestone, specify: target date, responsible party, dependencies, deliverables, and how completion is verified.`;
      
      case 'qualityMetrics':
        return basePrompt + `
Define comprehensive quality and performance metrics for this clinical trial that demonstrate operational excellence and audit readiness.

For the Mermaid diagram: Create a flowchart showing how different quality metrics connect to compliance outcomes and trial success, or a dashboard-style diagram showing key metric categories and their target ranges (green/yellow/red zones).

Include detailed metrics across key categories:

**1. Enrollment & Retention Metrics**:
   - **Screening-to-enrollment ratio**: Target <3:1 (fewer screen failures = better protocol design or patient selection)
   - **Enrollment rate**: Subjects per site per month (track vs. target)
   - **Enrollment forecast accuracy**: Actual vs. projected enrollment
   - **Subject retention rate**: % completing study (target >85%)
   - **Dropout reasons**: Track reasons (adverse events, lost to follow-up, withdrawal of consent)
   - **Visit compliance**: % of visits within protocol windows (target >95%)

**2. Data Quality Metrics**:
   - **Query rate**: Queries per CRF page (target <0.5 queries/page)
   - **Query aging**: % of queries >30 days old (target <10%)
   - **Query resolution time**: Average days to resolve (target <7 days)
   - **Source data verification (SDV) error rate**: % of verified data with discrepancies (target <5%)
   - **CRF completion timeliness**: % of CRFs completed within 5 days of visit (target >90%)
   - **Missing data rate**: % of required fields missing (target <2%)

**3. Compliance & Regulatory Metrics**:
   - **Protocol deviation rate**: Deviations per subject (track trends, investigate if increasing)
   - **Major vs. minor deviations**: Categorize by severity
   - **SAE reporting timeliness**: % of SAEs reported within regulatory timelines (target 100%)
   - **ICF version compliance**: % of subjects consented with current ICF version (target 100%)
   - **Training compliance**: % of staff with current GCP and protocol training (target 100%)
   - **IRB approval timeliness**: Days to IRB approval for amendments (track for planning)
   - **Document completeness**: % of essential documents filed (target 100%)

**4. Operational Efficiency Metrics**:
   - **Monitoring visit findings**: Number of findings per visit (track trends over time)
   - **CAPA closure rate**: % of corrective actions closed on time (target >90%)
   - **Audit readiness score**: Self-assessment score on regulatory binder completeness
   - **Signature turnaround time**: Days to get PI signatures on required documents (target <3 days)
   - **Lab sample processing**: % of samples processed per protocol (target 100%)
   - **Drug accountability accuracy**: % of drug accountability records reconciled (target 100%)

**5. Safety Monitoring Metrics**:
   - **Adverse event rate**: AEs per subject (compare to expected based on similar trials)
   - **Serious adverse event rate**: SAEs per subject
   - **Causality assessment timeliness**: Days from AE to PI causality determination (target <2 days)
   - **Safety signal detection**: Unexpected patterns or clusters

**Dashboard & Reporting**:
- **Weekly metrics**: Enrollment, screening, query aging
- **Monthly metrics**: Full quality scorecard, trends, red flag alerts
- **Quarterly metrics**: Comprehensive trial health assessment
- **Audit readiness score**: Continuous self-assessment (1-100 scale)

**Benchmarks & Targets**:
For each metric, provide:
- Definition and calculation method
- Target value (green zone)
- Warning threshold (yellow zone - triggers monitoring)
- Critical threshold (red zone - triggers immediate action)
- Data source (where to pull the metric)
- Reporting frequency (weekly, monthly, quarterly)
- Responsible party for tracking

**Using Metrics for Improvement**:
- How to identify trends that indicate problems early
- When metrics trigger corrective action plans
- How to present metrics to sponsors and oversight committees`;
      
      default:
        return basePrompt + `
Generate trial coordination documentation for "${getTabDisplayName(persona, currentTab)}" that helps the trial team stay organized and operational.

For the Mermaid diagram: Create a relevant flowchart, timeline, or workflow diagram that visualizes the key operational processes and team coordination points.

Include practical guidance, checklists, and coordination strategies.`;
    }
  }
}

// Mock implementations to replace the LLM functionality
export async function getAIResponse(prompt: string, persona: Persona, currentTab: string): Promise<string> {
  console.log(`Generating response for ${persona} in tab ${currentTab}`);
  await new Promise(resolve => setTimeout(resolve, 500));

  return `This is a simulated AI response. In a real implementation, this would connect to an AI service.

You asked: "${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}"

As a ${persona === 'regulatoryAdvisor' ? 'Regulatory Compliance Advisor' : 'Trial Operations Coordinator'}, I'm here to help with the ${getTabDisplayName(persona, currentTab)} aspect of your clinical trial.`;
}

export async function generateVisualizationSuggestion(
  message: string, 
  persona: Persona,
  currentTab: string
): Promise<VisualizationSuggestion> {
  console.log(`Checking for visualization opportunities for message in ${currentTab}`);
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Simplified mock implementation
  const dummyVisualization: VisualizationSuggestion = {
    shouldCreateVisualization: Math.random() > 0.5,
    title: 'Sample Visualization',
    description: 'A sample visualization for demonstration purposes',
    type: Math.random() > 0.5 ? 'chart' : 'diagram',
    chartType: ['bar', 'line', 'pie', 'scatter'][Math.floor(Math.random() * 4)] as any,
    labels: ['A', 'B', 'C', 'D', 'E'],
    data: [10, 20, 30, 25, 15],
    code: 'graph TD;\n    A[Start] --> B{Decision};\n    B -->|Yes| C[Do Something];\n    B -->|No| D[Do Nothing];\n    C --> E[End];\n    D --> E;'
  };
  
  return dummyVisualization;
}

// Updated to use real AI service with caching
export async function generateTabContent(
  persona: Persona, 
  currentTab: TabType | string, 
  projectInfo: Record<string, string> = {},
  projectId?: string,
  forceRefresh: boolean = false
): Promise<string> {
  console.log(`Generating content for ${persona} tab ${currentTab} with project info, forceRefresh: ${forceRefresh}`);
  
  try {
    // Step 1: Generate initial draft based on tab-specific prompt
    const tabPrompt = getTabPrompt(persona, currentTab, projectInfo);
    const systemPrompt = getSystemPrompt(persona, currentTab);
    
    const fullPrompt = `${systemPrompt}\n\n${tabPrompt}\n\nCRITICAL: Remember to start with a Mermaid.js diagram in proper syntax enclosed in a code block. The diagram should be directly relevant to the content and help visualize the key concepts.`;
    
    // Make the first AI call to generate initial content with caching
    const initialResult = await generateAIResponse({
      prompt: fullPrompt,
      forceRefresh,
      projectId,
      persona,
      tabType: currentTab
    });
    
    if (!initialResult.success || !initialResult.response) {
      throw new Error(initialResult.error || 'Failed to generate initial content');
    }
    
    // If this was a cached response, return it directly to avoid unnecessary refinement
    if (initialResult.cached && !forceRefresh) {
      console.log('Returning cached content for tab:', currentTab);
      return initialResult.response;
    }
    
    // Step 2: Refine the content and check for consistency (only for fresh content)
    const refinementPrompt = `
You previously generated content for the "${getTabDisplayName(persona, currentTab)}" section.

Here is the content you generated:

${initialResult.response}

Please review this content and:
1. Check for any inconsistencies or gaps
2. Ensure it aligns with the project requirements
3. Make it more specific and actionable
4. Format it for readability
5. Add any missing critical information

Provide an improved, refined version of this content.`;
    
    const refinementResult = await generateAIResponse({
      prompt: refinementPrompt,
      forceRefresh,
      projectId,
      persona,
      tabType: `${currentTab}_refinement`
    });
    
    if (!refinementResult.success || !refinementResult.response) {
      // If refinement fails, return the initial content
      return initialResult.response;
    }
    
    // Return the refined content
    return refinementResult.response;
  } catch (error) {
    console.error('Error generating tab content:', error);
    return `# ${getTabDisplayName(persona, currentTab)} (Error)
    
There was an error generating content for this tab. Please try again later or contact support.

Error details: ${error instanceof Error ? error.message : String(error)}`;
  }
}

// Enhanced function that generates comprehensive tab content with multiple LLM calls
export async function generateComprehensiveTabContent(
  persona: Persona, 
  currentTab: TabType | string, 
  projectInfo: Record<string, string> = {},
  projectId?: string,
  forceRefresh: boolean = false
): Promise<string> {
  console.log(`Generating comprehensive content for ${persona} tab ${currentTab}, forceRefresh: ${forceRefresh}`);
  
  try {
    // Step 1: Generate initial draft with detailed prompting
    const tabPrompt = getTabPrompt(persona, currentTab, projectInfo);
    const systemPrompt = getSystemPrompt(persona, currentTab);
    
    const fullPrompt = `${systemPrompt}\n\n${tabPrompt}\n\nPlease be comprehensive and specific with your response, providing actionable information based on the project details. 

CRITICAL: Remember to start with a Mermaid.js diagram in proper syntax enclosed in a code block. The diagram should be directly relevant to the content and help visualize the key concepts.`;
    
    const initialResult = await generateAIResponse({
      prompt: fullPrompt,
      forceRefresh,
      projectId,
      persona,
      tabType: `${currentTab}_comprehensive`
    });
    
    if (!initialResult.success || !initialResult.response) {
      throw new Error(initialResult.error || 'Failed to generate initial content');
    }
    
    // If this was a cached response, return it directly to avoid multiple API calls
    if (initialResult.cached && !forceRefresh) {
      console.log('Returning cached comprehensive content for tab:', currentTab);
      return initialResult.response;
    }
    
    // Step 2: Generate alternative perspective (only for fresh content)
    const alternativePerspectivePrompt = `
As a different ${persona === 'regulatoryAdvisor' ? 'regulatory strategist' : 'operations lead'} with expertise in ${getTabDisplayName(persona, currentTab)}, 
review this project information and provide your own perspective on what should be included in the ${getTabDisplayName(persona, currentTab)} documentation:

Project Information:
${Object.entries(projectInfo)
  .map(([key, value]) => `${key}: ${value}`)
  .join('\n')}

Provide a different approach or additional considerations that might have been missed in conventional thinking.`;
    
    const alternativeResult = await generateAIResponse({
      prompt: alternativePerspectivePrompt,
      forceRefresh,
      projectId,
      persona,
      tabType: `${currentTab}_alternative`
    });
    
    let alternativePerspective = "No alternative perspective could be generated.";
    if (alternativeResult.success && alternativeResult.response) {
      alternativePerspective = alternativeResult.response;
    }
    
    // Step 3: Consolidate and resolve any conflicts between perspectives
    const consolidationPrompt = `
I have two different perspectives on the ${getTabDisplayName(persona, currentTab)} for this project:

PERSPECTIVE 1:
${initialResult.response}

PERSPECTIVE 2:
${alternativePerspective}

Please analyze these perspectives and create a consolidated, comprehensive ${getTabDisplayName(persona, currentTab)} document that:
1. Incorporates the strengths of both perspectives
2. Resolves any conflicts or contradictions
3. Ensures all key information is included
4. Is well-structured with clear sections and formatting
5. Provides specific, actionable guidance rather than generic information

The final document should be ready to share with stakeholders.`;
    
    const consolidatedResult = await generateAIResponse({
      prompt: consolidationPrompt,
      forceRefresh,
      projectId,
      persona,
      tabType: `${currentTab}_consolidated`
    });
    
    if (!consolidatedResult.success || !consolidatedResult.response) {
      // If consolidation fails, return the initial content
      return initialResult.response;
    }
    
    // Step 4: Final polish with appropriate formatting
    const polishingPrompt = `
Please review and polish this ${getTabDisplayName(persona, currentTab)} document:
${consolidatedResult.response}

Ensure it:
1. Has a professional, well-structured format
2. Uses clear headings and subheadings
3. Includes bullet points where appropriate
4. Has consistent terminology
5. Is free of redundancy or filler content
6. Maintains a ${persona === 'regulatoryAdvisor' ? 'compliance-focused and precise' : 'operational and actionable'} tone
7. Would be immediately useful to the project team

Return only the polished document with Markdown formatting, without any preface, explanation, or meta commentary.
Do not include phrases like "Of course", "I have reviewed", or "Here is the polished version"—start directly with the document content.`;
    
    const polishedResult = await generateAIResponse({
      prompt: polishingPrompt,
      forceRefresh,
      projectId,
      persona,
      tabType: `${currentTab}_polished`
    });
    
    if (!polishedResult.success || !polishedResult.response) {
      // If polishing fails, return the consolidated content
      return consolidatedResult.response;
    }

    // Strip any leftover meta-preface lines the model might still include
    const rawPolished = polishedResult.response.trimStart();

    // Remove one or more leading lines that look like generic LLM prefaces
    // (e.g., "Of course...", "Certainly...", "Sure...", "Here is...",
    //  "I have reviewed...", "Below is...", etc.)
    const cleanedPolished = rawPolished.replace(
      /^(?:\s*(?:Of course|Certainly|Sure|Absolutely|Yes,|I have reviewed|I have polished|I've reviewed|I've polished|Here is|Heres|Here is the polished version|Below is|Below you'll find|In this document)[^\n]*\n)+/i,
      ''
    );

    const finalText = cleanedPolished.trimStart();
    return finalText.length > 0 ? finalText : rawPolished;
  } catch (error) {
    console.error('Error generating comprehensive tab content:', error);
    return `# ${getTabDisplayName(persona, currentTab)} (Error)
    
There was an error generating comprehensive content for this tab. Please try again later or contact support.

Error details: ${error instanceof Error ? error.message : String(error)}`;
  }
} 