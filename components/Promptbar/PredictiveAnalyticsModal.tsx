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

// Helper function to choose bar color based on value
const getBarColor = (percentage: number): string => {
  if (percentage < 30) {
    return 'bg-green-500';
  } else if (percentage < 70) {
    return 'bg-yellow-500';
  } else {
    return 'bg-red-500';
  }
};

/**
 * Returns a SINGLE piece of advice for the overall length of stay (LOS)
 * based on the highest threshold likely to be breached (>= 50%).
 * This avoids conflicting advice for 3h vs 4h vs 5h vs 6h.
 */
const getLOSAdvice = (predictions: PredictiveMetrics): string => {
  const { threeHour, fourHour, fiveHour, sixHour } = predictions;

  if (sixHour >= 50) {
    return 'High likelihood of extended wait (6+ hours). Recommend early intervention, involving senior decision-makers, and expediting necessary investigations.';
  } else if (fiveHour >= 50) {
    return 'Significant likelihood of 5-hour breach. Consider early senior review, ordering scans/bloods, and involving specialty teams promptly.';
  } else if (fourHour >= 50) {
    return 'Moderate likelihood of 4-hour breach. Encourage proactive management, earlier diagnostics, and close monitoring.';
  } else if (threeHour >= 50) {
    return 'Elevated likelihood of 3-hour breach. Maintain vigilance, expedite workup, and prepare for potential escalation if condition worsens.';
  } else {
    return 'Less likely to breach these time thresholds. Standard management and routine investigations are appropriate; continue monitoring.';
  }
};

/**
 * Returns advice based on admission likelihood.
 * You could choose to unify this logic with getLOSAdvice
 * if you prefer one combined message for both LOS & Admission.
 */
const getAdmissionAdvice = (percentage: number): string => {
  if (percentage >= 50) {
    return 'High likelihood of admission: arrange early bed planning, involve senior review, and expedite diagnostics.';
  }
  return 'Less likely to require admission: continue conservative management, but reassess periodically.';
};

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

        {/* LENGTH OF STAY GROUP */}
        <div className="mb-6">
          <h3 className="text-xl text-white font-semibold mb-2">
            {t('Length of Stay Predictions')}
          </h3>
          {/* 3-Hour Wait */}
          <div className="mb-2">
            <div className="flex justify-between text-lg text-gray-200 mb-1">
              <span>3-Hour Wait</span>
              <span className="font-semibold">{predictions.threeHour}%</span>
            </div>
            <div className="w-full h-3 bg-gray-700 rounded">
              <div
                className={`h-3 rounded ${getBarColor(predictions.threeHour)}`}
                style={{ width: `${predictions.threeHour}%` }}
              />
            </div>
          </div>

          {/* 4-Hour Wait */}
          <div className="mb-2">
            <div className="flex justify-between text-lg text-gray-200 mb-1">
              <span>4-Hour Wait</span>
              <span className="font-semibold">{predictions.fourHour}%</span>
            </div>
            <div className="w-full h-3 bg-gray-700 rounded">
              <div
                className={`h-3 rounded ${getBarColor(predictions.fourHour)}`}
                style={{ width: `${predictions.fourHour}%` }}
              />
            </div>
          </div>

          {/* 5-Hour Wait */}
          <div className="mb-2">
            <div className="flex justify-between text-lg text-gray-200 mb-1">
              <span>5-Hour Wait</span>
              <span className="font-semibold">{predictions.fiveHour}%</span>
            </div>
            <div className="w-full h-3 bg-gray-700 rounded">
              <div
                className={`h-3 rounded ${getBarColor(predictions.fiveHour)}`}
                style={{ width: `${predictions.fiveHour}%` }}
              />
            </div>
          </div>

          {/* 6-Hour Wait */}
          <div className="mb-2">
            <div className="flex justify-between text-lg text-gray-200 mb-1">
              <span>6-Hour Wait</span>
              <span className="font-semibold">{predictions.sixHour}%</span>
            </div>
            <div className="w-full h-3 bg-gray-700 rounded">
              <div
                className={`h-3 rounded ${getBarColor(predictions.sixHour)}`}
                style={{ width: `${predictions.sixHour}%` }}
              />
            </div>
          </div>

          {/* Single Advice for Length of Stay */}
          <div className="mt-4 p-3 bg-gray-700 rounded">
            <p className="text-sm text-gray-300 font-semibold">
              {getLOSAdvice(predictions)}
            </p>
          </div>
        </div>

        {/* ADMISSION LIKELIHOOD GROUP */}
        <div className="mb-6">
          <h3 className="text-xl text-white font-semibold mb-2">
            {t('Admission Likelihood')}
          </h3>
          <div>
            <div className="flex justify-between text-lg text-gray-200 mb-1">
              <span>Admission</span>
              <span className="font-semibold">{predictions.admission}%</span>
            </div>
            <div className="w-full h-3 bg-gray-700 rounded">
              <div
                className={`h-3 rounded ${getBarColor(predictions.admission)}`}
                style={{ width: `${predictions.admission}%` }}
              />
            </div>
            <div className="mt-4 p-3 bg-gray-700 rounded">
              <p className="text-sm text-gray-300 font-semibold">
                {getAdmissionAdvice(predictions.admission)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
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
