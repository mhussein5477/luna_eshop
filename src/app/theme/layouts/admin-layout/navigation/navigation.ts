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

// ✅ Proper factory function for logout
export function getLogoutAction(): () => void {
  return () => {
    const router = inject(Router);
    const authService = inject(AuthSessionService);
    
    authService.logout(); // clear session
    router.navigate(['/login']); // absolute path
  };
}

// ✅ Fixed NavigationItems with absolute paths
export const NavigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    title: 'Client Operations',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'default',
        title: 'Dashboard',
        type: 'item',
        classes: 'nav-item',
        url: '/admin/dashboard/default', // ✅ absolute path
        icon: 'dashboard',
        breadcrumbs: false
      },
      {
        id: 'orders',
        title: 'Orders',
        type: 'item',
        classes: 'nav-item',
        url: '/admin/orders', // ✅ absolute path
        icon: 'profile',
        breadcrumbs: false
      },  
      {
        id: 'products',
        title: 'Products',
        type: 'item',
        classes: 'nav-item',
        url: '/admin/products', // ✅ absolute path
        icon: 'wallet',
        breadcrumbs: false
      },
      {
        id: 'reports',
        title: 'Report',
        type: 'item',
        classes: 'nav-item',
        url: '/admin/reports', // ✅ absolute path
        icon: 'unordered-list',
        breadcrumbs: false
      }
    ]
  },
  {
    id: 'distributors',
    title: 'Admin Operations',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'clients',
        title: 'Clients',
        type: 'item',
        classes: 'nav-item',
        url: '/admin/clients', // ✅ absolute path
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
        url: '/admin/profile', // ✅ absolute path
        icon: 'user', 
        breadcrumbs: false
      },
      {
        id: 'settings',
        title: 'Settings',
        type: 'item',
        classes: 'nav-item',
        url: '/admin/settings', // ✅ absolute path
        icon: 'setting', 
        breadcrumbs: false
      },
      {
        id: 'logout',
        title: 'Logout',
        type: 'item',
        classes: 'nav-item',
        icon: 'log-out',
        breadcrumbs: false,
        action: getLogoutAction() // ✅ properly uses inject()
      }
    ]
  },
];
