import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms'; 
import { LoaderMaterial } from '../component/loader-material/loader-material';
import { ApiService } from '../api-service';
import { Pagination } from '../widget/pagination/pagination';
import Swal from 'sweetalert2';
import { QRCodeComponent } from 'angularx-qrcode';

declare var bootstrap: any; // for Bootstrap modal programmatic control

@Component({
  selector: 'app-clients',
  templateUrl: './clients.html',
  styleUrls: ['./clients.scss'],
  imports: [CommonModule, FormsModule, LoaderMaterial , Pagination, QRCodeComponent],
})
export class ClientsComponent {
  selectedFilter = 'all';
  isSubmitting = false;
  selectedClient: any = null;
  modalMode: 'add' | 'edit' | 'view' = 'add';
  showPassword = false;
  showConfirmPassword = false;
  confirmPassword = '';
  
  // Logo upload
  selectedLogoFile: File | null = null;
  logoPreviewUrl: string | null = null;
  isUploadingLogo = false;
  
  // User details modal
  userDetails: any = null;
  isLoadingUserDetails = false;

  // QR Code modal
  qrCodeData: string = '';
  qrCodeClient: any = null;
  isGeneratingQR = false;

  searchPayload: {
    pageNo: number;
    pageSize: number;
    sortBy: string;
    sortDir: string;
    name: string;
    emailAddress: string;
    phoneNumber: string;
    clientStatus?: string;
  } = {
    pageNo: 0,
    pageSize: 10,
    sortBy: 'id',
    sortDir: 'DESC',
    name: '',
    emailAddress: '',
    phoneNumber: ''
  };

  filters = { name: '', email: '', phone: '' };
  isLoadingClients = false;
  totalElements = 0;

  newClient: any = {
    name: '', 
    emailAddress: '', 
    phoneNumber: '', 
    physicalAddress: '',
    website: '', 
    tin: '', 
    industry: '', 
    whatsappAcc: '',
    facebookAcc: '', 
    twitterAcc: '', 
    instagramAcc: '',
    themeColor: '#6750A4', 
    isEmailNotify: 0, 
    isSmsNotify: 0,
    logo: null, // Logo URL from backend
    userDetails: {
      id: null,
      firstName: '',
      lastName: '',
      emailAddress: '',
      phoneNumber: '',
      password: ''
    }
  };

  filteredClients: any[] = [];

  constructor(private clientsService: ApiService) {}

  ngOnInit() { this.loadClients(); }

  /** Returns the client object bound to the form depending on modal mode */
  get activeClient() {
    return this.modalMode === 'add' ? this.newClient : this.selectedClient;
  }

  /** Filter clients by status pill */
  filterByStatus(status: 'all' | 'active' | 'inactive' | 'pending') {
    this.selectedFilter = status;
    
    // Update search payload based on selected filter
    switch(status) {
      case 'all':
        // Remove clientStatus property for 'all' filter
        if ('clientStatus' in this.searchPayload) {
          delete this.searchPayload.clientStatus;
        }
        break;
      case 'active':
        this.searchPayload.clientStatus = 'ACTIVE';
        break;
      case 'inactive':
        this.searchPayload.clientStatus = 'DEACTIVATED';
        break;
      case 'pending':
        this.searchPayload.clientStatus = 'PENDING';
        break;
    }
    
    // Reset to first page and reload
    this.searchPayload.pageNo = 0;
    this.loadClients();
  }

  /** Open modal for adding a new client */
  openAddClientModal() {
    this.modalMode = 'add';
    this.selectedClient = null;
    this.confirmPassword = '';
    this.showPassword = false;
    this.showConfirmPassword = false;
    this.selectedLogoFile = null;
    this.logoPreviewUrl = null;
    this.resetForm();
    this.showModal('addClientModal');
  }

  /** Open modal for editing a client */
  editClient(client: any) {
    this.modalMode = 'edit';
    this.selectedClient = { ...client };
    this.selectedLogoFile = null;
    this.logoPreviewUrl = client.clientLogo || null;
    this.showModal('addClientModal');
  }

  /** Open modal for viewing a client */
  viewClient(client: any) {
    this.modalMode = 'view';
    this.selectedClient = { ...client };
    this.logoPreviewUrl = client.clientLogo || null;
    this.showModal('addClientModal');
  }

