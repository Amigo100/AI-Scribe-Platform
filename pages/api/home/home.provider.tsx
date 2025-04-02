// ~/pages/api/home/home.provider.tsx
// (Ideally move this file out of /api/ if it is a React component!)

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from 'next-i18next';

import HomeContext from './home.context';
import { HomeInitialState, initialState } from './home.state';
import { useCreateReducer } from '@/hooks/useCreateReducer';
import { Conversation } from '@/types/chat';
import { DEFAULT_SYSTEM_PROMPT, DEFAULT_TEMPERATURE } from '@/utils/app/const';
import { saveConversation, saveConversations } from '@/utils/app/conversation';
import { getSettings } from '@/utils/app/settings';

interface HomeProviderProps {
  children: ReactNode;
  serverSideApiKeyIsSet?: boolean;
  serverSidePluginKeysSet?: boolean;
  defaultModelId?: string;
  openaiApiKey?: string;
}

export const HomeProvider = ({
  children,
  serverSideApiKeyIsSet = false,
  serverSidePluginKeysSet = false,
  defaultModelId = '',
  openaiApiKey = '',
}: HomeProviderProps) => {
  const { t } = useTranslation('chat');
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
      loading,
    },
    dispatch,
  } = contextValue;

  //
  // 1. handleNewConversation
  //
  const handleNewConversation = () => {
    const lastConversation = conversations[conversations.length - 1];

    // Example fallback model object if you need it:
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
      model: lastConversation?.model ?? fallbackModel,
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

  //
  // 2. Folder Handlers
  //
  const handleCreateFolder = (folderName: string) => {
    const newFolder = {
      id: uuidv4(),
      name: folderName,
    };
    const updatedFolders = [...folders, newFolder];

    dispatch({ field: 'folders', value: updatedFolders });
    // If you have a localStorage or DB utility, you could also persist it:
    localStorage.setItem('folders', JSON.stringify(updatedFolders));
  };

  const handleDeleteFolder = (folderId: string) => {
    const updatedFolders = folders.filter((f) => f.id !== folderId);
    dispatch({ field: 'folders', value: updatedFolders });
    localStorage.setItem('folders', JSON.stringify(updatedFolders));
  };

  const handleUpdateFolder = (folderId: string, newName: string) => {
    const updatedFolders = folders.map((f) =>
      f.id === folderId ? { ...f, name: newName } : f,
    );
    dispatch({ field: 'folders', value: updatedFolders });
    localStorage.setItem('folders', JSON.stringify(updatedFolders));
  };

  //
  // 3. Conversation Handlers
  //
  const handleSelectConversation = (conversation: Conversation) => {
    dispatch({ field: 'selectedConversation', value: conversation });
    // Potentially save selection to localStorage, if desired:
    saveConversation(conversation);
  };

  const handleUpdateConversation = (updatedConversation: Conversation) => {
    const newConversations = conversations.map((c) =>
      c.id === updatedConversation.id ? updatedConversation : c,
    );
    dispatch({ field: 'conversations', value: newConversations });
    saveConversations(newConversations);

    // Update the currently selected conversation if it’s the same
    if (selectedConversation?.id === updatedConversation.id) {
      dispatch({ field: 'selectedConversation', value: updatedConversation });
      saveConversation(updatedConversation);
    }
  };

  //
  // 4. Load settings from localStorage or server
  //
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
        // Provide all the handlers required by HomeContextProps:
        handleNewConversation,
        handleCreateFolder,
        handleDeleteFolder,
        handleUpdateFolder,
        handleSelectConversation,
        handleUpdateConversation,
      }}
    >
      {children}
    </HomeContext.Provider>
  );
};

export { HomeContext };
