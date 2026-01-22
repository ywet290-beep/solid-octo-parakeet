import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Paperclip, Smile, MoreVertical, Hash, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  content: string;
  timestamp: Date;
  reactions?: { emoji: string; count: number; users: string[] }[];
  isEdited?: boolean;
  threadCount?: number;
}

const ChatWindow: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      userId: '1',
      username: 'John Doe',
      content: 'Hello everyone! Welcome to the general channel.',
      timestamp: new Date(Date.now() - 3600000),
      reactions: [{ emoji: '👍', count: 3, users: ['1', '2', '3'] }]
    },
    {
      id: '2',
      userId: '2',
      username: 'Jane Smith',
      content: 'Thanks John! Looking forward to collaborating.',
      timestamp: new Date(Date.now() - 1800000),
      threadCount: 2
    },
    {
      id: '3',
      userId: '1',
      username: 'John Doe',
      content: 'Let me know if you have any questions about the project setup.',
      timestamp: new Date(Date.now() - 900000),
      isEdited: true
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentChannel] = useState({ id: '1', name: 'general', type: 'channel' as 'channel' | 'dm' });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMoreMessages();
        }
      },
      { threshold: 1.0 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading]);

  const loadMoreMessages = useCallback(async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      const newMessages: Message[] = [
        {
          id: `old-${Date.now()}`,
          userId: '3',
          username: 'Bob Wilson',
          content: 'This is an older message for testing infinite scroll.',
          timestamp: new Date(Date.now() - 7200000)
        }
      ];
      setMessages(prev => [...newMessages, ...prev]);
      setLoading(false);
      // In real app, check if there are more messages
      if (messages.length > 20) {
        setHasMore(false);
      }
    }, 1000);
  }, [messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message: Message = {
        id: Date.now().toString(),
        userId: 'current-user',
        username: 'You',
        content: newMessage.trim(),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, message]);
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const messageDate = new Date(date);
    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    }
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return messageDate.toLocaleDateString();
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-3">
          {currentChannel.type === 'channel' ? (
            <Hash className="w-5 h-5 text-gray-500" />
          ) : (
            <Users className="w-5 h-5 text-gray-500" />
          )}
          <div>
            <h1 className="font-semibold text-gray-900">{currentChannel.name}</h1>
            <p className="text-sm text-gray-500">
              {currentChannel.type === 'channel' ? 'Channel' : 'Direct Message'}
            </p>
          </div>
        </div>
        <button className="p-2 hover:bg-gray-200 rounded">
          <MoreVertical className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {/* Load More Trigger */}
        <div ref={loadMoreRef} className="text-center py-4">
          {loading && (
            <div className="text-gray-500 text-sm">Loading more messages...</div>
          )}
        </div>

        <AnimatePresence>
          {messages.map((message, index) => {
            const showAvatar = index === 0 || messages[index - 1].userId !== message.userId;
            const showTimestamp = index === 0 ||
              new Date(message.timestamp).getTime() - new Date(messages[index - 1].timestamp).getTime() > 300000; // 5 minutes

            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex space-x-3 ${showAvatar ? 'mt-4' : ''}`}
              >
                {showAvatar ? (
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                    {message.username.charAt(0).toUpperCase()}
                  </div>
                ) : (
                  <div className="w-10"></div>
                )}
                <div className="flex-1 min-w-0">
                  {showAvatar && (
                    <div className="flex items-baseline space-x-2 mb-1">
                      <span className="font-semibold text-gray-900">{message.username}</span>
                      <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
                      {message.isEdited && (
                        <span className="text-xs text-gray-400">(edited)</span>
                      )}
                    </div>
                  )}
                  <div className="text-gray-700 break-words">
                    {message.content}
                  </div>
                  {message.reactions && message.reactions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {message.reactions.map((reaction, idx) => (
                        <button
                          key={idx}
                          className="flex items-center space-x-1 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-sm"
                        >
                          <span>{reaction.emoji}</span>
                          <span className="text-gray-600">{reaction.count}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {message.threadCount && (
                    <div className="text-xs text-blue-600 mt-1 cursor-pointer hover:underline">
                      {message.threadCount} replies
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      {isTyping && (
        <div className="px-4 py-2 text-sm text-gray-500">
          Someone is typing...
        </div>
      )}

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-end space-x-3">
          <button className="p-2 text-gray-500 hover:text-gray-700">
            <Paperclip className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message #${currentChannel.name}`}
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={1}
              style={{ minHeight: '44px', maxHeight: '120px' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 120) + 'px';
              }}
            />
          </div>
          <button className="p-2 text-gray-500 hover:text-gray-700">
            <Smile className="w-5 h-5" />
          </button>
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;