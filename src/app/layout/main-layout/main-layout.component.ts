import { Component, OnInit, inject } from '@angular/core';
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
  template: `
    <div class="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden relative">
      <app-sidebar></app-sidebar>
      <div class="flex flex-col flex-1 min-w-0 overflow-hidden">
        <app-header></app-header>
        <main class="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          <router-outlet></router-outlet>
        </main>
      </div>
      <app-call-modal></app-call-modal>
    </div>
  `,
})
export class MainLayoutComponent implements OnInit {
  private readonly socketService = inject(SocketService);

  ngOnInit(): void {
    this.socketService.connect();
  }
}
