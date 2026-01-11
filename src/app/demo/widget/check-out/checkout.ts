import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TopBarHome } from '../../widget/top-bar-home/top-bar-home'; 
import { ApiService } from '../../api-service';
import { LoaderMaterial } from '../../component/loader-material/loader-material';
import Swal from 'sweetalert2';
import { CartItem, CartService } from '../../cart-service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TopBarHome, LoaderMaterial],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss'
})
export class CheckoutComponent implements OnInit {
  cartItems: CartItem[] = [];
  isSubmitting = false;
    clientId = '';
  clientCode = '';

  clientData: any = null;
  
  customerInfo = {
    name: '',
    email: '',
    phone: '',
    address: ''
  };
  loadingClient: boolean;
  
  constructor(
    private cartService: CartService,
    private apiService: ApiService,
    private router: Router, 
    private route: ActivatedRoute,
  ) {}
  
  ngOnInit() {
    this.loadCart();
    
  // Read client ID from query params
  this.route.queryParams.subscribe(params => {
    this.clientId = params['clientId'] || '';
  });

this.route.queryParams.subscribe(params => {
  this.clientId = params['clientId'] || '';
  this.clientData = params['clientData'] ? JSON.parse(params['clientData']) : null;
});




    // Redirect if cart is empty
    if (this.cartItems.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Cart is Empty',
        text: 'Please add items to your cart before checking out',
        confirmButtonText: 'Go to Products'
      }).then(() => {
        this.router.navigate(['/product-list']);
      });
    }
  }
  
    

  
  loadCart() {
    this.cartService.cartItems$.subscribe(items => {
      this.cartItems = items;
    });
  }
  
  get cartTotal(): number {
    return this.cartService.getCartTotal();
  }
  
  get cartCount(): number {
    return this.cartService.getCartCount();
  }
  
  removeItem(item: CartItem) {
    this.cartService.removeFromCart(item.productId);
  }
  
  updateQuantity(item: CartItem, quantity: number) {
    if (quantity > 0 && quantity <= item.maxQuantity) {
      this.cartService.updateQuantity(item.productId, quantity);
    }
  }
  
  validateForm(): boolean {
    if (!this.customerInfo.name?.trim()) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'warning',
        title: 'Please enter your name',
        showConfirmButton: false,
        timer: 2000
      });
      return false;
    }
    
    if (!this.customerInfo.email?.trim()) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'warning',
        title: 'Please enter your email',
        showConfirmButton: false,
        timer: 2000
      });
      return false;
    }
    
    if (!this.customerInfo.phone?.trim()) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'warning',
        title: 'Please enter your phone number',
        showConfirmButton: false,
        timer: 2000
      });
      return false;
    }
    
    if (!this.customerInfo.address?.trim()) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'warning',
        title: 'Please enter your address',
        showConfirmButton: false,
        timer: 2000
      });
      return false;
    }
    
    return true;
  }
  
  placeOrder() {
    if (this.isSubmitting) return;
    
    if (!this.validateForm()) return;
    
    if (this.cartItems.length === 0) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'warning',
        title: 'Your cart is empty',
        showConfirmButton: false,
        timer: 2000
      });
      return;
    }
    
    this.isSubmitting = true;
    
    const orderPayload = {
      products: this.cartItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      })),
      customerEmail: this.customerInfo.email.trim(),
      customerName: this.customerInfo.name.trim(),
      customerPhone: this.customerInfo.phone.trim(),
      customerAddress: this.customerInfo.address.trim()
    };
    
    this.apiService.createOrder(orderPayload).subscribe({
      next: (response) => {
        Swal.fire({
          icon: 'success',
          title: 'Order Placed Successfully!',
          text: 'Your order has been received and is being processed.',
          confirmButtonText: 'Proceed to Whatsapp'
        }).then(() => {
              this.sendOrderToWhatsApp(response.data);
          // Clear cart
          this.cartService.clearCart();
          
          // Reset form
          this.customerInfo = {
            name: '',
            email: '',
            phone: '',
            address: ''
          };
          
          // Navigate to product list or orders page
          this.router.navigate(['/product-list'], {
  queryParams: { clientCode: this.clientData.clientCode }
});

        });
        
        this.isSubmitting = false;
      },
      error: (err) => {
        console.error('Order failed', err);
        Swal.fire({
          icon: 'error',
          title: 'Order Failed',
          text: err?.error?.message || 'Failed to place order. Please try again.',
          confirmButtonText: 'OK'
        });
        this.isSubmitting = false;
      }
    });
  }

  private sendOrderToWhatsApp(orderResponse: any) {
  const phone = '254795659576'; // WhatsApp number (NO + sign)
  const message = this.buildWhatsAppMessage(orderResponse);
  const encodedMessage = encodeURIComponent(message);

  const whatsappUrl = this.clientData?.whatsappAcc +  `?text=${encodedMessage}`;
  window.open(whatsappUrl, '_blank');
}



  private buildWhatsAppMessage(orderResponse: any): string {
  const date = new Date().toLocaleString('en-KE', {
    dateStyle: 'full',
    timeStyle: 'short'
  });

  const itemsText = this.cartItems
    .map((item, index) => {
      const total = item.quantity * item.price;
      return (
        `${index + 1}. ${item.name}\n` +
        `   Qty: ${item.quantity} × KES ${item.price.toFixed(2)} = KES ${total.toFixed(2)}`
      );
    })
    .join('\n\n');

  return `
🛒 *NEW ORDER RECEIVED*

━━━━━━━━━━━━━━━━━━━━━
📋 *ORDER DETAILS*
━━━━━━━━━━━━━━━━━━━━━
Order Number: ${orderResponse?.orderNumber || 'N/A'}
Date & Time: ${date}

━━━━━━━━━━━━━━━━━━━━━
👤 *CUSTOMER INFORMATION*
━━━━━━━━━━━━━━━━━━━━━
Name: ${this.customerInfo.name}
Phone: ${this.customerInfo.phone}
Email: ${this.customerInfo.email}
Delivery Address: ${this.customerInfo.address}

━━━━━━━━━━━━━━━━━━━━━
📦 *ORDER ITEMS (${this.cartItems.length})*
━━━━━━━━━━━━━━━━━━━━━
${itemsText}

━━━━━━━━━━━━━━━━━━━━━
💰 *PAYMENT SUMMARY*
━━━━━━━━━━━━━━━━━━━━━
Total Amount: KES ${this.cartTotal.toFixed(2)}

━━━━━━━━━━━━━━━━━━━━━
🚚 Status: Pending Confirmation

Powered by Luna Packaging Ltd.
`.trim();
}

}