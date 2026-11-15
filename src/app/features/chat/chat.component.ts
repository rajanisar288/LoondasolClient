import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  ViewChild,
  ElementRef,
  AfterViewChecked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import {
  SocketService,
  ChatMessage,
  ChatMessageAttachment,
  ChatMessageReply,
} from '../../core/services/socket.service';
import { WebRtcService } from '../../core/services/webrtc.service';
import { AppButtonComponent } from '../../shared/components/button/button.component';
import { AppModalComponent } from '../../shared/components/modal/modal.component';
import { AppAvatarComponent } from '../../shared/components/avatar/avatar.component';
import { WorkspaceDatePipe } from '../../shared/pipes/workspace-locale.pipes';

interface ChannelItem {
  channelId?: string;
  id?: string;
  name: string;
  description?: string;
  isPrivate?: boolean;
  memberIds?: string[];
}

interface TeamMember {
  employeeId: string;
  userId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  designation?: string;
  departmentName?: string;
  branchName?: string;
  employmentType?: string;
  joiningDate?: string;
  status?: string;
  roleName?: string;
  avatarUrl?: string;
  lastMessageText?: string;
  lastMessageTime?: string;
  lastMessageSenderId?: string;
  isOnline?: boolean;
  lastSeen?: string;
  isSelf?: boolean;
}

interface ConversationSummary {
  channelId: string;
  peerId: string;
  lastMessage?: {
    content: string;
    createdAt: string;
    senderId: string;
  };
}

interface EmojiItem {
  char: string;
  name: string;
}

interface EmojiCategory {
  id: string;
  label: string;
  icon: string;
  emojis: EmojiItem[];
}

const QUICK_REACTION_EMOJIS = ['👍', '❤️', '😂', '🎉', '🚀', '🔥', '👀', '✅'];

