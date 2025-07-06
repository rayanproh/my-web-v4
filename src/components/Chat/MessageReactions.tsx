import React, { useState } from 'react';
import { Plus, Smile } from 'lucide-react';
import { MessageReaction } from '../../types';
import { useAuthContext } from '../../contexts/AuthContext';
import { addReaction, removeReaction } from '../../services/chatService';
import { EmojiPicker } from './EmojiPicker';

interface MessageReactionsProps {
  messageId: string;
  reactions: MessageReaction[];
  onReactionUpdate: () => void;
}

export const MessageReactions: React.FC<MessageReactionsProps> = ({
  messageId,
  reactions,
  onReactionUpdate
}) => {
  const { user } = useAuthContext();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleReactionClick = async (emoji: string) => {
    if (!user) return;

    const existingReaction = reactions.find(r => r.emoji === emoji);
    const userHasReacted = existingReaction?.users.includes(user.uid);

    try {
      if (userHasReacted) {
        await removeReaction(messageId, emoji, user.uid);
      } else {
        await addReaction(messageId, emoji, user.uid);
      }
      onReactionUpdate();
    } catch (error) {
      console.error('Error updating reaction:', error);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    handleReactionClick(emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div className="flex items-center gap-1 mt-1 flex-wrap">
      {reactions.map((reaction) => {
        const userHasReacted = user && reaction.users.includes(user.uid);
        return (
          <button
            key={reaction.emoji}
            onClick={() => handleReactionClick(reaction.emoji)}
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors ${
              userHasReacted
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <span>{reaction.emoji}</span>
            <span>{reaction.count}</span>
          </button>
        );
      })}
      
      <div className="relative">
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
        >
          <Plus className="w-3 h-3" />
        </button>
        
        {showEmojiPicker && (
          <div className="absolute bottom-full left-0 mb-2 z-50">
            <EmojiPicker
              onEmojiSelect={handleEmojiSelect}
              onClose={() => setShowEmojiPicker(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
};