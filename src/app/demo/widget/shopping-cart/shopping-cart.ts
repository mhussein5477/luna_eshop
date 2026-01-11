import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router, RouterModule } from '@angular/router'; 
import Swal from 'sweetalert2';
import { CartItem, CartService } from '../../cart-service';

@Component({
  selector: 'app-shopping-cart',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './shopping-cart.html',
  styleUrl: './shopping-cart.scss'
})
export class ShoppingCart implements OnInit {
  @Output() closeModal = new EventEmitter<void>();
  @Input()  clientId : any
  @Input()  clientData : any

  

  
  cartItems: CartItem[] = [];
  
  constructor(
    private cartService: CartService,
    private router: Router
  ) {}
  
  ngOnInit() {
    this.loadCart();
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
  
  increaseQty(item: CartItem) {
    this.cartService.updateQuantity(item.productId, item.quantity + 1);
  }
  
  decreaseQty(item: CartItem) {
    if (item.quantity > 1) {
      this.cartService.updateQuantity(item.productId, item.quantity - 1);
    }
  }
  
  removeItem(item: CartItem) {
    Swal.fire({
      title: 'Remove Item?',
      text: `Remove ${item.name} from cart?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, remove it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.cartService.removeFromCart(item.productId);
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Item removed from cart',
          showConfirmButton: false,
          timer: 2000
        });
      }
    });
  }
  
  close() {
    this.closeModal.emit();
  }
  
  goToCheckout() {
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
    
    this.close();
this.router.navigate(['/checkout'], {
  queryParams: { 
    clientId: this.clientId,
    clientData: JSON.stringify(this.clientData)
  }
});

  }
}