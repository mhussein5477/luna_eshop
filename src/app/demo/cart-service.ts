import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface CartItem {
  productId: string;
  name: string;
  description: string;
  price: number;
  currencyCode: string;
  quantity: number;
  image: string;
  unitOfMeasure: string;
  maxQuantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems = new BehaviorSubject<CartItem[]>([]);
  public cartItems$ = this.cartItems.asObservable();

  constructor() {
    // Load cart from localStorage on init
    this.loadCartFromStorage();
  }

  private loadCartFromStorage() {
    const savedCart = localStorage.getItem('shopping_cart');
    if (savedCart) {
      try {
        const items = JSON.parse(savedCart);
        this.cartItems.next(items);
      } catch (e) {
        console.error('Failed to load cart from storage', e);
      }
    }
  }

  private saveCartToStorage() {
    localStorage.setItem('shopping_cart', JSON.stringify(this.cartItems.value));
  }

  getCartItems(): CartItem[] {
    return this.cartItems.value;
  }

  getCartCount(): number {
    return this.cartItems.value.reduce((total, item) => total + item.quantity, 0);
  }

  getCartTotal(): number {
    return this.cartItems.value.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  addToCart(product: CartItem) {
    const currentItems = this.cartItems.value;
    const existingItem = currentItems.find(item => item.productId === product.productId);

    if (existingItem) {
      // Update quantity if product already in cart
      const newQuantity = existingItem.quantity + product.quantity;
      if (newQuantity <= existingItem.maxQuantity) {
        existingItem.quantity = newQuantity;
      } else {
        existingItem.quantity = existingItem.maxQuantity;
      }
    } else {
      // Add new product to cart
      currentItems.push(product);
    }

    this.cartItems.next([...currentItems]);
    this.saveCartToStorage();
  }

  updateQuantity(productId: string, quantity: number) {
    const currentItems = this.cartItems.value;
    const item = currentItems.find(i => i.productId === productId);
    
    if (item) {
      if (quantity > 0 && quantity <= item.maxQuantity) {
        item.quantity = quantity;
        this.cartItems.next([...currentItems]);
        this.saveCartToStorage();
      }
    }
  }

  removeFromCart(productId: string) {
    const currentItems = this.cartItems.value.filter(item => item.productId !== productId);
    this.cartItems.next(currentItems);
    this.saveCartToStorage();
  }

  clearCart() {
    this.cartItems.next([]);
    localStorage.removeItem('shopping_cart');
  }
}