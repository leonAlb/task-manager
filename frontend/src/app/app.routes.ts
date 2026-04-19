import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    title: 'Login Page',
    loadComponent: () => import('./pages/login/login').then(m => m.Login),
  },
  {
    path: 'register',
    title: 'Register Page',
    loadComponent: () => import('./pages/register/register').then(m => m.Register),
  },
  {
    path: 'tasks',
    title: 'Tasks Page',
    loadComponent: () => import('./pages/tasks/tasks').then(m => m.Tasks),
  },
];
