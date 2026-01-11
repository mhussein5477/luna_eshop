import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WelcomeModal } from './welcome-modal/welcome-modal';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TopBarHome } from '../../widget/top-bar-home/top-bar-home'; 
import { HttpClientModule } from '@angular/common/http';
import { ApiService } from '../../api-service';
import { LoaderMaterial } from '../../component/loader-material/loader-material';
import Swal from 'sweetalert2';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  discount: number;
  rating: number;
  reviews: number;
  image: string;
  currencyCode: string;
  weight?: string; // unitOfMeasure
  quantity?: string; // quantityAvailable
  size?: string; // not in API
  isInStock?: boolean; // isInStock: 1/0
  isFeatured?: boolean; // isFeatured: 1/0
  quantityAvailable?: number;
}

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule, WelcomeModal, RouterModule, TopBarHome, HttpClientModule, LoaderMaterial],
  templateUrl: './product-list.html',
  styleUrls: ['./product-list.scss']
})
export class ProductListComponent implements OnInit {
  showModal = true;
  searchName = '';
  selectedSize = '';
  minPrice = '';
  maxPrice = '';

  sizeOptions = ['Small', 'Medium', 'Large'];

  filteredProducts: Product[] = [];
  currentPage = 0;
  totalPages = 1;
  pageSize = 10;
  loading = false;
  loadingClient = false;
  selectedFeatureFilter = ''; // 'featured' | 'discount'

  // Client data
  clientCode = '';
  clientId = '';
  clientData: any = null;

  isMobileFiltersOpen = false;

  constructor(
    private apiService: ApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    setTimeout(() => this.showModal = false, 4000);
    
    // Get client code from route params or query params
    this.route.params.subscribe(params => {
      this.clientCode = params['clientCode'] || '';
      if (this.clientCode) {
        this.fetchClientDetails();
      } else {
        // Try to get from query params
        this.route.queryParams.subscribe(queryParams => {
          this.clientCode = queryParams['clientCode'] || queryParams['code'] || '';
          if (this.clientCode) {
            this.fetchClientDetails();
          } else {
            this.showError('Client code not found in URL');
          }
        });
      }
    });
  }

  /**
   * Fetch client details using client code
   */
  fetchClientDetails(): void {
    this.loadingClient = true;

    const payload = {
      pageNo: 0,
      pageSize: 1,
      sortBy: 'id',
      sortDir: 'DESC',
      clientCode: this.clientCode, // Search by client code
      name: '',
      emailAddress: '',
      phoneNumber: ''
    };

    this.apiService.searchClients(payload).subscribe({
      next: (response: any) => {
        const clients = response.data || [];
        
        if (clients.length > 0) {
          this.clientData = clients[0];
          this.clientId = this.clientData.id;
          
          console.log('Client found:', this.clientData);
          
          // Now fetch products for this client
          this.fetchProducts();
        } else {
          this.showError('Client not found with code: ' + this.clientCode);
        }
        
        this.loadingClient = false;
      },
      error: (err) => {
        console.error('Error fetching client details', err);
        this.showError('Failed to load client details');
        this.loadingClient = false;
      }
    });
  }

  /**
   * Fetch products for the client
   */
  fetchProducts(): void {
    if (!this.clientId) {
      console.warn('Client ID not available yet');
      return;
    }

    this.loading = true;

    const payload: any = {
      clientId: this.clientId, // Filter by client ID
      name: this.searchName || undefined,
      minPrice: this.minPrice ? parseFloat(this.minPrice) : undefined,
      maxPrice: this.maxPrice ? parseFloat(this.maxPrice) : undefined,
      isFeatured: this.selectedFeatureFilter === 'featured' ? 1 : undefined,
      discountMin: this.selectedFeatureFilter === 'discount' ? 1 : undefined,
      pageNo: this.currentPage,
      pageSize: this.pageSize,
      status : "ACTIVE"
    };

    this.apiService.searchProducts(payload).subscribe({
      next: (res: any) => {
        if (res.data) {
          this.filteredProducts = res.data.map((p: any) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: p.unitPrice,
            originalPrice: p.unitPrice * (1 + (p.discountAmount / 100)), // Calculate original price
            discount: p.discountAmount,
            rating: p.averageRating || 0,
            reviews: p.reviewCount || 0,
            image: p.imageUrl || (p.imageUrls?.length ? p.imageUrls[0] : 'assets/images/product.png'),
            currencyCode: p.currencyCode,
            weight: p.unitOfMeasure,
            quantity: p.quantityAvailable?.toString(),
            quantityAvailable: p.quantityAvailable,
            size: undefined,
            isInStock: p.isInStock === 1,
            isFeatured: p.isFeatured === 1
          }));
          this.totalPages = res.pageDetail?.totalPages || 1;
        } else {
          this.filteredProducts = [];
          this.totalPages = 1;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching products', err);
        this.showError('Failed to load products');
        this.loading = false;
      }
    });
  }

  toggleFilters() {
    this.isMobileFiltersOpen = !this.isMobileFiltersOpen;
  }

  closeFilters() {
    this.isMobileFiltersOpen = false;
  }

  viewProduct(product: Product) {
    // Navigate to product details with product data as state
    this.router.navigate(['/product-details'], {
      state: { product },
      queryParams: { clientCode: this.clientCode } // Pass client code to product details
    });
  }

  applyFilters(): void {
    this.currentPage = 0;
    this.fetchProducts();
  }

  clearFilters(): void {
    this.searchName = '';
    this.selectedSize = '';
    this.minPrice = '';
    this.maxPrice = '';
    this.selectedFeatureFilter = '';
    this.currentPage = 0;
    this.fetchProducts();
  }

  getStars(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i < Math.floor(rating) ? 1 : 0);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page - 1;
      this.fetchProducts();
    }
  }

  /**
   * Show error message
   */
  private showError(message: string) {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      title: message,
      showConfirmButton: false,
      timer: 4000,
      timerProgressBar: true
    });
  }
}