import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Users, Clock, Hash } from 'lucide-react';
import { createGroupInvite } from '../../services/groupService';
import { useAuthContext } from '../../contexts/AuthContext';
import { Group } from '../../types/groups';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
}

export const InviteModal: React.FC<InviteModalProps> = ({
  isOpen,
  onClose,
  group
}) => {
  const { user } = useAuthContext();
  
  // CRITICAL FIX: Move ALL hooks to top level - NEVER inside conditions
  const [inviteCode, setInviteCode] = useState('');
  const [expiresIn, setExpiresIn] = useState<number | undefined>(24); // hours
  const [maxUses, setMaxUses] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  // FIXED: useEffect always called, condition inside
  useEffect(() => {
    if (isOpen && group.inviteCode) {
      setInviteCode(group.inviteCode);
    }
  }, [isOpen, group.inviteCode]);

  // Early return AFTER all hooks are called
  if (!isOpen) return null;

  const handleCreateInvite = async () => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      const code = await createGroupInvite(
        group.id,
        user.uid,
        expiresIn,
        maxUses
      );
      setInviteCode(code);
    } catch (error: any) {
      setError(error.message || 'Failed to create invite');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyInvite = async () => {
    if (!inviteCode) return;

    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy invite:', error);
    }
  };

  const expirationOptions = [
    { value: 1, label: '1 hour' },
    { value: 6, label: '6 hours' },
    { value: 12, label: '12 hours' },
    { value: 24, label: '1 day' },
    { value: 168, label: '7 days' },
    { value: undefined, label: 'Never' }
  ];

  const maxUsesOptions = [
    { value: 1, label: '1 use' },
    { value: 5, label: '5 uses' },
    { value: 10, label: '10 uses' },
    { value: 25, label: '25 uses' },
    { value: 50, label: '50 uses' },
    { value: 100, label: '100 uses' },
    { value: undefined, label: 'No limit' }
  ];

  return (
    <div className="fixed inset-0 aura-modal-backdrop flex items-center justify-center z-50 p-4">
      <div className="aura-modal w-full max-w-md aura-animate-scale-in">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 aura-glass rounded-xl flex items-center justify-center aura-glow-cyan">
                <Users className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Invite Friends
                </h2>
                <p className="text-sm text-gray-400">
                  to {group.name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 aura-animate-slide-in">
              <p className="text-red-300 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Current Invite */}
          {inviteCode && (
            <div className="aura-glass rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-300 mb-2">
                    Invite Link
                  </p>
                  <code className="aura-code block w-full p-3 rounded-lg font-mono text-sm">
                    {inviteCode}
                  </code>
                </div>
                <button
                  onClick={handleCopyInvite}
                  className={`ml-3 p-3 rounded-xl transition-all duration-200 ${
                    copied
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'aura-btn-secondary'
                  }`}
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}

          {/* Invite Settings */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Clock className="w-4 h-4 inline mr-2" />
                Expire after
              </label>
              <select
                value={expiresIn || ''}
                onChange={(e) => setExpiresIn(e.target.value ? Number(e.target.value) : undefined)}
                className="aura-input w-full"
              >
                {expirationOptions.map((option) => (
                  <option key={option.label} value={option.value || ''} className="bg-gray-800 text-white">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Hash className="w-4 h-4 inline mr-2" />
                Max number of uses
              </label>
              <select
                value={maxUses || ''}
                onChange={(e) => setMaxUses(e.target.value ? Number(e.target.value) : undefined)}
                className="aura-input w-full"
              >
                {maxUsesOptions.map((option) => (
                  <option key={option.label} value={option.value || ''} className="bg-gray-800 text-white">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleCreateInvite}
            disabled={loading}
            className="aura-btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Generating Invite...
              </div>
            ) : (
              'Generate New Invite'
            )}
          </button>

          {/* Info */}
          <div className="aura-glass rounded-xl p-4 border border-cyan-500/30">
            <p className="text-cyan-200 text-sm">
              <strong>Share this invite link</strong> with friends to let them join your server. 
              The link will expire based on your settings above.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};