import React, { useState, memo } from 'react';
import { Check, CheckCheck, Download, Reply, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { Message } from '../../types';
import { MessageReactions } from './MessageReactions';
import { PollMessage } from './PollMessage';
import { useAuthContext } from '../../contexts/AuthContext';
import { deleteMessage, editMessage, votePoll } from '../../services/chatService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  replyToMessage?: Message;
  onReply: (message: Message) => void;
  onReactionUpdate: () => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = memo(({
  message,
  isOwn,
  replyToMessage,
  onReply,
  onReactionUpdate
}) => {
  const { user } = useAuthContext();
  const [showActions, setShowActions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleEdit = async () => {
    if (!user || !editContent.trim()) return;

    try {
      await editMessage(message.id, editContent.trim());
      setIsEditing(false);
    } catch (error) {
      console.error('Error editing message:', error);
    }
  };

  const handleDelete = async () => {
    if (!user) return;

    try {
      await deleteMessage(message.id);
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handlePollVote = async (optionIndex: number) => {
    if (!user) return;

    try {
      await votePoll(message.id, optionIndex, user.uid);
      onReactionUpdate();
    } catch (error) {
      console.error('Error voting on poll:', error);
    }
  };

  const renderMessageContent = () => {
    if (message.isDeleted) {
      return (
        <p className="text-sm italic text-gray-500 dark:text-gray-400">
          This message was deleted
        </p>
      );
    }

    if (isEditing) {
      return (
        <div className="space-y-2">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
            rows={3}
          />
          <div className="flex gap-2">
            <button
              onClick={handleEdit}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditContent(message.content);
              }}
              className="px-3 py-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-sm hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    const markdownComponents = {
        p: ({node, ...props}: any) => <p className="mb-1 last:mb-0" {...props} />,
        a: ({node, ...props}: any) => <a className="text-blue-300 underline hover:no-underline" {...props} />,
        code: ({node, inline, className, children, ...props}: any) => {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
                <pre className="bg-gray-900/50 p-2 rounded-md my-2 overflow-x-auto">
                    <code className={className} {...props}>{children}</code>
                </pre>
            ) : (
                <code className="bg-gray-900/50 text-red-300 px-1 py-0.5 rounded" {...props}>{children}</code>
            );
        },
        ul: ({node, ...props}: any) => <ul className="list-disc list-inside" {...props} />,
        ol: ({node, ...props}: any) => <ol className="list-decimal list-inside" {...props} />,
    };

    switch (message.type) {
      case 'poll':
        return message.poll ? (
          <PollMessage poll={message.poll} onVote={handlePollVote} />
        ) : null;

      case 'location':
        return message.location ? (
          <div className="bg-blue-50 dark:bg-blue-900 p-3 rounded-lg max-w-xs">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-blue-600 dark:text-blue-300">📍</span>
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Live Location
              </span>
            </div>
            <p className="text-xs text-blue-700 dark:text-blue-200">
              Shared until {new Date(message.location.expiresAt).toLocaleTimeString()}
            </p>
            <button className="mt-2 text-blue-600 dark:text-blue-300 text-sm underline hover:no-underline">
              View on map
            </button>
          </div>
        ) : null;

      case 'image':
        return (
          <div className="space-y-1">
            {message.fileUrl && (
              <img
                src={message.fileUrl}
                alt="Shared content"
                className="max-w-xs rounded-lg"
                loading="lazy"
              />
            )}
            {message.content && (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {message.content}
              </ReactMarkdown>
            )}
          </div>
        );

      case 'voice':
        return (
          <div className="flex items-center gap-3">
             {message.fileUrl && (
              <audio controls className="w-full max-w-xs">
                <source src={message.fileUrl} />
                Your browser does not support the audio element.
              </audio>
            )}
          </div>
        );

      case 'file':
        return (
          <div className="flex items-center gap-3 bg-gray-500/30 p-3 rounded-lg">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <Download className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {message.fileName || 'Unknown file'}
              </p>
              <p className="text-xs opacity-75">
                {message.fileSize ? `${(message.fileSize / 1024).toFixed(1)} KB` : ''}
              </p>
            </div>
            <a href={message.fileUrl} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-gray-400/30 rounded-full">
                <Download className="w-5 h-5" />
            </a>
          </div>
        );

      case 'gif':
      case 'sticker':
        return (
          <div>
            {message.fileUrl && (
              <img
                src={message.fileUrl}
                alt={message.type === 'gif' ? 'GIF' : 'Sticker'}
                className="max-w-xs rounded-lg"
                loading="lazy"
              />
            )}
          </div>
        );

      default:
        return (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
          >
            {message.content}
          </ReactMarkdown>
        );
    }
  };

  return (
    <div className={`flex w-full ${isOwn ? 'justify-end' : 'justify-start'} group my-1`}>
      <div className={`max-w-xs lg:max-w-xl flex items-center gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Message Actions Menu */}
        <div className={`relative transition-opacity duration-200 opacity-0 group-hover:opacity-100 ${isOwn ? 'order-1' : 'order-3'}`}>
          <MoreHorizontal className="w-5 h-5 text-gray-400 cursor-pointer" />
          {/* Dropdown menu can be implemented here */}
        </div>

        <div className={`relative ${isOwn ? 'order-2' : 'order-2'}`}>
          {/* Reply indicator */}
          {replyToMessage && (
            <div className={`mb-1 px-3 py-1 rounded-t-lg text-xs ${
              isOwn
                ? 'bg-blue-500 text-blue-100'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}>
              <p className="font-medium">Replying to:</p>
              <p className="truncate opacity-75">{replyToMessage.content}</p>
            </div>
          )}

          <div
            className={`px-4 py-2 rounded-2xl ${
              replyToMessage ? (isOwn ? 'rounded-tr-none' : 'rounded-tl-none') : ''
            } ${
              isOwn
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
            }`}
          >
            {renderMessageContent()}
            
            <div className={`flex items-center gap-1.5 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <span className={`text-xs opacity-75 ${
                isOwn ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
              }`}>
                {formatTime(message.timestamp)}
                {message.isEdited && ' (edited)'}
              </span>
              {isOwn && (
                message.isRead ? 
                <CheckCheck className="w-4 h-4 text-blue-100" /> : 
                <Check className="w-4 h-4 text-blue-100" />
              )}
            </div>
          </div>

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <MessageReactions
              messageId={message.id}
              reactions={message.reactions}
              onReactionUpdate={onReactionUpdate}
              isOwn={isOwn}
            />
          )}
        </div>
      </div>
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';
