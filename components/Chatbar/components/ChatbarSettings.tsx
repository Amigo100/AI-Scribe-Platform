import {
  IconSettings,
  IconUser,
  IconTemplate,
  IconHelpCircle,
} from '@tabler/icons-react';
import { useContext } from 'react';
import { useTranslation } from 'next-i18next';

import HomeContext from '@/pages/api/home/home.context';

import ChatbarContext from '../Chatbar.context';
import { ClearConversations } from './ClearConversations';
import { Key } from '../../Settings/Key';
import { SidebarButton } from '../../Sidebar/SidebarButton';

export const ChatbarSettings = () => {
  const { t } = useTranslation('sidebar');

  const {
    state: { apiKey, serverSideApiKeyIsSet, conversations },
    dispatch: homeDispatch,
  } = useContext(HomeContext);

  const {
    handleClearConversations,
    handleApiKeyChange,
  } = useContext(ChatbarContext);

  return (
    <div
      className="
        flex flex-col items-center space-y-1 
        border-t border-white/20 
        pt-1 text-sm text-white
      "
    >
      {conversations.length > 0 && (
        <ClearConversations onClearConversations={handleClearConversations} />
      )}

      <SidebarButton
        text={t('Profile')}
        icon={<IconUser size={18} />}
        onClick={() => homeDispatch({ field: 'openModal', value: 'profile' })}
      />
      <SidebarButton
        text={t('Templates')}
        icon={<IconTemplate size={18} />}
        onClick={() => homeDispatch({ field: 'openModal', value: 'templates' })}
      />
      <SidebarButton
        text={t('Predictive Analytics')}
        icon={<IconTemplate size={18} />}
        onClick={() => homeDispatch({ field: 'openModal', value: 'predictive analytics' })}
      />
      <SidebarButton
        text={t('Help')}
        icon={<IconHelpCircle size={18} />}
        onClick={() => homeDispatch({ field: 'openModal', value: 'help' })}
      />

      <SidebarButton
        text={t('Settings')}
        icon={<IconSettings size={18} />}
        onClick={() => homeDispatch({ field: 'openModal', value: 'settings' })}
      />

      {/* If the server side API key isn't set, let user input their own */}
      {!serverSideApiKeyIsSet && (
        <Key apiKey={apiKey} onApiKeyChange={handleApiKeyChange} />
      )}
    </div>
  );
};
