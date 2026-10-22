import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

export interface MarketingPost {
  postId: string;
  platform: string;
  content: string;
  hashtags: string[];
  status: string;
  createdAt: string;
}

@Component({
  selector: 'app-marketing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Social Media Post Designer & AI Dispatcher
          </h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Design, format, and generate AI-optimized copy and hashtags across LinkedIn, Twitter/X, Facebook, and Instagram.
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div class="lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 class="text-base font-bold text-slate-900 dark:text-white">Post Creator & AI Generator</h3>

          <div class="space-y-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Target Platform</label>
              <div class="grid grid-cols-4 gap-2">
                @for (p of platforms; track p.id) {
                  <button
                    type="button"
                    (click)="selectedPlatform = p.id"
                    class="p-2.5 rounded-xl border text-xs font-bold text-center transition flex flex-col items-center space-y-1"
                    [ngClass]="selectedPlatform === p.id ? 'border-[#2A65F6] bg-blue-50 dark:bg-blue-950/40 text-[#2A65F6]' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'"
                  >
                    <span class="text-base">{{ p.icon }}</span>
                    <span>{{ p.name }}</span>
                  </button>
                }
              </div>
            </div>

            <div class="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2 border border-slate-100 dark:border-slate-700">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-slate-700 dark:text-slate-300">✨ AI Caption Assistant</span>
                <span class="text-[11px] text-[#2A65F6] font-semibold">Gemini 2.0 Flash</span>
              </div>
              <input
                type="text"
                [(ngModel)]="aiTopic"
                placeholder="Topic or announcement (e.g. Launched new automated payroll system)..."
                class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:border-[#2A65F6]"
              />
              <button
                type="button"
                (click)="generateWithAi()"
                [disabled]="!aiTopic.trim() || isGenerating()"
                class="w-full py-2 bg-[#2A65F6] hover:bg-[#2052cb] text-white text-xs font-bold rounded-lg transition disabled:opacity-50"
              >
                {{ isGenerating() ? 'AI is composing post...' : 'Generate Platform Copy with AI' }}
              </button>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Post Content</label>
              <textarea
                [(ngModel)]="postContent"
                rows="6"
                placeholder="Write your custom caption or edit the AI generated text..."
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:border-[#2A65F6]"
              ></textarea>
            </div>

            <div class="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                (click)="copyToClipboard()"
                [disabled]="!postContent.trim()"
                class="px-4 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold rounded-xl transition disabled:opacity-50"
              >
                📋 Copy Text
              </button>
              <button
                type="button"
                (click)="savePost()"
                [disabled]="!postContent.trim() || isSaving()"
                class="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition disabled:opacity-50"
              >
                {{ isSaving() ? 'Saving...' : 'Publish / Save Post' }}
              </button>
            </div>
          </div>
        </div>

        <div class="lg:col-span-6 space-y-4">
          <div class="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Preview ({{ selectedPlatform }})</h3>
            <div class="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
              <div class="flex items-center space-x-2.5">
                <div class="w-8 h-8 rounded-full bg-[#2A65F6] text-white flex items-center justify-center text-xs font-bold">
                  W
                </div>
                <div>
                  <div class="text-xs font-bold text-slate-900 dark:text-white">WorkivLab Official</div>
                  <div class="text-[10px] text-slate-400">Just now • 🌐 Public</div>
                </div>
              </div>

              <div class="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                {{ postContent || 'Your formatted preview copy will appear here...' }}
              </div>

              @if (hashtags.length > 0) {
                <div class="flex flex-wrap gap-1 pt-1">
                  @for (tag of hashtags; track tag) {
                    <span class="text-[11px] font-semibold text-[#2A65F6]">{{ tag }}</span>
                  }
                </div>
              }
            </div>
          </div>

          <div class="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Previous Posts</h3>
            @if (savedPosts().length === 0) {
              <p class="text-xs text-slate-400">No previous posts saved yet.</p>
            } @else {
              <div class="space-y-2 max-h-56 overflow-y-auto">
                @for (sp of savedPosts(); track sp.postId) {
                  <div class="p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span class="font-bold text-slate-900 dark:text-white mr-2">[{{ sp.platform }}]</span>
                      <span class="text-slate-500">{{ sp.content.slice(0, 45) }}...</span>
                    </div>
                    <span class="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                      {{ sp.status }}
                    </span>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class MarketingComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly platforms = [
    { id: 'LINKEDIN', name: 'LinkedIn', icon: '💼' },
    { id: 'TWITTER', name: 'Twitter / X', icon: '🐦' },
    { id: 'FACEBOOK', name: 'Facebook', icon: '👥' },
    { id: 'INSTAGRAM', name: 'Instagram', icon: '📸' },
  ];

  selectedPlatform = 'LINKEDIN';
  aiTopic = '';
  postContent = '';
  hashtags: string[] = [];

  readonly isGenerating = signal(false);
  readonly isSaving = signal(false);
  readonly savedPosts = signal<MarketingPost[]>([]);

  ngOnInit(): void {
    this.fetchPosts();
  }

  fetchPosts(): void {
    this.api.get<MarketingPost[]>('marketing/posts').subscribe({
      next: (res) => this.savedPosts.set(res || []),
    });
  }

  generateWithAi(): void {
    if (!this.aiTopic.trim()) return;
    this.isGenerating.set(true);
    this.api
      .post<any>('ai/generate-social-post', {
        topic: this.aiTopic.trim(),
        platform: this.selectedPlatform,
      })
      .subscribe({
        next: (res) => {
          this.postContent = res.content || '';
          this.hashtags = res.hashtags || [];
          this.isGenerating.set(false);
        },
        error: () => this.isGenerating.set(false),
      });
  }

  savePost(): void {
    if (!this.postContent.trim()) return;
    this.isSaving.set(true);
    this.api
      .post<MarketingPost>('marketing/posts', {
        platform: this.selectedPlatform,
        content: this.postContent.trim(),
        hashtags: this.hashtags,
        status: 'PUBLISHED',
      })
      .subscribe({
        next: (created) => {
          this.savedPosts.update((list) => [created, ...list]);
          this.isSaving.set(false);
          alert('Post published successfully to ' + this.selectedPlatform + '!');
        },
        error: () => this.isSaving.set(false),
      });
  }

  copyToClipboard(): void {
    const fullText = `${this.postContent}\n\n${this.hashtags.join(' ')}`;
    navigator.clipboard.writeText(fullText);
    alert('Copied post to clipboard!');
  }
}
