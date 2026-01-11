import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { AuthSessionService } from "src/app/demo/auth-session";

export interface NavigationItem {
  id: string;
  title: string;
  type: 'item' | 'collapse' | 'group';
  translate?: string;
  icon?: string;
  hidden?: boolean;
  url?: string;
  classes?: string;
  groupClasses?: string;
  exactMatch?: boolean;
  external?: boolean;
  target?: boolean;
  breadcrumbs?: boolean;
  children?: NavigationItem[];
  link?: string;
  description?: string;
  path?: string;
  action?: () => void; 
}

// ❌ DON'T DO THIS - inject() at top level
// const router = inject(Router);
// const authService = inject(AuthSessionService);

// ✅ DO THIS - Create a factory function that gets services when needed
export function getLogoutAction(): () => void {
  return () => {
    const router = inject(Router);
    const authService = inject(AuthSessionService);
    
    authService.logout();   // clear sessionStorage
    router.navigate(['/login']); // redirect
  };
}

export const NavigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    title: 'Distributor operations',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'default',
        title: 'Dashboard',
        type: 'item',
        classes: 'nav-item',
        url: '/dashboard/default',
        icon: 'dashboard',
        breadcrumbs: false
      },
      {
        id: 'orders',
        title: 'Orders',
        type: 'item',
        classes: 'nav-item',
        url: '/orders',
        icon: 'profile',
        breadcrumbs: false
      },  
      {
        id: 'products',
        title: 'Products',
        type: 'item',
        classes: 'nav-item',
        url: '/products',
        icon: 'wallet',
        breadcrumbs: false
      },
      {
        id: 'reports',
        title: 'Report',
        type: 'item',
        classes: 'nav-item',
        url: '/reports',
        icon: 'unordered-list',
        breadcrumbs: false
      }
    ]
  },
  {
    id: 'desitributors',
    title: 'Admin Operations',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'clients',
        title: 'Clients',
        type: 'item',
        classes: 'nav-item',
        url: '/clients',
        icon: 'profile', 
        breadcrumbs: false
      },
    ]
  },
  {
    id: 'authentication',
    title: 'Profile',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'profile',
        title: 'Profile',
        type: 'item',
        classes: 'nav-item',
        url: '/profile',
        icon: 'user', 
        breadcrumbs: false
      },
      {
        id: 'settings',
        title: 'Settings',
        type: 'item',
        classes: 'nav-item',
        url: '/settings',
        icon: 'setting', 
        breadcrumbs: false
      }
    ]
  },
];