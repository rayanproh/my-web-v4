import React, { useState } from 'react';
import { X, Upload, Image as ImageIcon, Sparkles } from 'lucide-react';
import { createGroup } from '../../services/groupService';
import { useAuthContext } from '../../contexts/AuthContext';
import { Group } from '../../types/groups';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: (group: Group) => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onGroupCreated
}) => {
  const { user } = useAuthContext();
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Icon size must be less than 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      
      setIconFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setIconPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !groupName.trim()) return;

    setLoading(true);
    setError('');

    try {
      const groupId = await createGroup(
        user.uid,
        groupName.trim(),
        description.trim() || undefined,
        iconFile || undefined
      );

      // Create a temporary group object for immediate UI update
      const newGroup: Group = {
        id: groupId,
        name: groupName.trim(),
        description: description.trim() || undefined,
        iconURL: iconPreview || undefined,
        ownerId: user.uid,
        createdAt: new Date(),
        memberCount: 1,
        isPublic: false,
        settings: {
          defaultNotifications: true,
          explicitContentFilter: 'members_without_roles',
          verificationLevel: 'none'
        }
      };

      onGroupCreated(newGroup);
      
      // Reset form
      setGroupName('');
      setDescription('');
      setIconFile(null);
      setIconPreview('');
    } catch (error: any) {
      setError(error.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setGroupName('');
    setDescription('');
    setIconFile(null);
    setIconPreview('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 aura-modal-backdrop flex items-center justify-center z-50 p-4">
      <div className="aura-modal w-full max-w-md aura-animate-scale-in">
        {/* Gradient header */}
        <div className="p-6 border-b border-white/10 bg-gradient-to-r from-purple-500/20 to-cyan-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 aura-glass rounded-xl flex items-center justify-center aura-glow-magenta">
                <Sparkles className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Create Your Server</h2>
                <p className="text-purple-200 text-sm">Your server is where you and your friends hang out</p>
              </div>
            </div>
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

          {/* Server Icon */}
          <div className="text-center">
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-2xl overflow-hidden aura-glass border-4 border-purple-500/30 flex items-center justify-center group cursor-pointer aura-glow-hover">
                {iconPreview ? (
                  <img
                    src={iconPreview}
                    alt="Server icon"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-8 h-8 text-purple-400" />
                )}
                <label
                  htmlFor="icon-upload"
                  className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Upload className="w-6 h-6 text-white" />
                </label>
              </div>
              <input
                id="icon-upload"
                type="file"
                accept="image/*"
                onChange={handleIconUpload}
                className="hidden"
              />
            </div>
            <p className="text-gray-400 text-sm mt-2">
              Upload a server icon (optional)
            </p>
          </div>

          {/* Server Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Server Name *
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="aura-input w-full"
              placeholder="Enter server name"
              required
              maxLength={50}
            />
            <p className="text-xs text-gray-400 mt-1">
              {groupName.length}/50 characters
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="aura-input w-full resize-none"
              placeholder="Tell people what your server is about"
              rows={3}
              maxLength={200}
            />
            <p className="text-xs text-gray-400 mt-1">
              {description.length}/200 characters
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !groupName.trim()}
            className="aura-btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating Server...
              </div>
            ) : (
              'Create Server'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};