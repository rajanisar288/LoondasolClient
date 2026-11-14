import { Component, inject, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebRtcService } from '../../../core/services/webrtc.service';

@Component({
  selector: 'app-call-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./call-modal.component.html",
  styleUrl: "./call-modal.component.scss",
})
export class CallModalComponent {
  readonly webrtcService = inject(WebRtcService);

  @ViewChild('remoteVideo') set remoteVideoEl(el: ElementRef<HTMLVideoElement> | undefined) {
    if (el && el.nativeElement && this.webrtcService.remoteStream()) {
      el.nativeElement.srcObject = this.webrtcService.remoteStream();
    }
  }

  @ViewChild('localVideo') set localVideoEl(el: ElementRef<HTMLVideoElement> | undefined) {
    if (el && el.nativeElement && this.webrtcService.localStream()) {
      el.nativeElement.srcObject = this.webrtcService.localStream();
    }
  }

  constructor() {
    // Attach stream whenever streams update
    effect(() => {
      const rStream = this.webrtcService.remoteStream();
      const lStream = this.webrtcService.localStream();
      // Effects track stream reactivity
    });
  }

  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}
