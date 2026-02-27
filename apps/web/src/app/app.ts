import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ProfileMenu } from './profile-menu/profile-menu';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterOutlet, ProfileMenu],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {}
