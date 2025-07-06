import React, { useState, useEffect, useRef } from 'react';
import { Send, Hash, Volume2, Users, Settings, Pin, Search } from 'lucide-react';
import { Channel, Group } from '../../types/groups';
import { Message } from '../../types';
import { useAuthContext } from '../../contexts/AuthContext';
import { sendMessage, getMessages } from '../../services/chatService';
import { MessageBubble } from '../Chat/MessageBubble';

interface GroupChatWindowProps {
  group: Group;
  channel: Channel;
}

export const GroupChatWindow: React.FC<GroupChatWindowProps> = ({ group, channel }) => {
  const { user } = useAuthContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !channel || channel.type !== 'text') return;

    // For group channels, we'll need to modify the message service
    // For now, we'll use a placeholder implementation
    const unsubscribe = getMessages(user.uid, channel.id, (messageList) => {
      setMessages(messageList);
    });

    return () => unsubscribe();
  }, [user, channel]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || channel.type !== 'text') return;

    setLoading(true);
    try {
      // For group messages, we'll need to modify the sendMessage function
      // to handle group channels instead of direct messages
      await sendMessage(
        user.uid,
        channel.id, // Use channel ID as receiver for group messages
        newMessage.trim(),
        'text'
      );
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChannelIcon = () => {
    switch (channel.type) {
      case 'text':
        return <Hash className="w-5 h-5 text-gray-400" />;
      case 'voice':
        return <Volume2 className="w-5 h-5 text-gray-400" />;
      case 'announcement':
        return <Pin className="w-5 h-5 text-gray-400" />;
      default:
        return <Hash className="w-5 h-5 text-gray-400" />;
    }
  };

  if (channel.type === 'voice') {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
        {/* Voice Channel Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Volume2 className="w-6 h-6 text-gray-500" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {channel.name}
              </h3>
              {channel.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {channel.description}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <Users className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Voice Channel Content */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Volume2 className="w-12 h-12 text-purple-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {channel.name}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-8">
              {channel.description || 'No one is in this voice channel yet.'}
            </p>
            <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
              Join Voice Channel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Channel Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getChannelIcon()}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {channel.name}
            </h3>
            {channel.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {channel.description}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <Search className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <Pin className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <Users className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              {getChannelIcon()}
            </div>
            <h3 className="text-lg font-semibold mb-2">
              Welcome to #{channel.name}!
            </h3>
            <p>This is the start of the #{channel.name} channel.</p>
            {channel.description && (
              <p className="text-sm mt-2 text-gray-400">{channel.description}</p>
            )}
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.senderId === user?.uid}
              onReply={() => {}}
              onReactionUpdate={() => {}}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Message #${channel.name}`}
              className="w-full pl-4 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={!newMessage.trim() || loading}
            className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};