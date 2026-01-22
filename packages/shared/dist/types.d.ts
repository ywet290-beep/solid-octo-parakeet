export type UserRole = 'admin' | 'moderator' | 'user';
export type UserStatus = 'online' | 'offline' | 'away' | 'busy' | 'invisible';
export type RoomType = 'channel' | 'direct' | 'private' | 'group';
export type RoomPrivacy = 'public' | 'private';
export type MessageType = 'text' | 'file' | 'image' | 'video' | 'audio' | 'system';
export type AttachmentType = 'image' | 'file' | 'link' | 'video' | 'audio';
export type ReactionType = 'emoji' | 'custom';
export type NotificationType = 'mention' | 'dm' | 'channel' | 'thread' | 'reaction';
export type AuthProvider = 'local' | 'google' | 'github' | 'ldap';
export interface User {
    _id: string;
    username: string;
    email: string;
    passwordHash?: string;
    displayName: string;
    avatar?: string;
    roles: UserRole[];
    status: UserStatus;
    statusText?: string;
    permissions: string[];
    sessions: UserSession[];
    preferences: UserPreferences;
    profile: UserProfile;
    createdAt: Date;
    updatedAt: Date;
    lastLogin?: Date;
    isActive: boolean;
    isVerified: boolean;
    twoFactorEnabled: boolean;
    twoFactorSecret?: string;
}
export interface UserSession {
    _id: string;
    userId: string;
    deviceId: string;
    deviceType: string;
    deviceName?: string;
    ipAddress: string;
    userAgent: string;
    location?: string;
    lastActive: Date;
    token: string;
    refreshToken: string;
    expiresAt: Date;
    isActive: boolean;
}
export interface UserPreferences {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    timezone: string;
    notifications: NotificationSettings;
    privacy: PrivacySettings;
    sound: SoundSettings;
    display: DisplaySettings;
}
export interface NotificationSettings {
    desktop: boolean;
    mobile: boolean;
    email: boolean;
    mentions: boolean;
    dms: boolean;
    channels: string[];
    threads: boolean;
    reactions: boolean;
    mutedUsers: string[];
    mutedChannels: string[];
}
export interface PrivacySettings {
    showOnlineStatus: boolean;
    showLastSeen: boolean;
    allowDirectMessages: boolean;
    allowFileUploads: boolean;
    allowVoiceCalls: boolean;
    allowVideoCalls: boolean;
}
export interface SoundSettings {
    message: boolean;
    mention: boolean;
    dm: boolean;
    channel: boolean;
    thread: boolean;
    reaction: boolean;
    volume: number;
}
export interface DisplaySettings {
    compactView: boolean;
    showAvatars: boolean;
    showUsernames: boolean;
    showTimestamps: boolean;
    timestampFormat: string;
    messageDensity: 'comfortable' | 'compact' | 'cozy';
    sidebarWidth: number;
    fontSize: 'small' | 'medium' | 'large';
}
export interface UserProfile {
    firstName?: string;
    lastName?: string;
    bio?: string;
    location?: string;
    website?: string;
    socialLinks: SocialLink[];
    customFields: {
        [key: string]: any;
    };
}
export interface SocialLink {
    platform: string;
    url: string;
    username?: string;
}
export interface Message {
    _id: string;
    roomId: string;
    userId: string;
    content: string;
    type: MessageType;
    timestamp: Date;
    editedAt?: Date;
    threadId?: string;
    replyTo?: string;
    reactions: Reaction[];
    attachments: Attachment[];
    mentions: Mention[];
    links: Link[];
    editHistory: EditEntry[];
    isEdited: boolean;
    isDeleted: boolean;
    deletedAt?: Date;
    deletedBy?: string;
    pinned: boolean;
    pinnedBy?: string;
    pinnedAt?: Date;
    starred: boolean;
    starredBy: string[];
    readBy: string[];
    deliveredTo: string[];
    metadata: {
        [key: string]: any;
    };
}
export interface Reaction {
    _id: string;
    emoji: string;
    type: ReactionType;
    users: string[];
    count: number;
    createdAt: Date;
}
export interface Attachment {
    _id: string;
    type: AttachmentType;
    title: string;
    description?: string;
    url: string;
    thumbnailUrl?: string;
    size?: number;
    mimeType?: string;
    width?: number;
    height?: number;
    duration?: number;
    uploadedBy: string;
    uploadedAt: Date;
    metadata: {
        [key: string]: any;
    };
}
export interface Mention {
    type: 'user' | 'channel' | 'everyone' | 'here';
    id?: string;
    username?: string;
    range: [number, number];
}
export interface Link {
    url: string;
    title?: string;
    description?: string;
    image?: string;
    range: [number, number];
}
export interface EditEntry {
    _id: string;
    oldContent: string;
    newContent: string;
    editedBy: string;
    editedAt: Date;
}
export interface Room {
    _id: string;
    name: string;
    displayName: string;
    type: RoomType;
    privacy: RoomPrivacy;
    description?: string;
    topic?: string;
    announcement?: string;
    avatar?: string;
    owner: string;
    members: RoomMember[];
    moderators: string[];
    bannedUsers: string[];
    invitedUsers: string[];
    settings: RoomSettings;
    integrations: Integration[];
    webhooks: Webhook[];
    customFields: {
        [key: string]: any;
    };
    createdAt: Date;
    updatedAt: Date;
    lastMessage?: Message;
    messageCount: number;
    unreadCount: {
        [userId: string]: number;
    };
    isArchived: boolean;
    archivedAt?: Date;
    archivedBy?: string;
}
export interface RoomMember {
    userId: string;
    role: RoomMemberRole;
    joinedAt: Date;
    invitedBy?: string;
    nickname?: string;
    permissions: string[];
    isMuted: boolean;
    mutedUntil?: Date;
}
export type RoomMemberRole = 'owner' | 'moderator' | 'member' | 'guest';
export interface RoomSettings {
    allowAnonymousRead: boolean;
    allowAnonymousWrite: boolean;
    allowFileUploads: boolean;
    allowVoiceMessages: boolean;
    allowVideoCalls: boolean;
    maxFileSize: number;
    retentionPolicy: RetentionPolicy;
    slowMode: number;
    password?: string;
    defaultNotification: NotificationType;
    readReceipts: boolean;
    typingIndicators: boolean;
    joinCode?: string;
}
export interface RetentionPolicy {
    enabled: boolean;
    maxAge: number;
    maxMessages: number;
    excludePinned: boolean;
    excludeFiles: boolean;
}
export interface Integration {
    _id: string;
    type: string;
    name: string;
    enabled: boolean;
    config: {
        [key: string]: any;
    };
    createdBy: string;
    createdAt: Date;
}
export interface Webhook {
    _id: string;
    name: string;
    url: string;
    events: string[];
    secret?: string;
    enabled: boolean;
    createdBy: string;
    createdAt: Date;
}
export interface AuthRequest {
    email: string;
    password: string;
    rememberMe?: boolean;
}
export interface AuthResponse {
    token: string;
    refreshToken: string;
    user: User;
    expiresIn: number;
}
export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
}
export interface PasswordResetRequest {
    email: string;
}
export interface PasswordResetConfirm {
    token: string;
    newPassword: string;
}
export interface TokenPayload {
    userId: string;
    username: string;
    roles: UserRole[];
    iat: number;
    exp: number;
}
export interface SocketEvent {
    type: string;
    payload: any;
    timestamp: Date;
    userId?: string;
    roomId?: string;
}
export interface TypingIndicator {
    userId: string;
    username: string;
    roomId: string;
    isTyping: boolean;
}
export interface PresenceUpdate {
    userId: string;
    status: UserStatus;
    statusText?: string;
}
export interface MessageEvent {
    message: Message;
    roomId: string;
}
export interface RoomEvent {
    room: Room;
    action: 'created' | 'updated' | 'deleted' | 'joined' | 'left';
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    timestamp: Date;
}
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export interface SearchResult {
    messages: Message[];
    users: User[];
    rooms: Room[];
    total: number;
}
export interface Notification {
    _id: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data: {
        [key: string]: any;
    };
    read: boolean;
    readAt?: Date;
    createdAt: Date;
    expiresAt?: Date;
}
export interface FileUploadRequest {
    file: File;
    roomId: string;
    description?: string;
}
export interface FileUploadResponse {
    attachment: Attachment;
    url: string;
}
export interface CallRequest {
    roomId: string;
    type: 'voice' | 'video';
    participants: string[];
}
export interface CallSession {
    _id: string;
    roomId: string;
    initiator: string;
    participants: CallParticipant[];
    type: 'voice' | 'video';
    status: 'ringing' | 'active' | 'ended';
    startedAt?: Date;
    endedAt?: Date;
    duration?: number;
}
export interface CallParticipant {
    userId: string;
    status: 'invited' | 'ringing' | 'joined' | 'declined' | 'left';
    joinedAt?: Date;
    leftAt?: Date;
}
export interface ServerStats {
    totalUsers: number;
    activeUsers: number;
    totalRooms: number;
    totalMessages: number;
    uptime: number;
    memoryUsage: number;
    diskUsage: number;
}
export interface AdminSettings {
    serverName: string;
    allowRegistration: boolean;
    requireEmailVerification: boolean;
    maxFileSize: number;
    maxUsersPerRoom: number;
    rateLimits: RateLimitSettings;
    integrations: IntegrationSettings;
}
export interface RateLimitSettings {
    login: {
        windowMs: number;
        max: number;
    };
    api: {
        windowMs: number;
        max: number;
    };
    message: {
        windowMs: number;
        max: number;
    };
}
export interface IntegrationSettings {
    slack: boolean;
    discord: boolean;
    mattermost: boolean;
    custom: {
        [key: string]: any;
    };
}
export interface ApiError {
    code: string;
    message: string;
    details?: any;
    timestamp: Date;
}
export interface ValidationError extends ApiError {
    field: string;
    value: any;
}
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type Required<T, K extends keyof T> = T & {
    [P in K]-?: T[P];
};
//# sourceMappingURL=types.d.ts.map