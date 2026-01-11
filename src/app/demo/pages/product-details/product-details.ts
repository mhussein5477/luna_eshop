import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TopBarHome } from '../../widget/top-bar-home/top-bar-home'; 
import { ApiService } from '../../api-service';
import Swal from 'sweetalert2';
import { CartService } from '../../cart-service';
import { LoaderMaterial } from '../../component/loader-material/loader-material';

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
  weight?: string;
  quantity?: string;
  quantityAvailable?: number;
  size?: string;
  isInStock?: boolean;
  isFeatured?: boolean;
}

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TopBarHome, LoaderMaterial],
  templateUrl: './product-details.html',
  styleUrl: './product-details.scss'
})
export class ProductDetails implements OnInit {
  product: Product | null = null;
  quantity: number = 1;
  
  // Client data
  clientCode = '';
  clientId = '';
  clientData: any = null;
  loadingClient = false;
  
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private cartService: CartService,
    private apiService: ApiService
  ) {
    // Get product from navigation state
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      this.product = navigation.extras.state['product'];
    }
  }
  
  ngOnInit(): void {
    // Get client code from query params
    this.route.queryParams.subscribe(queryParams => {
      this.clientCode = queryParams['clientCode'] || '';
      if (this.clientCode) {
        this.fetchClientDetails();
      }
    });
    
    // If no product in state, try to get from route params and fetch from API
    if (!this.product) {
      this.route.params.subscribe(params => {
        const productId = params['productId'];
        if (productId) {
          this.fetchProductDetails(productId);
        } else {
          // No product ID and no state, redirect to product list
          this.redirectToProductList();
        }
      });
    }
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
      clientCode: this.clientCode,
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
        }
        
        this.loadingClient = false;
      },
      error: (err) => {
        console.error('Error fetching client details', err);
        this.loadingClient = false;
      }
    });
  }
  
  /**
   * Fetch product details from API if not in state
   */
  fetchProductDetails(productId: string): void {
    this.apiService.getProductById(productId).subscribe({
      next: (response: any) => {
        const p = response.data || response;
        
        this.product = {
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.unitPrice,
          originalPrice: p.unitPrice * (1 + (p.discountAmount / 100)),
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
        };
      },
      error: (err) => {
        console.error('Error fetching product', err);
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: 'Failed to load product details',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        });
        this.redirectToProductList();
      }
    });
  }
  
  /**
   * Redirect to product list with client code
   */
redirectToProductList(): void {
  this.router.navigate(['/product-list'], {
    queryParams: this.clientCode ? { clientCode: this.clientCode } : {}
  });
}

  
  increaseQty() {
    if (this.product && this.quantity < (this.product.quantityAvailable || 999)) {
      this.quantity++;
    }
  }
  
  decreaseQty() {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }
  
  addToCart() {
    if (!this.product) return;
    
    this.cartService.addToCart({
      productId: this.product.id,
      name: this.product.name,
      description: this.product.description,
      price: this.product.price,
      currencyCode: this.product.currencyCode,
      quantity: this.quantity,
      image: this.product.image,
      unitOfMeasure: this.product.weight || '',
      maxQuantity: this.product.quantityAvailable || 999
    });
    
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: `Added ${this.quantity} ${this.product.name} to cart`,
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true
    });
    
    // Reset quantity
    this.quantity = 1;
  }
  
  addToCartAndCheckout() {
    this.addToCart();
    setTimeout(() => {
      // Pass client code to checkout
      this.router.navigate(['/checkout'], {
        queryParams: { clientId: this.clientId , clientData : JSON.stringify(this.clientData)}
      });
    }, 500);
  }
  
  getStars(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i < Math.floor(rating) ? 1 : 0);
  }
}