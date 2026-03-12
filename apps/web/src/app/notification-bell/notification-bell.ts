import { Component, HostListener, signal } from '@angular/core';
import { AuthService, type Notification } from '../services/auth.service';

@Component({
  selector: 'app-notification-bell',
  templateUrl: './notification-bell.html',
  styleUrl: './notification-bell.css',
})
export class NotificationBell {
  open = signal(false);
  notifications = signal<Notification[]>([]);

  constructor(public auth: AuthService) {}

  async toggle() {
    const wasOpen = this.open();
    this.open.set(!wasOpen);
    if (!wasOpen) {
      try {
        this.notifications.set(await this.auth.listNotifications());
      } catch {
        this.notifications.set([]);
      }
    }
  }

  async dismiss(id: string) {
    await this.auth.markNotificationRead(id);
    this.notifications.update((list) => list.filter((n) => n.id !== id));
  }

  async markAllRead() {
    await this.auth.markAllNotificationsRead();
    this.notifications.set([]);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const el = (event.target as HTMLElement).closest('app-notification-bell');
    if (!el) {
      this.open.set(false);
    }
  }
}
