// pages/api/home/home.provider.tsx
// (Or move outside /pages/api if it’s a React component)
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
import { OpenAIModelID, OpenAIModels } from '@/types/openai'; // <-- your enum is here
import { getSettings } from '@/utils/app/settings';
import { useTranslation } from 'next-i18next';

// Example usage: we assume your enum is something like:
//   enum OpenAIModelID {
//     GPT_3_5_TURBO = 'gpt-3.5-turbo',
//     GPT_4 = 'gpt-4',
//     // ...
//   }

interface HomeProviderProps {
  children: ReactNode;
  serverSideApiKeyIsSet?: boolean;
  serverSidePluginKeysSet?: boolean;
  defaultModelId?: OpenAIModelID; // or string
  openaiApiKey?: string;
}

export const HomeProvider = ({
  children,
  serverSideApiKeyIsSet = false,
  serverSidePluginKeysSet = false,
  // Using the enum key:
  defaultModelId = OpenAIModelID.GPT_3_5_TURBO,
  openaiApiKey = '',
}: HomeProviderProps) => {
  const { t } = useTranslation('chat');
  const contextValue = useCreateReducer<HomeInitialState>({ initialState });

  const {
    state: { conversations },
    dispatch,
  } = contextValue;

  const handleNewConversation = () => {
    const lastConversation = conversations[conversations.length - 1];
    const newConversation: Conversation = {
      id: uuidv4(),
      name: t('New Conversation'),
      messages: [],
      model:
        lastConversation?.model ??
        // e.g. if OpenAIModels is keyed by the enum values:
        {
          id:    OpenAIModels[defaultModelId].id,
          name:  OpenAIModels[defaultModelId].name,
          maxLength:   OpenAIModels[defaultModelId].maxLength,
          tokenLimit:  OpenAIModels[defaultModelId].tokenLimit,
        },
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
        // any other handlers ...
      }}
    >
      {children}
    </HomeContext.Provider>
  );
};

export { HomeContext };
