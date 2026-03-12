import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ProfileMenu } from './profile-menu/profile-menu';
import { NotificationBell } from './notification-bell/notification-bell';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterOutlet, ProfileMenu, NotificationBell],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {}
