import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Send, Phone, Video, MoreVertical, Paperclip, Mic, Gift, Reply, X, BarChart3, MapPin } from 'lucide-react';
import { getMessages, sendMessage, setTypingStatus } from '../../services/chatService';
import { useAuthContext } from '../../contexts/AuthContext';
import { Message, Chat } from '../../types';
import { MessageBubble } from './MessageBubble';

// Lazy load heavy components
const VoiceRecorder = lazy(() => import('./VoiceRecorder').then(module => ({ default: module.VoiceRecorder })));
const GifPicker = lazy(() => import('./GifPicker').then(module => ({ default: module.GifPicker })));
const EmojiPicker = lazy(() => import('./EmojiPicker').then(module => ({ default: module.EmojiPicker })));
const PollCreator = lazy(() => import('./PollCreator').then(module => ({ default: module.PollCreator })));
const LocationSharing = lazy(() => import('../Location/LocationSharing').then(module => ({ default: module.LocationSharing })));

interface ChatWindowProps {
  chat: Chat;
  onStartCall: (type: 'voice' | 'video') => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ chat, onStartCall }) => {
  const { user } = useAuthContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [showLocationSharing, setShowLocationSharing] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!user || !chat) return;

    const otherParticipant = chat.participants.find(p => p !== user.uid);
    if (!otherParticipant) return;

    const unsubscribe = getMessages(user.uid, otherParticipant, (messageList) => {
      setMessages(messageList);
    });

    return () => unsubscribe();
  }, [user, chat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const otherParticipant = chat.participants.find(p => p !== user.uid);
    if (!otherParticipant) return;

    setLoading(true);
    try {
      await sendMessage(
        user.uid, 
        otherParticipant, 
        newMessage.trim(), 
        'text', 
        undefined,
        replyingTo?.id
      );
      setNewMessage('');
      setReplyingTo(null);
      await setTypingStatus(user.uid, chat.id, false);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (!user) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (!isTyping) {
      setIsTyping(true);
      setTypingStatus(user.uid, chat.id, true);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      setTypingStatus(user.uid, chat.id, false);
    }, 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const otherParticipant = chat.participants.find(p => p !== user.uid);
    if (!otherParticipant) return;

    const fileType = file.type.startsWith('image/') ? 'image' : 'file';
    sendMessage(user.uid, otherParticipant, file.name, fileType, file);
  };

  const handleVoiceSend = async (audioBlob: Blob, duration: number) => {
    if (!user) return;

    const otherParticipant = chat.participants.find(p => p !== user.uid);
    if (!otherParticipant) return;

    try {
      await sendMessage(
        user.uid, 
        otherParticipant, 
        'Voice message', 
        'voice', 
        new File([audioBlob], 'voice.webm', { type: 'audio/webm' }),
        undefined,
        duration
      );
      setShowVoiceRecorder(false);
    } catch (error) {
      console.error('Error sending voice message:', error);
    }
  };

  const handleGifSelect = async (gifUrl: string) => {
    if (!user) return;

    const otherParticipant = chat.participants.find(p => p !== user.uid);
    if (!otherParticipant) return;

    try {
      await sendMessage(user.uid, otherParticipant, gifUrl, 'gif');
      setShowGifPicker(false);
    } catch (error) {
      console.error('Error sending GIF:', error);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleCreatePoll = async (question: string, options: string[], allowMultiple: boolean) => {
    if (!user) return;

    const otherParticipant = chat.participants.find(p => p !== user.uid);
    if (!otherParticipant) return;

    try {
      const pollData = {
        question,
        options,
        allowMultiple,
        votes: [],
        createdBy: user.uid,
        createdAt: new Date()
      };

      await sendMessage(user.uid, otherParticipant, question, 'poll', undefined, undefined, undefined, pollData);
      setShowPollCreator(false);
    } catch (error) {
      console.error('Error creating poll:', error);
    }
  };

  const handleShareLocation = async (location: { latitude: number; longitude: number; duration: number }) => {
    if (!user) return;

    const otherParticipant = chat.participants.find(p => p !== user.uid);
    if (!otherParticipant) return;

    try {
      const locationData = {
        ...location,
        sharedBy: user.uid,
        sharedAt: new Date(),
        expiresAt: new Date(Date.now() + location.duration)
      };

      await sendMessage(user.uid, otherParticipant, 'Shared location', 'location', undefined, undefined, undefined, undefined, locationData);
      setShowLocationSharing(false);
    } catch (error) {
      console.error('Error sharing location:', error);
    }
  };

  const handleReply = (message: Message) => {
    setReplyingTo(message);
  };

  const handleReactionUpdate = () => {
    // Trigger a refresh of messages
    if (!user || !chat) return;
    const otherParticipant = chat.participants.find(p => p !== user.uid);
    if (!otherParticipant) return;
    // This would typically be handled by the real-time listener
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Chat Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
              {chat.isGroup ? 'G' : 'U'}
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {chat.isGroup ? chat.groupName : 'Chat'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Online</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => onStartCall('voice')}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Phone className="w-5 h-5" />
          </button>
          <button
            onClick={() => onStartCall('video')}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Video className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const replyToMessage = message.replyTo 
              ? messages.find(m => m.id === message.replyTo)
              : undefined;
            
            return (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.senderId === user?.uid}
                replyToMessage={replyToMessage}
                onReply={handleReply}
                onReactionUpdate={handleReactionUpdate}
              />
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Preview */}
      {replyingTo && (
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3">
          <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Replying to:
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                {replyingTo.content}
              </p>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Voice Recorder */}
      {showVoiceRecorder && (
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
          <Suspense fallback={<div>Loading voice recorder...</div>}>
            <VoiceRecorder
              onSend={handleVoiceSend}
              onCancel={() => setShowVoiceRecorder(false)}
            />
          </Suspense>
        </div>
      )}

      {/* Message Input */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <label htmlFor="file-upload" className="cursor-pointer p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <Paperclip className="w-5 h-5" />
            </label>
            <input
              id="file-upload"
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx"
            />
            
            <button
              type="button"
              onClick={() => setShowVoiceRecorder(true)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Mic className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setShowPollCreator(true)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <BarChart3 className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setShowLocationSharing(true)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <MapPin className="w-5 h-5" />
            </button>
            
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowGifPicker(!showGifPicker)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Gift className="w-5 h-5" />
              </button>
              
              {showGifPicker && (
                <div className="absolute bottom-full left-0 mb-2 z-50">
                  <Suspense fallback={<div>Loading...</div>}>
                    <GifPicker
                      onGifSelect={handleGifSelect}
                      onClose={() => setShowGifPicker(false)}
                    />
                  </Suspense>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={handleTyping}
              placeholder="Type a message..."
              className="w-full pl-4 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  😊
                </button>
                
                {showEmojiPicker && (
                  <div className="absolute bottom-full right-0 mb-2 z-50">
                    <Suspense fallback={<div>Loading...</div>}>
                      <EmojiPicker
                        onEmojiSelect={handleEmojiSelect}
                        onClose={() => setShowEmojiPicker(false)}
                      />
                    </Suspense>
                  </div>
                )}
              </div>
            </div>
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

      {/* Modals */}
      {showPollCreator && (
        <Suspense fallback={null}>
          <PollCreator
            onCreatePoll={handleCreatePoll}
            onClose={() => setShowPollCreator(false)}
          />
        </Suspense>
      )}

      {showLocationSharing && (
        <Suspense fallback={null}>
          <LocationSharing
            onShareLocation={handleShareLocation}
            onClose={() => setShowLocationSharing(false)}
          />
        </Suspense>
      )}

      {/* Overlays */}
      {(showGifPicker || showEmojiPicker) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setShowGifPicker(false);
            setShowEmojiPicker(false);
          }}
        />
      )}
    </div>
  );
};