const CHAT_EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: 'smileys',
    label: 'Smileys & People',
    icon: '😀',
    emojis: [
      { char: '😀', name: 'grinning smile happy' },
      { char: '😃', name: 'smiley happy joy' },
      { char: '😄', name: 'smile laugh happy' },
      { char: '😁', name: 'grin happy' },
      { char: '😆', name: 'laughing satisfied' },
      { char: '😅', name: 'sweat smile relief' },
      { char: '😂', name: 'joy tears laugh lol' },
      { char: '🤣', name: 'rofl rolling floor laughing' },
      { char: '😊', name: 'blush warm smile' },
      { char: '😇', name: 'innocent angel halo' },
      { char: '🙂', name: 'slightly smiling' },
      { char: '🙃', name: 'upside down silly' },
      { char: '😉', name: 'wink' },
      { char: '😌', name: 'relieved calm' },
      { char: '😍', name: 'heart eyes love' },
      { char: '🥰', name: 'smiling hearts love adore' },
      { char: '😘', name: 'kissing heart' },
      { char: '😋', name: 'yum delicious' },
      { char: '😛', name: 'stuck out tongue' },
      { char: '😜', name: 'wink tongue playful' },
      { char: '🤪', name: 'zany crazy wild' },
      { char: '🤨', name: 'raised eyebrow skeptical' },
      { char: '🧐', name: 'monocle inspect curious' },
      { char: '🤓', name: 'nerd glasses smart' },
      { char: '😎', name: 'sunglasses cool' },
      { char: '🤩', name: 'star struck excited amazed' },
      { char: '🥳', name: 'party celebrate birthday' },
      { char: '😏', name: 'smirk' },
      { char: '😒', name: 'unamused' },
      { char: '😔', name: 'pensive sad' },
      { char: '😟', name: 'worried' },
      { char: '😕', name: 'confused' },
      { char: '🙁', name: 'frowning' },
      { char: '😣', name: 'persevere' },
      { char: '😖', name: 'confounded' },
      { char: '😫', name: 'tired exhausted' },
      { char: '😩', name: 'weary' },
      { char: '🥺', name: 'pleading puppy eyes' },
      { char: '😢', name: 'cry tear sad' },
      { char: '😭', name: 'sob crying loud' },
      { char: '😤', name: 'triumph steam proud' },
      { char: '😠', name: 'angry mad' },
      { char: '😡', name: 'rage furious' },
      { char: '🤯', name: 'exploding head mind blown' },
      { char: '😳', name: 'flushed surprised' },
      { char: '🥵', name: 'hot sweat' },
      { char: '🥶', name: 'cold freezing' },
      { char: '😱', name: 'scream shock fear' },
      { char: '😰', name: 'Cold sweat nervous' },
      { char: '🤗', name: 'hugging warm' },
      { char: '🤔', name: 'thinking hmm' },
      { char: '🤭', name: 'hand over mouth oops' },
      { char: '🤫', name: 'shushing quiet secret' },
      { char: '🤥', name: 'lying pinocchio' },
      { char: '😶', name: 'no mouth silent' },
      { char: '😐', name: 'neutral straight face' },
      { char: '😬', name: 'grimacing awkward' },
      { char: '🙄', name: 'rolling eyes' },
      { char: '😮', name: 'open mouth wow' },
      { char: '😲', name: 'astonished amazed' },
      { char: '🥱', name: 'yawning sleepy' },
      { char: '😴', name: 'sleeping zzz' },
      { char: '🤤', name: 'drooling' },
      { char: '😵', name: 'dizzy' },
      { char: '🤐', name: 'zipper mouth secret' },
      { char: '🤒', name: 'thermometer sick' },
      { char: '🤕', name: 'head bandage hurt' },
      { char: '🤑', name: 'money mouth rich' },
      { char: '🤠', name: 'cowboy hat' },
    ],
  },
  {
    id: 'gestures',
    label: 'Gestures & Hands',
    icon: '👍',
    emojis: [
      { char: '👍', name: 'thumbs up like approve yes' },
      { char: '👎', name: 'thumbs down dislike no' },
      { char: '👌', name: 'ok hand perfect' },
      { char: '✌️', name: 'victory peace' },
      { char: '🤞', name: 'crossed fingers luck' },
      { char: '🤟', name: 'love you gesture' },
      { char: '🤘', name: 'rock on metal' },
      { char: '🤙', name: 'call me shaka' },
      { char: '👈', name: 'point left' },
      { char: '👉', name: 'point right' },
      { char: '👆', name: 'point up' },
      { char: '👇', name: 'point down' },
      { char: '☝️', name: 'index point up' },
      { char: '✋', name: 'raised hand stop high five' },
      { char: '🤚', name: 'raised back of hand' },
      { char: '🖐️', name: 'hand splayed five' },
      { char: '🖖', name: 'vulcan salute spock' },
      { char: '👋', name: 'wave hello hi bye' },
      { char: '🤝', name: 'handshake deal agreement' },
      { char: '🙏', name: 'pray thank you please namaste' },
      { char: '💪', name: 'muscle strong flex bicep' },
      { char: '✍️', name: 'writing hand note' },
      { char: '👏', name: 'clap applause bravo congrats' },
      { char: '🙌', name: 'raising hands hooray celebrate' },
      { char: '👐', name: 'open hands' },
      { char: '🤲', name: 'palms up together' },
      { char: '✊', name: 'raised fist power' },
      { char: '👊', name: 'fist bump punch' },
      { char: '🫶', name: 'heart hands love thanks' },
      { char: '👀', name: 'eyes looking watching seen' },
      { char: '🧠', name: 'brain smart genius' },
    ],
  },
  {
    id: 'work',
    label: 'Work & Objects',
    icon: '💼',
    emojis: [
      { char: '🚀', name: 'rocket launch ship fast deploy' },
      { char: '💼', name: 'briefcase business work' },
      { char: '📁', name: 'file folder directory' },
      { char: '📂', name: 'open file folder' },
      { char: '📅', name: 'calendar date schedule' },
      { char: '📆', name: 'tear off calendar' },
      { char: '📊', name: 'bar chart analytics report stats' },
      { char: '📈', name: 'chart increasing growth up' },
      { char: '📉', name: 'chart decreasing down' },
      { char: '📋', name: 'clipboard task list' },
      { char: '📌', name: 'pushpin pin important' },
      { char: '📍', name: 'round pushpin location' },
      { char: '📎', name: 'paperclip attachment' },
      { char: '💻', name: 'laptop computer code dev' },
      { char: '🖥️', name: 'desktop monitor screen' },
      { char: '⌨️', name: 'keyboard typing' },
      { char: '🖱️', name: 'computer mouse' },
      { char: '📱', name: 'mobile phone smartphone' },
      { char: '☎️', name: 'telephone call' },
      { char: '📞', name: 'telephone receiver call' },
      { char: '💡', name: 'light bulb idea tip' },
      { char: '🔧', name: 'wrench fix tool' },
      { char: '🔨', name: 'hammer build' },
      { char: '⚙️', name: 'gear settings config' },
      { char: '🧰', name: 'toolbox' },
      { char: '🔒', name: 'locked security private' },
      { char: '🔓', name: 'unlocked open' },
      { char: '🔑', name: 'key access password' },
      { char: '🎯', name: 'bullseye target goal' },
      { char: '🏆', name: 'trophy winner champion award' },
      { char: '🥇', name: 'first place gold medal' },
      { char: '🔔', name: 'bell notification alert' },
      { char: '📣', name: 'megaphone announcement broadcast' },
      { char: '⏳', name: 'hourglass timer waiting' },
      { char: '⏰', name: 'alarm clock time deadline' },
      { char: '💰', name: 'money bag salary bonus' },
    ],
  },
  {
    id: 'symbols',
    label: 'Hearts & Symbols',
    icon: '❤️',
    emojis: [
      { char: '❤️', name: 'red heart love' },
      { char: '🧡', name: 'orange heart' },
      { char: '💛', name: 'yellow heart' },
      { char: '💚', name: 'green heart' },
      { char: '💙', name: 'blue heart' },
      { char: '💜', name: 'purple heart' },
      { char: '🖤', name: 'black heart' },
      { char: '🤍', name: 'white heart' },
      { char: '💔', name: 'broken heart' },
      { char: '❣️', name: 'heart exclamation' },
      { char: '💕', name: 'two hearts' },
      { char: '💖', name: 'sparkling heart' },
      { char: '💘', name: 'heart with arrow' },
      { char: '💝', name: 'heart with ribbon' },
      { char: '🔥', name: 'fire hot lit awesome' },
      { char: '✨', name: 'sparkles magic new clean' },
      { char: '🌟', name: 'glowing star shine' },
      { char: '⭐', name: 'star favorite' },
      { char: '⚡', name: 'high voltage zap fast' },
      { char: '💥', name: 'collision boom' },
      { char: '💯', name: 'hundred points perfect 100' },
      { char: '✅', name: 'check mark button done complete' },
      { char: '☑️', name: 'check box with check' },
      { char: '✔️', name: 'check mark tick' },
      { char: '❌', name: 'cross mark error wrong no' },
      { char: '⚠️', name: 'warning alert caution' },
      { char: '🚫', name: 'prohibited forbidden stop' },
      { char: '❓', name: 'question mark help' },
      { char: '❗', name: 'exclamation mark important' },
      { char: '🎉', name: 'party popper tada congrats' },
      { char: '🎊', name: 'confetti ball celebrate' },
      { char: '🎈', name: 'balloon party' },
      { char: '🎁', name: 'wrapped gift present' },
    ],
  },
  {
    id: 'nature',
    label: 'Nature & Animals',
    icon: '🌿',
    emojis: [
      { char: '☀️', name: 'sun sunny bright' },
      { char: '🌤️', name: 'sun behind small cloud' },
      { char: '⛅', name: 'sun behind cloud' },
      { char: '🌈', name: 'rainbow' },
      { char: '🌧️', name: 'cloud with rain' },
      { char: '❄️', name: 'snowflake cold winter' },
      { char: '🌊', name: 'water wave ocean' },
      { char: '🌸', name: 'cherry blossom flower' },
      { char: '🌺', name: 'hibiscus flower' },
      { char: '🌻', name: 'sunflower' },
      { char: '🌹', name: 'rose flower' },
      { char: '🌱', name: 'seedling sprout grow' },
      { char: '🌲', name: 'evergreen tree' },
      { char: '🌳', name: 'deciduous tree' },
      { char: '🌴', name: 'palm tree vacation' },
      { char: '🍀', name: 'four leaf clover luck' },
      { char: '🐶', name: 'dog puppy' },
      { char: '🐱', name: 'cat kitten' },
      { char: '🦊', name: 'fox' },
      { char: '🐻', name: 'bear' },
      { char: '🐼', name: 'panda' },
      { char: '🦁', name: 'lion' },
      { char: '🦄', name: 'unicorn magic' },
      { char: '🐝', name: 'honeybee busy' },
      { char: '🦋', name: 'butterfly' },
    ],
  },
  {
    id: 'food',
    label: 'Food & Drink',
    icon: '☕',
    emojis: [
      { char: '☕', name: 'hot beverage coffee tea break' },
      { char: '🍵', name: 'teacup green tea' },
      { char: '🥤', name: 'cup with straw soda' },
      { char: '🧋', name: 'bubble tea boba' },
      { char: '🍺', name: 'beer mug cheers' },
      { char: '🍻', name: 'clinking beer mugs cheers' },
      { char: '🥂', name: 'clinking glasses toast celebrate' },
      { char: '🍕', name: 'pizza slice' },
      { char: '🍔', name: 'hamburger burger' },
      { char: '🍟', name: 'french fries' },
      { char: '🌮', name: 'taco' },
      { char: '🌯', name: 'burrito wrap' },
      { char: '🥗', name: 'green salad healthy' },
      { char: '🍜', name: 'steaming bowl noodles ramen' },
      { char: '🍣', name: 'sushi' },
      { char: '🍰', name: 'shortcake cake slice' },
      { char: '🎂', name: 'birthday cake celebrate' },
      { char: '🧁', name: 'cupcake' },
      { char: '🍩', name: 'doughnut donut' },
      { char: '🍪', name: 'cookie' },
      { char: '🍫', name: 'chocolate bar' },
      { char: '🍿', name: 'popcorn movie' },
      { char: '🍎', name: 'red apple fruit' },
      { char: '🍉', name: 'watermelon' },
      { char: '🍓', name: 'strawberry' },
      { char: '🥑', name: 'avocado' },
    ],
  },
];

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AppButtonComponent,
    AppModalComponent,
    AppAvatarComponent,
    WorkspaceDatePipe,
  ],
  templateUrl: "./chat.component.html",
  styleUrl: "./chat.component.scss",
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  private readonly api = inject(ApiService);
  private readonly socketService = inject(SocketService);
  private readonly webrtcService = inject(WebRtcService);
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);

  @ViewChild('scrollContainer') private scrollContainer?: ElementRef;
  @ViewChild('messageInput') private messageInput?: ElementRef<HTMLElement>;

  readonly channels = signal<ChannelItem[]>([]);
  readonly activeChannel = signal<string>('general');
  readonly activeDirectUser = signal<TeamMember | null>(null);
  readonly teamMembers = signal<TeamMember[]>([]);
  readonly onlineUserIds = signal<Set<string>>(new Set<string>());
  readonly messages = signal<ChatMessage[]>([]);
  readonly typingUser = signal<string | null>(null);
  readonly pinnedMessages = computed(() => this.messages().filter((m) => !!m.isPinned));
  readonly isRecordingAudio = signal<boolean>(false);
  readonly recordingSeconds = signal<number>(0);
  readonly userLastSeen = signal<Map<string, string>>(new Map<string, string>());
  readonly unreadChannels = signal<Record<string, number>>({});
  readonly unreadDirect = signal<Record<string, number>>({});

  readonly pinnedChatKeys = signal<string[]>(this.loadPinnedChats());
  readonly pinWarning = signal<string | null>(null);
  readonly newChatLimit = signal<number>(10);

  readonly replyingToMessage = signal<ChatMessage | null>(null);
  readonly highlightedMessageId = signal<string | null>(null);

  readonly isEmojiPickerOpen = signal<boolean>(false);
  readonly activeEmojiCategory = signal<string>('smileys');
  emojiSearchQuery = '';
  readonly emojiCategories = CHAT_EMOJI_CATEGORIES;
  readonly quickReactionEmojis = QUICK_REACTION_EMOJIS;

  readonly showMentionMenu = signal<boolean>(false);
  readonly mentionQuery = signal<string>('');
  readonly mentionSelectedIndex = signal<number>(0);
  private mentionStartIndex = -1;
  private savedComposerRange: Range | null = null;
  composerCursorPos = 0;

  readonly pinnedChannels = computed(() => {
    const pinnedKeys = new Set(
      this.pinnedChatKeys()
        .filter((k) => k.startsWith('channel:'))
        .map((k) => k.replace('channel:', '')),
    );
    return this.channels().filter((ch) => pinnedKeys.has(ch.name));
  });

  readonly pinnedDirectMembers = computed(() => {
    const pinnedKeys = new Set(
      this.pinnedChatKeys()
        .filter((k) => k.startsWith('user:'))
        .map((k) => k.replace('user:', '')),
    );
    return this.teamMembers().filter((m) => m.userId && pinnedKeys.has(m.userId));
  });

  readonly hasPinnedChats = computed(() => {
    return this.pinnedChannels().length > 0 || this.pinnedDirectMembers().length > 0;
  });

  loadPinnedChats(): string[] {
    try {
      const stored = localStorage.getItem('workiv_pinned_chats');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  isChatPinned(type: 'channel' | 'user', id: string): boolean {
    const key = `${type}:${id}`;
    return this.pinnedChatKeys().includes(key);
  }

  togglePinChat(type: 'channel' | 'user', id: string, event?: Event): void {
    if (event) event.stopPropagation();
    const key = `${type}:${id}`;
    const current = [...this.pinnedChatKeys()];
    const index = current.indexOf(key);
    if (index > -1) {
      current.splice(index, 1);
      this.pinWarning.set(null);
    } else {
      if (current.length >= 3) {
        this.pinWarning.set('You can pin a maximum of 3 channels or direct chats.');
        setTimeout(() => this.pinWarning.set(null), 3500);
        return;
      }
      current.push(key);
    }
    this.pinnedChatKeys.set(current);
    try {
      localStorage.setItem('workiv_pinned_chats', JSON.stringify(current));
    } catch {}
  }

  getSenderAvatar(senderId: string): string | null {
    if (senderId === this.authService.currentUser()?.userId) {
      return this.authService.currentUser()?.avatarUrl || null;
    }
    const member = this.teamMembers().find(
      (m) => m.userId === senderId || m.employeeId === senderId,
    );
    return member?.avatarUrl || null;
  }

  searchFilter = '';
  newChatSearch = '';
  newMessageText = '';

  pendingAttachments: ChatMessageAttachment[] = [];
  readonly isUploadingFile = signal<boolean>(false);

  readonly isNewChatModalOpen = signal<boolean>(false);
  readonly isCreateChannelModalOpen = signal<boolean>(false);
  readonly isCreatingChannel = signal<boolean>(false);
  readonly isUserProfileModalOpen = signal<boolean>(false);
  readonly selectedProfileMember = signal<TeamMember | null>(null);

  newChannelName = '';
  newChannelDescription = '';
  newChannelIsPrivate = false;
  channelMemberSearch = '';
  selectedChannelMembers: TeamMember[] = [];

  editingMessageId: string | null = null;
  editingMessageText = '';

  private socketSubs: Subscription[] = [];
  private shouldScrollToBottom = false;
  private typingTimeout: any = null;
  private mediaRecorder: any = null;
  private audioChunks: Blob[] = [];
  private recordingTimer: any = null;
  private fallbackPollingTimer: any = null;

  ngOnInit(): void {
    this.socketService.connect();
    this.initSocketListeners();
    this.socketService.requestOnlineUsers();
    this.loadChannels();
    this.loadTeamMembers();
    this.loadUnreadCounts();
    this.loadConversationsSummary();
    this.loadMessages(this.activeChannel());
    console.log(
      '%c[ChatComponent]%c Initialized for channel #' + this.activeChannel() + ' | Realtime sync active',
      'background: #0284c7; color: #fff; padding: 2px 6px; border-radius: 4px; font-weight: bold;',
      'color: #0284c7; font-weight: bold; margin-left: 6px;',
    );

    // Intelligent polling fallback for serverless hosting (e.g. Vercel)
    this.fallbackPollingTimer = setInterval(() => {
      if (!this.socketService.isConnected()) {
        this.pollActiveMessages();
      }
    }, 3500);
  }

  ngOnDestroy(): void {
    if (this.fallbackPollingTimer) clearInterval(this.fallbackPollingTimer);
    this.socketSubs.forEach((s) => s.unsubscribe());
    if (this.typingTimeout) clearTimeout(this.typingTimeout);
    if (this.recordingTimer) clearInterval(this.recordingTimer);
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch {}
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  private initSocketListeners(): void {
    this.socketSubs.push(
      this.socketService.messages$.subscribe((msg) => {
        const direct = this.activeDirectUser();
        const myUserId = this.authService.currentUser()?.userId;
        if (direct) {
          const currentDmId = `dm_${[myUserId, direct.userId].sort().join('_')}`;
          if (msg.channelId === currentDmId) {
            this.messages.update((list) => {
              if (list.some((existing) => existing.messageId === msg.messageId)) {
                return list;
              }
              return [...list, msg];
            });
            this.shouldScrollToBottom = true;
            if (direct.userId) {
              this.api.post(`chat/direct/${direct.userId}/read`, {}).subscribe();
            }
          } else if (msg.senderId !== myUserId) {
            if (msg.isDirect) {
              this.unreadDirect.update((u) => ({
                ...u,
                [msg.senderId]: (u[msg.senderId] || 0) + 1,
              }));
            } else {
              this.unreadChannels.update((u) => ({
                ...u,
                [msg.channelId]: (u[msg.channelId] || 0) + 1,
              }));
            }
          }
        } else {
          if (msg.channelId === this.activeChannel()) {
            this.messages.update((list) => {
              if (list.some((existing) => existing.messageId === msg.messageId)) {
                return list;
              }
              return [...list, msg];
            });
            this.shouldScrollToBottom = true;
            this.api.post(`chat/channels/${this.activeChannel()}/read`, {}).subscribe();
          } else if (msg.senderId !== myUserId) {
            if (msg.isDirect) {
              this.unreadDirect.update((u) => ({
                ...u,
                [msg.senderId]: (u[msg.senderId] || 0) + 1,
              }));
            } else {
              this.unreadChannels.update((u) => ({
                ...u,
                [msg.channelId]: (u[msg.channelId] || 0) + 1,
              }));
            }
          }
        }
        this.loadConversationsSummary();
      }),
    );

    this.socketSubs.push(
      this.socketService.channelCreated$.subscribe((newChan) => {
        if (newChan && newChan.name) {
          this.channels.update((list) => {
            if (list.some((c) => c.name === newChan.name)) return list;
            return [...list, newChan];
          });
        }
      }),
    );

    this.socketSubs.push(
      this.socketService.onlineUsers$.subscribe((users) => {
        this.onlineUserIds.set(new Set(users));
      }),
    );

    this.socketSubs.push(
      this.socketService.userOnline$.subscribe(({ userId }) => {
        this.onlineUserIds.update((set) => {
          const updated = new Set(set);
          updated.add(userId);
          return updated;
        });
        this.userLastSeen.update((map) => {
          const next = new Map(map);
          next.set(userId, 'Active now');
          return next;
        });
        this.teamMembers.update((members) =>
          members.map((m) => (m.userId === userId ? { ...m, isOnline: true } : m)),
        );
      }),
    );

    this.socketSubs.push(
      this.socketService.userOffline$.subscribe(({ userId, lastSeen }) => {
        const offlineTimestamp = lastSeen || new Date().toISOString();
        this.onlineUserIds.update((set) => {
          const updated = new Set(set);
          updated.delete(userId);
          return updated;
        });
        this.userLastSeen.update((map) => {
          const next = new Map(map);
          next.set(userId, offlineTimestamp);
          return next;
        });
        this.teamMembers.update((members) =>
          members.map((m) =>
            m.userId === userId ? { ...m, isOnline: false, lastSeen: offlineTimestamp } : m,
          ),
        );
        if (this.activeDirectUser()?.userId === userId) {
          this.activeDirectUser.update((curr) =>
            curr ? { ...curr, isOnline: false, lastSeen: offlineTimestamp } : curr,
          );
        }
        if (this.selectedProfileMember()?.userId === userId) {
          this.selectedProfileMember.update((curr) =>
            curr ? { ...curr, isOnline: false, lastSeen: offlineTimestamp } : curr,
          );
        }
      }),
    );

    this.socketSubs.push(
      this.socketService.typing$.subscribe((event) => {
        const direct = this.activeDirectUser();
        const myUserId = this.authService.currentUser()?.userId;
        if (direct && event.userId === direct.userId && event.userId !== myUserId && event.isTyping) {
          this.typingUser.set(event.userName || 'Someone');
          if (this.typingTimeout) clearTimeout(this.typingTimeout);
          this.typingTimeout = setTimeout(() => this.typingUser.set(null), 3000);
        } else if (
          !direct &&
          event.channelId === this.activeChannel() &&
          event.userId !== myUserId &&
          event.isTyping
        ) {
          this.typingUser.set(event.userName || 'Someone');
          if (this.typingTimeout) clearTimeout(this.typingTimeout);
          this.typingTimeout = setTimeout(() => this.typingUser.set(null), 3000);
        } else {
          this.typingUser.set(null);
        }
      }),
    );

    this.socketSubs.push(
      this.socketService.messageEdited$.subscribe((updated) => {
        this.messages.update((list) =>
          list.map((m) =>
            m.messageId === updated.messageId
              ? { ...m, content: updated.content, isEdited: true }
              : m,
          ),
        );
      }),
    );

    this.socketSubs.push(
      this.socketService.messageDeleted$.subscribe((event) => {
        this.messages.update((list) => list.filter((m) => m.messageId !== event.messageId));
      }),
    );

    this.socketSubs.push(
      this.socketService.messagePinned$.subscribe((pinned) => {
        this.messages.update((list) =>
          list.map((m) =>
            m.messageId === pinned.messageId
              ? {
                  ...m,
                  isPinned: pinned.isPinned,
                  pinnedBy: pinned.pinnedBy,
                  pinnedAt: pinned.pinnedAt,
                }
              : m,
          ),
        );
      }),
    );

    this.socketSubs.push(
      this.socketService.messageReacted$.subscribe((reacted) => {
        this.messages.update((list) =>
          list.map((m) =>
            m.messageId === reacted.messageId ? { ...m, reactions: reacted.reactions || [] } : m,
          ),
        );
      }),
    );
  }

  /**
   * Builds a TeamMember entry representing the currently logged-in user for self-chat ("You").
   */
  private buildSelfTeamMember(empMatch?: any): TeamMember | null {
    const currentUser = this.authService.currentUser();
    if (!currentUser || !currentUser.userId) return null;
    const emailPrefix = (currentUser.email || 'You').split('@')[0];
    return {
      employeeId: empMatch?.employeeId || `self_${currentUser.userId}`,
      userId: currentUser.userId,
      firstName: empMatch?.firstName || currentUser.firstName || emailPrefix,
      lastName: empMatch?.lastName || currentUser.lastName || '',
      email: empMatch?.email || currentUser.email || '',
      phone: empMatch?.phone,
      designation:
        empMatch?.designation || (currentUser.isOwner ? 'Workspace Owner' : 'Team Member'),
      departmentName: empMatch?.departmentName || 'Personal Workspace',
      branchName: empMatch?.branchName || 'Headquarters',
      employmentType: empMatch?.employmentType || 'FULL_TIME',
      joiningDate: empMatch?.joiningDate,
      status: empMatch?.status || 'ACTIVE',
      roleName: empMatch?.roleName || (currentUser.isOwner ? 'OWNER' : 'EMPLOYEE'),
      avatarUrl: empMatch?.avatarUrl || currentUser.avatarUrl || undefined,
      isOnline: true,
      lastSeen: 'Active now',
      isSelf: true,
    };
  }

  /**
   * Checks whether a given TeamMember entry corresponds to the logged-in user.
   */
  isSelfMember(member?: TeamMember | null): boolean {
    if (!member) return false;
    if (member.isSelf) return true;
    const myUserId = this.authService.currentUser()?.userId;
    return !!myUserId && member.userId === myUserId;
  }

  loadChannels(): void {
    this.api.get<ChannelItem[]>('chat/channels').subscribe({
      next: (list) => {
        if (list && list.length > 0) {
          this.channels.set(list);
        } else {
          this.channels.set([
            { name: 'general', description: 'Company-wide discussion' },
            { name: 'announcements', description: 'Official updates' },
            { name: 'engineering', description: 'Technical architecture' },
            { name: 'random', description: 'Casual bonding' },
          ]);
        }
      },
      error: () => {},
    });
  }

  loadTeamMembers(): void {
    const initialSelf = this.buildSelfTeamMember();
    if (initialSelf && this.teamMembers().length === 0) {
      this.teamMembers.set([initialSelf]);
    }

    this.api.get<{ data: any[] }>('employees', { limit: 100 }).subscribe({
      next: (res) => {
        const currentUserId = this.authService.currentUser()?.userId;
        const rawList = res.data || [];
        const selfEmp = rawList.find((e) => e.userId && e.userId === currentUserId);
        const selfEntry = this.buildSelfTeamMember(selfEmp);

        const mapped: TeamMember[] = rawList
          .filter((e) => e.userId && e.userId !== currentUserId)
          .map((e) => {
            if (e.userId && e.lastSeen) {
              this.userLastSeen.update((map) => {
                const next = new Map(map);
                if (!this.onlineUserIds().has(e.userId)) {
                  next.set(e.userId, e.lastSeen);
                }
                return next;
              });
            }
            return {
              employeeId: e.employeeId,
              userId: e.userId,
              firstName: e.firstName,
              lastName: e.lastName,
              email: e.email,
              phone: e.phone,
              designation: e.designation,
              departmentName: e.departmentName,
              branchName: e.branchName,
              employmentType: e.employmentType,
              joiningDate: e.joiningDate,
              status: e.status,
              roleName: e.roleName,
              avatarUrl: e.avatarUrl,
              isOnline: this.onlineUserIds().has(e.userId),
              lastSeen: e.lastSeen,
              isSelf: false,
            };
          });

        this.teamMembers.set(selfEntry ? [selfEntry, ...mapped] : mapped);
        this.loadConversationsSummary();
      },
      error: () => {
        if (initialSelf && this.teamMembers().length === 0) {
          this.teamMembers.set([initialSelf]);
        }
      },
    });
  }

  loadConversationsSummary(): void {
    this.api.get<ConversationSummary[]>('chat/conversations').subscribe({
      next: (summaries) => {
        if (!summaries) return;
        const summaryMap = new Map<string, ConversationSummary>();
        summaries.forEach((s) => summaryMap.set(s.peerId, s));

        this.teamMembers.update((members) =>
          members.map((m) => {
            const summary = m.userId ? summaryMap.get(m.userId) : undefined;
            if (summary && summary.lastMessage) {
              return {
                ...m,
                lastMessageText: summary.lastMessage.content,
                lastMessageTime: summary.lastMessage.createdAt,
                lastMessageSenderId: summary.lastMessage.senderId,
              };
            }
            return m;
          }),
        );
      },
      error: () => {},
    });
  }

  activeOnlineMembers(): TeamMember[] {
    return this.teamMembers().filter((m) => !this.isSelfMember(m) && this.isUserOnline(m.userId));
  }

  filteredChannels(): ChannelItem[] {
    const q = this.searchFilter.toLowerCase().trim();
    if (!q) return this.channels();
    return this.channels().filter((c) => c.name.toLowerCase().includes(q));
  }

  filteredMembers(): TeamMember[] {
    const q = this.searchFilter.toLowerCase().trim();
    if (!q) return this.teamMembers();
    return this.teamMembers().filter(
      (m) =>
        m.firstName.toLowerCase().includes(q) ||
        m.lastName.toLowerCase().includes(q) ||
        (this.isSelfMember(m) && 'you personal self'.includes(q)) ||
        (m.designation && m.designation.toLowerCase().includes(q)),
    );
  }

  filteredNewChatTotal(): number {
    const q = this.newChatSearch.toLowerCase().trim();
    if (!q) return this.teamMembers().length;
    return this.teamMembers().filter(
      (m) =>
        m.firstName.toLowerCase().includes(q) ||
        m.lastName.toLowerCase().includes(q) ||
        (this.isSelfMember(m) && 'you personal self'.includes(q)) ||
        (m.designation && m.designation.toLowerCase().includes(q)),
    ).length;
  }

  filteredNewChatMembers(): TeamMember[] {
    const q = this.newChatSearch.toLowerCase().trim();
    const all = !q
      ? this.teamMembers()
      : this.teamMembers().filter(
          (m) =>
            m.firstName.toLowerCase().includes(q) ||
            m.lastName.toLowerCase().includes(q) ||
            (this.isSelfMember(m) && 'you personal self'.includes(q)) ||
            (m.designation && m.designation.toLowerCase().includes(q)),
        );
    return all.slice(0, this.newChatLimit());
  }

  loadMoreNewChatMembers(): void {
    this.newChatLimit.update((n) => n + 10);
  }

  onNewChatScroll(event: Event): void {
    const el = event.target as HTMLElement;
    if (el && el.scrollTop + el.clientHeight >= el.scrollHeight - 35) {
      if (this.newChatLimit() < this.filteredNewChatTotal()) {
        this.loadMoreNewChatMembers();
      }
    }
  }

  isUserOnline(userId?: string): boolean {
    if (!userId) return false;
    if (userId === this.authService.currentUser()?.userId) return true;
    return this.onlineUserIds().has(userId);
  }

  getUserLastSeenText(userId?: string): string {
    if (!userId) return 'Offline';
    if (this.isUserOnline(userId)) return 'Active now';
    const recorded = this.userLastSeen().get(userId);
    if (recorded && recorded !== 'Active now') {
      return this.formatRelativeTime(recorded);
    }
    const member = this.teamMembers().find((m) => m.userId === userId);
    if (member?.lastSeen) {
      return this.formatRelativeTime(member.lastSeen);
    }
    return 'Offline';
  }

  /** Formats an offline user's lastSeen timestamp in the effective branch/company timezone. */
  formatRelativeTime(isoString: string): string {
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return 'Offline';
      const now = new Date();
      const diffMs = Math.max(0, now.getTime() - d.getTime());
      const diffMins = Math.floor(diffMs / (60 * 1000));
      const formattedTime = this.authService.formatDateTime(d, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      if (diffMins < 1) {
        return formattedTime ? `Last seen just now (${formattedTime})` : 'Last seen just now';
      }
      if (diffMins < 60) {
        return formattedTime ? `Last seen ${diffMins}m ago (${formattedTime})` : `Last seen ${diffMins}m ago`;
      }
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) {
        return formattedTime ? `Last seen at ${formattedTime}` : `Last seen ${diffHours}h ago`;
      }
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `Last seen ${diffDays}d ago`;
      const formattedDate = this.authService.formatDateTime(d, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      return `Last seen ${formattedDate || d.toLocaleDateString()}`;
    } catch {
      return 'Offline';
    }
  }

  getChannelUnread(name: string): number {
    return this.unreadChannels()[name] || 0;
  }

  getDirectUnread(userId?: string): number {
    return userId ? (this.unreadDirect()[userId] || 0) : 0;
  }

  loadUnreadCounts(): void {
    this.api
      .get<{ channels: Record<string, number>; direct: Record<string, number> }>(
        'chat/unread-counts',
      )
      .subscribe({
        next: (res) => {
          if (res) {
            this.unreadChannels.set(res.channels || {});
            this.unreadDirect.set(res.direct || {});
          }
        },
        error: () => {},
      });
  }

  canCreateChannel(): boolean {
    const user = this.authService.currentUser();
    if (!user) return false;
    if (user.isOwner) return true;
    return (user.permissions || []).includes('channels.create');
  }

  selectChannel(channelName: string): void {
    this.activeDirectUser.set(null);
    this.activeChannel.set(channelName);
    this.typingUser.set(null);
    this.replyingToMessage.set(null);
    this.showMentionMenu.set(false);
    this.isEmojiPickerOpen.set(false);
    this.unreadChannels.update((u) => ({ ...u, [channelName]: 0 }));
    this.api.post(`chat/channels/${channelName}/read`, {}).subscribe();
    this.loadMessages(channelName);
  }

  selectDirectUser(member: TeamMember): void {
    this.activeDirectUser.set(member);
    this.typingUser.set(null);
    this.replyingToMessage.set(null);
    this.showMentionMenu.set(false);
    this.isEmojiPickerOpen.set(false);
    if (member.userId) {
      this.unreadDirect.update((u) => ({ ...u, [member.userId!]: 0 }));
      this.api.post(`chat/direct/${member.userId}/read`, {}).subscribe();
      this.api.get<ChatMessage[]>(`chat/direct/${member.userId}`).subscribe({
        next: (msgs) => {
          this.messages.set(msgs || []);
          this.shouldScrollToBottom = true;
        },
        error: () => this.messages.set([]),
      });
    }
  }

  openNewChatModal(): void {
    this.newChatSearch = '';
    this.newChatLimit.set(10);
    this.isNewChatModalOpen.set(true);
  }

  closeNewChatModal(): void {
    this.isNewChatModalOpen.set(false);
  }

  startChatWithMember(member: TeamMember): void {
    this.closeNewChatModal();
    this.selectDirectUser(member);
  }

  openCreateChannelModal(): void {
    this.newChannelName = '';
    this.newChannelDescription = '';
    this.newChannelIsPrivate = false;
    this.isCreateChannelModalOpen.set(true);
  }

  closeCreateChannelModal(): void {
    this.isCreateChannelModalOpen.set(false);
  }

  createChannel(): void {
    const name = this.newChannelName.trim();
    if (!name) return;

    this.isCreatingChannel.set(true);
    const memberIds = this.selectedChannelMembers
      .map((m) => m.userId)
      .filter((id): id is string => !!id);
    this.api
      .post<ChannelItem>('chat/channels', {
        name,
        description: this.newChannelDescription.trim(),
        isPrivate: this.newChannelIsPrivate,
        memberIds: this.newChannelIsPrivate ? memberIds : undefined,
      })
      .subscribe({
        next: (created) => {
          this.channels.update((list) => [...list, created]);
          this.isCreatingChannel.set(false);
          this.selectedChannelMembers = [];
          this.channelMemberSearch = '';
          this.closeCreateChannelModal();
          this.selectChannel(created.name);
        },
        error: () => this.isCreatingChannel.set(false),
      });
  }

  loadMessages(channelId: string): void {
    this.api.get<ChatMessage[]>('chat/messages', { channelId, limit: 50 }).subscribe({
      next: (data) => {
        this.messages.set(data || []);
        this.shouldScrollToBottom = true;
      },
      error: () => {},
    });
  }

  private pollActiveMessages(): void {
    const direct = this.activeDirectUser();
    if (direct && direct.userId) {
      this.api.get<ChatMessage[]>(`chat/direct/${direct.userId}`, { limit: 50 }).subscribe({
        next: (data) => {
          if (!data) return;
          const currentList = this.messages();
          if (
            data.length !== currentList.length ||
            (data.length > 0 &&
              currentList.length > 0 &&
              data[data.length - 1].messageId !== currentList[currentList.length - 1].messageId)
          ) {
            console.log(
              '%c[ChatComponent]%c 🔄 Synced new direct message(s) from peer',
              'background: #059669; color: #fff; padding: 2px 6px; border-radius: 4px; font-weight: bold;',
              'color: #059669; margin-left: 6px;',
            );
            this.messages.set(data);
            this.shouldScrollToBottom = true;
          }
        },
        error: () => {},
      });
    } else {
      const channel = this.activeChannel();
      if (channel) {
        this.api.get<ChatMessage[]>('chat/messages', { channelId: channel, limit: 50 }).subscribe({
          next: (data) => {
            if (!data) return;
            const currentList = this.messages();
            if (
              data.length !== currentList.length ||
              (data.length > 0 &&
                currentList.length > 0 &&
                data[data.length - 1].messageId !== currentList[currentList.length - 1].messageId)
            ) {
              console.log(
                '%c[ChatComponent]%c 🔄 Synced new channel message(s)',
                'background: #059669; color: #fff; padding: 2px 6px; border-radius: 4px; font-weight: bold;',
                'color: #059669; margin-left: 6px;',
              );
              this.messages.set(data);
              this.shouldScrollToBottom = true;
            }
          },
          error: () => {},
        });
      }
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.isUploadingFile.set(true);

    const formData = new FormData();
    formData.append('file', file);

    this.api
      .post<{ url: string; fileName: string; fileType: string; fileSize: number }>(
        'upload/attachment',
        formData,
      )
      .subscribe({
        next: (res) => {
          this.isUploadingFile.set(false);
          this.pendingAttachments.push({
            url: res.url,
            fileName: res.fileName,
            fileType: res.fileType,
            fileSize: res.fileSize,
          });
          input.value = '';
        },
        error: () => {
          this.isUploadingFile.set(false);
          input.value = '';
        },
      });
  }

  removePendingAttachment(index: number): void {
    this.pendingAttachments.splice(index, 1);
  }

  /**
   * Saves the active DOM selection range inside the rich text composer and refreshes toolbar states.
   */
  syncComposerCursor(): void {
    const editor = this.messageInput?.nativeElement;
    if (!editor) return;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      if (editor.contains(range.commonAncestorContainer)) {
        this.savedComposerRange = range.cloneRange();
      }
    }
    this.composerCursorPos++;
  }

  /**
   * Restores focus and the last saved selection range to the rich text composer.
   */
  private restoreComposerSelection(): void {
    const editor = this.messageInput?.nativeElement;
    if (!editor) return;
    editor.focus();
    if (this.savedComposerRange) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(this.savedComposerRange);
      }
    }
  }

  /**
   * Finds the closest ancestor element matching the given tag name inside the composer.
   */
  private getActiveClosestElement(tagName: string): HTMLElement | null {
    const editor = this.messageInput?.nativeElement;
    if (!editor) return null;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    let node: Node | null = sel.anchorNode;
    while (node && node !== editor) {
      if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName === tagName) {
        return node as HTMLElement;
      }
      node = node.parentNode;
    }
    return null;
  }

  /**
   * Handles paste events in the rich text composer by inserting clean plain text.
   */
  onComposerPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const text = event.clipboardData?.getData('text/plain') || '';
    if (text) {
      document.execCommand('insertText', false, text);
      this.syncEditorToModel();
    }
  }

  /**
   * Serializes the WYSIWYG composer DOM into Slack-flavored rich markdown stored in newMessageText.
   */
  syncEditorToModel(): void {
    const editor = this.messageInput?.nativeElement;
    if (!editor) return;

    const serializeInline = (node: Node): string => {
      if (node.nodeType === Node.TEXT_NODE) {
        return (node.nodeValue || '').replace(/\u200B/g, '');
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return '';
      const el = node as HTMLElement;
      const tag = el.tagName;
      if (tag === 'BR') return '\n';

      let childrenText = '';
      el.childNodes.forEach((child) => {
        childrenText += serializeInline(child);
      });

      if (!childrenText.trim() && tag !== 'A') return childrenText;
      if (tag === 'B' || tag === 'STRONG') return `*${childrenText.trim()}*`;
      if (tag === 'I' || tag === 'EM') return `_${childrenText.trim()}_`;
      if (tag === 'S' || tag === 'STRIKE' || tag === 'DEL') return `~${childrenText.trim()}~`;
      if (tag === 'CODE') return `\`${childrenText}\``;
      if (tag === 'A') {
        const href = el.getAttribute('href') || 'https://';
        return `[${childrenText || href}](${href})`;
      }
      return childrenText;
    };

    const serializeBlocks = (container: HTMLElement): string[] => {
      const lines: string[] = [];
      let inlineBuffer = '';

      const flushInline = () => {
        if (inlineBuffer) {
          lines.push(inlineBuffer);
          inlineBuffer = '';
        }
      };

      container.childNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement;
          const tag = el.tagName;

          if (tag === 'UL') {
            flushInline();
            el.querySelectorAll(':scope > li').forEach((li) => {
              lines.push(`• ${serializeInline(li).replace(/\n+/g, ' ').trim()}`);
            });
            return;
          }
          if (tag === 'OL') {
            flushInline();
            el.querySelectorAll(':scope > li').forEach((li, idx) => {
              lines.push(`${idx + 1}. ${serializeInline(li).replace(/\n+/g, ' ').trim()}`);
            });
            return;
          }
          if (tag === 'BLOCKQUOTE') {
            flushInline();
            const rawQuote = serializeInline(el);
            rawQuote.split('\n').forEach((qLine) => {
              lines.push(`> ${qLine}`);
            });
            return;
          }
          if (tag === 'PRE') {
            flushInline();
            const codeText = (el.textContent || '').replace(/\u200B/g, '');
            lines.push(`\`\`\`\n${codeText}\n\`\`\``);
            return;
          }
          if (tag === 'DIV' || tag === 'P') {
            flushInline();
            const blockSubLines = serializeBlocks(el);
            if (blockSubLines.length > 0) {
              lines.push(...blockSubLines);
            } else {
              lines.push('');
            }
            return;
          }
          if (tag === 'BR') {
            lines.push(inlineBuffer);
            inlineBuffer = '';
            return;
          }
        }
        inlineBuffer += serializeInline(node);
      });

      flushInline();
      return lines;
    };

    const serialized = serializeBlocks(editor).join('\n').trim();
    this.newMessageText = serialized;

    const rawText = (editor.textContent || '').replace(/\u200B/g, '').trim();
    if (
      !rawText &&
      !editor.querySelector('ul, ol, blockquote, pre') &&
      editor.innerHTML !== ''
    ) {
      editor.innerHTML = '';
    }
  }

  /**
   * Checks whether a given rich text format is currently active at the cursor or selection in the WYSIWYG composer.
   */
  isFormatActive(
    format: 'bold' | 'italic' | 'strike' | 'code' | 'codeblock' | 'quote' | 'bullet' | 'numbered',
  ): boolean {
    const _tick = this.composerCursorPos;
    const editor = this.messageInput?.nativeElement;
    if (!editor) return false;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !editor.contains(sel.anchorNode)) return false;

    try {
      if (format === 'bold') return document.queryCommandState('bold');
      if (format === 'italic') return document.queryCommandState('italic');
      if (format === 'strike') return document.queryCommandState('strikeThrough');
      if (format === 'bullet') return document.queryCommandState('insertUnorderedList');
      if (format === 'numbered') return document.queryCommandState('insertOrderedList');
    } catch {
      return false;
    }

    if (format === 'quote') return !!this.getActiveClosestElement('BLOCKQUOTE');
    if (format === 'codeblock') return !!this.getActiveClosestElement('PRE');
    if (format === 'code') {
      return !!this.getActiveClosestElement('CODE') && !this.getActiveClosestElement('PRE');
    }
    return false;
  }

  /**
   * Handles composer input to convert markdown list/quote shortcuts, sync model, and detect @mention queries.
   */
  onComposerInput(_event: Event): void {
    const direct = this.activeDirectUser();
    if (direct?.userId) {
      if (!this.isSelfMember(direct)) {
        this.socketService.sendTyping(true, undefined, direct.userId);
      }
    } else {
      this.socketService.sendTyping(true, this.activeChannel());
    }

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && sel.anchorNode?.nodeType === Node.TEXT_NODE) {
      const textNode = sel.anchorNode as Text;
      const offset = sel.anchorOffset;
      const beforeText = textNode.data.slice(0, offset);

      if (/^[-*•]\s$/.test(beforeText) && !this.getActiveClosestElement('LI')) {
        textNode.data = textNode.data.slice(offset);
        document.execCommand('insertUnorderedList', false);
      } else if (/^1\.\s$/.test(beforeText) && !this.getActiveClosestElement('LI')) {
        textNode.data = textNode.data.slice(offset);
        document.execCommand('insertOrderedList', false);
      } else if (/^>\s$/.test(beforeText) && !this.getActiveClosestElement('BLOCKQUOTE')) {
        textNode.data = textNode.data.slice(offset);
        document.execCommand('formatBlock', false, 'blockquote');
      }
    }

    this.syncComposerCursor();
    this.syncEditorToModel();

    if (sel && sel.rangeCount > 0 && sel.anchorNode?.nodeType === Node.TEXT_NODE) {
      const textBefore = (sel.anchorNode as Text).data.slice(0, sel.anchorOffset);
      const match = textBefore.match(/(?:^|\s)@([a-zA-Z0-9_.\- ]*)$/);
      if (match) {
        const query = match[1];
        if (query.length <= 25 && !query.includes('  ')) {
          this.mentionStartIndex = textBefore.lastIndexOf('@');
          this.mentionQuery.set(query.toLowerCase());
          this.mentionSelectedIndex.set(0);
          this.showMentionMenu.set(true);
          return;
        }
      }
    }

    this.showMentionMenu.set(false);
  }

  /**
   * Returns filtered team members for the @mention autocomplete menu.
   */
  filteredMentionCandidates(): TeamMember[] {
    const q = this.mentionQuery().trim().toLowerCase();
    const baseList = this.teamMembers();
    const specialGroupMentions: TeamMember[] = !this.activeDirectUser()
      ? [
          {
            employeeId: 'mention_channel',
            userId: 'channel',
            firstName: 'channel',
            lastName: '',
            email: 'Notify everyone in #' + this.activeChannel(),
            designation: 'Channel Broadcast',
          },
          {
            employeeId: 'mention_everyone',
            userId: 'everyone',
            firstName: 'everyone',
            lastName: '',
            email: 'Notify all workspace members',
            designation: 'Workspace Broadcast',
          },
        ]
      : [];

    const combined = [...specialGroupMentions, ...baseList];
    if (!q) return combined.slice(0, 8);
    return combined
      .filter((m) => {
        const full = `${m.firstName} ${m.lastName}`.toLowerCase();
        return (
          full.includes(q) ||
          m.email.toLowerCase().includes(q) ||
          (m.designation && m.designation.toLowerCase().includes(q))
        );
      })
      .slice(0, 8);
  }

  /**
   * Inserts the selected @mention candidate into the WYSIWYG composer at the active @ position.
   */
  selectMentionCandidate(candidate: TeamMember): void {
    this.restoreComposerSelection();
    const fullName = `${candidate.firstName} ${candidate.lastName}`.trim();
    const replacement = `@${fullName} `;

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && sel.anchorNode?.nodeType === Node.TEXT_NODE) {
      const textNode = sel.anchorNode as Text;
      const cursorOffset = sel.anchorOffset;
      const before = textNode.data.slice(0, cursorOffset);
      const atIdx = before.lastIndexOf('@');
      if (atIdx >= 0) {
        const range = document.createRange();
        range.setStart(textNode, atIdx);
        range.setEnd(textNode, cursorOffset);
        sel.removeAllRanges();
        sel.addRange(range);
        document.execCommand('insertText', false, replacement);
      } else {
        document.execCommand('insertText', false, replacement);
      }
    } else {
      document.execCommand('insertText', false, replacement);
    }

    this.showMentionMenu.set(false);
    this.mentionStartIndex = -1;
    this.syncComposerCursor();
    this.syncEditorToModel();
  }

  /**
   * Triggers the @mention autocomplete menu from the composer toolbar button.
   */
  triggerMentionFromToolbar(): void {
    this.restoreComposerSelection();
    document.execCommand('insertText', false, '@');
    this.mentionQuery.set('');
    this.mentionSelectedIndex.set(0);
    this.showMentionMenu.set(true);
    this.syncComposerCursor();
    this.syncEditorToModel();
  }

  /**
   * Handles keyboard shortcuts in the WYSIWYG rich text composer, including Slack-style list continuation on Shift+Enter.
   */
  onComposerKeydown(event: KeyboardEvent): void {
    if (this.showMentionMenu()) {
      const candidates = this.filteredMentionCandidates();
      if (candidates.length > 0) {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          this.mentionSelectedIndex.update((i) => (i + 1) % candidates.length);
          return;
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          this.mentionSelectedIndex.update((i) => (i - 1 + candidates.length) % candidates.length);
          return;
        }
        if (event.key === 'Enter' || event.key === 'Tab') {
          event.preventDefault();
          const chosen = candidates[this.mentionSelectedIndex()] || candidates[0];
          if (chosen) this.selectMentionCandidate(chosen);
          return;
        }
        if (event.key === 'Escape') {
          event.preventDefault();
          this.showMentionMenu.set(false);
          return;
        }
      }
    }

    if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === 'b') {
      event.preventDefault();
      this.applyRichFormat('bold');
      return;
    }

    if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === 'i') {
      event.preventDefault();
      this.applyRichFormat('italic');
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'x') {
      event.preventDefault();
      this.applyRichFormat('strike');
      return;
    }

    if (event.key === 'Tab') {
      const li = this.getActiveClosestElement('LI');
      if (li) {
        event.preventDefault();
        document.execCommand(event.shiftKey ? 'outdent' : 'indent', false);
        this.syncComposerCursor();
        this.syncEditorToModel();
        return;
      }
    }

    if (event.key === 'Enter' && event.shiftKey) {
      event.preventDefault();
      const li = this.getActiveClosestElement('LI');
      if (li) {
        const currentText = (li.textContent || '').replace(/\u200B/g, '').trim();
        if (!currentText) {
          const isOrdered = li.parentElement?.tagName === 'OL';
          document.execCommand(isOrdered ? 'insertOrderedList' : 'insertUnorderedList', false);
        } else {
          const sel = window.getSelection();
          if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            range.deleteContents();
            const tailRange = document.createRange();
            tailRange.setStart(range.endContainer, range.endOffset);
            tailRange.setEndAfter(li.lastChild || li);
            const trailingFragment = tailRange.extractContents();

            const newLi = document.createElement('li');
            if (trailingFragment.textContent || trailingFragment.querySelector('*')) {
              newLi.appendChild(trailingFragment);
            } else {
              newLi.appendChild(document.createElement('br'));
            }
            if (!li.textContent && !li.querySelector('br')) {
              li.appendChild(document.createElement('br'));
            }
            li.parentNode?.insertBefore(newLi, li.nextSibling);

            const nextRange = document.createRange();
            nextRange.setStart(newLi, 0);
            nextRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(nextRange);
          }
        }
        this.syncComposerCursor();
        this.syncEditorToModel();
        return;
      }

      const pre = this.getActiveClosestElement('PRE');
      if (pre) {
        document.execCommand('insertText', false, '\n');
        this.syncComposerCursor();
        this.syncEditorToModel();
        return;
      }

      document.execCommand('insertLineBreak', false);
      this.syncComposerCursor();
      this.syncEditorToModel();
      return;
    }

    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    } else if (event.key === 'Escape') {
      if (this.isEmojiPickerOpen()) {
        this.closeEmojiPicker();
      } else if (this.replyingToMessage()) {
        this.cancelReplyMessage();
      }
    }
  }

  /**
   * Applies or toggles Slack-style WYSIWYG rich text formatting directly inside the composer.
   */
  applyRichFormat(
    format:
      | 'bold'
      | 'italic'
      | 'strike'
      | 'code'
      | 'codeblock'
      | 'quote'
      | 'bullet'
      | 'numbered'
      | 'link',
  ): void {
    this.restoreComposerSelection();

    if (format === 'bold') {
      document.execCommand('bold', false);
    } else if (format === 'italic') {
      document.execCommand('italic', false);
    } else if (format === 'strike') {
      document.execCommand('strikeThrough', false);
    } else if (format === 'bullet') {
      document.execCommand('insertUnorderedList', false);
    } else if (format === 'numbered') {
      document.execCommand('insertOrderedList', false);
    } else if (format === 'quote') {
      const existingQuote = this.getActiveClosestElement('BLOCKQUOTE');
      if (existingQuote) {
        document.execCommand('formatBlock', false, 'div');
      } else {
        document.execCommand('formatBlock', false, 'blockquote');
      }
    } else if (format === 'codeblock') {
      const existingPre = this.getActiveClosestElement('PRE');
      if (existingPre) {
        document.execCommand('formatBlock', false, 'div');
      } else {
        document.execCommand('formatBlock', false, 'pre');
      }
    } else if (format === 'code') {
      const existingCode = this.getActiveClosestElement('CODE');
      if (existingCode && !this.getActiveClosestElement('PRE')) {
        const text = existingCode.textContent || '';
        const textNode = document.createTextNode(text);
        existingCode.parentNode?.replaceChild(textNode, existingCode);
        const sel = window.getSelection();
        if (sel) {
          const r = document.createRange();
          r.selectNodeContents(textNode);
          r.collapse(false);
          sel.removeAllRanges();
          sel.addRange(r);
        }
      } else {
        const sel = window.getSelection();
        const selectedText = sel ? sel.toString() : '';
        if (selectedText) {
          document.execCommand('insertHTML', false, `<code>${selectedText}</code>&#8203;`);
        } else {
          const codeEl = document.createElement('code');
          codeEl.textContent = '\u200B';
          if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            range.insertNode(codeEl);
            const nextRange = document.createRange();
            nextRange.setStart(codeEl.firstChild!, 1);
            nextRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(nextRange);
          }
        }
      }
    } else if (format === 'link') {
      const sel = window.getSelection();
      const selectedText = sel ? sel.toString().trim() : '';
      const url = window.prompt('Enter link URL:', 'https://');
      if (url && url.trim() && url.trim() !== 'https://') {
        const cleanUrl = url.trim();
        const label = selectedText || cleanUrl;
        document.execCommand(
          'insertHTML',
          false,
          `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer">${label}</a> `,
        );
      }
    }

    this.syncComposerCursor();
    this.syncEditorToModel();
  }

  /**
   * Renders Slack-style rich text (bold, italic, strikethrough, code blocks, inline code, grouped quotes, grouped lists, links, and @mentions) safely into HTML.
   */
  formatRichMessage(content?: string, isMine = false): SafeHtml {
    if (!content) return '';

    let escaped = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    const codeBlocks: string[] = [];
    escaped = escaped.replace(/```([\s\S]*?)```/g, (_match, codeContent: string) => {
      const idx = codeBlocks.length;
      const trimmed = codeContent.replace(/^\n+|\n+$/g, '');
      codeBlocks.push(
        `<pre class="my-1.5 p-2.5 rounded-[8px] bg-slate-950 text-emerald-300 font-mono text-xs overflow-x-auto border border-slate-700/80 leading-relaxed"><code>${trimmed}</code></pre>`,
      );
      return `@@CODEBLOCK_${idx}@@`;
    });

    const inlineCodes: string[] = [];
    escaped = escaped.replace(/`([^`\n]+)`/g, (_match, codeText: string) => {
      const idx = inlineCodes.length;
      const pillClass = isMine
        ? 'px-1.5 py-0.5 rounded bg-black/25 text-white font-mono text-xs'
        : 'px-1.5 py-0.5 rounded bg-slate-200/90 dark:bg-slate-700 text-pink-600 dark:text-pink-300 font-mono text-xs';
      inlineCodes.push(`<code class="${pillClass}">${codeText}</code>`);
      return `@@INLINECODE_${idx}@@`;
    });

    const linkClass = isMine
      ? 'underline font-semibold text-white hover:opacity-90'
      : 'underline font-semibold text-[#2A65F6] dark:text-blue-400 hover:opacity-90';
    escaped = escaped.replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      `<a href="$2" target="_blank" rel="noopener noreferrer" class="${linkClass}">$1</a>`,
    );

    escaped = escaped.replace(/\*\*([^*\n]+)\*\*/g, '<strong class="font-bold">$1</strong>');
    escaped = escaped.replace(
      /(^|[\s(])\*([^*\n]+)\*(?=[\s).,!?:;]|$)/g,
      '$1<strong class="font-bold">$2</strong>',
    );
    escaped = escaped.replace(
      /(^|[\s(])_([^_\n]+)_(?=[\s).,!?:;]|$)/g,
      '$1<em class="italic">$2</em>',
    );
    escaped = escaped.replace(
      /(^|[\s(])~([^~\n]+)~(?=[\s).,!?:;]|$)/g,
      '$1<del class="line-through opacity-85">$2</del>',
    );

    const mentionClass = isMine
      ? 'inline-flex items-center px-1.5 py-0.5 rounded-[6px] bg-white/25 text-white font-bold text-xs'
      : 'inline-flex items-center px-1.5 py-0.5 rounded-[6px] bg-blue-100 dark:bg-blue-900/60 text-[#2A65F6] dark:text-blue-300 font-bold text-xs';

    for (const member of this.teamMembers()) {
      const fullName = `${member.firstName} ${member.lastName}`.trim();
      if (fullName) {
        const safeName = fullName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const reg = new RegExp(`@${safeName}\\b`, 'gi');
        escaped = escaped.replace(reg, `<span class="${mentionClass}">@${fullName}</span>`);
      }
    }
    escaped = escaped.replace(
      /@(channel|everyone|[A-Za-z0-9_.-]+)\b/g,
      `<span class="${mentionClass}">@$1</span>`,
    );

    const rawLines = escaped.split('\n');
    const blocks: { type: 'text' | 'ul' | 'ol' | 'quote' | 'code'; html: string }[] = [];

    let i = 0;
    while (i < rawLines.length) {
      const line = rawLines[i];

      if (/^\s*@@CODEBLOCK_\d+@@\s*$/.test(line)) {
        blocks.push({ type: 'code', html: line.trim() });
        i++;
        continue;
      }

      if (/^\s*[•\-]\s+/.test(line)) {
        const items: string[] = [];
        while (i < rawLines.length && /^\s*[•\-]\s+/.test(rawLines[i])) {
          const match = rawLines[i].match(/^(\s*)[•\-]\s+(.*)$/);
          const indentLevel = match ? Math.min(Math.floor(match[1].length / 2), 4) : 0;
          const indentStyle = indentLevel > 0 ? ` style="margin-left: ${indentLevel * 16}px"` : '';
          items.push(
            `<li class="leading-snug"${indentStyle}>${match ? match[2] : rawLines[i]}</li>`,
          );
          i++;
        }
        blocks.push({
          type: 'ul',
          html: `<ul class="list-disc pl-5 my-1 space-y-0.5 marker:text-current">${items.join('')}</ul>`,
        });
        continue;
      }

      if (/^\s*\d+\.\s+/.test(line)) {
        const items: string[] = [];
        while (i < rawLines.length && /^\s*\d+\.\s+/.test(rawLines[i])) {
          const match = rawLines[i].match(/^(\s*)(\d+)\.\s+(.*)$/);
          const indentLevel = match ? Math.min(Math.floor(match[1].length / 2), 4) : 0;
          const indentStyle = indentLevel > 0 ? ` style="margin-left: ${indentLevel * 16}px"` : '';
          const valAttr = match ? ` value="${match[2]}"` : '';
          items.push(
            `<li${valAttr} class="leading-snug"${indentStyle}>${match ? match[3] : rawLines[i]}</li>`,
          );
          i++;
        }
        blocks.push({
          type: 'ol',
          html: `<ol class="list-decimal pl-5 my-1 space-y-0.5 marker:font-semibold marker:text-current">${items.join('')}</ol>`,
        });
        continue;
      }

      if (/^\s*&gt;\s?/.test(line)) {
        const quoteLines: string[] = [];
        while (i < rawLines.length && /^\s*&gt;\s?/.test(rawLines[i])) {
          quoteLines.push(rawLines[i].replace(/^\s*&gt;\s?/, ''));
          i++;
        }
        const quoteBorder = isMine
          ? 'border-white/70 bg-white/10 text-blue-50'
          : 'border-[#2A65F6] bg-slate-200/70 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200';
        blocks.push({
          type: 'quote',
          html: `<blockquote class="pl-3 py-1 my-1 border-l-3 rounded-r ${quoteBorder} italic text-xs leading-relaxed">${quoteLines.join('<br>')}</blockquote>`,
        });
        continue;
      }

      blocks.push({ type: 'text', html: line });
      i++;
    }

    let result = '';
    for (let b = 0; b < blocks.length; b++) {
      const curr = blocks[b];
      const prev = b > 0 ? blocks[b - 1] : null;
      if (prev && prev.type === 'text' && curr.type === 'text') {
        result += '<br>' + curr.html;
      } else {
        result += curr.html;
      }
    }

    inlineCodes.forEach((codeHtml, idx) => {
      result = result.replace(`@@INLINECODE_${idx}@@`, codeHtml);
    });
    codeBlocks.forEach((blockHtml, idx) => {
      result = result.replace(`@@CODEBLOCK_${idx}@@`, blockHtml);
    });

    return this.sanitizer.bypassSecurityTrustHtml(result);
  }

  /**
   * Sets a message as the active reply target and focuses the composer.
   */
  startReplyMessage(msg: ChatMessage): void {
    this.replyingToMessage.set(msg);
    setTimeout(() => {
      this.messageInput?.nativeElement?.focus();
    }, 0);
  }

  /**
   * Clears the active reply target in the composer.
   */
  cancelReplyMessage(): void {
    this.replyingToMessage.set(null);
  }

  /**
   * Smoothly scrolls to a specific message by ID and briefly highlights it.
   */
  scrollToMessage(messageId: string): void {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      this.highlightedMessageId.set(messageId);
      setTimeout(() => {
        if (this.highlightedMessageId() === messageId) {
          this.highlightedMessageId.set(null);
        }
      }, 2200);
    }
  }

  /**
   * Toggles the visibility of the categorized emoji picker popover.
   */
  toggleEmojiPicker(): void {
    this.isEmojiPickerOpen.update((v) => !v);
    if (this.isEmojiPickerOpen()) {
      this.emojiSearchQuery = '';
    }
  }

  /**
   * Closes the emoji picker popover.
   */
  closeEmojiPicker(): void {
    this.isEmojiPickerOpen.set(false);
  }

  /**
   * Returns the display label for the currently selected emoji category tab.
   */
  getActiveEmojiCategoryLabel(): string {
    const cat = this.emojiCategories.find((c) => c.id === this.activeEmojiCategory());
    return cat ? cat.label : 'Emojis';
  }

  /**
   * Returns emojis matching the search query or the active emoji category.
   */
  filteredEmojis(): EmojiItem[] {
    const q = this.emojiSearchQuery.trim().toLowerCase();
    if (q) {
      const all: EmojiItem[] = [];
      for (const cat of this.emojiCategories) {
        for (const em of cat.emojis) {
          if (em.name.includes(q) || em.char.includes(q)) {
            all.push(em);
          }
        }
      }
      return all;
    }
    const currentCat = this.emojiCategories.find((c) => c.id === this.activeEmojiCategory());
    return currentCat ? currentCat.emojis : this.emojiCategories[0].emojis;
  }

  /**
   * Inserts an emoji at the current cursor position in the WYSIWYG composer.
   */
  insertEmoji(emoji: string): void {
    this.restoreComposerSelection();
    document.execCommand('insertText', false, emoji);
    this.syncComposerCursor();
    this.syncEditorToModel();
  }

  /**
   * Toggles an emoji reaction on a chat message via WebSocket.
   */
  toggleReaction(msg: ChatMessage, emoji: string): void {
    if (!msg.messageId) return;
    const direct = this.activeDirectUser();
    this.socketService.reactMessage(
      msg.messageId,
      emoji,
      direct ? undefined : this.activeChannel(),
      direct ? direct.userId : undefined,
    );
  }

  /**
   * Checks whether the current user has reacted with a given reaction entry.
   */
  hasReacted(userIds: string[]): boolean {
    const myId = this.authService.currentUser()?.userId;
    return !!myId && Array.isArray(userIds) && userIds.includes(myId);
  }

  /**
   * Sends the composed message along with any attachments, reply metadata, and @mentions.
   */
  sendMessage(): void {
    this.syncEditorToModel();
    const text = this.newMessageText.trim();
    if (!text && this.pendingAttachments.length === 0) return;

    const attachmentsToSend = [...this.pendingAttachments];
    const direct = this.activeDirectUser();
    const replyTarget = this.replyingToMessage();

    const replyPayload: ChatMessageReply | undefined = replyTarget
      ? {
          messageId: replyTarget.messageId,
          senderId: replyTarget.senderId,
          senderName: replyTarget.senderName,
          content: replyTarget.content || undefined,
          attachmentName:
            replyTarget.attachments && replyTarget.attachments.length > 0
              ? replyTarget.attachments[0].fileName
              : replyTarget.type === 'VOICE'
                ? 'Voice Note'
                : undefined,
        }
      : undefined;

    const extractedMentions: string[] = [];
    for (const member of this.teamMembers()) {
      const fullName = `${member.firstName} ${member.lastName}`.trim();
      if (fullName && text.toLowerCase().includes(`@${fullName.toLowerCase()}`) && member.userId) {
        extractedMentions.push(member.userId);
      }
    }

    if (direct?.userId) {
      this.socketService.sendMessage(
        text,
        undefined,
        direct.userId,
        attachmentsToSend,
        undefined,
        undefined,
        replyPayload,
        extractedMentions,
      );
    } else {
      this.socketService.sendMessage(
        text,
        this.activeChannel(),
        undefined,
        attachmentsToSend,
        undefined,
        undefined,
        replyPayload,
        extractedMentions,
      );
    }

    this.newMessageText = '';
    if (this.messageInput?.nativeElement) {
      this.messageInput.nativeElement.innerHTML = '';
    }
    this.savedComposerRange = null;
    this.composerCursorPos = 0;
    this.pendingAttachments = [];
    this.replyingToMessage.set(null);
    this.showMentionMenu.set(false);
    this.isEmojiPickerOpen.set(false);
  }

  startCall(type: 'video' | 'audio'): void {
    const member = this.activeDirectUser();
    if (!member?.userId || this.isSelfMember(member)) return;
    this.webrtcService.startCall(member.userId, `${member.firstName} ${member.lastName}`, type);
  }

  goToMeetings(): void {
    this.router.navigate(['/meetings']);
  }

  isMyMessage(msg: ChatMessage): boolean {
    return msg.senderId === this.authService.currentUser()?.userId;
  }

  canEditDelete(msg: ChatMessage): boolean {
    return this.isMyMessage(msg) || !!this.authService.currentUser()?.isOwner;
  }

  isImageAttachment(att: ChatMessageAttachment): boolean {
    if (att.fileType && att.fileType.startsWith('image/')) return true;
    const ext = (att.fileName || '').toLowerCase();
    return (
      ext.endsWith('.png') ||
      ext.endsWith('.jpg') ||
      ext.endsWith('.jpeg') ||
      ext.endsWith('.gif') ||
      ext.endsWith('.webp')
    );
  }

  startEditMessage(msg: ChatMessage): void {
    this.editingMessageId = msg.messageId;
    this.editingMessageText = msg.content || '';
  }

  cancelEditMessage(): void {
    this.editingMessageId = null;
    this.editingMessageText = '';
  }

  saveEditMessage(): void {
    if (!this.editingMessageId || !this.editingMessageText.trim()) return;
    this.socketService.editMessage(this.editingMessageId, this.editingMessageText.trim());
    this.editingMessageId = null;
    this.editingMessageText = '';
  }

  deleteMessage(msg: ChatMessage): void {
    if (!msg.messageId) return;
    this.socketService.deleteMessage(msg.messageId);
  }

  togglePinMessage(msg: ChatMessage): void {
    if (!msg.messageId) return;
    const direct = this.activeDirectUser();
    this.socketService.pinMessage(
      msg.messageId,
      direct ? undefined : this.activeChannel(),
      direct ? direct.userId : undefined,
    );
  }

  hasAudioAttachment(msg: ChatMessage): boolean {
    if (msg.type === 'VOICE') return true;
    return !!msg.attachments?.some(
      (a) =>
        a.fileType?.startsWith('audio/') ||
        a.fileName?.toLowerCase().endsWith('.webm') ||
        a.fileName?.toLowerCase().endsWith('.mp3'),
    );
  }

  getAudioUrl(msg: ChatMessage): string {
    if (msg.attachments && msg.attachments.length > 0) {
      const audioAtt = msg.attachments.find(
        (a) =>
          a.fileType?.startsWith('audio/') ||
          a.fileName?.toLowerCase().endsWith('.webm') ||
          a.fileName?.toLowerCase().endsWith('.mp3'),
      );
      if (audioAtt) return audioAtt.url;
      return msg.attachments[0].url;
    }
    return '';
  }

  formatAudioDuration(seconds: number): string {
    if (!seconds || seconds <= 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  async startAudioRecording(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioChunks = [];
      const recorder = new MediaRecorder(stream);
      this.mediaRecorder = recorder;

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      recorder.start();
      this.isRecordingAudio.set(true);
      this.recordingSeconds.set(0);

      this.recordingTimer = setInterval(() => {
        this.recordingSeconds.update((s) => s + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start audio recording:', err);
    }
  }

  stopAndSendAudioRecording(): void {
    if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') return;

    const duration = this.recordingSeconds();
    this.mediaRecorder.onstop = () => {
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      this.uploadAndSendAudio(audioBlob, duration);
      if (this.mediaRecorder?.stream) {
        this.mediaRecorder.stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      }
      this.cleanupRecording();
    };

    this.mediaRecorder.stop();
  }

  cancelAudioRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.onstop = null;
      this.mediaRecorder.stop();
      if (this.mediaRecorder.stream) {
        this.mediaRecorder.stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      }
    }
    this.cleanupRecording();
  }

  private cleanupRecording(): void {
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }
    this.isRecordingAudio.set(false);
    this.recordingSeconds.set(0);
    this.audioChunks = [];
    this.mediaRecorder = null;
  }

  private uploadAndSendAudio(blob: Blob, durationSeconds: number): void {
    const formData = new FormData();
    formData.append('file', blob, 'voice_note.webm');

    this.api
      .post<{ url: string; fileName: string; fileType: string; fileSize: number }>(
        'upload/attachment',
        formData,
      )
      .subscribe({
        next: (res) => {
          const direct = this.activeDirectUser();
          const replyTarget = this.replyingToMessage();
          const replyPayload: ChatMessageReply | undefined = replyTarget
            ? {
                messageId: replyTarget.messageId,
                senderId: replyTarget.senderId,
                senderName: replyTarget.senderName,
                content: replyTarget.content || undefined,
              }
            : undefined;
          const attachments: ChatMessageAttachment[] = [
            {
              url: res.url,
              fileName: 'voice_note.webm',
              fileType: 'audio/webm',
              fileSize: res.fileSize || blob.size,
            },
          ];

          if (direct?.userId) {
            this.socketService.sendMessage(
              '',
              undefined,
              direct.userId,
              attachments,
              'VOICE',
              durationSeconds,
              replyPayload,
            );
          } else {
            this.socketService.sendMessage(
              '',
              this.activeChannel(),
              undefined,
              attachments,
              'VOICE',
              durationSeconds,
              replyPayload,
            );
          }
          this.replyingToMessage.set(null);
        },
        error: (err) => {
          console.error('Failed to upload voice note:', err);
        },
      });
  }

  get filteredChannelMembers(): TeamMember[] {
    const search = this.channelMemberSearch.toLowerCase().trim();
    if (!search) return [];
    const selectedIds = new Set(this.selectedChannelMembers.map((m) => m.userId || m.employeeId));
    return this.teamMembers().filter(
      (m) =>
        !this.isSelfMember(m) &&
        !selectedIds.has(m.userId || m.employeeId) &&
        (m.firstName.toLowerCase().includes(search) ||
          m.lastName.toLowerCase().includes(search) ||
          m.email.toLowerCase().includes(search)),
    );
  }

  addChannelMember(member: TeamMember): void {
    if (
      !this.selectedChannelMembers.find(
        (m) => (m.userId || m.employeeId) === (member.userId || member.employeeId),
      )
    ) {
      this.selectedChannelMembers.push(member);
    }
    this.channelMemberSearch = '';
  }

  removeChannelMember(index: number): void {
    this.selectedChannelMembers.splice(index, 1);
  }

  getActiveChannelDesc(): string {
    const ch = this.channels().find((c) => c.name === this.activeChannel());
    return ch?.description || '';
  }

  /**
   * Opens the user profile detail modal for a given team member.
   */
  openUserProfileModal(member: TeamMember): void {
    this.selectedProfileMember.set(member);
    this.isUserProfileModalOpen.set(true);
  }

  /**
   * Opens the user profile detail modal for the sender of a chat message.
   */
  openSenderProfileModal(msg: ChatMessage): void {
    const currentUser = this.authService.currentUser();
    if (currentUser && msg.senderId === currentUser.userId) {
      const selfMember = this.teamMembers().find((m) => this.isSelfMember(m));
      if (selfMember) {
        this.openUserProfileModal(selfMember);
        return;
      }
      const builtSelf = this.buildSelfTeamMember();
      if (builtSelf) {
        this.openUserProfileModal(builtSelf);
        return;
      }
    }

    const found = this.teamMembers().find(
      (m) => m.userId === msg.senderId || m.employeeId === msg.senderId,
    );
    if (found) {
      this.openUserProfileModal(found);
      return;
    }

    const parts = (msg.senderName || 'Team Member').split(' ');
    this.openUserProfileModal({
      employeeId: msg.senderId,
      userId: msg.senderId,
      firstName: parts[0] || 'Team',
      lastName: parts.slice(1).join(' ') || 'Member',
      email: '',
      designation: 'Team Member',
    });
  }

  /**
   * Closes the user profile detail modal.
   */
  closeUserProfileModal(): void {
    this.isUserProfileModalOpen.set(false);
  }

  /**
   * Formats raw employment type enum values into human-readable labels.
   */
  formatEmploymentType(type?: string): string {
    if (!type) return 'Full Time';
    return type
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Initiates a voice or video call directly from the user profile modal.
   */
  startCallFromProfile(member: TeamMember, type: 'audio' | 'video'): void {
    if (!member.userId || this.isSelfMember(member)) return;
    this.closeUserProfileModal();
    this.selectDirectUser(member);
    this.webrtcService.startCall(member.userId, `${member.firstName} ${member.lastName}`, type);
  }

  private scrollToBottom(): void {
    if (this.scrollContainer) {
      const el = this.scrollContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }
}
