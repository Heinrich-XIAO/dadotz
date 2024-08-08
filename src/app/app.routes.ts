import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home.component').then(com => com.HomeComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component').then(com => com.DashboardComponent)
  },
  {
    path: 'signup',
    loadComponent: () => import('./signup/signup.component').then(com => com.SignupComponent)
  }
];
