import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoaderMaterial } from '../component/loader-material/loader-material';
import { ApiService } from '../api-service'; 
import Swal from 'sweetalert2';
import { AuthSessionService } from '../auth-session';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, FormsModule, LoaderMaterial],
  templateUrl: './profile-page.html',
  styleUrls: ['./profile-page.css']
})
export class ProfilePage implements OnInit {
  
  // Loading states
  isLoadingProfile = false;
  isUpdatingProfile = false;
  isUploadingLogo = false;
  
  // Edit mode
  editMode = false;
  
  // Logo upload
  selectedLogoFile: File | null = null;
  logoPreviewUrl: string | null = null;
  
  // Client data
  clientData: any = null;
  
  // Profile form data
  profile = {
    id: '',
    name: '',
    industry: '',
    tin: '',
    physicalAddress: '',
    phoneNumber: '',
    emailAddress: '',
    website: '',
    logo: null,
    themeColor: '#0d6efd',
    whatsappAcc: '',
    instagramAcc: '',
    twitterAcc: '',
    facebookAcc: '',
    isEmailNotify: false,
    isSmsNotify: false
  };
  
  // Preferences
  language = 'en';
  clientId : any 

  constructor(
    private apiService: ApiService,
    private authService: AuthSessionService
  ) {}

  ngOnInit() {
      this.clientId = this.authService.clientId;
    this.loadProfile(this.clientId);
  }

