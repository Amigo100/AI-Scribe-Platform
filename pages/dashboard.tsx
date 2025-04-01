// pages/dashboard.tsx
import React, { useRef, useContext } from 'react';
import { HomeProvider } from '@/pages/api/home/home.provider';
import HomeContext from '@/pages/api/home/home.context';
import { Navbar } from '@/components/Mobile/Navbar';
import { Chatbar } from '@/components/Chatbar/Chatbar';
import Promptbar from '@/components/Promptbar/Promptbar';
import Chat from '@/components/Chat/Chat';

const DashboardContent: React.FC = () => {
  const stopConversationRef = useRef<boolean>(false);
  const { state } = useContext(HomeContext);
  const selectedConversation = state.selectedConversation;

  return (
    <div className="flex h-screen w-screen flex-col text-sm text-white dark:text-white">
      {/* Mobile Navbar */}
      <div className="fixed top-0 w-full sm:hidden">
        <Navbar
          selectedConversation={selectedConversation || { name: 'New Conversation' } as any}
          onNewConversation={() => {}}
        />
      </div>
      {/* Main Layout: Left Chatbar, Center Chat, Right Promptbar */}
      <div className="flex h-full w-full pt-[48px] sm:pt-0">
        <Chatbar />
        <div className="flex flex-1">
          <Chat stopConversationRef={stopConversationRef} />
        </div>
        <Promptbar />
      </div>
    </div>
  );
};

export default function DashboardPage() {
  return (
    <HomeProvider>
      <DashboardContent />
    </HomeProvider>
  );
}
