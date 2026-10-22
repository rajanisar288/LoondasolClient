import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rich-editor',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-sm focus-within:border-[#2A65F6] focus-within:ring-2 focus-within:ring-[#2A65F6]/20 transition"
    >
      <!-- Toolbar -->
      <div
        class="flex flex-wrap items-center gap-1 px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 text-slate-700 dark:text-slate-300 select-none"
      >
        <button
          type="button"
          (click)="exec('bold')"
          class="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-bold transition"
          title="Bold (Ctrl+B)"
        >
          <span class="w-4 h-4 flex items-center justify-center font-bold">B</span>
        </button>

        <button
          type="button"
          (click)="exec('italic')"
          class="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-xs italic font-serif transition"
          title="Italic (Ctrl+I)"
        >
          <span class="w-4 h-4 flex items-center justify-center italic">I</span>
        </button>

        <button
          type="button"
          (click)="exec('underline')"
          class="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-xs underline transition"
          title="Underline (Ctrl+U)"
        >
          <span class="w-4 h-4 flex items-center justify-center underline">U</span>
        </button>

        <button
          type="button"
          (click)="exec('strikeThrough')"
          class="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-xs line-through transition"
          title="Strikethrough"
        >
          <span class="w-4 h-4 flex items-center justify-center line-through">S</span>
        </button>

        <div class="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1"></div>

        <button
          type="button"
          (click)="execFormatBlock('h1')"
          class="px-2 py-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-bold transition"
          title="Heading 1"
        >
          H1
        </button>

        <button
          type="button"
          (click)="execFormatBlock('h2')"
          class="px-2 py-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-bold transition"
          title="Heading 2"
        >
          H2
        </button>

        <button
          type="button"
          (click)="execFormatBlock('p')"
          class="px-2 py-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-medium transition"
          title="Paragraph / Normal Text"
        >
          ¶
        </button>

        <div class="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1"></div>

        <button
          type="button"
          (click)="exec('insertUnorderedList')"
          class="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-xs transition"
          title="Bullet List"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <button
          type="button"
          (click)="exec('insertOrderedList')"
          class="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-xs transition"
          title="Numbered List"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <button
          type="button"
          (click)="execFormatBlock('blockquote')"
          class="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-xs transition"
          title="Blockquote"
        >
          <span class="w-4 h-4 flex items-center justify-center font-serif text-sm">”</span>
        </button>

        <button
          type="button"
          (click)="execFormatBlock('pre')"
          class="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-mono transition"
          title="Code Block"
        >
          &lt;/&gt;
        </button>

        <div class="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1"></div>

        <button
          type="button"
          (click)="insertLink()"
          class="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-xs transition"
          title="Insert Link"
        >
          🔗
        </button>

        <button
          type="button"
          (click)="exec('removeFormat')"
          class="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-xs transition"
          title="Clear Formatting"
        >
          🧹
        </button>
      </div>

      <!-- Editable Content Area -->
      <div
        #editor
        contenteditable="true"
        (input)="onContentChange()"
        (blur)="onContentChange()"
        [attr.data-placeholder]="placeholder"
        [style.min-height]="minHeight"
        class="rich-editor-content p-3.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none overflow-y-auto max-h-[360px] leading-relaxed"
      ></div>
    </div>
  `,
  styles: [
    `
      .rich-editor-content:empty:before {
        content: attr(data-placeholder);
        color: #94a3b8;
        pointer-events: none;
      }
      .rich-editor-content h1 {
        font-size: 1.25rem;
        font-weight: 700;
        margin: 0.5rem 0;
      }
      .rich-editor-content h2 {
        font-size: 1.1rem;
        font-weight: 600;
        margin: 0.4rem 0;
      }
      .rich-editor-content h3 {
        font-size: 0.95rem;
        font-weight: 600;
        margin: 0.3rem 0;
      }
      .rich-editor-content ul {
        list-style-type: disc;
        padding-left: 1.25rem;
        margin: 0.3rem 0;
      }
      .rich-editor-content ol {
        list-style-type: decimal;
        padding-left: 1.25rem;
        margin: 0.3rem 0;
      }
      .rich-editor-content blockquote {
        border-left: 3px solid #2A65F6;
        padding-left: 0.75rem;
        font-style: italic;
        color: #64748b;
        margin: 0.4rem 0;
      }
      .rich-editor-content pre {
        background-color: #f1f5f9;
        padding: 0.5rem;
        border-radius: 0.5rem;
        font-family: monospace;
        margin: 0.4rem 0;
      }
      :host-context(.dark) .rich-editor-content pre {
        background-color: #1e293b;
      }
      .rich-editor-content a {
        color: #2A65F6;
        text-decoration: underline;
      }
    `,
  ],
})
export class AppRichEditorComponent implements AfterViewInit, OnChanges {
  @Input() value = '';
  @Input() placeholder = 'Write details, notes, acceptance criteria...';
  @Input() minHeight = '140px';

  @Output() valueChange = new EventEmitter<string>();

  @ViewChild('editor') editorRef!: ElementRef<HTMLDivElement>;

  ngAfterViewInit(): void {
    this.syncEditorContent();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value'] && this.editorRef) {
      const currentHtml = this.editorRef.nativeElement.innerHTML;
      if (this.value !== currentHtml) {
        this.syncEditorContent();
      }
    }
  }

  syncEditorContent(): void {
    if (this.editorRef) {
      this.editorRef.nativeElement.innerHTML = this.value || '';
    }
  }

  exec(command: string, value: string | undefined = undefined): void {
    document.execCommand(command, false, value);
    this.onContentChange();
  }

  execFormatBlock(tag: string): void {
    document.execCommand('formatBlock', false, `<${tag}>`);
    this.onContentChange();
  }

  insertLink(): void {
    const url = prompt('Enter URL:');
    if (url) {
      this.exec('createLink', url);
    }
  }

  onContentChange(): void {
    if (this.editorRef) {
      const html = this.editorRef.nativeElement.innerHTML;
      this.valueChange.emit(html);
    }
  }
}