  /** Load client profile from API */
  loadProfile(clientId) {
   
    
    if (!clientId) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: 'Client ID not found. Please login again.',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });
      return;
    }

    this.isLoadingProfile = true;

    const searchPayload = {
      clientId : this.clientId,
      pageSize: 10,
      "pageNo": 0, 
    };

    this.apiService.searchClients(searchPayload).subscribe({
      next: (response: any) => {
        const clients = response.data || [];
        
        if (clients.length > 0) {
          this.clientData = clients.find((c: any) => c.id === clientId);
          
          if (this.clientData) {
            this.populateProfile(this.clientData);
            
            // Apply theme color if exists
            if (this.clientData.themeColor) {
              this.updateThemeColor(this.clientData.themeColor);
            }
          } else {
            this.showError('Client profile not found');
          }
        } else {
          this.showError('No client data available');
        }
        
        this.isLoadingProfile = false;
      },
      error: (err) => {
        console.error('Failed to load profile', err);
        this.showError('Failed to load profile data');
        this.isLoadingProfile = false;
      }
    });
  }

  /** Populate profile form with client data */
  populateProfile(client: any) {
    this.profile = {
      id: client.id || '',
      name: client.name || '',
      industry: client.industry || '',
      tin: client.tin || '',
      physicalAddress: client.physicalAddress || '',
      phoneNumber: client.phoneNumber || '',
      emailAddress: client.emailAddress || '',
      website: client.website || '',
      logo: client.clientLogo || null,
      themeColor: client.themeColor || '#0d6efd',
      whatsappAcc: client.whatsappAcc || '',
      instagramAcc: client.instagramAcc || '',
      twitterAcc: client.twitterAcc || '',
      facebookAcc: client.facebookAcc || '',
      isEmailNotify: client.isEmailNotify === 1,
      isSmsNotify: client.isSmsNotify === 1
    };
    
    this.logoPreviewUrl = this.profile.logo;
  }

  /** Toggle edit mode */
  toggleEdit() {
    if (this.editMode) {
      // Cancel edit - reload profile
      this.loadProfile(this.clientId);
      this.selectedLogoFile = null;
      this.logoPreviewUrl = this.profile.logo;
    }
    this.editMode = !this.editMode;
  }

  /** Handle logo file selection */
  onLogoFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'warning',
          title: 'Please select a valid image file (JPG, PNG, GIF, WEBP)',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'warning',
          title: 'File size must be less than 5MB',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        });
        return;
      }

      this.selectedLogoFile = file;

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.logoPreviewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  /** Remove selected logo */
  removeLogo() {
    this.selectedLogoFile = null;
    this.logoPreviewUrl = this.profile.logo;
    // Clear file input
    const fileInput = document.getElementById('logoFileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  /** Upload logo to server */
  async uploadLogo(clientId: string): Promise<string | null> {
    if (!this.selectedLogoFile) {
      return null;
    }

    this.isUploadingLogo = true;

    try {
      const formData = new FormData();
      formData.append('id', clientId);
      formData.append('logo', this.selectedLogoFile);

      const response = await this.apiService.uploadClientLogo(formData).toPromise();
      this.isUploadingLogo = false;
      return response?.data?.logo || null;
    } catch (error) {
      console.error('Logo upload failed', error);
      this.isUploadingLogo = false;
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: 'Failed to upload logo',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });
      return null;
    }
  }

  /** Validate profile data */
  validateProfile(): { valid: boolean; message?: string } {
    if (!this.profile.name?.trim()) {
      return { valid: false, message: 'Company name is required' };
    }
    if (!this.profile.emailAddress?.trim()) {
      return { valid: false, message: 'Email address is required' };
    }
    if (!this.profile.phoneNumber?.trim()) {
      return { valid: false, message: 'Phone number is required' };
    }
    return { valid: true };
  }

  /** Save profile changes */
  async saveChanges() {
    // Validate
    const validation = this.validateProfile();
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

    this.isUpdatingProfile = true;

    // Prepare payload
    const payload = {
      id: this.profile.id,
      name: this.profile.name?.trim(),
      emailAddress: this.profile.emailAddress?.trim(),
      phoneNumber: this.profile.phoneNumber?.trim(),
      physicalAddress: this.profile.physicalAddress?.trim(),
      website: this.profile.website?.trim(),
      tin: this.profile.tin?.trim(),
      industry: this.profile.industry?.trim(),
      whatsappAcc: this.profile.whatsappAcc?.trim(),
      facebookAcc: this.profile.facebookAcc?.trim(),
      twitterAcc: this.profile.twitterAcc?.trim(),
      instagramAcc: this.profile.instagramAcc?.trim(),
      themeColor: this.profile.themeColor,
      isEmailNotify: this.profile.isEmailNotify ? 1 : 0,
      isSmsNotify: this.profile.isSmsNotify ? 1 : 0,
    };

    this.apiService.updateClient(payload).subscribe({
      next: async (response: any) => {
        // Upload logo if file is selected
        if (this.selectedLogoFile && this.profile.id) {
          const logoUrl = await this.uploadLogo(this.profile.id);
          if (logoUrl) {
            this.profile.logo = logoUrl;
          }
        }

        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Profile updated successfully!',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true
        });

        this.isUpdatingProfile = false;
        this.editMode = false;
        this.selectedLogoFile = null;
        
        // Reload profile to get latest data
        this.loadProfile(this.clientId);
      },
      error: (err) => {
        console.error('Failed to update profile', err);
        const errorMessage = err?.error?.message || 'Failed to update profile';
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: errorMessage,
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        });
        this.isUpdatingProfile = false;
      }
    });
  }

  /** Update theme color */
  updateThemeColor(color: string) {
    this.profile.themeColor = color;
    document.documentElement.style.setProperty('--primary-color', color);
    document.documentElement.style.setProperty('--bs-primary', color);
    document.documentElement.style.setProperty('--bs-primary-rgb', this.hexToRgb(color));
  }

  /** Convert hex to RGB */
  hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      const r = parseInt(result[1], 16);
      const g = parseInt(result[2], 16);
      const b = parseInt(result[3], 16);
      return `${r}, ${g}, ${b}`;
    }
    return '13, 110, 253'; // default bootstrap primary
  }

  /** Get initials from company name */
  getInitials(name: string): string {
    if (!name) return '?';
    const words = name.trim().split(' ');
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
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

  /** Format social media link */
  getSocialLink(platform: string): string | null {
    const link = this.profile[`${platform}Acc` as keyof typeof this.profile] as string;
    if (!link) return null;
    
    // If already a full URL, return as is
    if (link.startsWith('http://') || link.startsWith('https://')) {
      return link;
    }
    
    // Otherwise, construct URL based on platform
    switch(platform) {
      case 'whatsapp':
        return `https://wa.me/${link.replace(/[^0-9]/g, '')}`;
      case 'instagram':
        return `https://instagram.com/${link.replace('@', '')}`;
      case 'twitter':
        return `https://twitter.com/${link.replace('@', '')}`;
      case 'facebook':
        return `https://facebook.com/${link}`;
      default:
        return link;
    }
  }
}