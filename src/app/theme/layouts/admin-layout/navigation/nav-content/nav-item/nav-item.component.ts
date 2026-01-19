// Angular import
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Project import
import { NavigationItem } from '../../navigation';

import { IconDirective } from '@ant-design/icons-angular';

@Component({
  selector: 'app-nav-item',
  imports: [CommonModule, IconDirective, RouterModule],
  templateUrl: './nav-item.component.html',
  styleUrls: ['./nav-item.component.scss']
})
export class NavItemComponent {
  // public props
  @Input() item!: NavigationItem;

  // public method
  closeOtherMenu(event: MouseEvent) {
    const ele = event.target as HTMLElement;
    if (ele !== null && ele !== undefined) {
      const parent = ele.parentElement as HTMLElement;
      const up_parent = ((parent.parentElement as HTMLElement).parentElement as HTMLElement).parentElement as HTMLElement;
      const last_parent = up_parent.parentElement;
      const sections = document.querySelectorAll('.coded-hasmenu');
      for (let i = 0; i < sections.length; i++) {
        sections[i].classList.remove('active');
        sections[i].classList.remove('coded-trigger');
      }

      if (parent.classList.contains('coded-hasmenu')) {
        parent.classList.add('coded-trigger');
        parent.classList.add('active');
      } else if (up_parent.classList.contains('coded-hasmenu')) {
        up_parent.classList.add('coded-trigger');
        up_parent.classList.add('active');
      } else if (last_parent?.classList.contains('coded-hasmenu')) {
        last_parent.classList.add('coded-trigger');
        last_parent.classList.add('active');
      }
    }
    if ((document.querySelector('app-navigation.pc-sidebar') as HTMLDivElement)?.classList.contains('mob-open')) {
      (document.querySelector('app-navigation.pc-sidebar') as HTMLDivElement).classList.remove('mob-open');
    }
  }

  /**
   * Handle navigation item click
   * If item has an action, execute it instead of navigating
   */
  navItemClick(event: MouseEvent, item: NavigationItem) {
    console.log('Nav item clicked:', item);
    
    // If item has an action (like logout), execute it and prevent default
    if (item.action && typeof item.action === 'function') {
      event.preventDefault();
      item.action();
      this.closeOtherMenu(event);
      return;
    }
    
    // Otherwise, let the router handle it normally
    this.closeOtherMenu(event);
  }
}