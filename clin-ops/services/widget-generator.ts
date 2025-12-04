import * as fs from 'fs';
import { restructureToJSON, structuredToDashboardWidgets } from './mcp-data-restructurer';

// Define types for our parsed data
interface ParsedTab {
  tabName: string;
  content: string;
}

interface ParsedPersona {
  personaName: string;
  tabs: ParsedTab[];
}

/**
 * Reads the LLMResponses.txt file and parses it into structured data
 */
export function parseLLMResponses(filePath: string): ParsedPersona[] {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const lines = fileContent.split('\n');

  const personas: ParsedPersona[] = [];
  let currentPersona: ParsedPersona | null = null;
  let currentTab: ParsedTab | null = null;
  let buffer: string[] = [];

  // Helper to save current tab buffer
  const saveCurrentTab = () => {
    if (currentTab && currentPersona) {
      currentTab.content = buffer.join('\n').trim();
      currentPersona.tabs.push(currentTab);
      buffer = [];
      currentTab = null;
    }
  };

  // Helper to save current persona
  const saveCurrentPersona = () => {
    saveCurrentTab(); // Ensure last tab is saved
    if (currentPersona) {
      personas.push(currentPersona);
      currentPersona = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check for Persona header
    if (line.startsWith('Agent Persona')) {
      saveCurrentPersona();
      currentPersona = {
        personaName: line,
        tabs: []
      };
      continue;
    }

    // Check for Tab header (usually followed by "Refresh" or just a header)
    if (line === 'Refresh') {
      // The line BEFORE "Refresh" is likely the tab name
      let tabNameLineIndex = i - 1;
      while (tabNameLineIndex >= 0 && lines[tabNameLineIndex].trim() === '') {
        tabNameLineIndex--;
      }

      if (tabNameLineIndex >= 0) {
        const potentialTabName = lines[tabNameLineIndex].trim();

        // If we were already capturing a tab, save it.
        saveCurrentTab();

        currentTab = {
          tabName: potentialTabName,
          content: ''
        };

        continue;
      }
    }

    // If we are inside a tab, add line to buffer
    if (currentTab) {
      buffer.push(lines[i]);
    }
  }

  saveCurrentPersona();

  return personas;
}

/**
 * Main function to generate widgets from the file
 */
export async function generateWidgetsFromFile(
  inputFilePath: string,
  outputFilePath: string,
  projectId: string = 'project-123'
) {
  console.log(`Parsing file: ${inputFilePath}`);
  const personas = parseLLMResponses(inputFilePath);

  const allWidgets: any[] = [];
  const dbReadyWidgets: any[] = [];

  for (const persona of personas) {
    console.log(`Processing Persona: ${persona.personaName}`);

    // Map persona string to enum if possible
    let personaEnum = 'trialCoordinator'; // Default
    if (persona.personaName.toLowerCase().includes('regulatory')) {
      personaEnum = 'regulatoryAdvisor';
    }

    for (const tab of persona.tabs) {
      console.log(`  Processing Tab: ${tab.tabName}`);

      // Map tab name to enum
      let tabType = 'general';
      const lowerTab = tab.tabName.toLowerCase();
      if (lowerTab.includes('overview')) tabType = 'trialOverview';
      else if (lowerTab.includes('checklist')) tabType = 'taskChecklists';
      else if (lowerTab.includes('workflow')) tabType = 'teamWorkflows';
      else if (lowerTab.includes('timeline')) tabType = 'trialTimeline';
      else if (lowerTab.includes('quality')) tabType = 'qualityMetrics';
      else if (lowerTab.includes('document')) tabType = 'documentControl';
      else if (lowerTab.includes('compliance')) tabType = 'complianceDiagrams';
      else if (lowerTab.includes('risk')) tabType = 'riskControls';
      else if (lowerTab.includes('audit')) tabType = 'auditPreparation';
      else if (lowerTab.includes('alert')) tabType = 'smartAlerts';

      try {
        const structuredData = await restructureToJSON(
          tab.content,
          tabType,
          personaEnum,
          projectId
        );

        // Add metadata to help identify source
        const enrichedWidgets = structuredData.widgets.map(w => ({
          ...w,
          sourcePersona: persona.personaName,
          sourceTab: tab.tabName,
          tabType: tabType
        }));

        allWidgets.push(...enrichedWidgets);

        // Convert to DB format
        const dbWidgets = structuredToDashboardWidgets(structuredData, projectId, 'system-agent');
        dbReadyWidgets.push(...dbWidgets);

      } catch (error) {
        console.error(`    Error processing tab ${tab.tabName}:`, error);
      }
    }
  }

  const output = {
    generatedAt: new Date().toISOString(),
    widgets: allWidgets,
    dbWidgets: dbReadyWidgets
  };

  fs.writeFileSync(outputFilePath, JSON.stringify(output, null, 2));
  console.log(`Widgets saved to: ${outputFilePath}`);
  return output;
}
