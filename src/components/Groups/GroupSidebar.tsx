import React, { useState, useEffect } from 'react';
import { Plus, Settings, Users, Hash, Volume2, Crown, Shield, User as UserIcon } from 'lucide-react';
import { Group, Channel, GroupMember } from '../../types/groups';
import { User } from '../../types';
import { useAuthContext } from '../../contexts/AuthContext';
import { getUserGroups, getGroupChannels, getGroupMembers } from '../../services/groupService';
import { CreateGroupModal } from './CreateGroupModal';
import { JoinGroupModal } from './JoinGroupModal';
import { CreateChannelModal } from './CreateChannelModal';
import { InviteModal } from './InviteModal';

interface GroupSidebarProps {
  selectedGroupId?: string;
  selectedChannelId?: string;
  onGroupSelect: (group: Group) => void;
  onChannelSelect: (channel: Channel) => void;
}

export const GroupSidebar: React.FC<GroupSidebarProps> = ({
  selectedGroupId,
  selectedChannelId,
  onGroupSelect,
  onChannelSelect
}) => {
  const { user } = useAuthContext();
  const [groups, setGroups] = useState<Group[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showJoinGroup, setShowJoinGroup] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = getUserGroups(user.uid, (userGroups) => {
      setGroups(userGroups);
      
      // Auto-select first group if none selected
      if (userGroups.length > 0 && !selectedGroupId) {
        setSelectedGroup(userGroups[0]);
        onGroupSelect(userGroups[0]);
      }
    });

    return () => unsubscribe();
  }, [user, selectedGroupId, onGroupSelect]);

  useEffect(() => {
    if (!selectedGroupId) return;

    const group = groups.find(g => g.id === selectedGroupId);
    if (group) {
      setSelectedGroup(group);
    }

    const unsubscribeChannels = getGroupChannels(selectedGroupId, (groupChannels) => {
      setChannels(groupChannels);
      
      // Auto-select first text channel if none selected
      if (groupChannels.length > 0 && !selectedChannelId) {
        const firstTextChannel = groupChannels.find(c => c.type === 'text');
        if (firstTextChannel) {
          onChannelSelect(firstTextChannel);
        }
      }
    });

    const unsubscribeMembers = getGroupMembers(selectedGroupId, setMembers);

    return () => {
      unsubscribeChannels();
      unsubscribeMembers();
    };
  }, [selectedGroupId, selectedChannelId, groups, onChannelSelect]);

  const handleGroupSelect = (group: Group) => {
    setSelectedGroup(group);
    onGroupSelect(group);
  };

  const currentUserMember = members.find(m => m.userId === user?.uid);
  const canManageChannels = currentUserMember && ['owner', 'admin'].includes(currentUserMember.role);
  const canInvite = currentUserMember && ['owner', 'admin', 'moderator'].includes(currentUserMember.role);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-3 h-3 text-yellow-500" />;
      case 'admin':
        return <Shield className="w-3 h-3 text-red-500" />;
      case 'moderator':
        return <Shield className="w-3 h-3 text-blue-500" />;
      default:
        return <UserIcon className="w-3 h-3 text-gray-400" />;
    }
  };

  return (
    <div className="flex h-full">
      {/* Groups List */}
      <div className="w-20 bg-gray-900 flex flex-col items-center py-4 space-y-3">
        {/* Direct Messages */}
        <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg hover:rounded-xl transition-all duration-300 cursor-pointer group">
          <span>DM</span>
        </div>
        
        <div className="w-8 h-0.5 bg-gray-700 rounded-full"></div>
        
        {/* Groups */}
        {groups.map((group) => (
          <button
            key={group.id}
            onClick={() => handleGroupSelect(group)}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg hover:rounded-xl transition-all duration-300 group relative ${
              selectedGroupId === group.id 
                ? 'rounded-xl bg-gradient-to-br from-purple-600 to-blue-600' 
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {group.iconURL ? (
              <img
                src={group.iconURL}
                alt={group.name}
                className="w-full h-full rounded-2xl group-hover:rounded-xl transition-all duration-300 object-cover"
              />
            ) : (
              <span>{group.name.charAt(0).toUpperCase()}</span>
            )}
            
            {/* Active indicator */}
            {selectedGroupId === group.id && (
              <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"></div>
            )}
            
            {/* Tooltip */}
            <div className="absolute left-full ml-4 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-20">
              {group.name}
            </div>
          </button>
        ))}
        
        {/* Add Group Button */}
        <button
          onClick={() => setShowCreateGroup(true)}
          className="w-12 h-12 bg-gray-700 hover:bg-green-600 rounded-2xl hover:rounded-xl flex items-center justify-center text-green-500 hover:text-white transition-all duration-300 group"
        >
          <Plus className="w-6 h-6" />
          <div className="absolute left-full ml-4 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-20">
            Add a Server
          </div>
        </button>
        
        {/* Join Group Button */}
        <button
          onClick={() => setShowJoinGroup(true)}
          className="w-12 h-12 bg-gray-700 hover:bg-blue-600 rounded-2xl hover:rounded-xl flex items-center justify-center text-blue-500 hover:text-white transition-all duration-300 group"
        >
          <Users className="w-6 h-6" />
          <div className="absolute left-full ml-4 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-20">
            Join a Server
          </div>
        </button>
      </div>

      {/* Channels and Members */}
      {selectedGroup && (
        <div className="flex flex-1">
          {/* Channels Sidebar */}
          <div className="w-60 bg-gray-800 flex flex-col">
            {/* Group Header */}
            <div className="h-16 border-b border-gray-700 flex items-center justify-between px-4 bg-gray-800/50 backdrop-blur-sm">
              <h2 className="text-white font-semibold truncate">{selectedGroup.name}</h2>
              <div className="flex items-center gap-2">
                {canInvite && (
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                    title="Create Invite"
                  >
                    <Users className="w-4 h-4" />
                  </button>
                )}
                <button
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                  title="Server Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Channels List */}
            <div className="flex-1 overflow-y-auto p-2">
              {/* Text Channels */}
              <div className="mb-4">
                <div className="flex items-center justify-between px-2 py-1 mb-2">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Text Channels
                  </h3>
                  {canManageChannels && (
                    <button
                      onClick={() => setShowCreateChannel(true)}
                      className="p-1 text-gray-400 hover:text-white rounded transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                {channels
                  .filter(channel => channel.type === 'text')
                  .map((channel) => (
                    <button
                      key={channel.id}
                      onClick={() => onChannelSelect(channel)}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors ${
                        selectedChannelId === channel.id
                          ? 'bg-gray-700 text-white'
                          : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                      }`}
                    >
                      <Hash className="w-4 h-4 text-gray-400" />
                      <span className="text-sm truncate">{channel.name}</span>
                    </button>
                  ))}
              </div>

              {/* Voice Channels */}
              <div>
                <div className="flex items-center justify-between px-2 py-1 mb-2">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Voice Channels
                  </h3>
                  {canManageChannels && (
                    <button
                      onClick={() => setShowCreateChannel(true)}
                      className="p-1 text-gray-400 hover:text-white rounded transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                {channels
                  .filter(channel => channel.type === 'voice')
                  .map((channel) => (
                    <button
                      key={channel.id}
                      onClick={() => onChannelSelect(channel)}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors ${
                        selectedChannelId === channel.id
                          ? 'bg-gray-700 text-white'
                          : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                      }`}
                    >
                      <Volume2 className="w-4 h-4 text-gray-400" />
                      <span className="text-sm truncate">{channel.name}</span>
                    </button>
                  ))}
              </div>
            </div>
          </div>

          {/* Members Sidebar */}
          <div className="w-60 bg-gray-800/50 border-l border-gray-700">
            <div className="h-16 border-b border-gray-700 flex items-center px-4">
              <h3 className="text-white font-semibold">Members — {members.length}</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2">
              {/* Online Members */}
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 py-1 mb-2">
                  Online — {members.filter(m => m.userId).length}
                </h4>
                
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-gray-700/30 transition-colors"
                  >
                    <div className="relative">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {member.nickname?.charAt(0) || 'U'}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        {getRoleIcon(member.role)}
                        <span className="text-sm text-white truncate">
                          {member.nickname || `User ${member.userId.slice(-4)}`}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 truncate">
                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onGroupCreated={(group) => {
          setShowCreateGroup(false);
          handleGroupSelect(group);
        }}
      />

      <JoinGroupModal
        isOpen={showJoinGroup}
        onClose={() => setShowJoinGroup(false)}
        onGroupJoined={(groupId) => {
          setShowJoinGroup(false);
          const group = groups.find(g => g.id === groupId);
          if (group) {
            handleGroupSelect(group);
          }
        }}
      />

      {selectedGroup && (
        <>
          <CreateChannelModal
            isOpen={showCreateChannel}
            onClose={() => setShowCreateChannel(false)}
            groupId={selectedGroup.id}
          />

          <InviteModal
            isOpen={showInviteModal}
            onClose={() => setShowInviteModal(false)}
            group={selectedGroup}
          />
        </>
      )}
    </div>
  );
};