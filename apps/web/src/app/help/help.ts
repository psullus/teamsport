import { Component, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-help',
  imports: [RouterLink],
  templateUrl: './help.html',
  styleUrl: './help.css',
})
export class Help {
  isAdmin = computed(() => {
    const role = this.authService.user()?.role;
    return role === 'ADMIN' || role === 'CONTROL';
  });

  constructor(private authService: AuthService) {}
}
