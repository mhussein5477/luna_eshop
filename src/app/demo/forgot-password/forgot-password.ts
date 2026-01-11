import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LoaderMaterial } from '../component/loader-material/loader-material';
import { ApiService } from '../api-service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.scss'],
  imports: [CommonModule, FormsModule, LoaderMaterial],
})
export class ForgotPasswordComponent {
  // Step management
  currentStep: 'email' | 'otp' | 'newPassword' = 'email';
  
  // Form data
  emailAddress = '';
  otp = '';
  newPassword = '';
  confirmPassword = '';
  
  // Token from OTP verification
  resetToken = '';
  
  // Loading states
  isSubmittingEmail = false;
  isVerifyingOtp = false;
  isResettingPassword = false;
  
  // Password visibility
  showNewPassword = false;
  showConfirmPassword = false;
  
  // Timer for resend OTP
  resendTimer = 0;
  resendInterval: any;

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnDestroy() {
    if (this.resendInterval) {
      clearInterval(this.resendInterval);
    }
  }

  /** Submit email to request password reset OTP */
  submitEmail() {
    // Validate email
    if (!this.emailAddress?.trim()) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'warning',
        title: 'Please enter your email address',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.emailAddress)) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'warning',
        title: 'Please enter a valid email address',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });
      return;
    }

    this.isSubmittingEmail = true;

    this.apiService.forgotPassword(this.emailAddress).subscribe({
      next: (response: any) => {
        this.isSubmittingEmail = false;
        
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'OTP sent to your email!',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        });

        // Move to OTP verification step
        this.currentStep = 'otp';
        this.startResendTimer();
      },
      error: (err) => {
        console.error('Forgot password failed', err);
        this.isSubmittingEmail = false;
        
        const errorMessage = err?.error?.message || 'Failed to send OTP. Please try again.';
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

  /** Verify OTP */
  verifyOtp() {
    // Validate OTP
    if (!this.otp?.trim()) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'warning',
        title: 'Please enter the OTP',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });
      return;
    }

    // Check OTP length (assuming 6 digits)
    if (this.otp.length < 4) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'warning',
        title: 'Please enter a valid OTP',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });
      return;
    }

    this.isVerifyingOtp = true;

    const payload = {
      emailAddress: this.emailAddress,
      otp: parseInt(this.otp)
    };

    this.apiService.verifyOtp(payload).subscribe({
      next: (response: any) => {
        this.isVerifyingOtp = false;
        
        // Store the token from the response
        this.resetToken = response?.data?.token || response?.token || '';
        
        if (!this.resetToken) {
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'error',
            title: 'Invalid response from server. Please try again.',
            showConfirmButton: false,
            timer: 4000,
            timerProgressBar: true
          });
          return;
        }

        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'OTP verified successfully!',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true
        });

        // Move to new password step
        this.currentStep = 'newPassword';

        // Clear interval
        if (this.resendInterval) {
          clearInterval(this.resendInterval);
        }
      },
      error: (err) => {
        console.error('OTP verification failed', err);
        this.isVerifyingOtp = false;
        
        const errorMessage = err?.error?.message || 'Invalid OTP. Please try again.';
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

  /** Reset password with token */
  resetPassword() {
    // Validate passwords
    if (!this.newPassword?.trim()) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'warning',
        title: 'Please enter a new password',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });
      return;
    }

    if (this.newPassword.length < 6) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'warning',
        title: 'Password must be at least 6 characters',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });
      return;
    }

    if (!this.confirmPassword?.trim()) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'warning',
        title: 'Please confirm your password',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'warning',
        title: 'Passwords do not match',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });
      return;
    }

    this.isResettingPassword = true;

    const payload = {
      emailAddress: this.emailAddress,
      password: this.newPassword
    };

    this.apiService.changePasswordWithToken(payload, this.resetToken).subscribe({
      next: (response: any) => {
        this.isResettingPassword = false;
        
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Your password has been reset successfully.',
          confirmButtonText: 'Go to Login',
          confirmButtonColor: '#0d6efd'
        }).then((result) => {
          if (result.isConfirmed) {
            this.router.navigate(['/login']);
          }
        });
      },
      error: (err) => {
        console.error('Password reset failed', err);
        this.isResettingPassword = false;
        
        const errorMessage = err?.error?.message || 'Failed to reset password. Please try again.';
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

  /** Resend OTP */
  resendOtp() {
    if (this.resendTimer > 0) {
      return;
    }

    this.isSubmittingEmail = true;

    this.apiService.forgotPassword(this.emailAddress).subscribe({
      next: (response: any) => {
        this.isSubmittingEmail = false;
        
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'OTP resent successfully!',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        });

        this.startResendTimer();
      },
      error: (err) => {
        console.error('Resend OTP failed', err);
        this.isSubmittingEmail = false;
        
        const errorMessage = err?.error?.message || 'Failed to resend OTP. Please try again.';
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

  /** Start resend timer (60 seconds) */
  startResendTimer() {
    this.resendTimer = 60;
    
    if (this.resendInterval) {
      clearInterval(this.resendInterval);
    }

    this.resendInterval = setInterval(() => {
      this.resendTimer--;
      if (this.resendTimer <= 0) {
        clearInterval(this.resendInterval);
      }
    }, 1000);
  }

  /** Go back to email step */
  goBackToEmail() {
    this.currentStep = 'email';
    this.otp = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.resetToken = '';
    if (this.resendInterval) {
      clearInterval(this.resendInterval);
    }
    this.resendTimer = 0;
  }

  /** Go back to OTP step */
  goBackToOtp() {
    this.currentStep = 'otp';
    this.newPassword = '';
    this.confirmPassword = '';
    this.showNewPassword = false;
    this.showConfirmPassword = false;
  }

  /** Navigate back to login */
  goToLogin() {
    this.router.navigate(['/login']);
  }

  /** Toggle password visibility */
  togglePasswordVisibility(field: 'new' | 'confirm') {
    if (field === 'new') {
      this.showNewPassword = !this.showNewPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  /** Handle OTP input - auto-focus next input */
  onOtpInput(event: any, index: number) {
    const input = event.target;
    const value = input.value;

    // Only allow numbers
    if (value && !/^\d$/.test(value)) {
      input.value = '';
      return;
    }

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) {
        (nextInput as HTMLInputElement).focus();
      }
    }

    // Update OTP string
    this.updateOtpString();
  }

  /** Handle OTP backspace */
  onOtpKeydown(event: any, index: number) {
    if (event.key === 'Backspace') {
      const input = event.target;
      
      if (!input.value && index > 0) {
        const prevInput = document.getElementById(`otp-${index - 1}`);
        if (prevInput) {
          (prevInput as HTMLInputElement).focus();
        }
      }
    }
  }

  /** Update OTP string from individual inputs */
  updateOtpString() {
    let otpValue = '';
    for (let i = 0; i < 6; i++) {
      const input = document.getElementById(`otp-${i}`) as HTMLInputElement;
      if (input && input.value) {
        otpValue += input.value;
      }
    }
    this.otp = otpValue;
  }

  /** Handle paste event for OTP */
  onOtpPaste(event: ClipboardEvent) {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text');
    
    if (pastedData && /^\d{4,6}$/.test(pastedData)) {
      // Fill individual inputs
      for (let i = 0; i < Math.min(pastedData.length, 6); i++) {
        const input = document.getElementById(`otp-${i}`) as HTMLInputElement;
        if (input) {
          input.value = pastedData[i];
        }
      }
      this.updateOtpString();
      
      // Focus last filled input
      const lastIndex = Math.min(pastedData.length - 1, 5);
      const lastInput = document.getElementById(`otp-${lastIndex}`);
      if (lastInput) {
        (lastInput as HTMLInputElement).focus();
      }
    }
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