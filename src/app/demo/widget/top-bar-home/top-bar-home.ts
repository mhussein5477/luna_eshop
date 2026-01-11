import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ShoppingCart } from '../shopping-cart/shopping-cart'; 
import { CartService } from '../../cart-service';
import { ApiService } from '../../api-service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-top-bar-home',
  standalone: true,
  imports: [RouterModule, CommonModule, ShoppingCart],
  templateUrl: './top-bar-home.html',
  styleUrl: './top-bar-home.scss'
})
export class TopBarHome implements OnInit {
  
  showModal = false;
  cartCount = 0;
  isDownloading = false;
  
  @Input() clientId: any;
  @Input() clientData: any; // Optional: to display client logo, name, etc.

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

  constructor(
    private cartService: CartService, 
    private apiService: ApiService
  ) {}

  ngOnInit() {
    // Subscribe to cart changes
    this.cartService.cartItems$.subscribe(() => {
      this.cartCount = this.cartService.getCartCount();
    });
    console.log("this.clientData");
    console.log(this.clientData);
  }

  openModal() {
    this.showModal = true;
  }

  /**
   * Download product catalog for the client
   * FIXED: Now properly handles PDF blob response
   */
  download() {
    if (!this.clientId && !this.clientData?.id) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'warning',
        title: 'Client information not available',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });
      return;
    }

    this.isDownloading = true;

    // Use clientData.id or fallback to clientId
    const idToUse = this.clientData?.id || this.clientId;

    this.apiService.downloadCatalogue(idToUse).subscribe({
      next: (blob: Blob) => {
        // ⭐ KEY FIX: Response is already a Blob from the API
        // Create download URL
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // Generate filename with client name and timestamp
        const clientName = this.clientData?.name || 'Client';
        const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        link.download = `${clientName}_Product_Catalog_${timestamp}.pdf`;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Catalog downloaded successfully!',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        });

        this.isDownloading = false;
      },
      error: (err) => {
        console.error('Download failed:', err);
        
        let errorMessage = 'Failed to download catalog';
        
        // Handle specific error cases
        if (err.status === 0) {
          errorMessage = 'Network error - please check your connection';
        } else if (err.status === 404) {
          errorMessage = 'Catalog not found';
        } else if (err.status === 401 || err.status === 403) {
          errorMessage = 'Unauthorized - please log in again';
        } else if (err.status >= 500) {
          errorMessage = 'Server error - please try again later';
        }
        
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: errorMessage,
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        });

        this.isDownloading = false;
      }
    });
  }

  /**
   * Alternative: Open PDF in new tab instead of downloading
   */
  downloadAndOpen() {
    if (!this.clientId && !this.clientData?.id) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'warning',
        title: 'Client information not available',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });
      return;
    }

    this.isDownloading = true;
    const idToUse = this.clientData?.id || this.clientId;

    this.apiService.downloadCatalogue(idToUse).subscribe({
      next: (blob: Blob) => {
        // Create URL and open in new tab
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        
        // Note: URL will be revoked after some time to free memory
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 60000); // 1 minute

        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Catalog opened in new tab!',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        });

        this.isDownloading = false;
      },
      error: (err) => {
        console.error('Failed to open catalog:', err);
        
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: 'Failed to open catalog',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        });

        this.isDownloading = false;
      }
    });
  }

  /**
   * Get client logo URL or default
   */
  getClientLogo(): string {
    return this.clientData?.clientLogo || 'assets/images/image.png';
  }

  /**
   * Get client name or default
   */
  getClientName(): string {
    return this.clientData?.name || 'Client Portal';
  }
}