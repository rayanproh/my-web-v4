import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, MessageCircle, Users, Hash, Zap } from 'lucide-react';
import { collection, query, where, onSnapshot, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Chat, User } from '../../types';
import { useAuthContext } from '../../contexts/AuthContext';
import { useInView } from 'react-intersection-observer';

interface ChatListProps {
  onChatSelect: (chat: Chat) => void;
  selectedChatId?: string;
}

export const ChatList: React.FC<ChatListProps> = ({ onChatSelect, selectedChatId }) => {
  const { user } = useAuthContext();
  const [chats, setChats] = useState<Chat[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [loading, setLoading] = useState(true);

  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false
  });

  useEffect(() => {
    if (!user) return;

    console.log('🔄 Loading chats for user:', user.uid);
    setLoading(true);

    // OPTIMIZED: Efficient query with proper timeout
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid),
      orderBy('lastMessageAt', 'desc'),
      limit(20) // Reduced for faster loading
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatList: Chat[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        chatList.push({
          id: doc.id,
          ...data,
          lastMessageAt: data.lastMessageAt?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date()
        } as Chat);
      });
      
      console.log(`✅ Loaded ${chatList.length} chats`);
      setChats(chatList);
      setLoading(false);
    }, (error) => {
      console.error('❌ Error loading chats:', error);
      setLoading(false);
    });

    // Auto-timeout for loading
    const timeout = setTimeout(() => {
      if (loading) {
        console.log('⏰ Chat loading timeout, proceeding anyway');
        setLoading(false);
      }
    }, 3000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, [user]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!user) return;

      try {
        console.log('👥 Loading users...');
        const usersSnapshot = await getDocs(
          query(collection(db, 'users'), limit(50)) // Reduced for faster loading
        );
        const usersList: User[] = [];
        usersSnapshot.forEach((doc) => {
          if (doc.id !== user.uid) {
            const data = doc.data();
            usersList.push({
              id: doc.id,
              ...data,
              lastSeen: data.lastSeen?.toDate() || new Date(),
              createdAt: data.createdAt?.toDate() || new Date()
            } as User);
          }
        });
        console.log(`✅ Loaded ${usersList.length} users`);
        setUsers(usersList);
      } catch (error) {
        console.error('❌ Error fetching users:', error);
      }
    };

    fetchUsers();
  }, [user]);

  const filteredChats = useMemo(() => {
    if (!searchTerm) return chats;
    return chats.filter(chat => {
      const searchLower = searchTerm.toLowerCase();
      return chat.groupName?.toLowerCase().includes(searchLower) ||
             chat.lastMessage?.content?.toLowerCase().includes(searchLower);
    });
  }, [chats, searchTerm]);

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users.slice(0, 10); // Show fewer for performance
    return users.filter(user => 
      user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 8);
  }, [users, searchTerm]);

  const handleUserSelect = (selectedUser: User) => {
    if (!user) return;

    const chatId = [user.uid, selectedUser.id].sort().join('_');
    const existingChat = chats.find(chat => chat.id === chatId);

    if (existingChat) {
      onChatSelect(existingChat);
    } else {
      const newChat: Chat = {
        id: chatId,
        participants: [user.uid, selectedUser.id],
        lastMessageAt: new Date(),
        isGroup: false,
        createdAt: new Date()
      };
      onChatSelect(newChat);
    }
    setShowNewChat(false);
  };

  const formatLastMessageTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <div className="w-80 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50 flex items-center justify-center shadow-xl">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Loading chats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50 flex flex-col shadow-xl">
      {/* Modern Header */}
      <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-purple-50/50 to-blue-50/50 dark:from-purple-900/20 dark:to-blue-900/20">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Messages
          </h1>
          <button
            onClick={() => setShowNewChat(!showNewChat)}
            className="p-3 text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-2xl transition-all duration-300 group hover:scale-110"
          >
            <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-2xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 placeholder-gray-500"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {showNewChat ? (
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Start New Chat</h3>
            </div>
            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleUserSelect(user)}
                  className="w-full flex items-center gap-4 p-4 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 dark:hover:from-purple-900/20 dark:hover:to-blue-900/20 rounded-2xl transition-all duration-300 group hover:scale-[1.02]"
                >
                  <div className="relative">
                    <img
                      src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=6366f1&color=fff`}
                      alt={user.displayName}
                      className="w-12 h-12 rounded-2xl object-cover ring-2 ring-purple-500/20 group-hover:ring-purple-500/40 transition-all duration-300"
                      loading="lazy"
                    />
                    {user.isOnline && (
                      <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse"></div>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      {user.displayName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {user.username ? `@${user.username}` : user.status}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            {filteredChats.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-float">
                  <MessageCircle className="w-10 h-10 text-purple-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No conversations yet</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">Start chatting with your friends and colleagues</p>
                <button
                  onClick={() => setShowNewChat(true)}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-2xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Start New Chat
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100/50 dark:divide-gray-800/50">
                {filteredChats.map((chat, index) => (
                  <button
                    key={chat.id}
                    onClick={() => onChatSelect(chat)}
                    className={`w-full flex items-center gap-4 p-4 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 dark:hover:from-purple-900/20 dark:hover:to-blue-900/20 transition-all duration-300 group hover:scale-[1.02] ${
                      selectedChatId === chat.id ? 'bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 border-r-4 border-purple-500 shadow-lg' : ''
                    }`}
                    ref={index === filteredChats.length - 5 ? loadMoreRef : undefined}
                  >
                    <div className="relative">
                      <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:shadow-xl transition-all duration-300">
                        {chat.isGroup ? <Hash className="w-6 h-6" /> : 'DM'}
                      </div>
                      {!chat.isGroup && (
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse"></div>
                      )}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                          {chat.isGroup ? chat.groupName : 'Direct Message'}
                        </p>
                        <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 ml-2 font-medium">
                          {formatLastMessageTime(chat.lastMessageAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {chat.lastMessage?.content || 'No messages yet'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};