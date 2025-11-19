
'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { HiPaperAirplane } from 'react-icons/hi2'
import { HiCheckCircle, HiQuestionMarkCircle, HiRefresh, HiOutlineTrash, HiViewGrid, HiOutlineThumbUp, HiOutlineThumbDown } from 'react-icons/hi'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import MermaidDiagram from './MermaidDiagram'
import './style.css'
import { generateAIResponse } from '@/services/ai-client'
import { generateTabContent, generateComprehensiveTabContent, Persona, TabType as BaseTabType, getTabDisplayName } from '@/services/llm'
import { loadChatData, saveChatData, autoSaveChatData, clearChatData, ChatMessage as ChatMessageType } from '@/services/aiChat'

// Extend the TabType to include 'general'
type TabType = BaseTabType | 'general';

// Types
type Message = {
  text: string
  sender: 'user' | 'ai'
  persona?: Persona
}

// Essential project questions
type ProjectQuestion = {
  id: string
  question: string
  answered: boolean
  answer?: string
}

// Enhanced markdown renderer component using react-markdown with Mermaid support
// Wrapped with React.memo to prevent unnecessary re-renders
const SimpleMarkdownRenderer: React.FC<{ content: string; projectId?: string; contextInfo?: string }> = React.memo(({ content, projectId, contextInfo }) => {
  if (!content || typeof content !== 'string') {
    return <p className="text-xs text-gray-500">No content available</p>;
  }

  // Function to detect and extract Mermaid diagrams
  const processMermaidDiagrams = (text: string) => {
    const parts = [];
    let lastIndex = 0;

    // More precise regex for Mermaid code blocks that preserves content exactly
    const codeBlockRegex = /```(?:mermaid|diagram)?\s*\n([\s\S]*?)```/g;
    
    let match;

    // Find all code blocks that might contain Mermaid diagrams
    while ((match = codeBlockRegex.exec(text)) !== null) {
      const diagramContent = match[1].trim();
      
      // Check if this looks like a Mermaid diagram by checking for known diagram types
      const isMermaidDiagram = /^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gantt|pie|gitgraph|mindmap|timeline|sankey|xychart|quadrantChart|requirement|C4Context|C4Container|C4Component|C4Dynamic|C4Deployment)\b/i.test(diagramContent);
      
      // Also check for common Mermaid patterns (arrows, participants, etc.)
      const hasArrowPatterns = /-->|->|--|\|\||participant\s+|actor\s+|\->>|\-\->>/.test(diagramContent);
      
      if (isMermaidDiagram || hasArrowPatterns) {
        // Add text before the diagram
        if (match.index > lastIndex) {
          const textBefore = text.slice(lastIndex, match.index);
          if (textBefore.trim()) {
            parts.push({ type: 'markdown', content: textBefore });
          }
        }

        // Use the diagram content exactly as provided, with minimal cleaning
        let cleanDiagram = diagramContent;
        
        // Only normalize line endings - don't modify the content otherwise
        cleanDiagram = cleanDiagram.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        
        // Only add diagram type if it's completely missing and we can detect the intent
        if (!cleanDiagram.match(/^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gantt|pie|gitgraph|mindmap|timeline|sankey|xychart|quadrantChart|requirement|C4Context|C4Container|C4Component|C4Dynamic|C4Deployment)\b/i)) {
          // Try to detect the diagram type from content
          if (/participant\s+|actor\s+|\->>|\-\->>/.test(cleanDiagram)) {
            cleanDiagram = `sequenceDiagram\n${cleanDiagram}`;
          } else if (/-->|->|--/.test(cleanDiagram)) {
            cleanDiagram = `flowchart TD\n${cleanDiagram}`;
          }
        }
        
        parts.push({ type: 'mermaid', content: cleanDiagram });
        lastIndex = match.index + match[0].length;
      }
    }

    // If no code block diagrams found, look for standalone diagrams
    if (parts.length === 0) {
      // Look for standalone Mermaid diagrams (not in code blocks)
      const standaloneRegex = /(?:^|\n\n)((?:graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gantt|pie|gitgraph|mindmap|timeline|sankey|xychart|quadrantChart|requirement|C4Context|C4Container|C4Component|C4Dynamic|C4Deployment)\b[\s\S]*?)(?=\n\n|\n\s*[A-Z][a-z]+:|\n\s*$|$)/gi;
      
      while ((match = standaloneRegex.exec(text)) !== null) {
        // Add text before the diagram
        if (match.index > lastIndex) {
          const textBefore = text.slice(lastIndex, match.index);
          if (textBefore.trim()) {
            parts.push({ type: 'markdown', content: textBefore });
          }
        }

        // Use the diagram content with minimal processing
        const diagramContent = match[1].trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        parts.push({ type: 'mermaid', content: diagramContent });
        lastIndex = match.index + match[0].length;
      }
    }

    // Add remaining text
    if (lastIndex < text.length) {
      const remainingText = text.slice(lastIndex);
      if (remainingText.trim()) {
        parts.push({ type: 'markdown', content: remainingText });
      }
    }

    // If no diagrams found, return original content as markdown
    if (parts.length === 0) {
      parts.push({ type: 'markdown', content: text });
    }

    return parts;
  };

  const contentParts = processMermaidDiagrams(content);

  // Create a stable hash for diagram content to prevent unnecessary re-renders
  const hashString = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  };

  return (
    <div className="markdown-content prose prose-sm dark:prose-invert max-w-none">
      {contentParts.map((part, index) => {
        if (part.type === 'mermaid') {
          // Use content hash as key to prevent re-renders when diagram content hasn't changed
          const diagramKey = `diagram-${hashString(part.content)}-${index}`;
          return (
            <div key={diagramKey} className="my-4">
              <MermaidDiagram 
                key={diagramKey}
                chart={part.content} 
                projectId={projectId} 
                contextInfo={contextInfo} 
              />
            </div>
          );
        } else {
          return (
            <ReactMarkdown
              key={index}
              remarkPlugins={[remarkGfm]}
              components={{
                // Custom styling for different elements
                h1: ({ children }) => (
                  <h1 className="text-lg font-bold mb-4 mt-6 text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-base font-semibold mb-3 mt-5 text-gray-800 dark:text-gray-200">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-sm font-medium mb-2 mt-4 text-gray-700 dark:text-gray-300">
                    {children}
                  </h3>
                ),
                h4: ({ children }) => (
                  <h4 className="text-xs font-medium mb-2 mt-3 text-gray-600 dark:text-gray-400">
                    {children}
                  </h4>
                ),
                p: ({ children }) => (
                  <p className="text-xs leading-relaxed mb-3 text-gray-700 dark:text-gray-300">
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside mb-4 ml-4 space-y-1">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside mb-4 ml-4 space-y-1">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="text-xs leading-relaxed text-gray-700 dark:text-gray-300">
                    {children}
                  </li>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 mb-4 italic text-gray-600 dark:text-gray-400">
                    {children}
                  </blockquote>
                ),
                code: ({ children }) => (
                  <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-xs font-mono">
                    {children}
                  </code>
                ),
                pre: ({ children }) => (
                  <div className="mb-4">
                    <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-xs overflow-x-auto border">
                      {children}
                    </pre>
                  </div>
                ),
                hr: () => (
                  <hr className="border-gray-300 dark:border-gray-600 my-6" />
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold">{children}</strong>
                ),
                em: ({ children }) => (
                  <em className="italic">{children}</em>
                ),
              }}
            >
              {part.content}
            </ReactMarkdown>
          );
        }
      })}
    </div>
  );
});

SimpleMarkdownRenderer.displayName = 'SimpleMarkdownRenderer';

