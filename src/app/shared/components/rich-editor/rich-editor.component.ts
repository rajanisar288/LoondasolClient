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
  templateUrl: "./rich-editor.component.html",
  styleUrl: "./rich-editor.component.scss",
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
    if (this.editorRef) {
      this.editorRef.nativeElement.focus();
    }
    document.execCommand(command, false, value);
    this.onContentChange();
  }

  execFormatBlock(tag: string): void {
    if (this.editorRef) {
      this.editorRef.nativeElement.focus();
    }
    try {
      document.execCommand('formatBlock', false, `<${tag}>`);
    } catch {
      document.execCommand('formatBlock', false, tag);
    }
    this.onContentChange();
  }

  insertLink(): void {
    const sel = window.getSelection();
    let range: Range | null = null;
    if (sel && sel.rangeCount > 0) {
      range = sel.getRangeAt(0);
    }
    const url = prompt('Enter URL:', 'https://');
    if (url) {
      if (this.editorRef) {
        this.editorRef.nativeElement.focus();
      }
      if (range && sel) {
        sel.removeAllRanges();
        sel.addRange(range);
      }
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
