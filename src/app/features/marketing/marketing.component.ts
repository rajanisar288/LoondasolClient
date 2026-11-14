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
  templateUrl: "./marketing.component.html",
  styleUrl: "./marketing.component.scss",
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
