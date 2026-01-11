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
    this.navigations = NavigationItems;
  }

  ngOnInit() {
    if (this.windowWidth < 1025) {
      (document.querySelector('.coded-navbar') as HTMLDivElement).classList.add('menupos-static');
    }
    this.buildNavigation();
    this.setupLogoutAction();
  }

  /**
   * Setup logout action for the logout navigation item
   */
  private setupLogoutAction() {
    const authGroup = this.navigations.find(nav => nav.id === 'authentication');
    const logoutItem = authGroup?.children?.find(child => child.id === 'login');
    
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

  private buildNavigation() {
  if (this.authService.role === 'ROLE_ADMIN') {
  this.navigations = NavigationItems;
  return;
}


    this.navigations = NavigationItems
      .map(group => {
        if (group.id === 'desitributors' && group.children) {
          const filteredChildren = group.children.filter(item => item.id !== 'clients');
          if (filteredChildren.length === 0) return null;
          return { ...group, children: filteredChildren };
        }
        return group;
      })
      .filter(Boolean) as NavigationItem[];
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
  console.log(item)
  }
}