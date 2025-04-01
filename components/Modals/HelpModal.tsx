import { useContext } from 'react';
import { useTranslation } from 'next-i18next';
import HomeContext from '@/pages/api/home/home.context';

export const HelpModal = () => {
  const { t } = useTranslation();
  const { state, dispatch } = useContext(HomeContext);

  if (state.openModal !== 'help') return null;

  const handleClose = () => {
    dispatch({ field: 'openModal', value: null });
  };

  return (
    // Dark overlay behind the modal
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50">
      {/* Modal Container */}
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-auto rounded-md shadow-lg
          bg-white dark:bg-[#343541] text-black dark:text-white
          border border-gray-300 dark:border-gray-700 p-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {t('Help & FAQs')}
          </h2>
          <button
            className="rounded-md bg-blue-600 px-3 py-1 text-sm font-semibold text-white
              hover:bg-blue-700 transition"
            onClick={handleClose}
          >
            {t('Close')}
          </button>
        </div>

        {/* Quick Start Section */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {t('Quick Start Guide')}
          </h3>
          <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-200 mt-2 space-y-1">
            <li>
              {t(
                'Open the Chat interface and click “Start New Session” in the Chatbar to begin a new conversation.'
              )}
            </li>
            <li>
              {t(
                'Use the Voice Mode button to dictate your notes. Press spacebar (if not typing) or click again to stop recording.'
              )}
            </li>
            <li>
              {t(
                'Select a template (e.g., “ED Triage Note”) to automatically structure your content.'
              )}
            </li>
            <li>
              {t(
                'Adjust the model (GPT-4, Gemini, or internal ML) as preferred in the chat toolbar or Settings.'
              )}
            </li>
          </ul>
        </div>

        {/* Privacy & Security Section */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {t('Privacy & Security')}
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
            {t(
              'Our platform uses secure methods (e.g., OpenWhisper + GPT-4 or Gemini) to process your audio and generate structured clinical documents. Please avoid including personally identifiable information (PII) or personal health information (PHI). Data is transiently processed and not stored on our servers unless otherwise specified in your institution’s policy.'
            )}
          </p>
        </div>

        {/* Frequently Asked Questions Section */}
        <div className="mb-6 space-y-3">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {t('Frequently Asked Questions')}
          </h3>

          <details
            className="p-2 bg-gray-100 dark:bg-gray-700 rounded border
              border-gray-200 dark:border-gray-600"
          >
            <summary className="cursor-pointer text-sm text-gray-900 dark:text-gray-100">
              {t('How does Metrix AI handle patient data?')}
            </summary>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
              {t(
                'Metrix AI processes dictation data transiently using secure connections. We strongly advise excluding personal health identifiers from dictation. For enhanced security, you can also enable internal ML models for local processing.'
              )}
            </p>
          </details>

          <details
            className="p-2 bg-gray-100 dark:bg-gray-700 rounded border
              border-gray-200 dark:border-gray-600"
          >
            <summary className="cursor-pointer text-sm text-gray-900 dark:text-gray-100">
              {t('Which browsers are supported?')}
            </summary>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
              {t(
                'Chrome, Safari, and modern Edge are recommended for best results. Other browsers may work but may have partial support for speech recognition or other features.'
              )}
            </p>
          </details>

          <details
            className="p-2 bg-gray-100 dark:bg-gray-700 rounded border
              border-gray-200 dark:border-gray-600"
          >
            <summary className="cursor-pointer text-sm text-gray-900 dark:text-gray-100">
              {t('Can I use internal ML models?')}
            </summary>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
              {t(
                'Yes, internal ML models can process data without sending it over network connections, useful for sensitive clinical data. Check Settings to switch to an internal model.'
              )}
            </p>
          </details>

          <details
            className="p-2 bg-gray-100 dark:bg-gray-700 rounded border
              border-gray-200 dark:border-gray-600"
          >
            <summary className="cursor-pointer text-sm text-gray-900 dark:text-gray-100">
              {t('How can I contact support?')}
            </summary>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
              {t(
                'Email support@metrixai.com or use the “Profile” page to open a ticket. Our team is available 24/7.'
              )}
            </p>
          </details>
        </div>

        <div className="text-sm text-gray-700 dark:text-gray-300">
          {t(
            'For further assistance, contact your institution’s IT department or refer to the Metrix AI user guide.'
          )}
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
