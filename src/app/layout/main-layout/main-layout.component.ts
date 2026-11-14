import { Component, OnInit, OnDestroy, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';
import { CallModalComponent } from '../../shared/components/call-modal/call-modal.component';
import { SocketService } from '../../core/services/socket.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, HeaderComponent, CallModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  private readonly socketService = inject(SocketService);

  ngOnInit(): void {
    this.socketService.connect();
  }

  ngOnDestroy(): void {
    this.socketService.disconnect();
  }
}
