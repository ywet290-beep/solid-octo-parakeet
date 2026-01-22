import React, { useState } from 'react';
import { Phone } from 'lucide-react';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import CallUI from './CallUI';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../contexts/AuthContext';

const Layout: React.FC = () => {
  const [showCall, setShowCall] = useState(false);
  const socket = useSocket();
  const { user } = useAuth();

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Sidebar - Panes 1 & 2 */}
      <div className="w-80 bg-gray-800 text-white flex flex-col">
        <Sidebar />
      </div>

      {/* Chat Window - Pane 3 */}
      <div className="flex-1 flex flex-col">
        <ChatWindow />
      </div>

      {/* Call Button */}
      <button
        onClick={() => setShowCall(true)}
        className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg z-40"
      >
        <Phone className="w-6 h-6" />
      </button>

      {/* Call UI */}
      {showCall && (
        <CallUI
          socket={socket}
          userId={user?.userId || ''}
          onClose={() => setShowCall(false)}
        />
      )}
    </div>
  );
};

export default Layout;