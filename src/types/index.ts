export interface User {
  id: string;
  email: string;
  displayName: string;
  username?: string;
  photoURL?: string;
  bannerURL?: string;
  status: string;
  customStatus?: {
    text: string;
    emoji: string;
  };
  aboutMe?: string;
  isOnline: boolean;
  lastSeen: Date;
  createdAt: Date;
  theme: 'light' | 'dark';
  blockedUsers: string[];
  profileCompleted?: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId?: string;
  groupId?: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'audio' | 'video' | 'voice' | 'gif' | 'sticker' | 'poll' | 'location';
  timestamp: Date;
  isRead: boolean;
  deliveredAt?: Date;
  readAt?: Date;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  reactions?: MessageReaction[];
  replyTo?: string;
  isEdited?: boolean;
  editedAt?: Date;
  isDeleted?: boolean;
  deletedAt?: Date;
  mentions?: string[];
  expiresAt?: Date;
  voiceDuration?: number;
  poll?: Poll;
  location?: LocationData;
}

export interface MessageReaction {
  emoji: string;
  users: string[];
  count: number;
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage?: Message;
  lastMessageAt: Date;
  isGroup: boolean;
  groupName?: string;
  groupPhoto?: string;
  groupDescription?: string;
  createdBy?: string;
  createdAt: Date;
  roles?: GroupRole[];
  disappearingMessages?: {
    enabled: boolean;
    duration: number; // in hours
  };
}

export interface GroupRole {
  userId: string;
  role: 'admin' | 'moderator' | 'member';
  permissions: Permission[];
}

export interface Permission {
  type: 'add_members' | 'remove_members' | 'edit_group' | 'delete_messages' | 'manage_roles';
  granted: boolean;
}

export interface CallData {
  id: string;
  callerId: string;
  participants: string[];
  type: 'voice' | 'video';
  status: 'calling' | 'answered' | 'ended' | 'declined';
  startTime: Date;
  endTime?: Date;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  iceCandidates?: RTCIceCandidate[];
  isScreenSharing?: boolean;
  screenSharingUser?: string;
}

export interface TypingStatus {
  userId: string;
  chatId: string;
  isTyping: boolean;
  timestamp: Date;
}

export interface VoiceRecording {
  blob: Blob;
  duration: number;
  url: string;
}

export interface Theme {
  name: 'light' | 'dark';
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    accent: string;
  };
}

export interface Story {
  id: string;
  userId: string;
  user: User;
  type: 'image' | 'video';
  mediaUrl: string;
  text?: string;
  createdAt: Date;
  expiresAt: Date;
  views: string[];
  reactions: StoryReaction[];
}

export interface StoryReaction {
  userId: string;
  emoji: string;
  timestamp: Date;
}

export interface Poll {
  id: string;
  question: string;
  options: string[];
  votes: PollVote[];
  allowMultiple: boolean;
  createdBy: string;
  createdAt: Date;
  expiresAt?: Date;
}

export interface PollVote {
  userId: string;
  optionIndex: number;
  timestamp: Date;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  sharedBy: string;
  sharedAt: Date;
  expiresAt: Date;
}