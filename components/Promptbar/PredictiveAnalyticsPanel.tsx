// components/Promptbar/PredictiveAnalyticsPanel.tsx
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface PredictiveMetrics {
  threeHour: number;
  fourHour: number;
  fiveHour: number;
  sixHour: number;
  admission: number;
}

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
 */
const getAdmissionAdvice = (percentage: number): string => {
  if (percentage >= 50) {
    return 'High likelihood of admission: arrange early bed planning, involve senior review, and expedite diagnostics.';
  }
  return 'Less likely to require admission: continue conservative management, but reassess periodically.';
};

const PredictiveAnalyticsPanel: React.FC = () => {
  const { t } = useTranslation('promptbar');
  const [predictions, setPredictions] = useState<PredictiveMetrics>({
    threeHour: 0,
    fourHour: 0,
    fiveHour: 0,
    sixHour: 0,
    admission: 0,
  });

  useEffect(() => {
    const threeHour = Math.floor(Math.random() * 20) + 70; // 70-90%
    const fourHour = Math.floor(Math.random() * 20) + 50;  // 50-70%
    const fiveHour = Math.floor(Math.random() * 20) + 30;  // 30-50%
    const sixHour = Math.floor(Math.random() * 20) + 10;   // 10-30%
    const admission = Math.floor(Math.random() * 40) + 10; // 10-50%

    setPredictions({ threeHour, fourHour, fiveHour, sixHour, admission });
  }, []);

  return (
    <div className="text-white">
      <h2 className="text-xl font-bold mb-4">
        {t('Predictive Analytics')}
      </h2>

      {/* LENGTH OF STAY GROUP */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">
          {t('Length of Stay Predictions')}
        </h3>
        {/* 3-Hour Wait */}
        <div className="mb-2">
          <div className="flex justify-between text-gray-200 mb-1">
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
          <div className="flex justify-between text-gray-200 mb-1">
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
          <div className="flex justify-between text-gray-200 mb-1">
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
          <div className="flex justify-between text-gray-200 mb-1">
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
        <h3 className="text-lg font-semibold mb-2">
          {t('Admission Likelihood')}
        </h3>
        <div>
          <div className="flex justify-between text-gray-200 mb-1">
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
    </div>
  );
};

export default PredictiveAnalyticsPanel;
