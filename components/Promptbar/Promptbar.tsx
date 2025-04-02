// components/Promptbar/Promptbar.tsx
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';

import HomeContext from '@/pages/api/home/home.context';
import Sidebar from '@/components/Sidebar';
import LanguageSwitcher from './LanguageSwitcher';
import PredictiveAnalyticsPanel from './PredictiveAnalyticsPanel';

const Promptbar = () => {
  const { t } = useTranslation('promptbar');
  const {
    state: { showSidePromptbar, hasChatOutput },
    dispatch: homeDispatch,
  } = useContext(HomeContext);

  // Toggle the promptbar (right-hand sidebar) open/closed
  const handleTogglePromptbar = () => {
    homeDispatch({ field: 'showSidePromptbar', value: !showSidePromptbar });
    localStorage.setItem('showSidePromptbar', JSON.stringify(!showSidePromptbar));
  };

  // Render content for the right sidebar
  const renderContent = () => (
    <div className="flex flex-col h-full">
      {hasChatOutput ? (
        <div className="p-3">
          <PredictiveAnalyticsPanel />
        </div>
      ) : (
        <div className="p-3 text-gray-400 text-sm">
          {t('No chat output yet. The analytics will appear here after the assistant responds.')}
        </div>
      )}
      {/* Divider */}
      <div className="flex-1 border-t border-gray-600 my-2" />
      {/* Bottom area: Language Switcher */}
      <div className="p-3">
        <LanguageSwitcher />
      </div>
    </div>
  );

  return (
    <Sidebar
      side="right"
      isOpen={showSidePromptbar}
      toggleOpen={handleTogglePromptbar}
      className="w-64"
    >
      {renderContent()}
    </Sidebar>
  );
};

export default Promptbar;
