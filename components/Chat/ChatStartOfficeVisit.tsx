// components/Chat/ChatStartOfficeVisit.tsx
import { useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import { useTranslation } from 'next-i18next';
import HomeContext from '@/pages/api/home/home.context';
import { Message, Role } from '@/types/chat';
import { Plugin } from '@/types/plugin';
import { MediaStreamRecorder } from '@/types/mediaStreamRecorder';

let RecordRTC: any;

interface Props {
  onSend: (message: Message, plugin: Plugin | null) => void;
}

export const ChatStartOfficeVisit = ({ onSend }: Props) => {
  const { t } = useTranslation('chat');
  const recordRTC = useRef<MediaStreamRecorder | null>(null);
  const { state: { recording, transcribingAudio }, dispatch: homeDispatch } = useContext(HomeContext);

  const handleStartRecording = () => {
    if (typeof window !== 'undefined' && navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          recordRTC.current = RecordRTC(stream, {
            type: 'audio',
            mimeType: 'audio/webm',
          });
          if (recordRTC.current?.startRecording) {
            recordRTC.current.startRecording();
          }
          homeDispatch({ field: 'recording', value: true });
        })
        .catch((error) => {
          console.error('Error accessing microphone:', error);
        });
    } else {
      console.error('Audio recording not supported');
    }
  };

  const handleStopRecording = () => {
    homeDispatch({ field: 'recording', value: false });
    if (recordRTC.current?.stopRecording) {
      recordRTC.current.stopRecording(async () => {
        homeDispatch({ field: 'transcribingAudio', value: true });
        if (recordRTC.current?.getBlob) {
          const blob = recordRTC.current.getBlob();
          const formData = new FormData();
          formData.append('file', blob, 'audio.webm');
          formData.append('model', 'whisper-1');

          try {
            const apiKey = localStorage.getItem('apiKey');
            const response = await axios.post(
              'https://api.openai.com/v1/audio/transcriptions',
              formData,
              {
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                  'Content-Type': 'multipart/form-data',
                },
              }
            );
            homeDispatch({ field: 'transcribingAudio', value: false });
            const messageContent = `This is an automated transcription of my patient visit. Write a progress note for the visit. Include ICD 10 and CPT codes. Here is the transcription: ${response.data.text}`;
            const message: Message = {
              role: 'user' as Role,
              content: messageContent,
            };
            onSend(message, null);
          } catch (error) {
            console.error('Error fetching the transcription:', error);
            homeDispatch({ field: 'transcribingAudio', value: false });
          }
        }
      });
    }
  };

  useEffect(() => {
    import('recordrtc').then((R) => {
      RecordRTC = R.default || R;
    });
  }, []);

  return (
    <div
      className={`flex items-center justify-center w-64 h-24 
                  rounded-lg border border-neutral-200 
                  bg-gray-800 bg-opacity-100
                  cursor-pointer 
                  hover:bg-gray-800 hover:bg-opacity-70
                  dark:border-neutral-600 
                  dark:bg-gray-800 dark:bg-opacity-100 
                  dark:hover:bg-gray-800 dark:hover:bg-opacity-70
                  record-button 
                  transition-colors duration-200`}
      onClick={recording ? handleStopRecording : handleStartRecording}
    >
      {transcribingAudio ? (
        <div className="flex items-center justify-center">
          <div className="flex space-x-2 animate-pulse">
            <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
            <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
            <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
          </div>
        </div>
      ) : (
        <div className="flex items-center space-x-2 px-2">
          <img
            src="/diagnosis.png"
            alt="Start Office Visit"
            className="w-6 h-6 object-contain"
          />
          <div className="flex flex-col text-left">
            <h3 className="text-sm font-semibold text-white">
              Consultations
            </h3>
            <p className="text-[10px] text-white">
              {t('Have Metrix produce a structured consultation summary')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
