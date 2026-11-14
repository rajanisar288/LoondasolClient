import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationService } from './core/services/notification.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'client';
  readonly notifService = inject(NotificationService);
}
