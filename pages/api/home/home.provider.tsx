// pages/api/home/home.provider.tsx

import { useEffect, useRef, useState } from 'react';
import { useCreateReducer } from '@/hooks/useCreateReducer';
import HomeContext from './home.context';
import { HomeInitialState, initialState } from './home.state';
import { v4 as uuidv4 } from 'uuid';
import { Conversation } from '@/types/chat';
import { KeyValuePair } from '@/types/data';
import { FolderType } from '@/types/folder';
import { Prompt } from '@/types/prompt';
import { updateConversation, saveConversation, saveConversations } from '@/utils/app/conversation';
import { cleanConversationHistory, cleanSelectedConversation } from '@/utils/app/clean';
import { DEFAULT_SYSTEM_PROMPT, DEFAULT_TEMPERATURE } from '@/utils/app/const';
import { OpenAIModelID, OpenAIModels } from '@/types/openai';
import { getSettings } from '@/utils/app/settings';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
// and any other imports from home.tsx as needed

// This is a new 'provider' that sets up your entire HomeContext logic
export const HomeProvider = ({ 
  children,
  serverSideApiKeyIsSet = false,
  serverSidePluginKeysSet = false,
  defaultModelId = OpenAIModelID['gpt-3.5-turbo'],
  openaiApiKey = '',
}) => {

  const { t } = useTranslation('chat'); // if you use translations
  const contextValue = useCreateReducer<HomeInitialState>({ initialState });

  const {
    state: {
      apiKey,
      lightMode,
      folders,
      conversations,
      selectedConversation,
      prompts,
      temperature,
    },
    dispatch,
  } = contextValue;

  // all the logic you had in home.tsx -> handleNewConversation, handleCreateFolder, etc. 
  // EXACTLY as in your home.tsx, but do not return <Chat/> or <main> here:
  const handleNewConversation = () => {
    // same as in home.tsx
    const lastConversation = conversations[conversations.length - 1];
    const newConversation: Conversation = {
      id: uuidv4(),
      name: t('New Conversation'),
      messages: [],
      model: lastConversation?.model || {
        id: OpenAIModels[defaultModelId].id,
        name: OpenAIModels[defaultModelId].name,
        maxLength: OpenAIModels[defaultModelId].maxLength,
        tokenLimit: OpenAIModels[defaultModelId].tokenLimit,
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

  // ...handleCreateFolder, handleDeleteFolder, handleUpdateFolder, handleSelectConversation, handleUpdateConversation, etc. 
  // from your home.tsx

  // useEffects that load from localStorage, etc. 
  // you can copy those from home.tsx if you want the same initialization logic
  useEffect(() => {
    // do your localStorage or server side logic
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

    // etc. replicate as needed 
  }, [openaiApiKey, serverSideApiKeyIsSet]);

  // Provide the entire context value
  return (
    <HomeContext.Provider
      value={{
        ...contextValue,
        handleNewConversation,
        // your other handlers, e.g. handleCreateFolder, handleSelectConversation, etc.
      }}
    >
      {children}
    </HomeContext.Provider>
  );
};
