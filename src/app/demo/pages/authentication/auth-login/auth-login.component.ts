// project import
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from 'src/app/demo/api-service';
import { LoaderMaterial } from 'src/app/demo/component/loader-material/loader-material';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-auth-login',
  imports: [RouterModule, CommonModule, FormsModule, LoaderMaterial],
  templateUrl: './auth-login.component.html',
  styleUrl: './auth-login.component.scss'
})
export class AuthLoginComponent {
  constructor(private router: Router, private apiService: ApiService) {}
  
  showPassword = false;
  isSubmitting = false;
  isLoadingLogin = false;
  form: any = {};
  selectedRole: 'admin' | 'client' = 'client';
  
  // MFA state
  mfaToken = '';
  mfaEmail = '';

  // public method
  SignInOptions = [
    {
      image: 'assets/images/authentication/google.svg',
      name: 'Google'
    },
    {
      image: 'assets/images/authentication/twitter.svg',
      name: 'Twitter'
    },
    {
      image: 'assets/images/authentication/facebook.svg',
      name: 'Facebook'
    }
  ];

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  login() {
    // Validate inputs
    if (!this.form.email?.trim()) {
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

    if (!this.form.password?.trim()) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'warning',
        title: 'Please enter your password',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });
      return;
    }

    this.isSubmitting = true;
    this.isLoadingLogin = true;

    // 🔹 Hardcoded login (DEV)
    // if (this.form.email === 'luna@gmail.com' && this.form.password === 'Luna@2026') {
    //   sessionStorage.setItem('auth_token', 'DEV_TOKEN');

    //   Swal.fire({
    //     toast: true,
    //     position: 'top-end',
    //     icon: 'success',
    //     title: `Welcome to Luna Portal`,
    //     showConfirmButton: false,
    //     timer: 2000,
    //     timerProgressBar: true
    //   });

    //   this.isLoadingLogin = false;
    //   this.isSubmitting = false;
    //   this.router.navigate(['./dashboard/default']);
    //   return;
    // }

    // 🔹 API Login
    const payload = {
      emailAddress: this.form.email,
      password: this.form.password
    };

    this.apiService.login(payload).subscribe({
      next: (response: any) => {
        // Check if MFA is required
        const loginData = response?.data?.data;
        
        if (loginData && typeof loginData === 'object' && loginData.validMfa === false) {
          // MFA is enabled and needs verification
          this.mfaToken = loginData.mfaToken;
          this.mfaEmail = this.form.email;
          
          this.isLoadingLogin = false;
          this.isSubmitting = false;
          
          // Show MFA OTP popup
          this.showMfaOtpPopup();
        } else {
          // No MFA or already verified - proceed to dashboard
          // ✅ Store JWT token in sessionStorage
          sessionStorage.setItem('auth_token', response.data.data);
          sessionStorage.setItem('is_logged_in', 'true');

          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: `Welcome to Luna Portal`,
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true
          });

          this.isLoadingLogin = false;
          this.isSubmitting = false;
          this.router.navigate(['./dashboard/default']);
        }
      },

      error: (err) => {
        console.error('Login failed:', err);

        const errorMessage = err?.error?.message || 'Invalid credentials. Please try again.';
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: errorMessage,
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        });

        this.isLoadingLogin = false;
        this.isSubmitting = false;
      }
    });
  }

  /** Show MFA OTP verification popup */
  async showMfaOtpPopup() {
    const { value: otp } = await Swal.fire({
      title: 'Verify Your Account',
      html: `
        <p class="text-muted mb-3">An OTP has been sent to your email</p>
        <p class="fw-bold mb-4">${this.mfaEmail}</p>
        <div class="otp-input-container">
          <input type="text" id="otp-0" class="otp-input" maxlength="1" />
          <input type="text" id="otp-1" class="otp-input" maxlength="1" />
          <input type="text" id="otp-2" class="otp-input" maxlength="1" />
          <input type="text" id="otp-3" class="otp-input" maxlength="1" />
        </div>
        <style>
          .otp-input-container {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin: 20px 0;
          }
          .otp-input {
            width: 50px;
            height: 55px;
            text-align: center;
            font-size: 1.5rem;
            font-weight: 600;
            border: 2px solid #dee2e6;
            border-radius: 8px;
            transition: all 0.3s ease;
          }
          .otp-input:focus {
            outline: none;
            border-color: #0d6efd;
            box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
          }
        </style>
      `,
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Verify',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#0d6efd',
      cancelButtonColor: '#6c757d',
      allowOutsideClick: false,
      didOpen: () => {
        // Auto-focus functionality
        const inputs = document.querySelectorAll('.otp-input') as NodeListOf<HTMLInputElement>;
        
        inputs.forEach((input, index) => {
          // Auto-focus next input
          input.addEventListener('input', (e: any) => {
            const value = e.target.value;
            
            // Only allow numbers
            if (value && !/^\d$/.test(value)) {
              e.target.value = '';
              return;
            }
            
            // Move to next input
            if (value && index < 3) {
              inputs[index + 1].focus();
            }
          });

          // Handle backspace
          input.addEventListener('keydown', (e: any) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
              inputs[index - 1].focus();
            }
          });

          // Handle paste
          if (index === 0) {
            input.addEventListener('paste', (e: any) => {
              e.preventDefault();
              const pastedData = e.clipboardData?.getData('text');
              
              if (pastedData && /^\d{4}$/.test(pastedData)) {
                for (let i = 0; i < 4; i++) {
                  inputs[i].value = pastedData[i];
                }
                inputs[3].focus();
              }
            });
          }
        });

        // Focus first input
        inputs[0].focus();
      },
      preConfirm: () => {
        const inputs = document.querySelectorAll('.otp-input') as NodeListOf<HTMLInputElement>;
        let otpValue = '';
        
        inputs.forEach(input => {
          otpValue += input.value;
        });

        if (otpValue.length < 4) {
          Swal.showValidationMessage('Please enter the complete 4-digit OTP');
          return false;
        }

        return otpValue;
      }
    });

    if (otp) {
      this.verifyMfaOtp(otp);
    }
  }

  /** Verify MFA OTP */
  verifyMfaOtp(otp: string) {
    // Show loading
    Swal.fire({
      title: 'Verifying...',
      text: 'Please wait while we verify your OTP',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    const payload = {
      emailAddress: this.mfaEmail,
      otp: parseInt(otp)
    };

    // Pass mfaToken to the API call
    this.apiService.verifyMfaLogin(payload, this.mfaToken).subscribe({
      next: (response: any) => {
        // Close loading
        Swal.close();

        // Store the actual JWT token
        const token = response?.data?.accessToken || response?.data || response?.token;
        
        if (token) {
          sessionStorage.setItem('auth_token', token);
          sessionStorage.setItem('is_logged_in', 'true');

          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Verification successful! Welcome to Luna Portal',
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true
          });

          // Navigate to dashboard
          this.router.navigate(['./dashboard/default']);
        } else {
          throw new Error('Invalid token response');
        }
      },
      error: (err) => {
        console.error('MFA verification failed:', err);
        Swal.close();

        const errorMessage = err?.error?.message || 'Invalid OTP. Please try again.';
        
        Swal.fire({
          icon: 'error',
          title: 'Verification Failed',
          text: errorMessage,
          confirmButtonText: 'Try Again',
          confirmButtonColor: '#0d6efd',
          showCancelButton: true,
          cancelButtonText: 'Cancel',
          cancelButtonColor: '#6c757d'
        }).then((result) => {
          if (result.isConfirmed) {
            // Show OTP popup again
            this.showMfaOtpPopup();
          }
        });
      }
    });
  }

  /** Navigate to forgot password page */
  goToForgotPassword() {
    this.router.navigate(['/forgot-password']);
  }
}