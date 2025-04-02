// Chat.tsx
import { IconChevronDown } from '@tabler/icons-react';
import {
  MutableRefObject,
  memo,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  CSSProperties,
  ReactNode,
} from 'react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from 'next-i18next';

// PDF library
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
pdfMake.vfs = pdfFonts.pdfMake.vfs;

import { throttle } from '@/utils/data/throttle';
import { saveConversation, saveConversations } from '@/utils/app/conversation';

import HomeContext from '@/pages/api/home/home.context';
import { Conversation, Message } from '@/types/chat';
import { Plugin } from '@/types/plugin';
import { Prompt } from '@/types/prompt';

import { ChatLoader } from './ChatLoader';
import { ErrorMessageDiv } from './ErrorMessageDiv';
import { ChatTextToSpeech } from './ChatTextToSpeech';
import { ChatStartOfficeVisit } from './ChatStartOfficeVisit';
import { ChatInput } from './ChatInput';

// Modals
import { ProfileModal } from '@/components/Modals/ProfileModal';
import { TemplatesModal } from '@/components/Modals/TemplatesModal';
import { HelpModal } from '@/components/Modals/HelpModal';
import { SettingsModal } from '@/components/Modals/SettingsModal';
import PredictiveAnalyticsModal from '@/components/Modals/PredictiveAnalyticsModal';

/**
 * Splits the final assistant message into three sections:
 * Potential Transcription Errors,
 * Helpful Content,
 * Clinical Document.
 */
function parseAssistantOutput(content: string) {
  let potentialRecs = '';
  let helpfulContent = '';
  let clinicalDoc = '';

  const potentialPattern = /Potential Transcription (Recommendations|Errors):?\s*([\s\S]*?)(?=\n[\t ]*(Helpful Content|Clinical Document)|$)/i;
  const helpfulPattern = /Helpful Content:?\s*([\s\S]*?)(?=\n[\t ]*(Clinical Document)|$)/i;
  const clinicalPattern = /Clinical Document:?\s*([\s\S]*)/i;

  const potMatch = content.match(potentialPattern);
  if (potMatch && potMatch[2]) {
    potentialRecs = potMatch[2].trim();
  }

  const helpMatch = content.match(helpfulPattern);
  if (helpMatch && helpMatch[1]) {
    helpfulContent = helpMatch[1].trim();
  }

  const docMatch = content.match(clinicalPattern);
  if (docMatch && docMatch[1]) {
    clinicalDoc = docMatch[1].trim();
  }

  return { potentialRecs, helpfulContent, clinicalDoc };
}

/** Rebuild the final assistant message from the three sections. */
function rebuildAssistantOutput(
  potentialRecs: string,
  helpfulContent: string,
  clinicalDoc: string
) {
  return `Potential Transcription Errors:
${potentialRecs.trim() || 'No errors found.'}

Helpful Content:
${helpfulContent.trim() || '(No helpful content)'}

Clinical Document:
${clinicalDoc.trim() || '(No clinical document)'}
`;
}

interface Props {
  stopConversationRef: MutableRefObject<boolean>;
}

