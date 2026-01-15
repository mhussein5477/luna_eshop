import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api-service';
import { LoaderMaterial } from '../component/loader-material/loader-material';
import { Pagination } from '../widget/pagination/pagination';
import Swal from 'sweetalert2';
import { Subject, forkJoin } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AuthSessionService } from '../auth-session';

declare var bootstrap: any;

interface OrderItem {
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice?: number;
}

interface Order {
  id?: string;
  orderNo?: string;
  products: OrderItem[];
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  status?: string;
  createdDate?: string;
  totalAmount?: number;
}

interface Product {
  id: string;
  name: string;
  unitPrice: number;
  currencyCode: string;
  quantityAvailable: number;
  isInStock: number;
}

@Component({
  selector: 'app-orders',
  templateUrl: './orders.html',
  imports: [CommonModule, FormsModule, LoaderMaterial, Pagination],
  styleUrl: './orders.scss'
})
export class Orders implements OnDestroy {

  selectedFilter: string = 'all';
  isLoadingOrders = false;
  isSubmitting = false;
  modalMode: 'add' | 'edit' | 'view' = 'add';
  selectedOrder: any = null;
  isDevMode = false;

  // Search debouncers
  private orderNoSubject = new Subject<string>();
  private customerNameSubject = new Subject<string>();
  private customerPhoneSubject = new Subject<string>();

  // Products for dropdown
  availableProducts: Product[] = [];
  isLoadingProducts = false;

  orders: any[] = [];
  totalElements = 0;

  searchPayload = {
    pageNo: 0,
    pageSize: 10,
    sortBy: 'id',
    sortDir: 'DESC',
    orderNo: '',
    customerName: '',
    customerPhone: '',
    createdDate: '',
    clientId: ''
  };

  filters = {
    orderNo: '',
    customerName: '',
    customerPhone: '',
    createdDate: ''
  };

  newOrder: Order = {
    products: [],
    customerEmail: '',
    customerName: '',
    customerPhone: '',
    customerAddress: ''
  };

  // Temporary product selection
  tempProductId = '';
  tempQuantity = 1;

  timelineSteps = [
    'Pending',
    'Confirmed',
    'Paid',
    'Shipped',
    'Delivered'
  ];

  constructor(
    private apiService: ApiService,
    private authSession: AuthSessionService
  ) {
    // Setup debounced searches
    this.orderNoSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(term => {
      this.searchPayload.orderNo = term.trim();
      this.searchPayload.pageNo = 0;
      this.loadOrders();
    });

    this.customerNameSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(term => {
      this.searchPayload.customerName = term.trim();
      this.searchPayload.pageNo = 0;
      this.loadOrders();
    });

    this.customerPhoneSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(term => {
      this.searchPayload.customerPhone = term.trim();
      this.searchPayload.pageNo = 0;
      this.loadOrders();
    });
  }

  ngOnInit() {
    this.attachClientIdToSearch();
    this.loadOrders();
    this.loadProducts();
    this.checkDevMode();
  }

  private attachClientIdToSearch() {
    const clientId = this.authSession.clientId;

    if (!clientId) {
      console.error('Client ID missing from token');
      return;
    }

    this.searchPayload.clientId = clientId;
  }

  ngOnDestroy() {
    this.orderNoSubject.complete();
    this.customerNameSubject.complete();
    this.customerPhoneSubject.complete();
  }

  get activeOrder() {
    return this.modalMode === 'add' ? this.newOrder : this.selectedOrder;
  }

  get filteredOrders() {
    if (this.selectedFilter === 'all') return this.orders;

    return this.orders.filter(o =>
      o.status?.toLowerCase() === this.selectedFilter
    );
  }

  get orderTotal(): number {
    return this.activeOrder.products.reduce((sum: number, item: OrderItem) => {
      return sum + ((item.unitPrice || 0) * item.quantity);
    }, 0);
  }

