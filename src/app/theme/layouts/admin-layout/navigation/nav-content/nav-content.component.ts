import { Component, OnInit, inject, output } from '@angular/core';
import { CommonModule, Location, LocationStrategy } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NavigationItem, NavigationItems } from '../navigation';
import { environment } from 'src/environments/environment';
import { NavGroupComponent } from './nav-group/nav-group.component';
import { IconService } from '@ant-design/icons-angular';
import {
  DashboardOutline,
  CreditCardOutline,
  LoginOutline,
  QuestionOutline,
  ChromeOutline,
  FontSizeOutline,
  ProfileOutline,
  BgColorsOutline,
  AntDesignOutline
} from '@ant-design/icons-angular/icons';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { AuthSessionService } from 'src/app/demo/auth-session';

@Component({
  selector: 'app-nav-content',
  standalone: true,
  imports: [CommonModule, RouterModule, NavGroupComponent, NgScrollbarModule],
  templateUrl: './nav-content.component.html',
  styleUrls: ['./nav-content.component.scss']
})
export class NavContentComponent implements OnInit {
  private location = inject(Location);
  private locationStrategy = inject(LocationStrategy);
  private iconService = inject(IconService);
  private router = inject(Router);
  private authService = inject(AuthSessionService);

  NavCollapsedMob = output();
  navigations: NavigationItem[];
  title = 'Demo application for version numbering';
  currentApplicationVersion = environment.appVersion;
  navigation = NavigationItems;
  windowWidth = window.innerWidth;

  constructor() {
    this.iconService.addIcon(
      ...[
        DashboardOutline,
        CreditCardOutline,
        FontSizeOutline,
        LoginOutline,
        ProfileOutline,
        BgColorsOutline,
        AntDesignOutline,
        ChromeOutline,
        QuestionOutline
      ]
    );
    // Initialize with empty array - will be built in ngOnInit
    this.navigations = [];
  }

  ngOnInit() {
    if (this.windowWidth < 1025) {
      (document.querySelector('.coded-navbar') as HTMLDivElement)?.classList.add('menupos-static');
    }
    
    // Build navigation first
    this.buildNavigation();
    
    // Then setup logout action
    this.setupLogoutAction();
  }

  /**
   * Setup logout action for the logout navigation item
   */
  private setupLogoutAction() {
    const authGroup = this.navigations.find(nav => nav.id === 'authentication');
    const logoutItem = authGroup?.children?.find(child => child.id === 'logout');
    
    if (logoutItem) {
      logoutItem.action = () => {
        this.handleLogout();
      };
    }
  }

  /**
   * Handle logout action
   */
  private handleLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  /**
   * Build navigation based on user role and order permissions
   * 
   * ROLE_ADMIN sees: Dashboard, Clients, Settings, Logout
   * ROLE_CLIENT sees: Dashboard, Orders (if isPortalOrder = 1), Products, Reports, Profile, Settings, Logout
   */
  private buildNavigation() {
    const userRole = this.authService.role;
    const isPortalOrder = this.authService.isPortalOrder;

    console.log('Building navigation for role:', userRole, 'isPortalOrder:', isPortalOrder);

    if (userRole === 'ROLE_ADMIN') {
      // ADMIN sees: Dashboard, Clients, Settings, Logout
      this.navigations = NavigationItems
        .map(group => {
          // Deep clone to avoid mutating original
          const clonedGroup = JSON.parse(JSON.stringify(group));
          
          if (clonedGroup.id === 'dashboard' && clonedGroup.children) {
            // Keep only Dashboard from this group
            const filteredChildren = clonedGroup.children.filter((item: NavigationItem) => 
              item.id === 'default'
            );
            if (filteredChildren.length === 0) return null;
            return { ...clonedGroup, children: filteredChildren };
          }
          
          if (clonedGroup.id === 'distributors') {
            // Keep the entire Admin Operations group (has Clients)
            return clonedGroup;
          }
          
          if (clonedGroup.id === 'authentication' && clonedGroup.children) {
            // Keep only Settings and Logout (no Profile)
            const filteredChildren = clonedGroup.children.filter((item: NavigationItem) => 
              item.id === 'settings' || item.id === 'logout'
            );
            if (filteredChildren.length === 0) return null;
            return { ...clonedGroup, children: filteredChildren };
          }
          
          // Hide other groups
          return null;
        })
        .filter(Boolean) as NavigationItem[];
    } else {
      // CLIENT sees: Dashboard, Orders (if isPortalOrder = 1), Products, Reports, Profile, Settings, Logout
      this.navigations = NavigationItems
        .map(group => {
          // Deep clone to avoid mutating original
          const clonedGroup = JSON.parse(JSON.stringify(group));
          
          if (clonedGroup.id === 'dashboard' && clonedGroup.children) {
            // Filter children based on isPortalOrder
            const filteredChildren = clonedGroup.children.filter((item: NavigationItem) => {
              // Show Orders only if isPortalOrder is true
              if (item.id === 'orders') {
                return isPortalOrder;
              }
              // Show all other items (Dashboard, Products, Reports)
              return item.id === 'default' || item.id === 'products' || item.id === 'reports';
            });
            
            if (filteredChildren.length === 0) return null;
            return { ...clonedGroup, children: filteredChildren };
          }
          
          if (clonedGroup.id === 'distributors') {
            // Remove entire Admin Operations group (has Clients) for clients
            return null;
          }
          
          if (clonedGroup.id === 'authentication' && clonedGroup.children) {
            // Keep all items (Profile, Settings, Logout)
            const filteredChildren = clonedGroup.children.filter((item: NavigationItem) => 
              item.id === 'profile' || item.id === 'settings' || item.id === 'logout'
            );
            if (filteredChildren.length === 0) return null;
            return { ...clonedGroup, children: filteredChildren };
          }
          
          // Hide other groups
          return null;
        })
        .filter(Boolean) as NavigationItem[];
    }

    console.log('Built navigation:', this.navigations);
  }

  fireOutClick() {
    let current_url = this.location.path();
    const baseHref = this.locationStrategy.getBaseHref();
    if (baseHref) current_url = baseHref + this.location.path();

    const link = "a.nav-link[ href='" + current_url + "' ]";
    const ele = document.querySelector(link);
    if (!ele) return;

    const parent = ele.parentElement;
    const up_parent = parent?.parentElement?.parentElement;
    const last_parent = up_parent?.parentElement;

    if (parent?.classList.contains('coded-hasmenu')) {
      parent.classList.add('coded-trigger', 'active');
    } else if (up_parent?.classList.contains('coded-hasmenu')) {
      up_parent.classList.add('coded-trigger', 'active');
    } else if (last_parent?.classList.contains('coded-hasmenu')) {
      last_parent.classList.add('coded-trigger', 'active');
    }
  }

  navMob() {
    if (this.windowWidth < 1025 && document.querySelector('app-navigation.coded-navbar')?.classList.contains('mob-open')) {
      this.NavCollapsedMob.emit();
    }
  }

  /**
   * Handle navigation click for items with an action
   */
  onNavItemClick(item: NavigationItem) {
    console.log('Nav item clicked:', item);
    
    // If item has an action, execute it
    if (item.action && typeof item.action === 'function') {
      item.action();
    }
  }
}