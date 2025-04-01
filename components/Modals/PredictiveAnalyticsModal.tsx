// components/Promptbar/PredictiveAnalyticsModal.tsx
import React, { useEffect, useState } from 'react';
import { IconX } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

interface PredictiveMetrics {
  threeHour: number;
  fourHour: number;
  fiveHour: number;
  sixHour: number;
  admission: number;
}

interface Props {
  onClose: () => void;
}

const PredictiveAnalyticsModal: React.FC<Props> = ({ onClose }) => {
  const { t } = useTranslation('promptbar');
  const [predictions, setPredictions] = useState<PredictiveMetrics>({
    threeHour: 0,
    fourHour: 0,
    fiveHour: 0,
    sixHour: 0,
    admission: 0,
  });

  useEffect(() => {
    // Generate random predictions (peaking at 3-hours and declining)
    const threeHour = Math.floor(Math.random() * 20) + 70; // 70-90%
    const fourHour = Math.floor(Math.random() * 20) + 50;  // 50-70%
    const fiveHour = Math.floor(Math.random() * 20) + 30;  // 30-50%
    const sixHour = Math.floor(Math.random() * 20) + 10;   // 10-30%
    const admission = Math.floor(Math.random() * 40) + 10; // 10-50%
    setPredictions({ threeHour, fourHour, fiveHour, sixHour, admission });
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-md p-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-200"
        >
          <IconX size={24} />
        </button>
        <h2 className="text-2xl font-bold text-white mb-4">
          {t('Predictive Analytics')}
        </h2>
        <div className="space-y-4">
          <div className="flex justify-between text-lg">
            <span>3-Hour Wait:</span>
            <span className="font-semibold">{predictions.threeHour}%</span>
          </div>
          <div className="flex justify-between text-lg">
            <span>4-Hour Wait:</span>
            <span className="font-semibold">{predictions.fourHour}%</span>
          </div>
          <div className="flex justify-between text-lg">
            <span>5-Hour Wait:</span>
            <span className="font-semibold">{predictions.fiveHour}%</span>
          </div>
          <div className="flex justify-between text-lg">
            <span>6-Hour Wait:</span>
            <span className="font-semibold">{predictions.sixHour}%</span>
          </div>
          <div className="flex justify-between text-lg">
            <span>Admission Likelihood:</span>
            <span className="font-semibold">{predictions.admission}%</span>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          >
            {t('Close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PredictiveAnalyticsModal;
