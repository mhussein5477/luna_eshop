// angular import
import { Component, inject, input, output } from '@angular/core';
import { Router } from '@angular/router';

// project import
import { IconService, IconDirective } from '@ant-design/icons-angular';
import {
  BellOutline,
  SettingOutline,
  GiftOutline,
  MessageOutline,
  PhoneOutline,
  CheckCircleOutline,
  LogoutOutline,
  EditOutline,
  UserOutline,
  ProfileOutline,
  WalletOutline,
  QuestionCircleOutline,
  LockOutline,
  CommentOutline,
  UnorderedListOutline,
  ArrowRightOutline,
  GithubOutline,
  OrderedListOutline
} from '@ant-design/icons-angular/icons';
import { NgbDropdownModule, NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { AuthSessionService } from 'src/app/demo/auth-session';

@Component({
  selector: 'app-nav-right',
  standalone: true,
  imports: [IconDirective, NgbDropdownModule, NgbNavModule, NgScrollbarModule],
  templateUrl: './nav-right.component.html',
  styleUrls: ['./nav-right.component.scss']
})
export class NavRightComponent {
  private iconService = inject(IconService);
  private router = inject(Router);

  styleSelectorToggle = input<boolean>();
  Customize = output();
  windowWidth: number;
  screenFull: boolean = true;

  constructor(public authSession: AuthSessionService) {
    this.windowWidth = window.innerWidth;

    // Register icons
    this.iconService.addIcon(
      ...[
        CheckCircleOutline,
        GiftOutline,
        MessageOutline,
        SettingOutline,
        PhoneOutline,
        LogoutOutline,
        UserOutline,
        EditOutline,
        ProfileOutline,
        QuestionCircleOutline,
        LockOutline,
        CommentOutline,
        UnorderedListOutline,
        ArrowRightOutline,
        BellOutline,
        GithubOutline,
        WalletOutline
      ]
    );
  }

  // Profile menu
  profile = [
    {
      icon: 'user',
      title: 'View Profile',
      link: '/profile'
    },
    
    {
      icon: 'logout',
      title: 'Logout',
      link: '/login',
      action: () => this.logout() // 🔹 call logout
    }
  ];

  // Settings menu
  setting = [
    {
      icon: 'question-circle',
      title: 'Support',
      link: 'https://lunapackaging.co.ke'
    },
    {
      icon: 'lock',
      title: 'Change Pass',
      link: '/settings'
    },
    {
      icon: 'comment',
      title: 'Notification Settings',
      link: '/settings'
    }
  ];

  /**
   * Logout user: clears token and redirects to login
   */
  logout() {
    this.authSession.logout(); // clears sessionStorage
    this.router.navigate(['/login']);
  }

  /**
   * Handle menu click
   */
  onMenuClick(item: any) {
    if (item.action) {
      item.action(); // call the action (like logout)
    } else if (item.link) {
      if (item.link.startsWith('http')) {
        window.open(item.link, '_blank'); // external link
      } else {
        this.router.navigate([item.link]); // internal route
      }
    }
  }
}