export default function ContextAwareChat() {
  // Get project ID from URL parameters, generate one if not provided
  const { projectId: urlProjectId } = useParams()
  const [projectId, setProjectId] = useState<string | null>(null)
  
  // Generate or use existing project ID
  useEffect(() => {
    if (urlProjectId) {
      setProjectId(urlProjectId as string)
    } else {
      // Generate a new project ID if not in URL
      const newProjectId = `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      setProjectId(newProjectId)
      
      // Optionally update the URL without causing a page reload
      if (typeof window !== 'undefined') {
        const newUrl = `/${newProjectId}`
        window.history.replaceState({}, '', newUrl)
      }
    }
  }, [urlProjectId])
  
  // State
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Hello! I'm your clinical trial operations assistant. I can help you organize your trial, create timelines, manage compliance, and prepare for audits. Let's start by answering some essential questions about your trial in the General tab.",
      sender: 'ai',
      persona: 'trialCoordinator'
    }
  ])
  const [input, setInput] = useState('')
  const [currentPersona, setCurrentPersona] = useState<Persona>('trialCoordinator')
  const [currentTab, setCurrentTab] = useState<TabType>('general')
  const [isLoading, setIsLoading] = useState(false)
  const [tabContent, setTabContent] = useState<Record<string, string>>({})
  const [isTabContentLoading, setIsTabContentLoading] = useState(false)
  const [tabContentGeneration, setTabContentGeneration] = useState<Record<string, 'pending' | 'generating' | 'complete' | 'error'>>({})
  const [isDataLoaded, setIsDataLoaded] = useState(false)
  const [tabsSentToDashboard, setTabsSentToDashboard] = useState<Set<string>>(new Set())
  const [isSendingToDashboard, setIsSendingToDashboard] = useState(false)
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false)
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)
  const [feedbackRating, setFeedbackRating] = useState<'up' | 'down' | null>(null)
  
  // Change request state
  const [changeRequest, setChangeRequest] = useState('')
  const [isProcessingChange, setIsProcessingChange] = useState(false)
  
  // Project questions state
  const [projectQuestions, setProjectQuestions] = useState<ProjectQuestion[]>([
    { id: 'trialName', question: 'What is the trial name and protocol number?', answered: false },
    { id: 'endpoints', question: 'What are the primary and secondary endpoints?', answered: false },
    { id: 'enrollment', question: 'How many sites and patients are planned?', answered: false },
    { id: 'regulations', question: 'What are the key regulatory requirements? (FDA, EMA, local IRB)', answered: false },
    { id: 'duration', question: 'What is the trial duration? (screening, treatment, follow-up)', answered: false },
    { id: 'stakeholders', question: 'Who are the key stakeholders? (PI, coordinators, sponsor, CRO)', answered: false },
    { id: 'risks', question: 'What are the most critical compliance risks you are worried about?', answered: false },
    { id: 'documents', question: 'What documents need version control? (ICF, protocol, lab manual, etc.)', answered: false },
    { id: 'milestones', question: 'What are the major milestones? (first patient in, enrollment complete, data lock)', answered: false },
    { id: 'systems', question: 'What existing tools/systems are you using? (EDC, CTMS, eTMF)', answered: false },
  ])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [showQuestionPrompt, setShowQuestionPrompt] = useState(true)
  
  // Store conversation history for context
  const [conversationHistory, setConversationHistory] = useState<string[]>([
    "Hello! I'm your clinical trial operations assistant. I can help you organize your trial, create timelines, manage compliance, and prepare for audits. Let's start by answering some essential questions about your trial in the General tab."
  ])
  const MAX_CONTEXT_LENGTH = 10 // Keep the last N messages for context

  // Add a new state to track when context has been refreshed
  const [contextRefreshed, setContextRefreshed] = useState(false)

  // Force reload function to manually trigger data loading
  const forceReloadData = async () => {
    if (!projectId) return;
    
    setIsDataLoaded(false);
    
    try {
      const result = await loadChatData(projectId as string);
      
      if (result.success && result.data) {
        const chatData = result.data;
        
        // Restore project questions if they exist
        if (chatData.projectInfo && typeof chatData.projectInfo === 'object') {
          setProjectQuestions(prevQuestions => {
            const updatedQuestions = prevQuestions.map(q => {
              const savedAnswer = chatData.projectInfo?.[q.id] || chatData.projectInfo?.[q.question];
              if (savedAnswer) {
                return { ...q, answered: true, answer: savedAnswer };
              }
              return { ...q, answered: false, answer: undefined };
            });
            
            // Update related states
            const allAnswered = updatedQuestions.every(q => q.answered);
            if (allAnswered) {
              setShowQuestionPrompt(false);
            } else {
              setShowQuestionPrompt(true);
              const firstUnanswered = updatedQuestions.findIndex(q => !q.answered);
              if (firstUnanswered >= 0) {
                setCurrentQuestionIndex(firstUnanswered);
              }
            }
            
            return updatedQuestions;
          });
        }
        
        // Restore other data
        if (chatData.messages && chatData.messages.length > 0) {
          setMessages(chatData.messages as Message[]);
          const history = chatData.messages.map((msg: ChatMessageType) => 
            `${msg.sender === 'user' ? 'User' : 'AI'}: ${msg.text}`
          );
          setConversationHistory(history);
        }
        
        if (chatData.persona) {
          setCurrentPersona(chatData.persona as Persona);
        }
        if (chatData.currentTab) {
          setCurrentTab(chatData.currentTab as TabType);
        }
        
        // Restore tab content and generation status
        if (chatData.tabContent) {
          setTabContent(chatData.tabContent);
        }
        if (chatData.tabContentGeneration) {
          setTabContentGeneration(chatData.tabContentGeneration as Record<string, 'pending' | 'generating' | 'complete' | 'error'>);
        }
      }
    } catch (error) {
      console.error('Error in force reload:', error);
    } finally {
      setIsDataLoaded(true);
    }
  };

  // Load chat data from backend on component mount
  useEffect(() => {
    const loadPersistedData = async () => {
      if (!projectId) return;
      
      try {
        const result = await loadChatData(projectId as string);
        
        if (result.success && result.data) {
          const chatData = result.data;
          
          // Restore messages if they exist
          if (chatData.messages && chatData.messages.length > 0) {
            setMessages(chatData.messages as Message[]);
            
            // Rebuild conversation history from messages
            const history = chatData.messages.map((msg: ChatMessageType) => 
              `${msg.sender === 'user' ? 'User' : 'AI'}: ${msg.text}`
            );
            setConversationHistory(history);
          }
          
          // Restore project questions if they exist
          if (chatData.projectInfo && typeof chatData.projectInfo === 'object') {
            // Create updated questions array
            const updatedQuestions = projectQuestions.map(q => {
              // Check both q.id and transformed keys for backwards compatibility
              const savedAnswer = chatData.projectInfo?.[q.id] || chatData.projectInfo?.[q.question];
              if (savedAnswer) {
                return { ...q, answered: true, answer: savedAnswer };
              }
              return { ...q, answered: false, answer: undefined };
            });
            
            // Update states
            const allAnswered = updatedQuestions.every(q => q.answered);
            
            // Apply the updates
            setProjectQuestions(updatedQuestions);
            
            if (allAnswered) {
              setShowQuestionPrompt(false);
            } else {
              setShowQuestionPrompt(true);
              const firstUnanswered = updatedQuestions.findIndex(q => !q.answered);
              if (firstUnanswered >= 0) {
                setCurrentQuestionIndex(firstUnanswered);
              }
            }
          }
          
          // Restore persona and tab if they exist
          if (chatData.persona) {
            setCurrentPersona(chatData.persona as Persona);
          }
          if (chatData.currentTab) {
            setCurrentTab(chatData.currentTab as TabType);
          }
          
          // Restore tab content and generation status
          if (chatData.tabContent) {
            setTabContent(chatData.tabContent);
          }
          if (chatData.tabContentGeneration) {
            setTabContentGeneration(chatData.tabContentGeneration as Record<string, 'pending' | 'generating' | 'complete' | 'error'>);
          }
        }
      } catch (error) {
        console.error('Error loading chat data:', error);
      } finally {
        setIsDataLoaded(true);
      }
    };

    // Reset data loaded flag when projectId changes to ensure fresh data fetch
    if (projectId && !isDataLoaded) {
      loadPersistedData();
    }
  }, [projectId, isDataLoaded]);

  // Reset isDataLoaded when projectId changes to force fresh data loading
  useEffect(() => {
    if (projectId) {
      setIsDataLoaded(false);
    }
  }, [projectId]);

  // Add visibility change handler to reload data when user returns to tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && projectId && isDataLoaded) {
        // Force a reload to get the latest data
        forceReloadData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [projectId, isDataLoaded]);

  // Save data before page unload/navigation
  useEffect(() => {
    const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
      if (!projectId || !isDataLoaded) return;
      
      try {
        // Prepare project info
        const projectInfo: Record<string, string> = {};
        projectQuestions.forEach(q => {
          if (q.answered && q.answer) {
            projectInfo[q.id] = q.answer;
          }
        });
        

        
                  // Use sendBeacon for reliable data sending during page unload
        if (navigator.sendBeacon && Object.keys(projectInfo).length > 0 && projectId) {
          const data = JSON.stringify({
            projectId,
            userId: 'default-user',
            messages: messages as ChatMessageType[],
            projectInfo,
            persona: currentPersona,
            currentTab,
            tabContent,
            tabContentGeneration
          });
        
        const blob = new Blob([data], { type: 'application/json' });
        navigator.sendBeacon('/api/ai/chat/save', blob);
                } else if (projectId) {
          // Fallback: synchronous save (less reliable but better than nothing)
          saveChatData(
            projectId,
            'default-user',
            messages as ChatMessageType[],
            projectInfo,
            currentPersona,
            currentTab,
            tabContent,
            tabContentGeneration
          );
        }  
      } catch (error) {
        console.error('Error saving data before unload:', error);
      }
    };

    // Add event listener
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [projectId, isDataLoaded, projectQuestions, messages, currentPersona, currentTab, tabContent, tabContentGeneration]);

  // Auto-save chat data when state changes
  useEffect(() => {
    console.log('Auto-save useEffect triggered with projectId:', projectId, 'isDataLoaded:', isDataLoaded);
    if (!projectId || !isDataLoaded) return;
    
    // Convert project questions to a simple object for saving
    const projectInfo: Record<string, string> = {};
    projectQuestions.forEach(q => {
      if (q.answered && q.answer) {
        projectInfo[q.id] = q.answer;
      }
    });
    
    // Only auto-save if there's actually data to save and we have a valid projectId
    if (projectId && (Object.keys(projectInfo).length > 0 || messages.length > 1)) {
      autoSaveChatData(
        projectId,
        'default-user',
        messages as ChatMessageType[],
        projectInfo,
        currentPersona,
        currentTab,
        tabContent,
        tabContentGeneration
      );
    }
  }, [messages, projectQuestions, currentPersona, currentTab, projectId, isDataLoaded, tabContent, tabContentGeneration]);

  // Manual save function for immediate saves
  const saveDataNow = async () => {
    if (!projectId) return;
    
    try {
      const projectInfo: Record<string, string> = {};
      projectQuestions.forEach(q => {
        if (q.answered && q.answer) {
          projectInfo[q.id] = q.answer;
        }
      });
      
      if (projectId) {
        await saveChatData(
          projectId,
          'default-user',
          messages as ChatMessageType[],
          projectInfo,
          currentPersona,
          currentTab,
          tabContent,
          tabContentGeneration
        );
      }
    } catch (error) {
      console.error('Error saving chat data manually:', error);
    }
  };

  // Clear all chat data - Enhanced with better state reset
  const clearAllChatData = async () => {
    if (!projectId) return;
    
    try {
      const result = await clearChatData(projectId as string);
      
      if (result.success) {
        // Reset to initial state
        setMessages([
          {
            text: "Hello! I'm your clinical trial operations assistant. I can help you organize your trial, create timelines, manage compliance, and prepare for audits. Let's start by answering some essential questions about your trial in the General tab.",
            sender: 'ai',
            persona: 'trialCoordinator'
          }
        ]);
        setConversationHistory([
          "Hello! I'm your clinical trial operations assistant. I can help you organize your trial, create timelines, manage compliance, and prepare for audits. Let's start by answering some essential questions about your trial in the General tab."
        ]);
        setProjectQuestions([
          { id: 'trialName', question: 'What is the trial name and protocol number?', answered: false },
          { id: 'endpoints', question: 'What are the primary and secondary endpoints?', answered: false },
          { id: 'enrollment', question: 'How many sites and patients are planned?', answered: false },
          { id: 'regulations', question: 'What are the key regulatory requirements? (FDA, EMA, local IRB)', answered: false },
          { id: 'duration', question: 'What is the trial duration? (screening, treatment, follow-up)', answered: false },
          { id: 'stakeholders', question: 'Who are the key stakeholders? (PI, coordinators, sponsor, CRO)', answered: false },
          { id: 'risks', question: 'What are the most critical compliance risks you are worried about?', answered: false },
          { id: 'documents', question: 'What documents need version control? (ICF, protocol, lab manual, etc.)', answered: false },
          { id: 'milestones', question: 'What are the major milestones? (first patient in, enrollment complete, data lock)', answered: false },
          { id: 'systems', question: 'What existing tools/systems are you using? (EDC, CTMS, eTMF)', answered: false },
        ]);
        setCurrentQuestionIndex(0);
        setShowQuestionPrompt(true);
        setCurrentPersona('trialCoordinator');
        setCurrentTab('general');
        setTabContent({});
        setTabContentGeneration({});
        
      } else {
        // Show user-friendly error message
        alert('Failed to clear chat data. Please try again.');
      }
    } catch (error) {
      console.error('Error clearing chat data:', error);
      alert('An error occurred while clearing chat data. Please try again.');
    }
  };

  // Function to gather project information from answered questions
  const getProjectInfo = (): Record<string, string> => {
    return projectQuestions.reduce((info, question) => {
      if (question.answered && question.answer) {
        // Create a key from the question (e.g., "What is the main purpose?" -> "Purpose")
        const key = question.question
          .replace(/what is|what are|who are|how will you/i, '')
          .replace(/\?/g, '')
          .trim()
          .split(' ')
          .map((word, index) => index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word)
          .join(' ');
        
        return { ...info, [key]: question.answer };
      }
      return info;
    }, {});
  };

  // Change persona and set appropriate default tab
  const changePersona = (persona: Persona) => {
    setCurrentPersona(persona);

    // Only change tab if we're not on the general tab to preserve question state
    if (currentTab !== 'general') {
      if (persona === 'trialCoordinator') {
        setCurrentTab('trialOverview');
      } else {
        setCurrentTab('protocolRequirements');
      }
    }
  }

  const handleSubmitFeedback = async () => {
    if (!feedbackMessage.trim()) return
    try {
      setIsSubmittingFeedback(true)
      setFeedbackSubmitted(false)
      const prefix = feedbackRating === 'up'
        ? '[Thumbs Up] '
        : feedbackRating === 'down'
          ? '[Thumbs Down] '
          : ''
      const messageToSend = `${prefix}${feedbackMessage.trim()}`
      await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageToSend,
          persona: currentPersona,
          tabType: currentTab,
          projectId,
          userId: 'default-user',
        }),
      })
      setFeedbackSubmitted(true)
      setFeedbackMessage('')
      setTimeout(() => {
        setIsFeedbackOpen(false)
        setFeedbackSubmitted(false)
        setFeedbackRating(null)
      }, 1200)
    } catch (error) {
      console.error('Error submitting feedback:', error)
    } finally {
      setIsSubmittingFeedback(false)
    }
  }

  // Create a context-aware prompt by including previous messages
  const createContextAwarePrompt = (userInput: string): string => {
    // Combine conversation history but limit to prevent token overflow
    const recentHistory = conversationHistory.slice(-MAX_CONTEXT_LENGTH);
    
    // Get project information for context
    const projectInfo = getProjectInfo();
    const hasProjectInfo = Object.keys(projectInfo).length > 0;
    
    // Format the context and new prompt with diagram encouragement
    const contextPrefix = recentHistory.length > 0 
      ? `Previous conversation:\n${recentHistory.join('\n')}\n\nNew message: `
      : '';
    
    const diagramEncouragement = hasProjectInfo 
      ? `\n\nWhen appropriate for the topic, please include relevant Mermaid.js diagrams in your response using proper syntax enclosed in code blocks like this:
\`\`\`mermaid
[your mermaid diagram here]
\`\`\`

Use diagram types like flowchart, sequenceDiagram, erDiagram, classDiagram, gantt, journey, etc. to help visualize concepts, processes, or system architecture.`
      : '';
      
    return contextPrefix + userInput + diagramEncouragement;
  }

  // Check if the message might be answering a project question
  const checkForQuestionAnswer = (userMessage: string, aiResponse: string) => {
    if (currentTab !== 'general' || !showQuestionPrompt) return false;
    
    const currentQuestion = projectQuestions[currentQuestionIndex];
    if (!currentQuestion) return false;
    
    // Accept any non-empty answer
    if (userMessage.trim().length > 0) {
      const updatedQuestions = [...projectQuestions];
      updatedQuestions[currentQuestionIndex] = {
        ...currentQuestion,
        answered: true,
        answer: userMessage
      };
      
      setProjectQuestions(updatedQuestions);
      
      // Immediately save after answering a question
      const projectInfo: Record<string, string> = {};
      updatedQuestions.forEach(q => {
        if (q.answered && q.answer) {
          projectInfo[q.id] = q.answer;
        }
      });
      
      // Force an immediate save instead of waiting for auto-save
      if (projectId) {
        saveChatData(
          projectId,
          'default-user', // Add default userId
          messages as ChatMessageType[],
          projectInfo,
          currentPersona,
          currentTab,
          tabContent,
          tabContentGeneration
        ).catch(error => {
          console.error('Failed to save question answer:', error);
        });
      }
      
      // Move to next unanswered question
      const nextIndex = findNextUnansweredQuestionIndex(updatedQuestions, currentQuestionIndex);
      setCurrentQuestionIndex(nextIndex);
      
      // Check if we've completed all questions or should continue asking
      if (nextIndex === currentQuestionIndex || updatedQuestions.every(q => q.answered)) {
        // All questions answered
        setTimeout(() => {
          const completionMessage = {
            text: "Great! You've answered all the essential project questions. This will help me provide better assistance. I'll now generate content for the other tabs based on this information.",
            sender: 'ai' as const,
            persona: currentPersona
          };
          setMessages(prev => [...prev, completionMessage]);
          setConversationHistory(prev => [...prev, `AI: ${completionMessage.text}`]);
          setShowQuestionPrompt(false);
          
          // Start generating content for all tabs now that we have project info
          generateAllTabContent();
        }, 1000);
              } else {
          // Still have more questions to answer, just show the next question
        setTimeout(() => {
          const nextQuestion = updatedQuestions[nextIndex];
          const questionMessage = {
            text: `${nextQuestion.question}`,
            sender: 'ai' as const,
            persona: currentPersona
          };
          setMessages(prev => [...prev, questionMessage]);
          // We're not adding this to conversation history since we're just collecting data
        }, 500);
      }
      
      // Return true to indicate we've handled this message as a question answer
      return true;
    }
    
    return false;
  };
  
  // Find the next unanswered question index
  const findNextUnansweredQuestionIndex = (questions: ProjectQuestion[], currentIndex: number): number => {
    for (let i = currentIndex + 1; i < questions.length; i++) {
      if (!questions[i].answered) return i;
    }
    // If we reach the end, start from beginning looking for any unanswered questions
    for (let i = 0; i < currentIndex; i++) {
      if (!questions[i].answered) return i;
    }
    // If all questions are answered, return the current index
    return currentIndex;
  };

  // Generate content for all tabs based on project information
  const generateAllTabContent = async () => {
    // Get project information from answered questions
    const projectInfo = getProjectInfo();
    
    // If we don't have enough project information, don't generate content
    if (Object.keys(projectInfo).length < 3) return;
    
    // Set all tabs to pending
    const tabsToGenerate: Record<string, 'pending'> = {};
    
    // Add Regulatory Advisor tabs
    ['protocolRequirements', 'documentControl', 'complianceDiagrams', 'riskControls', 'auditPreparation', 'smartAlerts'].forEach(tab => {
      const tabKey = `regulatoryAdvisor-${tab}`;
      tabsToGenerate[tabKey] = 'pending';
    });

    // Add Trial Coordinator tabs
    ['trialOverview', 'taskChecklists', 'teamWorkflows', 'trialTimeline', 'qualityMetrics'].forEach(tab => {
      const tabKey = `trialCoordinator-${tab}`;
      tabsToGenerate[tabKey] = 'pending';
    });
    
    setTabContentGeneration(prev => ({
      ...prev,
      ...tabsToGenerate
    }));
    
    // Now generate content for each tab in the background
    Object.keys(tabsToGenerate).forEach(async (tabKey) => {
      const [persona, tab] = tabKey.split('-') as [Persona, TabType];
      
      try {
        // Update status to generating
        setTabContentGeneration(prev => ({
          ...prev,
          [tabKey]: 'generating'
        }));
        
        // Generate comprehensive content for this tab with caching
        const content = await generateComprehensiveTabContent(
          persona, 
          tab, 
          projectInfo, 
          projectId || 'default-project', 
          false // forceRefresh = false for initial generation (use cache if available)
        );
        
        // Store the generated content
        setTabContent(prev => ({
          ...prev,
          [tabKey]: content
        }));
        
        // Update status to complete
        setTabContentGeneration(prev => ({
          ...prev,
          [tabKey]: 'complete'
        }));
      } catch (error) {
        console.error(`Error generating content for ${tabKey}:`, error);
        
        // Update status to error
        setTabContentGeneration(prev => ({
          ...prev,
          [tabKey]: 'error'
        }));
      }
    });
  };

  // Handle sending messages
  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return
    
    const userInput = input.trim();
    
    // Add user message
    const userMessage: Message = { 
      text: userInput, 
      sender: 'user' 
    }
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // For the General tab and when in question mode, handle as a question answer first
      if (currentTab === 'general' && showQuestionPrompt) {
        const isQuestionAnswer = checkForQuestionAnswer(userInput, "");
        
        if (isQuestionAnswer) {
          setIsLoading(false);
          return;
        }
      }
      
      // If we got here, this is a regular message requiring an AI response
      // Store in conversation history (only for actual AI interactions, not during initial questions)
      setConversationHistory(prev => [...prev, `User: ${userInput}`]);
      
      // Create context-aware prompt
      const contextAwarePrompt = createContextAwarePrompt(userInput);
      
      // Use real API service
      const aiResult = await generateAIResponse(contextAwarePrompt);
      
      // Check for success directly
      if (aiResult && aiResult.success === true && typeof aiResult.response === 'string') {
        // Get response from real AI API
        const aiResponse = aiResult.response;
        
        // Update conversation history with AI response
        setConversationHistory(prev => [...prev, `AI: ${aiResponse}`]);
        
        // Add AI response
        setMessages(prev => [...prev, {
          text: aiResponse,
          sender: 'ai',
          persona: currentPersona
        }]);
      } else {
        throw new Error(aiResult?.error || 'No valid response received');
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      // Add error message
      const errorMessage = error instanceof Error ? error.message : String(error);
      let userFriendlyMessage = "I'm sorry, I encountered an error processing your request. Please try again.";
      
      // Check for service unavailability error
      if (errorMessage.includes('service is currently unavailable') || 
          errorMessage.includes('Service Unavailable')) {
        userFriendlyMessage = "I'm sorry, the AI service is currently unavailable. This may be due to high demand or scheduled maintenance. Please try again in a few minutes.";
      }
      
      // Add error message to conversation history
      setConversationHistory(prev => [...prev, `AI: ${userFriendlyMessage}`]);
      
      setMessages(prev => [...prev, {
        text: userFriendlyMessage,
        sender: 'ai',
        persona: currentPersona
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load tab content when tab or persona changes
  useEffect(() => {
    const loadTabContent = async () => {
      // Skip for the general tab since it has its own content
      if (currentTab === 'general') return;
      
      // Create tab key
      const tabKey = `${currentPersona}-${currentTab}`;
      
      // Check if we already have content for this tab or if it's already generating
      if (tabContent[tabKey] || tabContentGeneration[tabKey] === 'generating') return;
      
      // Check if we have enough project information
      const projectInfo = getProjectInfo();
      const hasEnoughInfo = Object.keys(projectInfo).length >= 3;
      
      // If we don't have enough info and this is first access, show a message
      if (!hasEnoughInfo && !tabContent[tabKey]) {
        setTabContent(prev => ({
          ...prev,
          [tabKey]: `# Answer Questions First

Please answer at least 3 of the essential questions in the General tab before content can be generated for this tab.

This will ensure the AI can create relevant and specific content for your project.`
        }));
        return;
      }
      
      // Start generating content
      setIsTabContentLoading(true);
      setTabContentGeneration(prev => ({
        ...prev,
        [tabKey]: 'generating'
      }));
      
      try {
        // Use the comprehensive generation for better results with caching
        const content = await generateComprehensiveTabContent(
          currentPersona, 
          currentTab, 
          projectInfo, 
          projectId as string, 
          false // forceRefresh = false for normal loading (use cache if available)
        );
        
        // Update content and status
        setTabContent(prev => ({
          ...prev,
          [tabKey]: content
        }));
        
        setTabContentGeneration(prev => ({
          ...prev,
          [tabKey]: 'complete'
        }));
      } catch (error) {
        console.error('Error loading tab content:', error);
        
        // Set error status and content
        setTabContentGeneration(prev => ({
          ...prev,
          [tabKey]: 'error'
        }));
        
        setTabContent(prev => ({
          ...prev,
          [tabKey]: `# Error Generating Content

There was an error generating content for this tab. Please try refreshing the content.

Error details: ${error instanceof Error ? error.message : String(error)}`
        }));
      } finally {
        setIsTabContentLoading(false);
      }
    }
    
    loadTabContent();
  }, [currentPersona, currentTab]);

    // Handle change requests
  const handleChangeRequest = async () => {
    if (!changeRequest.trim() || currentTab === 'general') return;
    
    setIsProcessingChange(true);
    
    try {
      // Get current tab content
      const tabKey = `${currentPersona}-${currentTab}`;
      const currentContent = tabContent[tabKey] || '';
      
      if (!currentContent.trim()) {
        console.error('No current content to modify');
        alert('No content available to modify. Please generate content for this tab first.');
        return;
      }
      
      // Create a prompt for the change request
      const projectInfo = getProjectInfo();
      const changePrompt = `Please modify the following content based on this change request:

CHANGE REQUEST: ${changeRequest}

CURRENT CONTENT:
${currentContent}

PROJECT CONTEXT:
${Object.entries(projectInfo).map(([key, value]) => `${key}: ${value}`).join('\n')}

Please provide the updated content that addresses the change request while maintaining the same structure and format. Make sure to keep all relevant information and only modify what's necessary based to the request. Include Mermaid diagrams where appropriate.`;

      console.log('Processing change request:', changeRequest);
      console.log('Tab key:', tabKey);
      console.log('Current content length:', currentContent.length);

      // Generate updated content
      const result = await generateAIResponse({
        prompt: changePrompt,
        projectId: projectId as string,
        persona: currentPersona,
        tabType: currentTab,
        forceRefresh: true
      });
      
      console.log('Change request result:', result);
      
      if (result.success && result.response) {
        // Update the tab content with the modified version
        const newTabContent = {
          ...tabContent,
          [tabKey]: result.response
        };
        
        setTabContent(newTabContent);
        
        // Clear the change request input
        setChangeRequest('');
        
        // Update generation status
        const newTabContentGeneration = {
          ...tabContentGeneration,
          [tabKey]: 'complete' as const
        };
        
        setTabContentGeneration(newTabContentGeneration);
        
        // Immediately save the updated content with the new states
        const currentProjectInfo = getProjectInfo();
        saveChatData(
          projectId as string,
          'default-user',
          messages as ChatMessageType[],
          currentProjectInfo,
          currentPersona,
          currentTab,
          newTabContent, // Use the new tab content
          newTabContentGeneration // Use the new generation status
        ).catch(error => {
          console.error('Failed to save after change request:', error);
        });
        
        console.log('Content updated successfully');
      } else {
        console.error('Failed to process change request:', result.error);
        alert(`Failed to process change request: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error processing change request:', error);
      alert(`Error processing change request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessingChange(false);
    }
  };

  // Handle refreshing tab content
  const handleRefreshTabContent = async () => {
    // Skip for the general tab since it has its own content
    if (currentTab === 'general') return;

    // Create tab key
    const tabKey = `${currentPersona}-${currentTab}`;

    // Start generating content
    setIsTabContentLoading(true);
    setTabContentGeneration(prev => ({
      ...prev,
      [tabKey]: 'generating'
    }));

    try {
      // Get project information and generate new content with forceRefresh=true
      const projectInfo = getProjectInfo();
      const content = await generateComprehensiveTabContent(
        currentPersona,
        currentTab,
        projectInfo,
        projectId as string,
        true // forceRefresh = true for refresh button
      );

      // Update content and status
      setTabContent(prev => ({
        ...prev,
        [tabKey]: content
      }));

      setTabContentGeneration(prev => ({
        ...prev,
        [tabKey]: 'complete'
      }));

      // Immediately save the refreshed content
      const refreshProjectInfo = getProjectInfo();
      saveChatData(
        projectId as string,
        'default-user',
        messages as ChatMessageType[],
        refreshProjectInfo,
        currentPersona,
        currentTab,
        tabContent,
        tabContentGeneration
      ).catch(error => {
        console.error('Failed to save after refresh:', error);
      });
    } catch (error) {
      console.error('Error refreshing tab content:', error);

      // Set error status
      setTabContentGeneration(prev => ({
        ...prev,
        [tabKey]: 'error'
      }));
    } finally {
      setIsTabContentLoading(false);
    }
  };

  // Handle sending tab content to dashboard (with optional structured mode)
  const handleSendToDashboard = async (useStructured: boolean = false) => {
    // Skip for the general tab
    if (currentTab === 'general') return;

    const tabKey = `${currentPersona}-${currentTab}`;
    const content = tabContent[tabKey];

    if (!content) {
      alert('No content available to send to dashboard');
      return;
    }

    setIsSendingToDashboard(true);

    try {
      const response = await fetch('/api/dashboard/add-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: projectId || 'default-project',
          userId: 'default-user',
          tabType: currentTab,
          persona: currentPersona,
          content,
          useStructured
        })
      });

      const result = await response.json();

      if (result.success) {
        // Mark this tab as sent to dashboard
        setTabsSentToDashboard(prev => new Set(prev).add(tabKey));

        // Show success message
        alert(`Successfully sent ${result.data.widgetsCreated} widget(s) to dashboard! (${result.data.mode} mode)`);
      } else {
        alert(`Failed to send to dashboard: ${result.error}`);
      }
    } catch (error) {
      console.error('Error sending to dashboard:', error);
      alert('Failed to send content to dashboard');
    } finally {
      setIsSendingToDashboard(false);
    }
  };

  // Handle generating structured content directly (NEW - better approach)
  const handleGenerateStructured = async () => {
    // Skip for the general tab
    if (currentTab === 'general') return;

    const tabKey = `${currentPersona}-${currentTab}`;

    setIsSendingToDashboard(true);

    try {
      const projectInfo = getProjectInfo();

      const response = await fetch('/api/dashboard/generate-structured', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: projectId || 'default-project',
          userId: 'default-user',
          tabType: currentTab,
          persona: currentPersona,
          projectInfo
        })
      });

      const result = await response.json();

      if (result.success) {
        // Mark this tab as sent to dashboard
        setTabsSentToDashboard(prev => new Set(prev).add(tabKey));

        // Show success message
        alert(`Successfully generated ${result.data.widgetsCreated} structured widget(s)!`);
      } else {
        alert(`Failed to generate structured content: ${result.error}`);
      }
    } catch (error) {
      console.error('Error generating structured content:', error);
      alert('Failed to generate structured content');
    } finally {
      setIsSendingToDashboard(false);
    }
  };

  // Ask the first question when the component loads
  useEffect(() => {
    if (!isDataLoaded) return; // Wait for data to be loaded first
    
    if (projectQuestions.length > 0 && currentTab === 'general' && showQuestionPrompt) {
      const firstUnansweredIndex = projectQuestions.findIndex(q => !q.answered);
      if (firstUnansweredIndex >= 0) {
        setCurrentQuestionIndex(firstUnansweredIndex);
        // Check if this is first load and we need to ask a question
        if (messages.length === 1) {
          const questionMessage = {
            text: `Let's start by gathering essential project information. Please answer the following questions one by one: ${projectQuestions[firstUnansweredIndex].question}`,
            sender: 'ai' as const,
            persona: currentPersona
          };
          setMessages(prev => [...prev, questionMessage]);
          // Don't add this to conversation history since it's just question gathering
        }
      }
    }
  }, [currentTab, showQuestionPrompt, isDataLoaded, projectQuestions.length]);

  // Function to refresh/clear the conversation context
  const refreshConversationContext = () => {
    // Keep only the first welcome message
    const welcomeMessage = messages[0];
    setMessages([welcomeMessage]);
    
    // Keep only the first welcome message in conversation history
    const welcomeHistory = conversationHistory[0];
    setConversationHistory([welcomeHistory]);
    
    // Set the refreshed flag
    setContextRefreshed(true);
    
    // Reset the flag after 3 seconds
    setTimeout(() => {
      setContextRefreshed(false);
    }, 3000);
    
    // Add a system message informing the user
    const contextResetMessage = {
      text: "Conversation context has been refreshed. The AI will no longer consider previous messages when generating responses.",
      sender: 'ai' as const,
      persona: currentPersona
    };
    
    setMessages(prev => [...prev, contextResetMessage]);
  };

  // Render the general tab content with project questions
  const renderGeneralTabContent = () => {
    const answeredCount = projectQuestions.filter(q => q.answered).length;
    const progress = (answeredCount / projectQuestions.length) * 100;
    
    return (
      <div className="p-3 h-full overflow-auto">
        <h3 className="text-sm font-semibold mb-3 flex items-center justify-between">
          <span>Project Requirements</span>
          <span className="text-xs text-gray-500">{answeredCount}/{projectQuestions.length} complete</span>
        </h3>
        
        {/* Progress bar */}
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-4">
          <div 
            className="h-2 bg-indigo-500 rounded-full" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        {/* Questions list */}
        <div className="bg-white dark:bg-gray-900 rounded-lg p-3 shadow-sm mb-4">
          <h4 className="text-xs font-semibold mb-2">Essential Questions</h4>
          <ul className="space-y-2">
            {projectQuestions.map((question, index) => (
              <li 
                key={question.id} 
                className={`text-xs p-2 rounded flex items-start gap-2 ${
                  question.answered 
                    ? 'bg-green-50 dark:bg-green-900/20' 
                    : index === currentQuestionIndex && showQuestionPrompt
                      ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                      : 'bg-gray-50 dark:bg-gray-800'
                }`}
              >
                <div className="mt-0.5">
                  {question.answered 
                    ? <HiCheckCircle className="h-4 w-4 text-green-500" /> 
                    : <HiQuestionMarkCircle className="h-4 w-4 text-gray-400" />
                  }
                </div>
                <div>
                  <div className="font-medium">{question.question}</div>
                  {question.answered && question.answer && (
                    <div className="mt-1 text-gray-600 dark:text-gray-400 italic">{question.answer}</div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Tips */}
        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-3">
          <h4 className="text-xs font-semibold mb-2">Why This Matters</h4>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Answering these essential questions helps create a clear foundation for your project.
            This information will be used to provide more relevant suggestions, documentation,
            and technical advice throughout your project lifecycle.
          </p>
        </div>
      </div>
    );
  };

  // Render appropriate tab content
  const renderTabContent = () => {
    if (currentTab === 'general') {
      return renderGeneralTabContent();
    }
    
    const tabKey = `${currentPersona}-${currentTab}`;
    const generationStatus = tabContentGeneration[tabKey];
    
    return (
      <div className="p-3 h-full overflow-auto">
        <h3 className="text-sm font-semibold mb-3 flex items-center justify-between">
          <span>{getTabDisplayName(currentPersona, currentTab)}</span>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {generationStatus === 'complete' && (
              <>
                <button
                  onClick={handleRefreshTabContent}
                  className="text-xs flex items-center gap-1 text-indigo-500 hover:text-indigo-700"
                  disabled={isTabContentLoading}
                >
                  <HiRefresh className={`h-3 w-3 ${isTabContentLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>

                <button
                  onClick={() => handleSendToDashboard(true)}
                  className="text-xs flex items-center gap-1 bg-indigo-500 hover:bg-indigo-600 text-white px-2 py-1 rounded"
                  disabled={isSendingToDashboard || isTabContentLoading}
                  title="Generate structured dashboard widgets using AI (Recommended)"
                >
                  <HiViewGrid className="h-3 w-3" />
                  <span>
                    {isSendingToDashboard
                      ? 'Generating...'
                      : '🤖 Smart Send'
                    }
                  </span>
                </button>

                <button
                  onClick={() => handleSendToDashboard(false)}
                  className={`text-xs flex items-center gap-1 ${
                    tabsSentToDashboard.has(`${currentPersona}-${currentTab}`)
                      ? 'text-green-600 hover:text-green-700'
                      : 'text-blue-600 hover:text-blue-700'
                  }`}
                  disabled={isSendingToDashboard || isTabContentLoading}
                  title="Parse current markdown content to dashboard"
                >
                  <HiViewGrid className="h-3 w-3" />
                  <span>
                    {tabsSentToDashboard.has(`${currentPersona}-${currentTab}`)
                      ? 'Sent ✓'
                      : 'Send'
                    }
                  </span>
                </button>

                {tabsSentToDashboard.has(`${currentPersona}-${currentTab}`) && (
                  <a
                    href={`/trial-dashboard/${projectId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs flex items-center gap-1 text-gray-600 hover:text-gray-800"
                  >
                    <span>View Dashboard →</span>
                  </a>
                )}
              </>
            )}
          </div>
        </h3>
        
        {/* Change Request Input - Only show for non-general tabs with content */}
        {['prFaq', 'userStories', 'customerJourneyMaps', 'productRoadmap', 'successMetrics', 'requirementsVision', 'systemDesign', 'architectureViz', 'apiDataModeling', 'infrastructureAsCode', 'genAiImplementation'].includes(currentTab) && generationStatus === 'complete' && (
          <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Request Changes:
              </label>
              
              {/* Processing status indicator */}
              {isProcessingChange && (
                <div className="bg-blue-50 dark:bg-blue-900/20 text-xs text-blue-600 dark:text-blue-300 p-2 rounded flex items-center gap-2">
                  <div className="animate-pulse flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  </div>
                  <span>Processing your change request...</span>
                </div>
              )}
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={changeRequest}
                  onChange={(e) => setChangeRequest(e.target.value)}
                  placeholder="e.g., Make it more detailed, add security considerations, change the tech stack..."
                  className="flex-1 text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white disabled:opacity-50"
                  disabled={isProcessingChange}
                  onKeyPress={(e) => e.key === 'Enter' && !isProcessingChange && handleChangeRequest()}
                />
                <button
                  onClick={handleChangeRequest}
                  disabled={!changeRequest.trim() || isProcessingChange}
                  className="px-3 py-1 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-xs rounded flex items-center gap-1 min-w-[100px] justify-center"
                >
                  {isProcessingChange ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Updating...</span>
                    </>
                  ) : (
                    'Apply Changes'
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Describe what you'd like to change about the current content and the AI will update it for you.
              </p>
            </div>
          </div>
        )}
        
        <div className="bg-white dark:bg-gray-900 rounded-lg p-3 shadow-sm">
          {/* Generation status indicator */}
          {generationStatus === 'generating' && (
            <div className="bg-blue-50 dark:bg-blue-900/20 text-xs text-blue-600 dark:text-blue-300 p-2 mb-3 rounded">
              <div className="flex items-center space-x-2">
                <div className="animate-pulse flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                </div>
                <span>Generating content based on your project information...</span>
              </div>
            </div>
          )}
          
          {/* Error status indicator */}
          {generationStatus === 'error' && (
            <div className="bg-red-50 dark:bg-red-900/20 text-xs text-red-600 dark:text-red-300 p-2 mb-3 rounded">
              <div className="flex items-center space-x-2">
                <span>There was an error generating content. Please try refreshing.</span>
                <button 
                  onClick={handleRefreshTabContent}
                  className="text-xs flex items-center gap-1 text-red-600 hover:text-red-800"
                  disabled={isTabContentLoading}
                >
                  <HiRefresh className={`h-3 w-3 ${isTabContentLoading ? 'animate-spin' : ''}`} />
                  <span>Try Again</span>
                </button>
              </div>
            </div>
          )}
          
          {isTabContentLoading && generationStatus !== 'generating' ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-pulse flex space-x-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {tabContent[tabKey] ? (
                <SimpleMarkdownRenderer
                  content={tabContent[tabKey]}
                  projectId={projectId || undefined}
                  contextInfo={currentTab}
                />
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Content for this tab will be generated based on your conversation with the AI.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="ai-chat-container flex h-full flex-col">
      {/* Top Section - Tabs and Persona Selection */}
      <div className="flex-none p-2 bg-white dark:bg-gray-900 border-b dark:border-gray-700 flex justify-between items-center">
        <div className="flex overflow-x-auto">
          {/* General Tab (always present) */}
          <button 
            className={`px-2 py-1 text-xs ${currentTab === 'general' ? 'border-b-2 border-indigo-500 text-indigo-500' : 'text-gray-600 dark:text-gray-400'}`}
            onClick={() => setCurrentTab('general')}
          >
            General
          </button>
          
          {currentPersona === 'trialCoordinator' ? (
            /* Trial Coordinator Tabs */
            <>
              <button
                className={`px-2 py-1 text-xs ${currentTab === 'trialOverview' ? 'border-b-2 border-indigo-500 text-indigo-500' : 'text-gray-600 dark:text-gray-400'}`}
                onClick={() => setCurrentTab('trialOverview')}
              >
                Trial Overview
              </button>
              <button
                className={`px-2 py-1 text-xs ${currentTab === 'taskChecklists' ? 'border-b-2 border-indigo-500 text-indigo-500' : 'text-gray-600 dark:text-gray-400'}`}
                onClick={() => setCurrentTab('taskChecklists')}
              >
                Task Checklists
              </button>
              <button
                className={`px-2 py-1 text-xs ${currentTab === 'teamWorkflows' ? 'border-b-2 border-indigo-500 text-indigo-500' : 'text-gray-600 dark:text-gray-400'}`}
                onClick={() => setCurrentTab('teamWorkflows')}
              >
                Team Workflows
              </button>
              <button
                className={`px-2 py-1 text-xs ${currentTab === 'trialTimeline' ? 'border-b-2 border-indigo-500 text-indigo-500' : 'text-gray-600 dark:text-gray-400'}`}
                onClick={() => setCurrentTab('trialTimeline')}
              >
                Trial Timeline
              </button>
              <button
                className={`px-2 py-1 text-xs ${currentTab === 'qualityMetrics' ? 'border-b-2 border-indigo-500 text-indigo-500' : 'text-gray-600 dark:text-gray-400'}`}
                onClick={() => setCurrentTab('qualityMetrics')}
              >
                Quality Metrics
              </button>
            </>
          ) : (
            /* Regulatory Advisor Tabs */
            <>
              <button
                className={`px-2 py-1 text-xs ${currentTab === 'protocolRequirements' ? 'border-b-2 border-indigo-500 text-indigo-500' : 'text-gray-600 dark:text-gray-400'}`}
                onClick={() => setCurrentTab('protocolRequirements')}
              >
                Protocol Requirements
              </button>
              <button
                className={`px-2 py-1 text-xs ${currentTab === 'documentControl' ? 'border-b-2 border-indigo-500 text-indigo-500' : 'text-gray-600 dark:text-gray-400'}`}
                onClick={() => setCurrentTab('documentControl')}
              >
                Document Control
              </button>
              <button
                className={`px-2 py-1 text-xs ${currentTab === 'complianceDiagrams' ? 'border-b-2 border-indigo-500 text-indigo-500' : 'text-gray-600 dark:text-gray-400'}`}
                onClick={() => setCurrentTab('complianceDiagrams')}
              >
                Compliance Diagrams
              </button>
              <button
                className={`px-2 py-1 text-xs ${currentTab === 'riskControls' ? 'border-b-2 border-indigo-500 text-indigo-500' : 'text-gray-600 dark:text-gray-400'}`}
                onClick={() => setCurrentTab('riskControls')}
              >
                Risk & Controls
              </button>
              <button
                className={`px-2 py-1 text-xs ${currentTab === 'auditPreparation' ? 'border-b-2 border-indigo-500 text-indigo-500' : 'text-gray-600 dark:text-gray-400'}`}
                onClick={() => setCurrentTab('auditPreparation')}
              >
                Audit Preparation
              </button>
              <button
                className={`px-2 py-1 text-xs ${currentTab === 'smartAlerts' ? 'border-b-2 border-indigo-500 text-indigo-500' : 'text-gray-600 dark:text-gray-400'}`}
                onClick={() => setCurrentTab('smartAlerts')}
              >
                Smart Alerts
              </button>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <div className="border rounded overflow-hidden text-xs">
            <button
              className={`px-2 py-1 ${
              currentPersona === 'trialCoordinator'
                ? 'bg-indigo-500 text-white'
                : 'bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-300'
            }`}
            onClick={() => changePersona('trialCoordinator')}
          >
            Trial Coordinator
          </button>
            <button
              className={`px-2 py-1 ${
              currentPersona === 'regulatoryAdvisor'
                ? 'bg-indigo-500 text-white'
                : 'bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-300'
            }`}
              onClick={() => changePersona('regulatoryAdvisor')}
            >
              Regulatory Advisor
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button
              className="p-1 rounded-full border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Thumbs up feedback"
              onClick={() => {
                setFeedbackRating('up')
                setFeedbackSubmitted(false)
                setIsFeedbackOpen(true)
              }}
            >
              <HiOutlineThumbUp className="h-4 w-4" />
            </button>
            <button
              className="p-1 rounded-full border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Thumbs down feedback"
              onClick={() => {
                setFeedbackRating('down')
                setFeedbackSubmitted(false)
                setIsFeedbackOpen(true)
              }}
            >
              <HiOutlineThumbDown className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Main Content - Split into two sections horizontally */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Left Panel - Chat */}
        <div className="w-2/5 flex flex-col bg-white dark:bg-gray-900 border-r dark:border-gray-700">
          {/* Context awareness indicator with refresh button */}
          <div className="flex-none px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-xs text-blue-600 dark:text-blue-300 border-b flex justify-between items-center">
            <span>
              <span className="font-semibold">Persistent Chat:</span> {isDataLoaded ? 'Messages auto-saved' : 'Loading...'} | {conversationHistory.length > 1 ? `Context: ${Math.min(conversationHistory.length, MAX_CONTEXT_LENGTH)} messages` : 'No chat history'}
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={refreshConversationContext}
                className={`flex items-center gap-1 ${contextRefreshed ? 'text-green-500' : 'text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100'}`}
                title="Clear conversation context (keeps saved data)"
                disabled={contextRefreshed || conversationHistory.length <= 1}
              >
                <HiRefresh className="h-3 w-3" />
                <span>{contextRefreshed ? 'Cleared!' : 'Clear Context'}</span>
              </button>

              <button 
                onClick={clearAllChatData}
                className="flex items-center gap-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                title="Clear all chat data and reset everything"
              >
                <HiOutlineTrash className="h-3 w-3" />
                <span>Reset All</span>
              </button>
            </div>
          </div>
          
          {/* Messages - Scrollable container with fixed height */}
          <div className="flex-1 overflow-y-auto p-3 text-sm min-h-0">
            {messages.map((message, index) => (
              <div key={index} className={`mb-3 ${message.sender === 'user' ? 'text-right' : ''}`}>
                <div className={`inline-block p-2 rounded-lg max-w-[85%] break-words ${
                  message.sender === 'user' 
                    ? 'bg-indigo-500 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 dark:text-white'
                }`}>
                  {message.sender === 'ai' && message.persona && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {message.persona === 'regulatoryAdvisor' ? 'Regulatory Advisor' : 'Trial Coordinator'}
                    </div>
                  )}
                  <div className="text-xs whitespace-pre-wrap">{message.text}</div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start mb-3">
                <div className="inline-block p-2 rounded-lg bg-gray-200 dark:bg-gray-700 dark:text-white">
                  <div className="text-xs flex items-center space-x-1">
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-pulse"></div>
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-pulse delay-100"></div>
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-pulse delay-200"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Input - Fixed at bottom */}
          <div className="flex-none p-2 border-t dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 border dark:border-gray-600 rounded-l px-3 py-2 dark:bg-gray-800 dark:text-white text-sm h-10"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isLoading ? "AI is thinking..." : currentTab === 'general' && showQuestionPrompt ? "Type your answer here..." : "Type your message here..."}
                disabled={isLoading}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button
                className={`${isLoading ? 'bg-gray-400' : 'bg-indigo-500 hover:bg-indigo-600'} text-white px-4 rounded-r h-10 flex items-center justify-center`}
                onClick={handleSendMessage}
                disabled={isLoading}
              >
                <HiPaperAirplane className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Right Panel - Content Area */}
        <div className="w-3/5 flex-1 bg-gray-50 dark:bg-gray-800 relative">
          {/* Tab Content */}
          {renderTabContent()}

          {isFeedbackOpen && (
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center z-20">
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4 w-full max-w-sm text-xs">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100">Share Feedback</h3>
                  <button
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    onClick={() => setIsFeedbackOpen(false)}
                    disabled={isSubmittingFeedback}
                  >
                    ✕
                  </button>
                </div>
                <p className="mb-2 text-gray-600 dark:text-gray-300">
                  Help us improve the {currentPersona === 'regulatoryAdvisor' ? 'Regulatory Advisor' : 'Trial Coordinator'} on the "{getTabDisplayName(currentPersona, currentTab)}" view.
                </p>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-gray-600 dark:text-gray-300">Rate this experience:</span>
                  <button
                    type="button"
                    className={`p-1 rounded-full border text-base flex items-center justify-center ${feedbackRating === 'up' ? 'bg-green-100 border-green-500 text-green-600 dark:bg-green-900/30 dark:border-green-400' : 'border-gray-300 text-gray-500 dark:border-gray-600 dark:text-gray-300'}`}
                    onClick={() => setFeedbackRating(feedbackRating === 'up' ? null : 'up')}
                    disabled={isSubmittingFeedback}
                  >
                    <HiOutlineThumbUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className={`p-1 rounded-full border text-base flex items-center justify-center ${feedbackRating === 'down' ? 'bg-red-100 border-red-500 text-red-600 dark:bg-red-900/30 dark:border-red-400' : 'border-gray-300 text-gray-500 dark:border-gray-600 dark:text-gray-300'}`}
                    onClick={() => setFeedbackRating(feedbackRating === 'down' ? null : 'down')}
                    disabled={isSubmittingFeedback}
                  >
                    <HiOutlineThumbDown className="h-4 w-4" />
                  </button>
                </div>
                <textarea
                  className="w-full h-24 text-xs border border-gray-300 dark:border-gray-600 rounded p-2 mb-2 dark:bg-gray-800 dark:text-white"
                  placeholder="What worked well? What could be better?"
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  disabled={isSubmittingFeedback}
                />
                {feedbackSubmitted && (
                  <div className="mb-2 text-green-600 dark:text-green-400">
                    Thank you for your feedback!
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <button
                    className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => setIsFeedbackOpen(false)}
                    disabled={isSubmittingFeedback}
                  >
                    Cancel
                  </button>
                  <button
                    className={`px-3 py-1 rounded text-white ${feedbackMessage.trim() && !isSubmittingFeedback ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-gray-400 cursor-not-allowed'}`}
                    onClick={handleSubmitFeedback}
                    disabled={!feedbackMessage.trim() || isSubmittingFeedback}
                  >
                    {isSubmittingFeedback ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}