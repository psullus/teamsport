import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Signup } from './signup/signup';
import { Login } from './login/login';
import { VerifyEmail } from './verify-email/verify-email';
import { VerifyEmailNotice } from './verify-email-notice/verify-email-notice';
import { AdminDashboard } from './admin/admin-dashboard';
import { ControlDashboard } from './control/control-dashboard';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'signup', component: Signup },
  { path: 'login', component: Login },
  { path: 'verify-email', component: VerifyEmail },
  { path: 'verify-email-notice', component: VerifyEmailNotice },
  {
    path: 'admin',
    component: AdminDashboard,
    canActivate: [authGuard, roleGuard('ADMIN', 'CONTROL')],
  },
  {
    path: 'control',
    component: ControlDashboard,
    canActivate: [authGuard, roleGuard('CONTROL')],
  },
];
