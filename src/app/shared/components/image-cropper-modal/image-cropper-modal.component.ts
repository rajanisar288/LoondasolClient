import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppModalComponent } from '../modal/modal.component';
import { AppButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-image-cropper-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, AppModalComponent, AppButtonComponent],
  templateUrl: './image-cropper-modal.component.html',
  styleUrl: './image-cropper-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppImageCropperModalComponent implements AfterViewInit, OnChanges {
  @Input() isOpen = false;
  @Input() imageSrc: string | null = null;
  @Input() title = 'Crop Profile Picture';

  @Output() cropped = new EventEmitter<Blob>();
  @Output() cancelled = new EventEmitter<void>();

  @ViewChild('cropperCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  readonly zoom = signal<number>(1.0);
  readonly rotation = signal<number>(0);
  readonly isImageLoaded = signal<boolean>(false);
  readonly isProcessing = signal<boolean>(false);

  private loadedImage: HTMLImageElement | null = null;
  private panX = 0;
  private panY = 0;
  private isDragging = false;
  private lastDragX = 0;
  private lastDragY = 0;

  // Visual canvas dimensions
  readonly canvasSize = 360;
  readonly cropDiameter = 280;

  ngAfterViewInit(): void {
    if (this.isOpen && this.imageSrc) {
      this.loadImage();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.resetTransform();
      setTimeout(() => this.loadImage(), 50);
    } else if (changes['imageSrc'] && this.isOpen) {
      this.resetTransform();
      this.loadImage();
    }
  }

  private resetTransform(): void {
    this.zoom.set(1.0);
    this.rotation.set(0);
    this.panX = 0;
    this.panY = 0;
    this.isDragging = false;
  }

  private loadImage(): void {
    if (!this.imageSrc) {
      this.loadedImage = null;
      this.isImageLoaded.set(false);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      this.loadedImage = img;
      this.isImageLoaded.set(true);
      this.draw();
    };
    img.onerror = () => {
      this.isImageLoaded.set(false);
    };
    img.src = this.imageSrc;
  }

  onZoomChange(value: number): void {
    this.zoom.set(Number(value));
    this.draw();
  }

  zoomIn(): void {
    const next = Math.min(3.0, +(this.zoom() + 0.15).toFixed(2));
    this.zoom.set(next);
    this.draw();
  }

  zoomOut(): void {
    const next = Math.max(1.0, +(this.zoom() - 0.15).toFixed(2));
    this.zoom.set(next);
    this.draw();
  }

  rotateRight(): void {
    this.rotation.set((this.rotation() + 90) % 360);
    this.draw();
  }

  resetAll(): void {
    this.resetTransform();
    this.draw();
  }

  // --- Pointer / Touch event handlers for dragging ---
  onMouseDown(event: MouseEvent): void {
    this.isDragging = true;
    this.lastDragX = event.clientX;
    this.lastDragY = event.clientY;
  }

  onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return;
    const dx = event.clientX - this.lastDragX;
    const dy = event.clientY - this.lastDragY;
    this.lastDragX = event.clientX;
    this.lastDragY = event.clientY;
    this.panX += dx;
    this.panY += dy;
    this.draw();
  }

  onMouseUp(): void {
    this.isDragging = false;
  }

  onTouchStart(event: TouchEvent): void {
    if (event.touches.length === 1) {
      this.isDragging = true;
      this.lastDragX = event.touches[0].clientX;
      this.lastDragY = event.touches[0].clientY;
    }
  }

  onTouchMove(event: TouchEvent): void {
    if (!this.isDragging || event.touches.length !== 1) return;
    event.preventDefault();
    const dx = event.touches[0].clientX - this.lastDragX;
    const dy = event.touches[0].clientY - this.lastDragY;
    this.lastDragX = event.touches[0].clientX;
    this.lastDragY = event.touches[0].clientY;
    this.panX += dx;
    this.panY += dy;
    this.draw();
  }

  onTouchEnd(): void {
    this.isDragging = false;
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    const delta = event.deltaY < 0 ? 0.08 : -0.08;
    const next = Math.max(1.0, Math.min(3.0, +(this.zoom() + delta).toFixed(2)));
    this.zoom.set(next);
    this.draw();
  }

  private draw(): void {
    if (!this.canvasRef || !this.loadedImage) return;
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = this.loadedImage;
    const w = this.canvasSize;
    const h = this.canvasSize;
    const cropR = this.cropDiameter / 2;
    const centerX = w / 2;
    const centerY = h / 2;

    // Reset transform & clear
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // 1. Draw image with pan, zoom, and rotation
    ctx.save();
    ctx.translate(centerX + this.panX, centerY + this.panY);
    ctx.rotate((this.rotation() * Math.PI) / 180);

    // Calculate base dimensions so image covers at least the crop circle diameter
    const isRotated90or270 = this.rotation() === 90 || this.rotation() === 270;
    const effectiveW = isRotated90or270 ? img.height : img.width;
    const effectiveH = isRotated90or270 ? img.width : img.height;
    const baseScale = Math.max(this.cropDiameter / effectiveW, this.cropDiameter / effectiveH);
    const drawW = img.width * baseScale * this.zoom();
    const drawH = img.height * baseScale * this.zoom();

    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    // 2. Draw dark backdrop overlay
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
    ctx.fillRect(0, 0, w, h);

    // 3. Cut out circular viewing hole
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(centerX, centerY, cropR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 4. Draw circular stroke & subtle grid
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, cropR, 0, Math.PI * 2);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#2A65F6';
    ctx.stroke();

    // Subtle alignment grid inside circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, cropR, 0, Math.PI * 2);
    ctx.clip();

    ctx.lineWidth = 0.5;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    // Vertical grid
    ctx.beginPath();
    ctx.moveTo(centerX - cropR / 3, centerY - cropR);
    ctx.lineTo(centerX - cropR / 3, centerY + cropR);
    ctx.moveTo(centerX + cropR / 3, centerY - cropR);
    ctx.lineTo(centerX + cropR / 3, centerY + cropR);
    // Horizontal grid
    ctx.moveTo(centerX - cropR, centerY - cropR / 3);
    ctx.lineTo(centerX + cropR, centerY - cropR / 3);
    ctx.moveTo(centerX - cropR, centerY + cropR / 3);
    ctx.lineTo(centerX + cropR, centerY + cropR / 3);
    ctx.stroke();

    ctx.restore();
  }

  saveCrop(): void {
    if (!this.loadedImage) return;
    this.isProcessing.set(true);

    const img = this.loadedImage;
    const exportSize = 512;
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = exportSize;
    exportCanvas.height = exportSize;
    const ctx = exportCanvas.getContext('2d');

    if (!ctx) {
      this.isProcessing.set(false);
      return;
    }

    const scaleFactor = exportSize / this.cropDiameter;
    const isRotated90or270 = this.rotation() === 90 || this.rotation() === 270;
    const effectiveW = isRotated90or270 ? img.height : img.width;
    const effectiveH = isRotated90or270 ? img.width : img.height;
    const baseScale = Math.max(this.cropDiameter / effectiveW, this.cropDiameter / effectiveH);
    const drawW = img.width * baseScale * this.zoom() * scaleFactor;
    const drawH = img.height * baseScale * this.zoom() * scaleFactor;

    // Draw transformed image
    ctx.save();
    ctx.translate(exportSize / 2 + this.panX * scaleFactor, exportSize / 2 + this.panY * scaleFactor);
    ctx.rotate((this.rotation() * Math.PI) / 180);
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    exportCanvas.toBlob(
      (blob) => {
        this.isProcessing.set(false);
        if (blob) {
          this.cropped.emit(blob);
        }
      },
      'image/jpeg',
      0.92,
    );
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
