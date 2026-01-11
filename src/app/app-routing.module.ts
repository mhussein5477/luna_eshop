// angular import
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Project import
import { AdminComponent } from './theme/layouts/admin-layout/admin-layout.component';
import { GuestLayoutComponent } from './theme/layouts/guest-layout/guest-layout.component';
import { CheckoutComponent } from './demo/widget/check-out/checkout';
import { ForgotPasswordComponent } from './demo/forgot-password/forgot-password';
import { AuthGuard } from './demo/auth.guard';

const routes: Routes = [
  // 🌍 GUEST LAYOUT ROUTES (PUBLIC)
  {
    path: '',
    component: GuestLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./demo/pages/product-list/product-list')
            .then((c) => c.ProductListComponent)
      },
      {
        path: 'login',
        loadComponent: () =>
          import('./demo/pages/authentication/auth-login/auth-login.component')
            .then((c) => c.AuthLoginComponent)
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./demo/pages/authentication/auth-register/auth-register.component')
            .then((c) => c.AuthRegisterComponent)
      },
      {
        path: 'product-list',
        loadComponent: () =>
          import('./demo/pages/product-list/product-list')
            .then((c) => c.ProductListComponent)
      },
      {
        path: 'product-details',
        loadComponent: () =>
          import('./demo/pages/product-details/product-details')
            .then((c) => c.ProductDetails)
      },
      {
        path: 'checkout',
        component: CheckoutComponent
      },
      {
        path: 'forgot-password',
        component: ForgotPasswordComponent
      }
    ]
  },

  // 🔒 ADMIN LAYOUT ROUTES (PROTECTED)
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard/default',
        pathMatch: 'full'
      },
      {
        path: 'dashboard/default',
        loadComponent: () =>
          import('./demo/dashboard/default/default.component')
            .then((c) => c.DefaultComponent)
      },
      {
        path: 'typography',
        loadComponent: () =>
          import('./demo/component/basic-component/typography/typography.component')
            .then((c) => c.TypographyComponent)
      },
      {
        path: 'color',
        loadComponent: () =>
          import('./demo/component/basic-component/color/color.component')
            .then((c) => c.ColorComponent)
      },
      {
        path: 'sample-page',
        loadComponent: () =>
          import('./demo/others/sample-page/sample-page.component')
            .then((c) => c.SamplePageComponent)
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./demo/orders/orders')
            .then((c) => c.Orders)
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./demo/products/products')
            .then((c) => c.Products)
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./demo/reports/reports')
            .then((c) => c.Reports)
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./demo/profile-page/profile-page')
            .then((c) => c.ProfilePage)
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./demo/settings/settings')
            .then((c) => c.Settings)
      },
      {
        path: 'clients',
        loadComponent: () =>
          import('./demo/clients/clients')
            .then((c) => c.ClientsComponent)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}