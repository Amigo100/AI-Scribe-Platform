// pages/api/home/home.provider.tsx

import React, { ReactNode, useEffect } from 'react';
import { useCreateReducer } from '@/hooks/useCreateReducer';
import HomeContext from './home.context';
import { HomeInitialState, initialState } from './home.state';
import { v4 as uuidv4 } from 'uuid';
import { Conversation } from '@/types/chat';// pages/api/home/home.provider.tsx

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
import { OpenAIModelID, OpenAIModels } from '@/types/openai';
import { getSettings } from '@/utils/app/settings';
import { useTranslation } from 'next-i18next';

// Define the interface for HomeProvider props
interface HomeProviderProps {
  children: ReactNode;
  serverSideApiKeyIsSet?: boolean;
  serverSidePluginKeysSet?: boolean;
  defaultModelId?: string;
  openaiApiKey?: string;
}

// This provider sets up your HomeContext logic.
export const HomeProvider = ({
  children,
  serverSideApiKeyIsSet = false,
  serverSidePluginKeysSet = false,
  // Use bracket notation to access the model ID (assuming OpenAIModelID is defined as an object)
  defaultModelId = OpenAIModelID["gpt-3.5-turbo"],
  openaiApiKey = '',
}: HomeProviderProps) => {
  const { t } = useTranslation('chat');
  const contextValue = useCreateReducer<HomeInitialState>({ initialState });

  const {
    state: { apiKey, lightMode, folders, conversations, selectedConversation, prompts, temperature },
    dispatch,
  } = contextValue;

  // Handler: Create a new conversation
  const handleNewConversation = () => {
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

  // ... Include any other handlers (e.g. handleCreateFolder, handleDeleteFolder, etc.)

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
        // Include other handlers here as needed.
      }}
    >
      {children}
    </HomeContext.Provider>
  );
};

export { HomeContext };

import { Prompt } from '@/types/prompt';
import { saveConversation, saveConversations } from '@/util// pages/api/home/home.provider.tsx

import React, { ReactNode, useEffect } from 'react';
import { useCreateReducer } from '@/hooks/useCreateReducer';
import HomeContext from './home.context';
import { HomeInitialState, initialState } from './home.state';
import { v4 as uuidv4 } from 'uuid';
import { Conversation } from '@/types/chat';
import { Prompt } from '@/types/prompt';
import { saveConversation, saveConversations } from '@/utils/app/conversation';
import { DEFAULT_SYSTEM_PROMPT, DEFAULT_TEMPERATURE } from '@/utils/app/const';
import { OpenAIModelID, OpenAIModels } from '@/types/openai';
import { getSettings } from '@/utils/app/settings';
import { useTranslation } from 'next-i18next';

// Define the interface for HomeProvider props
interface HomeProviderProps {
  children: ReactNode;
  serverSideApiKeyIsSet?: boolean;
  serverSidePluginKeysSet?: boolean;
  // Use string because our OpenAIModelID is defined as an object literal.
  defaultModelId?: string;
  openaiApiKey?: string;
}

// This is a new 'provider' that sets up your entire HomeContext logic
export const HomeProvider = ({
  children,
  serverSideApiKeyIsSet = false,
  serverSidePluginKeysSet = false,
  // Use bracket notation to access the key from OpenAIModelID
  defaultModelId = OpenAIModelID["gpt-3.5-turbo"],
  openaiApiKey = '',
}: HomeProviderProps) => {
  const { t } = useTranslation('chat');
  const contextValue = useCreateReducer<HomeInitialState>({ initialState });

  const {
    state: { apiKey, lightMode, folders, conversations, selectedConversation, prompts, temperature },
    dispatch,
  } = contextValue;

  // Handler: Create a new conversation
  const handleNewConversation = () => {
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

  // ... (Include any other handlers such as handleCreateFolder, handleDeleteFolder, etc.)

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
        // Include any other handlers here as needed.
      }}
    >
      {children}
    </HomeContext.Provider>
  );
};

export { HomeContext };
s/app/conversation';
import { DEFAULT_SYSTEM_PROMPT, DEFAULT_TEMPERATURE } from '@/utils/app/const';
import { OpenAIModelID, OpenAIModels } from '@/types/openai';
import { getSettings } from '@/utils/app/settings';
import { useTranslation } from 'next-i18next';

// Define the interface for HomeProvider props
interface HomeProviderProps {
  children: ReactNode;
  serverSideApiKeyIsSet?: boolean;
  serverSidePluginKeysSet?: boolean;
  defaultModelId?: string;
  openaiApiKey?: string;
}

// This is a new 'provider' that sets up your entire HomeContext logic
export const HomeProvider = ({
  children,
  serverSideApiKeyIsSet = false,
  serverSidePluginKeysSet = false,
  // Use the enum key instead of a string literal:
  defaultModelId = OpenAIModelID.GPT_3_5_TURBO,
  openaiApiKey = '',
}: HomeProviderProps) => {
  const { t } = useTranslation('chat'); // if you use translations
  const contextValue = useCreateReducer<HomeInitialState>({ initialState });

  const {
    state: { apiKey, lightMode, folders, conversations, selectedConversation, prompts, temperature },
    dispatch,
  } = contextValue;

  // Handler: Create a new conversation
  const handleNewConversation = () => {
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

  // ... (include your other handlers such as handleCreateFolder, handleDeleteFolder, etc.)

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
        // Include your other handlers here as needed.
      }}
    >
      {children}
    </HomeContext.Provider>
  );
};

export { HomeContext };