  /** Open QR Code modal */
  openQRCodeModal(client: any) {
    if (!client.website || client.website.trim() === '') {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'warning',
        title: 'This client does not have a website URL',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });
      return;
    }

    this.qrCodeClient = client;
    this.qrCodeData = client.website;
    this.showModal('qrCodeModal');
  }

  /** Download QR Code as image */
  downloadQRCode() {
    const canvas = document.querySelector('#qrCodeCanvas canvas') as HTMLCanvasElement;
    if (!canvas) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: 'QR Code not found',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true
      });
      return;
    }

    // Convert canvas to blob and download
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const fileName = `${this.qrCodeClient.name.replace(/\s+/g, '_')}_QR_Code.png`;
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'QR Code downloaded successfully',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true
        });
      }
    });
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
    this.logoPreviewUrl = null;
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

      const response = await this.clientsService.uploadClientLogo(formData).toPromise();
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

  /** View user details for a client */
  viewUserDetails(clientId: string) {
    this.userDetails = null;
    this.isLoadingUserDetails = true;
    this.showModal('userDetailsModal');

    const payload = {
      pageNo: 0,
      pageSize: 10,
      sortBy: 'id',
      sortDir: 'DESC',
      clientId: clientId
    };

    this.clientsService.searchUsers(payload).subscribe({
      next: (res: any) => {
        const users = res.data ?? [];
        if (users.length > 0) {
          this.userDetails = users[0]; // Get the first user
        } else {
          this.userDetails = null;
        }
        this.isLoadingUserDetails = false;
      },
      error: (err) => {
        console.error('Failed to load user details', err);
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: 'Failed to load user details',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true
        });
        this.isLoadingUserDetails = false;
        this.userDetails = null;
      }
    });
  }

  /** Show bootstrap modal programmatically */
  private showModal(modalId: string) {
    const modal = new bootstrap.Modal(
      document.getElementById(modalId)!
    );
    modal.show();
  }

  /** Toggle password visibility */
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  /** Toggle confirm password visibility */
  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  /** Validate client form */
  private validateClient(client: any): { valid: boolean; message?: string } {
    // Client validation
    if (!client.name?.trim()) {
      return { valid: false, message: 'Client name is required' };
    }
    if (!client.emailAddress?.trim()) {
      return { valid: false, message: 'Client email is required' };
    }
    if (!client.phoneNumber?.trim()) {
      return { valid: false, message: 'Client phone number is required' };
    }

    // User details validation only for add mode
    if (this.modalMode === 'add') {
      if (!client.userDetails.firstName?.trim()) {
        return { valid: false, message: 'User first name is required' };
      }
      if (!client.userDetails.lastName?.trim()) {
        return { valid: false, message: 'User last name is required' };
      }
      if (!client.userDetails.emailAddress?.trim()) {
        return { valid: false, message: 'User email is required' };
      }
      if (!client.userDetails.phoneNumber?.trim()) {
        return { valid: false, message: 'User phone number is required' };
      }
      if (!client.userDetails.password?.trim()) {
        return { valid: false, message: 'User password is required' };
      }
      // Confirm password validation
      if (client.userDetails.password !== this.confirmPassword) {
        return { valid: false, message: 'Passwords do not match' };
      }
    }

    return { valid: true };
  }

  /** Submit client: add or edit */
  async submitClient() {
    if (this.isSubmitting) return;

    const clientToSend = this.activeClient;

    // Validate form
    const validation = this.validateClient(clientToSend);
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

    this.isSubmitting = true;

    let payload: any = {
      name: clientToSend.name?.trim(),
      emailAddress: clientToSend.emailAddress?.trim(),
      phoneNumber: clientToSend.phoneNumber?.trim(),
      physicalAddress: clientToSend.physicalAddress?.trim(),
      website: clientToSend.website?.trim(),
      tin: clientToSend.tin?.trim(),
      industry: clientToSend.industry?.trim(),
      whatsappAcc: clientToSend.whatsappAcc?.trim(),
      facebookAcc: clientToSend.facebookAcc?.trim(),
      twitterAcc: clientToSend.twitterAcc?.trim(),
      instagramAcc: clientToSend.instagramAcc?.trim(),
      themeColor: clientToSend.themeColor,
      isEmailNotify: clientToSend.isEmailNotify ? 1 : 0,
      isSmsNotify: clientToSend.isSmsNotify ? 1 : 0,
    };

    // Add user details only for add mode
    if (this.modalMode === 'add') {
      payload.userDetails = {
        id: null,
        firstName: clientToSend.userDetails.firstName?.trim(),
        lastName: clientToSend.userDetails.lastName?.trim(),
        emailAddress: clientToSend.userDetails.emailAddress?.trim(),
        phoneNumber: clientToSend.userDetails.phoneNumber?.trim(),
        password: clientToSend.userDetails.password?.trim()
      };
    } else if (this.modalMode === 'edit') {
      // For edit mode, include the client ID
      payload.id = clientToSend.id;
    }

    const request$ = this.modalMode === 'edit'
      ? this.clientsService.updateClient(payload)
      : this.clientsService.createClient(payload);

    request$.subscribe({
      next: async (response: any) => {
        const clientId = response?.data?.id || clientToSend.id;

        // Upload logo if file is selected
        if (this.selectedLogoFile && clientId) {
          await this.uploadLogo(clientId);
        }

        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: this.modalMode === 'edit' ? 'Client updated successfully' : 'Client added successfully',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true
        });

        this.isSubmitting = false;
        this.modalMode = 'add';
        this.selectedClient = null;
        this.confirmPassword = '';
        this.showPassword = false;
        this.showConfirmPassword = false;
        this.selectedLogoFile = null;
        this.logoPreviewUrl = null;
        this.resetForm();
        this.closeModal('addClientModal');
        this.loadClients();
      },
      error: (err) => {
        console.error('Save client failed', err);
        const errorMessage = err?.error?.message || 'Failed to save client';
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: errorMessage,
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        });
        this.isSubmitting = false;
      }
    });
  }

  /** Load clients from backend */
  loadClients() {
    this.isLoadingClients = true;

    this.clientsService.searchClients(this.searchPayload).subscribe({
      next: (res: any) => {
        const data = res.data ?? [];
        this.totalElements = res.pageDetail?.totalElements ?? data.length;

        this.filteredClients = data.map(c => ({
          id: c.id,
          name: c.name,
          email: c.emailAddress,
          phone: c.phoneNumber,
          location: c.physicalAddress,
          url: c.website,
          logo: c.logo, // Logo URL from backend
          active: c.clientStatus === 'ACTIVE',
          createdAt: c.createdAt || new Date().toISOString().split('T')[0],
          payments: c.payments || [],
          ...c
        }));
      },
      error: (err) => console.error(err),
      complete: () => this.isLoadingClients = false
    });
  }

  /** Get initials from client name */
  getClientInitials(name: string): string {
    if (!name) return '?';
    const words = name.trim().split(' ');
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }

  /** Reset add/edit form */
  resetForm() {
    this.newClient = {
      name: '', 
      emailAddress: '', 
      phoneNumber: '', 
      physicalAddress: '',
      website: '', 
      tin: '', 
      industry: '', 
      whatsappAcc: '',
      facebookAcc: '', 
      twitterAcc: '', 
      instagramAcc: '',
      themeColor: '#6750A4', 
      isEmailNotify: 0, 
      isSmsNotify: 0,
      logo: null,
      userDetails: {
        id: null,
        firstName: '',
        lastName: '',
        emailAddress: '',
        phoneNumber: '',
        password: ''
      }
    };
  }

  /** Close modal */
  closeModal(modalId: string) {
    const modalEl = document.getElementById(modalId);
    if (modalEl) {
      const modalInstance = bootstrap.Modal.getInstance(modalEl);
      if (modalInstance) {
        modalInstance.hide();
      }
    }
  }

  /** Pagination */
  onPageChange(event: { page: number; pageSize: number }) {
    this.searchPayload.pageNo = event.page - 1;
    this.searchPayload.pageSize = event.pageSize;
    this.loadClients();
  }

  /** Filters */
  applyFilters() {
    this.searchPayload.name = this.filters.name?.trim() || '';
    this.searchPayload.emailAddress = this.filters.email?.trim() || '';
    this.searchPayload.phoneNumber = this.filters.phone?.trim() || '';
    this.searchPayload.pageNo = 0;
    this.loadClients();
  }

  /** Change status */
  changeStatus(client: any, status: 'PENDING' | 'ACTIVE' | 'DEACTIVATED' | 'SUSPENDE') {
    this.isLoadingClients = true;

    this.clientsService.changeStatus(client.id, status).subscribe({
      next: () => {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: `Client "${client.name}" is now ${status}`,
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true
        });
        this.loadClients();
      },
      error: (err) => {
        console.error(err);
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: 'Failed to update status',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true
        });
        this.isLoadingClients = false;
      }
    });
  }
}