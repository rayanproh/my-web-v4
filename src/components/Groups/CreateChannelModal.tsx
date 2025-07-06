import React, { useState } from 'react';
import { X, Hash, Volume2, Megaphone } from 'lucide-react';
import { createChannel } from '../../services/groupService';
import { useAuthContext } from '../../contexts/AuthContext';

interface CreateChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
}

export const CreateChannelModal: React.FC<CreateChannelModalProps> = ({
  isOpen,
  onClose,
  groupId
}) => {
  const { user } = useAuthContext();
  const [channelName, setChannelName] = useState('');
  const [channelType, setChannelType] = useState<'text' | 'voice' | 'announcement'>('text');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !channelName.trim()) return;

    setLoading(true);
    setError('');

    try {
      // CRITICAL BUG FIX: Only pass description if it's not empty
      const descriptionValue = description.trim() || undefined;
      
      await createChannel(
        groupId,
        channelName.trim(),
        channelType,
        user.uid,
        undefined,
        descriptionValue // This will be undefined if empty, preventing the Firestore error
      );
      
      onClose();
      setChannelName('');
      setDescription('');
      setChannelType('text');
    } catch (error: any) {
      setError(error.message || 'Failed to create channel');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setChannelName('');
    setDescription('');
    setChannelType('text');
    setError('');
    onClose();
  };

  const channelTypes = [
    {
      type: 'text' as const,
      icon: Hash,
      title: 'Text',
      description: 'Send messages, images, GIFs, emoji, opinions, and puns'
    },
    {
      type: 'voice' as const,
      icon: Volume2,
      title: 'Voice',
      description: 'Hang out together with voice, video, and screen share'
    },
    {
      type: 'announcement' as const,
      icon: Megaphone,
      title: 'Announcement',
      description: 'Important updates for your community'
    }
  ];

  return (
    <div className="fixed inset-0 aura-modal-backdrop flex items-center justify-center z-50 p-4">
      <div className="aura-modal w-full max-w-md aura-animate-scale-in">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">
              Create Channel
            </h2>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 aura-animate-slide-in">
              <p className="text-red-300 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Channel Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-3">
              Channel Type
            </label>
            <div className="space-y-3">
              {channelTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <label
                    key={type.type}
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      channelType === type.type
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-white/10 hover:border-white/20 aura-glass-hover'
                    }`}
                  >
                    <input
                      type="radio"
                      name="channelType"
                      value={type.type}
                      checked={channelType === type.type}
                      onChange={(e) => setChannelType(e.target.value as any)}
                      className="sr-only"
                    />
                    <Icon className={`w-6 h-6 mt-0.5 ${
                      channelType === type.type ? 'text-purple-400' : 'text-gray-400'
                    }`} />
                    <div>
                      <h3 className={`font-medium ${
                        channelType === type.type 
                          ? 'text-purple-300' 
                          : 'text-white'
                      }`}>
                        {type.title}
                      </h3>
                      <p className={`text-sm ${
                        channelType === type.type 
                          ? 'text-purple-200' 
                          : 'text-gray-400'
                      }`}>
                        {type.description}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Channel Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Channel Name
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                {channelType === 'text' && <Hash className="w-5 h-5 text-gray-400" />}
                {channelType === 'voice' && <Volume2 className="w-5 h-5 text-gray-400" />}
                {channelType === 'announcement' && <Megaphone className="w-5 h-5 text-gray-400" />}
              </div>
              <input
                type="text"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                className="aura-input w-full pl-10"
                placeholder="new-channel"
                required
                maxLength={50}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Channel names must be lowercase and can contain dashes
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="aura-input w-full resize-none"
              placeholder="What's this channel about?"
              rows={3}
              maxLength={200}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !channelName.trim()}
            className="aura-btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating Channel...
              </div>
            ) : (
              'Create Channel'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};