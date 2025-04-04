// components/Chat/ChatTextToSpeech.tsx
import { useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import { useTranslation } from 'next-i18next';
import HomeContext from '@/pages/api/home/home.context';
import { Message, Role } from '@/types/chat';
import { Plugin } from '@/types/plugin';
import { IconMicrophone } from '@tabler/icons-react';

type RecordRTCInstance = any;

let RecordRTC: any;

interface Props {
  onSend: (message: Message, plugin: Plugin | null) => void;
}

export const ChatTextToSpeech = ({ onSend }: Props) => {
  const { t } = useTranslation('chat');
  const recordRTC = useRef<RecordRTCInstance | null>(null);

  const {
    state: { recording, transcribingAudio },
    dispatch: homeDispatch,
  } = useContext(HomeContext);

  // Start Recording
  const handleStartRecording = () => {
    if (typeof window !== 'undefined' && navigator.mediaDevices) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
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

  // Stop Recording + Transcribe
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
              },
            );
            homeDispatch({ field: 'transcribingAudio', value: false });
            const message: Message = {
              role: 'user' as Role,
              content: response.data.text,
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
    // Lazy-load RecordRTC on mount
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
        record-button 
        ${recording ? 'is-recording' : ''}`}
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
          <IconMicrophone size={36} className="text-white" />
          <div className="flex flex-col text-left">
            <h3 className="text-sm font-semibold text-white">Dictation</h3>
            <p className="text-[10px] text-white">
              {t('Dictate Clerking Notes, SOAP Notes and Discharge Summaries')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
