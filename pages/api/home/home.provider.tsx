// pages/api/home/home.provider.tsx (or move to a non-API folder if it's a React component)

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useCreateReducer } from '@/hooks/useCreateReducer';
import HomeContext from './home.context';
import { HomeInitialState, initialState } from './home.state';
import { v4 as uuidv4 } from 'uuid';
import { Conversation } from '@/types/chat';
import { Prompt } from '@/types/prompt';
import { saveConversation, saveConversations } from '@/utils/app/conversation';
import { DEFAULT_SYSTEM_PROMPT, DEFAULT_TEMPERATURE } from '@/utils/app/const';
// import { OpenAIModelID, OpenAIModels } from '@/types/openai'; 
// ^ If you're not referencing OpenAIModelID or OpenAIModels, you can remove the import
import { getSettings } from '@/utils/app/settings';
import { useTranslation } from 'next-i18next';

interface HomeProviderProps {
  children: ReactNode;
  serverSideApiKeyIsSet?: boolean;
  serverSidePluginKeysSet?: boolean;

  // If you do not need a defaultModelId at all, you can remove this line:
  defaultModelId?: string;

  openaiApiKey?: string;
}

export const HomeProvider = ({
  children,
  serverSideApiKeyIsSet = false,
  serverSidePluginKeysSet = false,

  // No longer referencing GPT_3_5_TURBO or 'gpt-3.5-turbo':
  defaultModelId = '',

  openaiApiKey = '',
}: HomeProviderProps) => {
  const { t } = useTranslation('chat');
  const contextValue = useCreateReducer<HomeInitialState>({ initialState });

  const {
    state: { conversations },
    dispatch,
  } = contextValue;

  // Handler: Create a new conversation
  const handleNewConversation = () => {
    const lastConversation = conversations[conversations.length - 1];

    // If you do want to reference a fallback model, you can do so here:
    const fallbackModel = {
      id: 'my-fallback-model',
      name: 'My Fallback Model',
      maxLength: 4096,
      tokenLimit: 4096,
    };

    const newConversation: Conversation = {
      id: uuidv4(),
      name: t('New Conversation'),
      messages: [],
      // Use last conversation’s model if it exists, otherwise use the fallback:
      model: lastConversation?.model || fallbackModel,
      prompt: DEFAULT_SYSTEM_PROMPT,
      temperature: lastConversation?.temperature ?? DEFAULT_TEMPERATURE,
      folderId: null,
    };

    const updatedConversations = [...conversations, newConversation];
    dispatch({ field: 'selectedConversation', value: newConversation });
    dispatch({ field: 'conversations', value: updatedConversations });
    saveConversation(newConversation);
    saveConversations(updatedConversations);
    dispatch({ field: 'loading', value: false });
  };

  // Load settings from localStorage or server-side
  useEffect(() => {
    const settings = getSettings();
    if (settings.theme) {
      dispatch({ field: 'lightMode', value: settings.theme });
    }

    if (openaiApiKey) {
      dispatch({ field: 'apiKey', value: openaiApiKey });
      localStorage.setItem('apiKey', openaiApiKey);
    } else {
      const storedKey = localStorage.getItem('apiKey');
      if (storedKey) {
        dispatch({ field: 'apiKey', value: storedKey });
      }
    }

    if (serverSideApiKeyIsSet) {
      dispatch({ field: 'serverSideApiKeyIsSet', value: true });
    }
  }, [openaiApiKey, serverSideApiKeyIsSet, dispatch]);

  return (
    <HomeContext.Provider
      value={{
        ...contextValue,
        handleNewConversation,
        // other handlers if needed
      }}
    >
      {children}
    </HomeContext.Provider>
  );
};

export { HomeContext };
