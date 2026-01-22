import React, { useState, useEffect } from 'react';
import { ChevronDown, Hash, Users, Plus, Search } from 'lucide-react';

interface Channel {
  id: string;
  name: string;
  type: 'channel' | 'dm';
  unreadCount: number;
  lastActivity: Date;
  isPrivate?: boolean;
}

const Sidebar: React.FC = () => {
  const [workspaces] = useState([
    { id: '1', name: 'Rocket.Chat', avatar: 'R' },
    { id: '2', name: 'Dev Team', avatar: 'D' }
  ]);
  const [currentWorkspace, setCurrentWorkspace] = useState(workspaces[0]);
  const [channels, setChannels] = useState<Channel[]>([
    { id: '1', name: 'general', type: 'channel', unreadCount: 5, lastActivity: new Date() },
    { id: '2', name: 'random', type: 'channel', unreadCount: 0, lastActivity: new Date(Date.now() - 3600000) },
    { id: '3', name: 'dev-team', type: 'channel', unreadCount: 12, lastActivity: new Date() },
    { id: '4', name: 'John Doe', type: 'dm', unreadCount: 2, lastActivity: new Date(Date.now() - 1800000) },
    { id: '5', name: 'Jane Smith', type: 'dm', unreadCount: 0, lastActivity: new Date(Date.now() - 7200000) }
  ]);
  const [sortBy, setSortBy] = useState<'unread' | 'activity'>('unread');
  const [searchTerm, setSearchTerm] = useState('');

  // Sort channels
  const sortedChannels = [...channels].sort((a, b) => {
    if (sortBy === 'unread') {
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
      if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
      return b.lastActivity.getTime() - a.lastActivity.getTime();
    } else {
      return b.lastActivity.getTime() - a.lastActivity.getTime();
    }
  }).filter(channel =>
    channel.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedChannels = {
    channels: sortedChannels.filter(c => c.type === 'channel'),
    dms: sortedChannels.filter(c => c.type === 'dm')
  };

  return (
    <div className="flex flex-col h-full">
      {/* Workspace Switcher - Pane 1 */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between cursor-pointer hover:bg-gray-700 p-2 rounded">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white font-bold">
              {currentWorkspace.avatar}
            </div>
            <span className="font-semibold">{currentWorkspace.name}</span>
          </div>
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {/* Channel List - Pane 2 */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search channels..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Sort Options */}
        <div className="px-4 pb-2">
          <div className="flex space-x-2">
            <button
              onClick={() => setSortBy('unread')}
              className={`px-3 py-1 text-xs rounded ${sortBy === 'unread' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            >
              Unread
            </button>
            <button
              onClick={() => setSortBy('activity')}
              className={`px-3 py-1 text-xs rounded ${sortBy === 'activity' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            >
              Recent
            </button>
          </div>
        </div>

        {/* Channels */}
        <div className="flex-1 overflow-y-auto">
          {/* Channels Section */}
          <div className="px-4 py-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Channels</h3>
              <Plus className="w-4 h-4 text-gray-400 cursor-pointer hover:text-white" />
            </div>
            <div className="space-y-1">
              {groupedChannels.channels.map(channel => (
                <div
                  key={channel.id}
                  className="flex items-center justify-between p-2 rounded cursor-pointer hover:bg-gray-700 group"
                >
                  <div className="flex items-center space-x-2">
                    <Hash className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{channel.name}</span>
                    {channel.isPrivate && <span className="text-xs text-gray-500">🔒</span>}
                  </div>
                  {channel.unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center">
                      {channel.unreadCount > 99 ? '99+' : channel.unreadCount}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* DMs Section */}
          <div className="px-4 py-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Direct Messages</h3>
              <Plus className="w-4 h-4 text-gray-400 cursor-pointer hover:text-white" />
            </div>
            <div className="space-y-1">
              {groupedChannels.dms.map(channel => (
                <div
                  key={channel.id}
                  className="flex items-center justify-between p-2 rounded cursor-pointer hover:bg-gray-700 group"
                >
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{channel.name}</span>
                  </div>
                  {channel.unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center">
                      {channel.unreadCount > 99 ? '99+' : channel.unreadCount}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;