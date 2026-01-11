import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LoaderMaterial } from '../component/loader-material/loader-material';
import { ApiService } from '../api-service'; 
import Swal from 'sweetalert2';
import { AuthSessionService } from '../auth-session';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, LoaderMaterial],
  templateUrl: './settings.html',
  styleUrls: ['./settings.scss']
})
export class Settings implements OnInit {
  activeTab: 'security' | 'notifications' = 'security';

  // Loading states
  isChangingPassword = false;
  isEnablingMfa = false;
  isLoadingUserData = false;

  // User data
  userId: string = '';
  userEmail: string = '';
  isMfaEnabled: boolean = false;

  // Notification preferences
  notifications = {
    orderUpdates: true,
    promotions: false,
    newsletter: true
  };

  // Password fields
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  // Toggles for showing passwords
  showCurrent = false;
  showNew = false;
  showConfirm = false;

  constructor(
    private apiService: ApiService,
    private authService: AuthSessionService
  ) {}

  ngOnInit() {
    this.loadUserData();
  }

  /** Load user data to get user ID and MFA status */
  loadUserData() {
    this.userEmail = this.authService.email || '';
    const clientId = this.authService.clientId;

    if (!clientId || !this.userEmail) {
      this.showError('User information not found. Please login again.');
      return;
    }

    this.isLoadingUserData = true;

    const searchPayload = {
      pageNo: 0,
      pageSize: 10,
      sortBy: 'id',
      sortDir: 'DESC',
      clientId: clientId
    };

    this.apiService.searchUsers(searchPayload).subscribe({
      next: (response: any) => {
        const users = response.data || [];
        const currentUser = users.find((u: any) => u.emailAddress === this.userEmail);
        
        if (currentUser) {
          this.userId = currentUser.id;
          this.isMfaEnabled = currentUser.isMfa === 1;
        } else {
          this.showError('User data not found');
        }
        
        this.isLoadingUserData = false;
      },
      error: (err) => {
        console.error('Failed to load user data', err);
        this.showError('Failed to load user data');
        this.isLoadingUserData = false;
      }
    });
  }

  /** Toggle active tab */
  toggleTab(tab: 'security' | 'notifications') {
    this.activeTab = tab;
  }

  /** Toggle notification preference */
  toggleNotification(key: string) {
    this.notifications[key] = !this.notifications[key];
  }

  /** Toggle password visibility */
  togglePassword(field: 'current' | 'new' | 'confirm') {
    if (field === 'current') this.showCurrent = !this.showCurrent;
    if (field === 'new') this.showNew = !this.showNew;
    if (field === 'confirm') this.showConfirm = !this.showConfirm;
  }

  /** Validate password fields */
  validatePasswordFields(): { valid: boolean; message?: string } {
    if (!this.currentPassword?.trim()) {
      return { valid: false, message: 'Current password is required' };
    }

    if (!this.newPassword?.trim()) {
      return { valid: false, message: 'New password is required' };
    }

    if (this.newPassword.length < 6) {
      return { valid: false, message: 'New password must be at least 6 characters' };
    }

    if (!this.confirmPassword?.trim()) {
      return { valid: false, message: 'Please confirm your new password' };
    }

    if (this.newPassword !== this.confirmPassword) {
      return { valid: false, message: 'New password and confirm password do not match' };
    }

    if (this.currentPassword === this.newPassword) {
      return { valid: false, message: 'New password must be different from current password' };
    }

    return { valid: true };
  }

  /** Change password */
  changePassword() {
    // Validate fields
    const validation = this.validatePasswordFields();
    if (!validation.valid) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'warning',
        title: validation.message,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });
      return;
    }

    if (!this.userEmail) {
      this.showError('User email not found. Please login again.');
      return;
    }

    this.isChangingPassword = true;

    const payload = {
      emailAddress: this.userEmail,
      password: this.newPassword
    };

    // Use bearer token from auth service
    this.apiService.changePasswordWithBearerToken(payload).subscribe({
      next: (response: any) => {
        this.isChangingPassword = false;

        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Your password has been changed successfully.',
          confirmButtonText: 'OK',
          confirmButtonColor: '#0d6efd'
        });

        // Clear password fields
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        this.showCurrent = false;
        this.showNew = false;
        this.showConfirm = false;
      },
      error: (err) => {
        console.error('Change password failed', err);
        this.isChangingPassword = false;

        const errorMessage = err?.error?.message || 'Failed to change password. Please check your current password.';
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: errorMessage,
          showConfirmButton: false,
          timer: 4000,
          timerProgressBar: true
        });
      }
    });
  }

  /** Enable/Disable MFA */
  toggleMfa() {
    if (!this.userId) {
      this.showError('User ID not found. Please refresh the page.');
      return;
    }

    const action = this.isMfaEnabled ? 'disable' : 'enable';
    const newMfaValue = this.isMfaEnabled ? 0 : 1;

    Swal.fire({
      title: `${action === 'enable' ? 'Enable' : 'Disable'} Two-Factor Authentication?`,
      text: action === 'enable' 
        ? 'This will add an extra layer of security to your account.' 
        : 'Your account will be less secure without 2FA.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: action === 'enable' ? '#0d6efd' : '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: `Yes, ${action} it`,
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.updateMfaStatus(newMfaValue);
      }
    });
  }

  /** Update MFA status via API */
  updateMfaStatus(mfaValue: number) {
    this.isEnablingMfa = true;

    const payload = {
      id: this.userId,
      firstName: '', // These will be filled by backend from existing data
      lastName: '',
      phoneNumber: '',
      clientId: this.authService.clientId || '',
      isMfa: mfaValue
    };

    this.apiService.updateUser(payload).subscribe({
      next: (response: any) => {
        this.isEnablingMfa = false;
        this.isMfaEnabled = mfaValue === 1;

        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: `Two-Factor Authentication has been ${mfaValue === 1 ? 'enabled' : 'disabled'}.`,
          confirmButtonText: 'OK',
          confirmButtonColor: '#0d6efd'
        });
      },
      error: (err) => {
        console.error('MFA update failed', err);
        this.isEnablingMfa = false;

        const errorMessage = err?.error?.message || 'Failed to update MFA settings. Please try again.';
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: errorMessage,
          showConfirmButton: false,
          timer: 4000,
          timerProgressBar: true
        });
      }
    });
  }

  /** Show error message */
  private showError(message: string) {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      title: message,
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true
    });
  }

  /** Get password strength indicator */
  getPasswordStrength(password: string): { text: string; color: string; width: string } {
    if (!password) {
      return { text: '', color: '', width: '0%' };
    }

    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;

    if (strength <= 2) {
      return { text: 'Weak', color: '#dc3545', width: '33%' };
    } else if (strength <= 4) {
      return { text: 'Medium', color: '#ffc107', width: '66%' };
    } else {
      return { text: 'Strong', color: '#28a745', width: '100%' };
    }
  }
}