  /**
   * Calculate order total from items (in case backend doesn't return it)
   */
  getOrderTotal(order: any): number {
    if (!order.items || order.items.length === 0) {
      return order.totalAmount || 0;
    }
    
    return order.items.reduce((sum: number, item: any) => {
      const unitPrice = item.unitPrice || 0;
      const qty = item.qty || item.quantity || 0;
      return sum + (unitPrice * qty);
    }, 0);
  }

  // Search handlers
  onOrderNoChange(term: string) {
    this.filters.orderNo = term;
    this.orderNoSubject.next(term);
  }

  onCustomerNameChange(term: string) {
    this.filters.customerName = term;
    this.customerNameSubject.next(term);
  }

  onCustomerPhoneChange(term: string) {
    this.filters.customerPhone = term;
    this.customerPhoneSubject.next(term);
  }

  onDateChange(date: string) {
    this.filters.createdDate = date;
    this.searchPayload.createdDate = date;
    this.searchPayload.pageNo = 0;
    this.loadOrders();
  }

  setFilter(filter: string) {
    this.selectedFilter = filter;
  }

  checkDevMode() {
    this.isDevMode = this.authSession.role === 'ROLE_ADMIN';
  }

  // Load orders with their items
  loadOrders() {
    this.isLoadingOrders = true;

    this.apiService.searchOrders(this.searchPayload).subscribe({
      next: (res: any) => {
        const data = res.data ?? [];
        this.totalElements = res.pageDetail?.totalElements ?? data.length;

        // If there are orders, fetch items for each order
        if (data.length > 0) {
          this.loadOrdersWithItems(data);
        } else {
          this.orders = [];
          this.isLoadingOrders = false;
        }
      },
      error: (err) => {
        console.error('Failed to load orders', err);
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: 'Failed to load orders',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true
        });
        this.isLoadingOrders = false;
      }
    });
  }

  // Load orders with their items using the orderItem/search endpoint
  private loadOrdersWithItems(orders: any[]) {
    // Create array of observables to fetch items for each order
    const itemRequests = orders.map(order => 
      this.apiService.searchOrderItems({
        pageNo: 0,
        pageSize: 100,
        sortBy: 'id',
        sortDir: 'ASC',
        orderId: order.id
      })
    );

    // Execute all requests in parallel
    forkJoin(itemRequests).subscribe({
      next: (responses: any[]) => {
        // Map orders with their items
        this.orders = orders.map((order: any, index: number) => {
          const itemsData = responses[index]?.data ?? [];
          
          const items = itemsData.map((item: any) => ({
            productId: item.productId,
            productName: item.product?.name || item.name || 'Unknown Product',
            qty: item.quantity || item.qty || 0,
            unitPrice: item.unitPrice || item.price || 0
          }));

          // ✅ Calculate total from items
          const calculatedTotal = items.reduce((sum: number, item: any) => {
            return sum + (item.unitPrice * item.qty);
          }, 0);
          
          return {
            id: order.id,
            orderNo: order.orderNumber,
            items: items,
            totalAmount: calculatedTotal || order.totalAmount || 0, // ✅ Use calculated total first
            currencyCode: order.currencyCode || 'KES',
            createdDate: order.orderedAt || order.createdAt,
            status: order.orderStatus || 'PENDING',
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            customerEmail: order.customerEmail,
            customerAddress: order.customerAddress,
            client: {
              name: order.customerName,
              phone: order.customerPhone,
              location: order.customerAddress
            },
            stepsCompleted: this.getStepsCompleted(order.orderStatus)
          };
        });
        
        this.isLoadingOrders = false;
      },
      error: (err) => {
        console.error('Failed to load order items', err);
        // Fallback: show orders without items
        this.orders = orders.map((order: any) => ({
          id: order.id,
          orderNo: order.orderNumber,
          items: [],
          totalAmount: order.totalAmount || 0,
          currencyCode: order.currencyCode || 'KES',
          createdDate: order.orderedAt || order.createdAt,
          status: order.orderStatus || 'PENDING',
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          customerEmail: order.customerEmail,
          customerAddress: order.customerAddress,
          client: {
            name: order.customerName,
            phone: order.customerPhone,
            location: order.customerAddress
          },
          stepsCompleted: this.getStepsCompleted(order.orderStatus)
        }));
        
        this.isLoadingOrders = false;
      }
    });
  }

  // Load products for the dropdown
  loadProducts() {
    this.isLoadingProducts = true;

    const payload = {
      pageNo: 0,
      pageSize: 100,
      sortBy: 'name',
      sortDir: 'ASC',
      name: '',
      clientId: this.authSession.clientId || ''
    };

    this.apiService.searchProducts(payload).subscribe({
      next: (res: any) => {
        this.availableProducts = (res.data ?? []).filter((p: Product) => p.isInStock === 1);
      },
      error: (err) => console.error('Failed to load products', err),
      complete: () => this.isLoadingProducts = false
    });
  }

  // Add product to order
  addProductToOrder() {
    if (!this.tempProductId) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'warning',
        title: 'Please select a product',
        showConfirmButton: false,
        timer: 2000
      });
      return;
    }

    if (this.tempQuantity <= 0) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'warning',
        title: 'Quantity must be greater than 0',
        showConfirmButton: false,
        timer: 2000
      });
      return;
    }

    // Check if product already exists
    const existingIndex = this.activeOrder.products.findIndex(
      (p: OrderItem) => p.productId === this.tempProductId
    );

    const product = this.availableProducts.find(p => p.id === this.tempProductId);

    if (existingIndex >= 0) {
      // Update quantity
      this.activeOrder.products[existingIndex].quantity += this.tempQuantity;
    } else {
      // Add new product
      this.activeOrder.products.push({
        productId: this.tempProductId,
        productName: product?.name || '',
        quantity: this.tempQuantity,
        unitPrice: product?.unitPrice || 0
      });
    }

    // Reset temp fields
    this.tempProductId = '';
    this.tempQuantity = 1;
  }

  // Remove product from order
  removeProductFromOrder(index: number) {
    this.activeOrder.products.splice(index, 1);
  }

  // Update quantity
  updateQuantity(index: number, quantity: number) {
    if (quantity <= 0) {
      this.removeProductFromOrder(index);
    } else {
      this.activeOrder.products[index].quantity = quantity;
    }
  }

  // Open add order modal
  openAddOrderModal() {
    this.modalMode = 'add';
    this.selectedOrder = null;
    this.resetForm();
    this.showModal('orderModal');
  }

  // View order
  viewOrder(order: any) {
    this.modalMode = 'view';
    this.selectedOrder = { ...order };
    
    // Map items to products format
    if (order.items) {
      this.selectedOrder.products = order.items.map((item: any) => ({
        productId: item.productId || '',
        productName: item.productName || '',
        quantity: item.qty || 0,
        unitPrice: item.unitPrice || 0
      }));
    }
    
    this.showModal('orderModal');
  }

  // Edit order
  editOrder(order: any) {
    this.modalMode = 'edit';
    this.selectedOrder = { ...order };
    
    // Map items to products format
    if (order.items) {
      this.selectedOrder.products = order.items.map((item: any) => ({
        productId: item.productId || '',
        productName: item.productName || '',
        quantity: item.qty || 0,
        unitPrice: item.unitPrice || 0
      }));
    }
    
    this.showModal('orderModal');
  }

  // Submit order
  submitOrder() {
    if (this.isSubmitting) return;

    // Validation
    if (!this.activeOrder.customerName?.trim()) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'warning',
        title: 'Customer name is required',
        showConfirmButton: false,
        timer: 2000
      });
      return;
    }

    if (!this.activeOrder.customerPhone?.trim()) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'warning',
        title: 'Customer phone is required',
        showConfirmButton: false,
        timer: 2000
      });
      return;
    }

    if (this.activeOrder.products.length === 0) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'warning',
        title: 'Please add at least one product',
        showConfirmButton: false,
        timer: 2000
      });
      return;
    }

    this.isSubmitting = true;

    const payload = {
      products: this.activeOrder.products.map((p: OrderItem) => ({
        productId: p.productId,
        quantity: p.quantity
      })),
      customerEmail: this.activeOrder.customerEmail?.trim() || '',
      customerName: this.activeOrder.customerName.trim(),
      customerPhone: this.activeOrder.customerPhone.trim(),
      customerAddress: this.activeOrder.customerAddress?.trim() || ''
    };

    this.apiService.createOrder(payload).subscribe({
      next: () => {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Order created successfully',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true
        });

        this.isSubmitting = false;
        this.closeModal('orderModal');
        this.resetForm();
        this.loadOrders();
      },
      error: (err) => {
        console.error('Failed to create order', err);
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: 'Failed to create order',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true
        });
        this.isSubmitting = false;
      }
    });
  }

  // Change order status
  changeOrderStatus(order: any, status: string) {
    if (!order?.id) {
      console.error('Order ID is missing');
      return;
    }

    this.isLoadingOrders = true;

    const payload = {
      status: status,
      paymentMethod: order.paymentMethod ?? '',
      orderId: order.id ?? '',
      paymentReference: order.paymentReference ?? '',
      shippingProvider: order.shippingProvider ?? '',
      trackingNumber: order.trackingNumber ?? ''
    };

    this.apiService.changeOrderStatus(order.id, payload).subscribe({
      next: () => {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: `Order status updated to ${status}`,
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true
        });
        this.loadOrders();
      },
      error: (err) => {
        console.error('Failed to update order status', err);
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: 'Failed to update order status',
          showConfirmButton: false,
          timer: 2000
        });
        this.isLoadingOrders = false;
      }
    });
  }

  // Action methods
  markConfirmed(order: any) {
    this.changeOrderStatus(order, 'CONFIRMED');
  }

  markPaid(order: any) {
    this.changeOrderStatus(order, 'PAID');
  }

  markShipped(order: any) {
    this.changeOrderStatus(order, 'SHIPPED');
  }

  markDelivered(order: any) {
    this.changeOrderStatus(order, 'DELIVERED');
  }

  refundOrder(order: any) {
    Swal.fire({
      title: 'Refund Order?',
      text: `Are you sure you want to refund Order #${order.orderNo}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ffc107',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, refund it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.changeOrderStatus(order, 'REFUNDED');
      }
    });
  }

  cancelOrder(order: any) {
    Swal.fire({
      title: 'Cancel Order?',
      text: `Are you sure you want to cancel Order #${order.orderNo}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, cancel it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.changeOrderStatus(order, 'CANCELLED');
      }
    });
  }

  // Helper methods
  getStatusClass(status: string) {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return 'bg-secondary';
      case 'CONFIRMED':
        return 'bg-primary';
      case 'PAID':
        return 'bg-success';
      case 'SHIPPED':
        return 'bg-info';
      case 'DELIVERED':
        return 'bg-dark';
      case 'CANCELLED':
        return 'bg-danger';
      case 'REFUNDED':
        return 'bg-warning text-dark';
      default:
        return 'bg-light text-dark';
    }
  }

  getStepsCompleted(status: string): number {
    switch (status?.toUpperCase()) {
      case 'PENDING': return 1;
      case 'CONFIRMED': return 2;
      case 'PAID': return 3;
      case 'SHIPPED': return 4;
      case 'DELIVERED': return 5;
      default: return 0; // CANCELLED / REFUNDED
    }
  }

  // Reset form
  resetForm() {
    this.newOrder = {
      products: [],
      customerEmail: '',
      customerName: '',
      customerPhone: '',
      customerAddress: ''
    };
    this.tempProductId = '';
    this.tempQuantity = 1;
  }

  // Modal helpers
  private showModal(modalId: string) {
    const modalEl = document.getElementById(modalId);
    if (modalEl) {
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    }
  }

  closeModal(modalId: string) {
    const modalEl = document.getElementById(modalId);
    if (modalEl) {
      const modalInstance = bootstrap.Modal.getInstance(modalEl);
      if (modalInstance) {
        modalInstance.hide();
      }
    }
  }

  // Pagination
  onPageChange(event: { page: number; pageSize: number }) {
    this.searchPayload.pageNo = event.page - 1;
    this.searchPayload.pageSize = event.pageSize;
    this.loadOrders();
  }
}