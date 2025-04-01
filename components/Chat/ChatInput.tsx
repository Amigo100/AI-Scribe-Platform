// components/Chat/ChatInput.tsx

import {
  IconArrowDown,
  IconBolt,
  IconBrandGoogle,
  IconPlayerStop,
  IconRepeat,
  IconSend,
} from '@tabler/icons-react';
import {
  KeyboardEvent,
  MutableRefObject,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import { useTranslation } from 'next-i18next';

import { Message } from '@/types/chat';
import { Plugin } from '@/types/plugin';
import { Prompt } from '@/types/prompt';

import HomeContext from '@/pages/api/home/home.context';

import { PluginSelect } from './PluginSelect';
import { PromptList } from './PromptList';
import { VariableModal } from './VariableModal';
import { ChatInputMicButton } from './ChatInputMicButton';

interface Props {
  onSend: (message: Message, plugin: Plugin | null) => void;
  onRegenerate: () => void;
  onScrollDownClick: () => void;
  stopConversationRef: MutableRefObject<boolean>;
  textareaRef: MutableRefObject<HTMLTextAreaElement | null>;
  showScrollDownButton: boolean;
}

export const ChatInput = ({
  onSend,
  onRegenerate,
  onScrollDownClick,
  stopConversationRef,
  textareaRef,
  showScrollDownButton,
}: Props) => {
  const { t } = useTranslation('chat');

  const {
    state: {
      selectedConversation,
      messageIsStreaming,
      prompts,
      activePromptIndex,
      promptModalVisible,
      promptVariables,
      textInputContent,
    },
    dispatch: homeDispatch,
  } = useContext(HomeContext);

  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [showPromptList, setShowPromptList] = useState(false);
  const [promptInputValue, setPromptInputValue] = useState('');
  const [showPluginSelect, setShowPluginSelect] = useState(false);
  const [plugin, setPlugin] = useState<Plugin | null>(null);

  const promptListRef = useRef<HTMLUListElement | null>(null);

  // Filter prompts
  const filteredPrompts = prompts.filter((prompt) =>
    prompt.name.toLowerCase().includes(promptInputValue.toLowerCase()),
  );

  // convenience
  const setActivePromptIndex = (idx: any) => {
    homeDispatch({ field: 'activePromptIndex', value: idx });
  };

  const setVariables = (vars: any) => {
    homeDispatch({ field: 'promptVariables', value: vars });
  };

  const setTextInputContent = (content: any) => {
    homeDispatch({ field: 'textInputContent', value: content });
  };

  // On text area changes
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const maxLength = selectedConversation?.model.maxLength;

    if (maxLength && value.length > maxLength) {
      alert(
        t(
          `Message limit is {{maxLength}} characters. You have entered {{valueLength}} characters.`,
          { maxLength, valueLength: value.length },
        ),
      );
      return;
    }
    setTextInputContent(value);
    updatePromptListVisibility(value);
  };

  // Actually sending user text
  const handleSend = () => {
    if (messageIsStreaming) {
      return;
    }
    if (!textInputContent) {
      alert(t('Please enter a message'));
      return;
    }
    // Build user message
    const userMsg: Message = {
      role: 'user',
      content: textInputContent,
    };
    onSend(userMsg, plugin);
    setTextInputContent('');
    setPlugin(null);

    // close keyboard on mobile
    if (window.innerWidth < 640 && textareaRef && textareaRef.current) {
      textareaRef.current.blur();
    }
  };

  // Stop the generation
  const handleStopConversation = () => {
    stopConversationRef.current = true;
    setTimeout(() => {
      stopConversationRef.current = false;
    }, 1000);
  };

  // check if user is on mobile
  const isMobile = () => {
    const ua =
      typeof navigator === 'undefined' ? '' : navigator.userAgent;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(ua);
  };

  // Insert prompt from suggestions
  const handleInitModal = () => {
    const selectedPrompt = filteredPrompts[activePromptIndex];
    if (selectedPrompt) {
      const newContent = textInputContent?.replace(
        /\/\w*$/,
        selectedPrompt.content,
      );
      setTextInputContent(newContent);
      handlePromptSelect(selectedPrompt);
    }
    setShowPromptList(false);
  };

  // Keydown logic
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showPromptList) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActivePromptIndex((prevIndex: number) =>
          prevIndex < filteredPrompts.length - 1 ? prevIndex + 1 : prevIndex,
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActivePromptIndex((prevIndex: number) =>
          prevIndex > 0 ? prevIndex - 1 : prevIndex,
        );
      } else if (e.key === 'Tab') {
        e.preventDefault();
        setActivePromptIndex((prevIndex: number) =>
          prevIndex < filteredPrompts.length - 1 ? prevIndex + 1 : 0,
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleInitModal();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowPromptList(false);
      } else {
        setActivePromptIndex(0);
      }
    } else if (e.key === 'Enter' && !isTyping && !isMobile() && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === '/' && e.metaKey) {
      e.preventDefault();
      setShowPluginSelect(!showPluginSelect);
    }
  };

  // parse template variables
  const parseVariables = (content: string) => {
    const regex = /{{(.*?)}}/g;
    const foundVariables: string[] = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      foundVariables.push(match[1]);
    }
    return foundVariables;
  };

  const updatePromptListVisibility = useCallback((text: string) => {
    const match = text.match(/\/\w*$/);
    if (match) {
      setShowPromptList(true);
      setPromptInputValue(match[0].slice(1));
    } else {
      setShowPromptList(false);
      setPromptInputValue('');
    }
  }, []);

  const handlePromptSelect = (prompt: Prompt) => {
    const vars = parseVariables(prompt.content);
    setVariables(vars);
    if (vars.length > 0) {
      homeDispatch({ field: 'promptModalVisible', value: true });
    } else {
      const replaced = textInputContent?.replace(/\/\w*$/, prompt.content);
      setTextInputContent(replaced || '');
      updatePromptListVisibility(replaced || '');
    }
  };

  // If user filled the variable modal
  const handleSubmit = (updatedVars: string[]) => {
    const newContent = textInputContent?.replace(/{{(.*?)}}/g, (match, variable) => {
      const idx = promptVariables.indexOf(variable);
      return updatedVars[idx];
    });
    setTextInputContent(newContent || '');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // If we arrow up/down in prompt list => scroll
  useEffect(() => {
    if (promptListRef.current) {
      promptListRef.current.scrollTop = activePromptIndex * 30;
    }
  }, [activePromptIndex]);

  // auto-grow
  useEffect(() => {
    if (textareaRef?.current) {
      textareaRef.current.style.height = 'inherit';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      textareaRef.current.style.overflow = `${
        textareaRef.current.scrollHeight > 400 ? 'auto' : 'hidden'
      }`;
    }
  }, [textInputContent]);

  // close prompt list if click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        promptListRef.current &&
        !promptListRef.current.contains(e.target as Node)
      ) {
        setShowPromptList(false);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => {
      window.removeEventListener('click', handleOutsideClick);
    };
  }, []);

  return (
    <div
      className="relative w-full border-transparent bg-gradient-to-b 
                 from-transparent via-white to-white pt-6 
                 dark:border-white/20 dark:via-[#343541] 
                 dark:to-[#343541] md:pt-2"
    >
      <div className="mx-2 mt-4 flex flex-row gap-3 last:mb-2 
                      md:mx-4 md:mt-[52px] md:last:mb-6 lg:mx-auto 
                      lg:max-w-3xl"
      >
        {messageIsStreaming && (
          <button
            className="mb-3 flex w-fit items-center gap-3 rounded 
                       border border-neutral-200 bg-white py-2 px-4 text-black 
                       hover:opacity-50 dark:border-neutral-600 
                       dark:bg-[#343541] dark:text-white md:mb-0 md:mt-2 mx-auto"
            onClick={handleStopConversation}
          >
            <IconPlayerStop size={16} /> {t('Stop Generating')}
          </button>
        )}

        {!messageIsStreaming &&
          selectedConversation &&
          selectedConversation.messages.length > 0 && (
            <button
              className="mb-3 flex w-fit items-center gap-3 rounded 
                         border border-neutral-200 bg-white py-2 px-4 text-black 
                         hover:opacity-50 dark:border-neutral-600 
                         dark:bg-[#343541] dark:text-white 
                         md:mb-0 md:mt-2 mx-auto"
              onClick={onRegenerate}
            >
              <IconRepeat size={16} /> {t('Regenerate response')}
            </button>
          )}

        {/* Outer container for text area */}
        <div className="relative mx-2 flex w-full flex-grow flex-col
                       rounded-md border border-black/10 bg-white 
                       shadow-[0_0_10px_rgba(0,0,0,0.10)] dark:border-gray-900/50 
                       dark:bg-[#40414F] dark:text-white 
                       dark:shadow-[0_0_15px_rgba(0,0,0,0.10)] sm:mx-4"
        >
          {/* Plugin / Bolt button on left */}
          <button
            className="absolute left-2 top-2 rounded-sm p-1 text-neutral-800
                       opacity-60 hover:bg-neutral-200 hover:text-neutral-900
                       dark:bg-opacity-50 dark:text-neutral-100 dark:hover:text-neutral-200"
            onClick={() => setShowPluginSelect(!showPluginSelect)}
          >
            {plugin ? <IconBrandGoogle size={20} /> : <IconBolt size={20} />}
          </button>

          {showPluginSelect && (
            <div className="absolute left-0 bottom-14 rounded bg-white dark:bg-[#343541]">
              <PluginSelect
                plugin={plugin}
                onKeyDown={(e: any) => {
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    setShowPluginSelect(false);
                    textareaRef.current?.focus();
                  }
                }}
                onPluginChange={(newPlugin: Plugin) => {
                  setPlugin(newPlugin);
                  setShowPluginSelect(false);
                  if (textareaRef.current) {
                    textareaRef.current.focus();
                  }
                }}
              />
            </div>
          )}

          {/* The text area for user typed input */}
          <textarea
            ref={textareaRef}
            className="m-0 w-full resize-none border-0 bg-transparent p-0 py-2 pr-8 pl-10
                       text-black dark:bg-transparent dark:text-white 
                       md:py-3 md:pl-10"
            style={{
              resize: 'none',
              bottom: `${textareaRef?.current?.scrollHeight}px`,
              maxHeight: '400px',
              overflow: `${
                textareaRef?.current && textareaRef.current.scrollHeight > 400
                  ? 'auto'
                  : 'hidden'
              }`,
            }}
            placeholder={t('Enter a question to ask for guidelines, dosages or refine clinical outputs') || ''}
            value={textInputContent}
            rows={1}
            onCompositionStart={() => setIsTyping(true)}
            onCompositionEnd={() => setIsTyping(false)}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
          />

          {/* Right side: send + mic */}
          <div className="absolute right-2 top-2 flex items-end flex-nowrap">
            <button
              className="rounded-sm p-1 text-neutral-800 opacity-60
                         hover:bg-neutral-200 hover:text-neutral-900
                         dark:bg-opacity-50 dark:text-neutral-100 
                         dark:hover:text-neutral-200"
              onClick={handleSend}
            >
              {messageIsStreaming ? (
                <div className="h-4 w-4 animate-spin rounded-full border-t-2 
                                border-neutral-800 opacity-60 dark:border-neutral-100" />
              ) : (
                <IconSend size={18} />
              )}
            </button>

            <ChatInputMicButton
              onSend={onSend}
              messageIsStreaming={messageIsStreaming}
            />
          </div>

          {showScrollDownButton && (
            <div className="absolute bottom-12 right-0 lg:bottom-0 lg:-right-10">
              <button
                className="flex h-7 w-7 items-center justify-center rounded-full 
                           bg-neutral-300 text-gray-800 shadow-md hover:shadow-lg 
                           focus:outline-none focus:ring-2 focus:ring-blue-500 
                           dark:bg-gray-700 dark:text-neutral-200"
                onClick={onScrollDownClick}
              >
                <IconArrowDown size={18} />
              </button>
            </div>
          )}

          {/* If user typed /some => show prompt suggestions */}
          {showPromptList && filteredPrompts.length > 0 && (
            <div className="absolute bottom-12 w-full">
              <PromptList
                activePromptIndex={activePromptIndex}
                prompts={filteredPrompts}
                onSelect={handleInitModal}
                onMouseOver={setActivePromptIndex}
                promptListRef={promptListRef}
              />
            </div>
          )}

          {/* If the chosen prompt has template variables => open a modal */}
          {promptModalVisible && (
            <VariableModal
              prompt={filteredPrompts[activePromptIndex]}
              variables={promptVariables}
              onSubmit={handleSubmit}
              onClose={() => {
                homeDispatch({ field: 'promptModalVisible', value: false });
              }}
            />
          )}
        </div>
      </div>

      {/* Optional small branding row */}
      <div className="hidden sm:flex items-center justify-center 
                      px-3 pt-2 pb-3 text-center text-[12px] 
                      text-black/50 dark:text-white/50 md:px-4 
                      md:pt-3 md:pb-6"
      >
        <a
          href="https://caduc.eus"
          target="_blank"
          rel="noreferrer"
          className="flex flex-nowrap items-center justify-center mr-2"
        >
          <span className="mr-1 text-lg">☤</span>
          <span className="underline hover:no-underline font-semibold">
            Metrix AI
          </span>
        </a>
        <span>{t('Demo Environment')}</span>
      </div>
    </div>
  );
};
