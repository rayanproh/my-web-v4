export interface Group {
  id: string;
  name: string;
  description?: string;
  iconURL?: string;
  bannerURL?: string;
  ownerId: string;
  createdAt: Date;
  memberCount: number;
  isPublic: boolean;
  inviteCode?: string;
  settings: {
    defaultNotifications: boolean;
    explicitContentFilter: 'disabled' | 'members_without_roles' | 'all_members';
    verificationLevel: 'none' | 'low' | 'medium' | 'high';
  };
}

export interface GroupMember {
  id: string;
  userId: string;
  groupId: string;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  joinedAt: Date;
  nickname?: string;
  permissions: GroupPermission[];
  isMuted: boolean;
  isDeafened: boolean;
}

export interface GroupPermission {
  type: 'manage_group' | 'manage_channels' | 'manage_members' | 'kick_members' | 'ban_members' | 'create_invite' | 'manage_messages' | 'mention_everyone' | 'use_voice_activity' | 'priority_speaker';
  granted: boolean;
}

export interface Channel {
  id: string;
  groupId: string;
  name: string;
  type: 'text' | 'voice' | 'announcement';
  description?: string;
  position: number;
  categoryId?: string;
  createdAt: Date;
  createdBy: string;
  permissions: ChannelPermission[];
  settings: {
    slowMode?: number; // seconds
    nsfw: boolean;
    bitrate?: number; // for voice channels
    userLimit?: number; // for voice channels
  };
}

export interface ChannelPermission {
  type: 'view_channel' | 'send_messages' | 'read_message_history' | 'connect' | 'speak' | 'mute_members' | 'deafen_members' | 'move_members';
  roleId?: string;
  userId?: string;
  granted: boolean;
}

export interface ChannelCategory {
  id: string;
  groupId: string;
  name: string;
  position: number;
  collapsed: boolean;
  permissions: ChannelPermission[];
}

export interface GroupInvite {
  id: string;
  groupId: string;
  code: string;
  createdBy: string;
  createdAt: Date;
  expiresAt?: Date;
  maxUses?: number;
  uses: number;
  isActive: boolean;
}

export interface VoiceState {
  userId: string;
  channelId: string;
  groupId: string;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  joinedAt: Date;
}