export const Chat = memo(function Chat({ stopConversationRef }: Props) {
  const { t } = useTranslation('chat');

  /*****************************************************************
   * 1) GET CONTEXT + DEFINE ALL HOOKS UNCONDITIONALLY
   *****************************************************************/
  const {
    state: {
      apiKey,
      serverSideApiKeyIsSet,
      modelError,
      loading,
      conversations,
      selectedConversation,
      openModal,
      models,
      prompts,
      userSignOff,
      showChatbar,
      showSidePromptbar,
      hasChatOutput,
    },
    dispatch,
    handleUpdateConversation,
  } = useContext(HomeContext);

  // local states
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const [currentMessage, setCurrentMessage] = useState<Message | null>(null);

  // Document Title (sync with conversation.name)
  const [documentTitle, setDocumentTitle] = useState(
    selectedConversation?.name || ''
  );

  // Template, Model selection
  const [activeTemplateName, setActiveTemplateName] = useState('ED Triage Note');
  const [activeModelName, setActiveModelName] = useState('GPT-4');
  const [showTemplatesDropdown, setShowTemplatesDropdown] = useState(false);
  const [showModelsDropdown, setShowModelsDropdown] = useState(false);

  // final doc editing
  const [editedClinicalDoc, setEditedClinicalDoc] = useState('');
  const [isEditingDoc, setIsEditingDoc] = useState(false);

  // references
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // final assistant message
  const [finalAssistantMessage, setFinalAssistantMessage] = useState<Message | null>(null);

  // 1a) Keep doc title in sync with selectedConversation
  useEffect(() => {
    if (selectedConversation) {
      setDocumentTitle(selectedConversation.name);
    }
  }, [selectedConversation]);

  // 1b) Identify the final assistant message
  useEffect(() => {
    let found: Message | null = null;
    if (selectedConversation?.messages) {
      for (let i = selectedConversation.messages.length - 1; i >= 0; i--) {
        if (selectedConversation.messages[i].role === 'assistant') {
          found = selectedConversation.messages[i];
          break;
        }
      }
    }
    setFinalAssistantMessage(found);
  }, [selectedConversation]);

  // 1c) If we have a final message + not editing => load doc text
  useEffect(() => {
    if (finalAssistantMessage && !isEditingDoc) {
      const { clinicalDoc } = parseAssistantOutput(finalAssistantMessage.content);
      setEditedClinicalDoc(clinicalDoc);
    }
  }, [finalAssistantMessage, isEditingDoc]);

  // 1d) Throttled scroll
  const throttledScrollDown = throttle(() => {
    if (autoScrollEnabled && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, 250);

  useEffect(() => {
    throttledScrollDown();
  }, [selectedConversation, throttledScrollDown, loading]);

  // 1e) Intersection observer for auto-scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setAutoScrollEnabled(entry.isIntersecting);
        if (entry.isIntersecting) {
          textareaRef.current?.focus();
        }
      },
      { root: null, threshold: 0.3 }
    );
    if (messagesEndRef.current) {
      observer.observe(messagesEndRef.current);
    }
    return () => {
      if (messagesEndRef.current) observer.unobserve(messagesEndRef.current);
    };
  }, []);

  // 1f) scrollToBottom function
  const scrollToBottom = () => {
    if (autoScrollEnabled && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      textareaRef.current?.focus();
    }
  };

  // 1g) handleSend => the main sending function
  const handleSend = useCallback(
    async (message: Message, deleteCount = 0, plugin: Plugin | null = null) => {
      if (!apiKey && !serverSideApiKeyIsSet) {
        console.error('No API key found. Cannot send message.');
        return;
      }

      // if no selected conv => create new one
      let activeConv = selectedConversation;
      if (!activeConv) {
        activeConv = {
          // NOTE: Must provide all fields required by "Conversation" type:
          id: uuidv4(),
          name: documentTitle || 'New Clinical Note',
          messages: [],
          model:
            models[0] || {
              id: 'gpt-3.5-turbo',
              name: 'GPT-3.5',
              maxLength: 12000,
              tokenLimit: 4000,
            },
          // Provide missing fields:
          prompt: '',
          temperature: 1.0,
          folderId: null,
        };
        const newConvs = [...conversations, activeConv];
        dispatch({ field: 'conversations', value: newConvs });
        dispatch({ field: 'selectedConversation', value: activeConv });
        saveConversations(newConvs);
        saveConversation(activeConv);
      }

      let updatedMessages = [...(activeConv.messages || [])];
      if (deleteCount > 0) {
        updatedMessages = updatedMessages.slice(0, -deleteCount);
      }
      updatedMessages.push(message);

      const updatedConv: Conversation = {
        ...activeConv,
        messages: updatedMessages,
      };

      let newConversations2: Conversation[];
      const exists = conversations.some((c) => c.id === updatedConv.id);
      if (exists) {
        newConversations2 = conversations.map((c) =>
          c.id === updatedConv.id ? updatedConv : c
        );
      } else {
        newConversations2 = [...conversations, updatedConv];
      }

      dispatch({ field: 'selectedConversation', value: updatedConv });
      dispatch({ field: 'conversations', value: newConversations2 });
      saveConversation(updatedConv);
      saveConversations(newConversations2);

      // Build system prompt
      const convPrompt = activeConv.prompt?.trim() || '';
      const systemPrompt = `
You are a clinical scribe generating a final note with 3 sections:
1) Potential Transcription Errors
2) Helpful Content
3) Clinical Document (with headings from the chosen template)
Append the provider’s sign-off: ${userSignOff.trim() || '[Provider sign-off here]'}

Transcript:
"""
${convPrompt}
"""
      `;

      const chosenModel = updatedConv.model;
      if (!chosenModel) {
        console.error('No model selected.');
        return;
      }

      dispatch({ field: 'loading', value: true });
      try {
        const payload = {
          model: chosenModel.id,
          messages: [
            { role: 'system', content: systemPrompt },
            ...updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          ],
          temperature: 0.7,
          stream: false,
        };

        const response = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          payload,
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        dispatch({ field: 'loading', value: false });

        let assistantContent =
          response.data?.choices?.[0]?.message?.content || '';
        assistantContent = assistantContent.replace(/\[.*?\]/g, '');
        assistantContent = assistantContent.replace(/\*/g, '');

        const assistantMsg: Message = {
          role: 'assistant',
          content: assistantContent,
        };

        const finalMsgs = [...updatedMessages, assistantMsg];
        const finalConv: Conversation = {
          ...updatedConv,
          messages: finalMsgs,
        };

        const finalConvs = newConversations2.map((c) =>
          c.id === finalConv.id ? finalConv : c
        );

        dispatch({ field: 'hasChatOutput', value: true });
        dispatch({ field: 'selectedConversation', value: finalConv });
        dispatch({ field: 'conversations', value: finalConvs });

        saveConversation(finalConv);
        saveConversations(finalConvs);
      } catch (err) {
        dispatch({ field: 'loading', value: false });
        console.error('Error calling LLM:', err);
      }
    },
    [
      apiKey,
      serverSideApiKeyIsSet,
      selectedConversation,
      documentTitle,
      models,
      conversations,
      userSignOff,
      dispatch,
    ]
  );

  /*****************************************************************
   * 2) DETERMINE MAIN CONTENT RENDERING
   *****************************************************************/
  const noApiKey = !apiKey && !serverSideApiKeyIsSet;
  const noMessages =
    !selectedConversation || selectedConversation.messages.length === 0;

  let mainContent: ReactNode;

  // Condition 1: No API Key
  if (noApiKey) {
    mainContent = (
      <div className="mx-auto flex h-full w-[300px] flex-col justify-center space-y-6 text-black sm:w-[600px]">
        <div className="text-center text-2xl">
          {t('Please set your API key.')}
        </div>
      </div>
    );
  }
  // Condition 2: Model error
  else if (modelError) {
    mainContent = <ErrorMessageDiv error={modelError} />;
  }
  // Condition 3: No messages => show start UI
  else if (noMessages) {
    mainContent = (
      <div className="flex-1 flex flex-col border-b border-gray-300 w-full">
        <div className="flex flex-row flex-1 items-center justify-evenly py-6 px-4 md:py-12">
          <div
            className="w-[45%] flex flex-col items-center justify-center border rounded-lg p-36 shadow"
            style={{
              backgroundImage: "url('/VoiceMode.png')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <ChatTextToSpeech
              onSend={(userMsg) => {
                setCurrentMessage(userMsg);
                handleSend(userMsg);
              }}
            />
          </div>
          <div
            className="w-[45%] flex flex-col items-center justify-center border rounded-lg p-36 shadow"
            style={{
              backgroundImage: "url('/StartOfficeVisit.png')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <ChatStartOfficeVisit
              onSend={(userMsg) => {
                setCurrentMessage(userMsg);
                handleSend(userMsg);
              }}
            />
          </div>
        </div>
      </div>
    );
  }
  // Otherwise => parse final assistant message, show output
  else {
    let potentialRecs = '';
    let helpfulContent = '';
    let docText = '';
    if (finalAssistantMessage) {
      const parsed = parseAssistantOutput(finalAssistantMessage.content);
      potentialRecs = parsed.potentialRecs;
      helpfulContent = parsed.helpfulContent;
      docText = parsed.clinicalDoc;
    }

    const docWordCount = editedClinicalDoc.trim()
      ? editedClinicalDoc.trim().split(/\s+/).length
      : 0;

    mainContent = (
      <div className="p-4">
        {/* Transcript */}
        <div className="text-center mb-6">
          <h2 className="text-lg font-bold mb-2">Transcript</h2>
          <div className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-100 inline-block">
            {selectedConversation?.messages
              .filter((m) => m.role === 'user')
              .map((m) => m.content)
              .join('\n') || '(No transcript)'}
          </div>
        </div>
        <hr className="my-4 border-gray-300 dark:border-gray-700" />

        <div className="flex flex-col md:flex-row gap-6">
          {/* LEFT: Clinical Document w/ editing */}
          <div className="flex-1 md:w-1/2 border rounded-md p-4 dark:border-gray-600">
            <div className="flex items-center justify-between mb-2">
              <div className="font-bold text-md">Clinical Document</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {docWordCount} words
              </div>
            </div>

            {isEditingDoc ? (
              <textarea
                className="w-full h-64 border border-gray-300 rounded dark:border-gray-600
                           p-2 text-sm dark:bg-gray-700 dark:text-white"
                value={editedClinicalDoc}
                onChange={(e) => setEditedClinicalDoc(e.target.value)}
              />
            ) : (
              <div className="whitespace-pre-wrap text-sm">
                {editedClinicalDoc || '(No clinical document)'}
              </div>
            )}

            {/* Buttons */}
            <div className="mt-3 flex gap-2 flex-wrap">
              {!isEditingDoc && (
                <button
                  onClick={() => setIsEditingDoc(true)}
                  className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600
                             rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                >
                  Edit
                </button>
              )}
              {isEditingDoc && (
                <button
                  onClick={() => {
                    // Rebuild the final assistant message
                    if (!finalAssistantMessage) return;
                    const parsed = parseAssistantOutput(finalAssistantMessage.content);
                    const newContent = rebuildAssistantOutput(
                      parsed.potentialRecs,
                      parsed.helpfulContent,
                      editedClinicalDoc
                    );

                    const updatedMsg: Message = {
                      ...finalAssistantMessage,
                      content: newContent,
                    };

                    const msgs = [...(selectedConversation?.messages || [])];
                    const idx = msgs.lastIndexOf(finalAssistantMessage);
                    if (idx !== -1) {
                      msgs[idx] = updatedMsg;
                    }
                    const updatedConv: Conversation = {
                      ...selectedConversation!,
                      messages: msgs,
                    };

                    const newConvs = conversations.map((c) =>
                      c.id === updatedConv.id ? updatedConv : c
                    );
                    dispatch({ field: 'conversations', value: newConvs });
                    dispatch({ field: 'selectedConversation', value: updatedConv });
                    saveConversations(newConvs);
                    saveConversation(updatedConv);

                    setIsEditingDoc(false);
                    alert('Edits saved!');
                  }}
                  className="px-3 py-1 text-sm bg-blue-600 text-white
                             rounded hover:bg-blue-700"
                >
                  Save
                </button>
              )}
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(editedClinicalDoc);
                    alert('Clinical Document copied to clipboard!');
                  } catch (err) {
                    console.error(err);
                    alert('Could not copy text.');
                  }
                }}
                className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600
                           rounded hover:bg-gray-300 dark:hover:bg-gray-500"
              >
                Copy
              </button>
              <button
                onClick={() => {
                  const now = new Date();
                  const stamp = `${now.getFullYear()}${(now.getMonth() + 1)
                    .toString()
                    .padStart(2, '0')}${now
                    .getDate()
                    .toString()
                    .padStart(2, '0')}_${now
                    .getHours()
                    .toString()
                    .padStart(2, '0')}${now
                    .getMinutes()
                    .toString()
                    .padStart(2, '0')}`;
                  const docDefinition = {
                    content: [
                      { text: documentTitle || 'Clinical Document', style: 'header' },
                      { text: editedClinicalDoc, margin: [0, 5, 0, 15] },
                    ],
                    styles: {
                      header: { fontSize: 14, bold: true },
                    },
                  };
                  pdfMake
                    .createPdf(docDefinition)
                    .download(`${stamp}_ClinicalDoc.pdf`);
                }}
                className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600
                           rounded hover:bg-gray-300 dark:hover:bg-gray-500"
              >
                Download PDF
              </button>
            </div>
          </div>

          {/* RIGHT: Potential Errors & Helpful Content */}
          <div className="flex-1 md:w-1/2 flex flex-col gap-4">
            <div className="border rounded-md p-4 dark:border-gray-600">
              <h3 className="text-md font-bold mb-2">
                Potential Transcription Errors
              </h3>
              <div className="whitespace-pre-wrap text-sm">
                {potentialRecs || 'No errors found.'}
              </div>
            </div>
            <div className="border rounded-md p-4 dark:border-gray-600">
              <h3 className="text-md font-bold mb-2">Helpful Content</h3>
              <div className="whitespace-pre-wrap text-sm">
                {helpfulContent || '(No helpful content)'}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If loading, show loader
  const loader = loading ? <ChatLoader /> : null;

  // bottom bar style
  const chatbarWidth = 240;
  const sidePromptbarWidth = 240;
  const bottomBarStyle: CSSProperties = {
    position: 'fixed',
    bottom: 0,
    left: showChatbar ? `${chatbarWidth}px` : '0',
    right: showSidePromptbar ? `${sidePromptbarWidth}px` : '0',
  };

  /*****************************************************************
   * 4) SINGLE RETURN
   *****************************************************************/
  return (
    <div className="flex flex-col w-full h-full bg-white dark:bg-[#343541] text-black dark:text-white">

      {/* HEADER */}
      <header className="sticky top-0 z-20 bg-gray-900 text-white flex flex-col">
        <div className="flex items-center px-4 py-3">
          <img src="/MetrixAI.png" alt="Metrix AI Logo" className="h-8 mr-2" />
          <h2 className="text-base font-semibold">
            Metrix AI - The Intelligent Clinical Scribe Platform
          </h2>
        </div>

        {/* Document Title, Template, Model */}
        <div className="border-t border-gray-700 px-4 py-2 flex items-center gap-4">
          {/* Document Title */}
          <div className="flex items-center gap-2">
            <label
              htmlFor="documentTitle"
              className="text-sm font-medium text-white"
            >
              {t('Document Title')}
            </label>
            <input
              id="documentTitle"
              type="text"
              className="w-[300px] rounded border border-gray-500 px-3 py-2 text-sm text-black
                         focus:outline-none focus:border-gray-400"
              placeholder="Enter your document title here"
              value={documentTitle}
              onChange={(e) => {
                const newTitle = e.target.value;
                setDocumentTitle(newTitle);
                if (selectedConversation) {
                  handleUpdateConversation(selectedConversation, {
                    key: 'name',
                    value: newTitle,
                  });
                }
              }}
            />
          </div>

          {/* Template dropdown */}
          <div className="relative">
            <button
              className="flex items-center gap-1 rounded-md bg-gray-900 px-4 py-2
                         text-sm font-semibold text-white hover:bg-gray-700"
              onClick={() => setShowTemplatesDropdown(!showTemplatesDropdown)}
            >
              {`${t('Template')}: ${activeTemplateName}`}
              <IconChevronDown size={16} />
            </button>
            {showTemplatesDropdown && (
              <div className="absolute left-0 mt-2 w-[220px] rounded-md border border-gray-200
                              bg-white p-2 shadow-lg z-50">
                {prompts.map((prompt) => (
                  <button
                    key={prompt.id}
                    className="block w-full text-left px-3 py-2 text-sm text-gray-700
                               hover:bg-gray-100"
                    onClick={() => {
                      setActiveTemplateName(prompt.name);
                      if (selectedConversation) {
                        handleUpdateConversation(selectedConversation, {
                          key: 'prompt',
                          value: prompt.content,
                        });
                      }
                      setShowTemplatesDropdown(false);
                    }}
                  >
                    {prompt.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Model dropdown */}
          <div className="relative">
            <button
              className="flex items-center gap-1 rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold
                         text-white hover:bg-gray-700"
              onClick={() => setShowModelsDropdown(!showModelsDropdown)}
            >
              {`${t('Model')}: ${activeModelName}`}
              <IconChevronDown size={16} />
            </button>
            {showModelsDropdown && (
              <div className="absolute left-0 mt-2 w-[220px] rounded-md border
                              border-gray-200 bg-white p-2 shadow-lg z-50">
                {(() => {
                  // If "Discharge Summary," add "Internal ML Algorithm"
                  const baseModels = [...models];
                  if (activeTemplateName === 'Discharge Summary') {
                    const found = baseModels.find((m) => m.id === 'internal-ml');
                    if (!found) {
                      baseModels.push({
                        id: 'internal-ml',
                        name: 'Internal ML Algorithm',
                        maxLength: 16000,
                        tokenLimit: 4000,
                      });
                    }
                  }
                  return baseModels;
                })().map((m) => (
                  <button
                    key={m.id}
                    className="block w-full text-left px-3 py-2 text-sm text-gray-700
                               hover:bg-gray-100"
                    onClick={() => {
                      if (selectedConversation) {
                        handleUpdateConversation(selectedConversation, {
                          key: 'model',
                          value: m,
                        });
                      }
                      setActiveModelName(m.name);
                      setShowModelsDropdown(false);
                    }}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div
        ref={chatContainerRef}
        onScroll={() => {
          if (!chatContainerRef.current) return;
          const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
          if (scrollTop + clientHeight < scrollHeight - 80) {
            setAutoScrollEnabled(false);
          } else {
            setAutoScrollEnabled(true);
          }
        }}
        className="flex-1 overflow-y-auto pb-40"
      >
        {/** The "mainContent" logic from above. */}
        {mainContent}

        {loading && <ChatLoader />}

        <div ref={messagesEndRef} className="h-1" />
      </div>

      {/* BOTTOM BAR */}
      <div className="flex justify-center pb-2" style={{
        position: 'fixed',
        bottom: 0,
        left: showChatbar ? '240px' : '0',
        right: showSidePromptbar ? '240px' : '0',
      }}>
        <div className="w-full px-2">
          <ChatInput
            stopConversationRef={stopConversationRef}
            textareaRef={textareaRef}
            onSend={(msg, plugin) => {
              setCurrentMessage(msg);
              handleSend(msg, 0, plugin);
            }}
            onScrollDownClick={scrollToBottom}
            onRegenerate={() => {
              if (currentMessage && selectedConversation) {
                // remove last user + assistant message
                handleSend(currentMessage, 2);
              }
            }}
            showScrollDownButton={false}
          />
        </div>
      </div>

      {/* MODALS */}
      {openModal === 'profile' && <ProfileModal />}
      {openModal === 'templates' && <TemplatesModal />}
      {openModal === 'help' && <HelpModal />}
      {openModal === 'settings' && <SettingsModal />}
      {openModal === 'predictive analytics' && <PredictiveAnalyticsModal />}
    </div>
  );
});

Chat.displayName = 'Chat';
export default Chat;
