import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { forkJoin } from 'rxjs';
import { ApiService } from '../../api-service';
import { AuthSessionService } from '../../auth-session';

interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  outOfStock: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
}

interface AdminStats {
  totalClients: number;
  activeClients: number;
  inactiveClients: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  orderStatus: string;
  createdAt: string;
  totalItems?: number;
}

interface TopProduct {
  id: string;
  name: string;
  unitPrice: number;
  quantityAvailable: number;
  currencyCode: string;
  imageUrls?: string[];
  isFeatured: number;
}

interface ClientInfo {
  id: string;
  name: string;
  clientCode: string;
  emailAddress: string;
  phoneNumber: string;
  status: string;
  createdAt: string;
}

@Component({
  selector: 'app-default',
  standalone: true,
  imports: [CommonModule],
  templateUrl: 'default.component.html',
  styleUrls: ['default.component.scss']
})
export class DefaultComponent implements OnInit {
  
  clientId: string | null = null;
  clientName: string | null = null;
  isLoading = true;
  isAdmin = false;

  // Client dashboard stats
  stats: DashboardStats = {
    totalProducts: 0,
    activeProducts: 0,
    inactiveProducts: 0,
    outOfStock: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0
  };

  // Admin dashboard stats
  adminStats: AdminStats = {
    totalClients: 0,
    activeClients: 0,
    inactiveClients: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0
  };

  recentOrders: RecentOrder[] = [];
  topProducts: TopProduct[] = [];
  featuredProducts: TopProduct[] = [];
  recentClients: ClientInfo[] = [];

  // Chart data
  monthlyOrdersData: { month: string; count: number }[] = [];
  orderStatusData: { status: string; count: number; color: string }[] = [];

  constructor(
    private apiService: ApiService,
    private authService: AuthSessionService
  ) {}

  ngOnInit() {
    this.clientId = this.authService.clientId;
    this.clientName = this.authService.clientName;
    this.isAdmin = this.authService.role === 'ROLE_ADMIN';
    
    if (this.isAdmin) {
      this.loadAdminDashboard();
    } else {
      this.loadClientDashboard();
    }
  }

  /**
   * Load dashboard for ADMIN users
   */
  loadAdminDashboard() {
    this.isLoading = true;

    const clientsPayload = {
      pageNo: 0,
      pageSize: 100,
      sortBy: 'createdAt',
      sortDir: 'DESC',
      name: '',
      emailAddress: '',
      phoneNumber: ''
    };

    const productsPayload = {
      pageNo: 0,
      pageSize: 1000,
      sortBy: 'createdAt',
      sortDir: 'DESC',
      name: '',
      clientId: '' // Admin sees all products
    };

    const ordersPayload = {
      pageNo: 0,
      pageSize: 1000,
      sortBy: 'createdAt',
      sortDir: 'DESC',
      clientId: '' // Admin sees all orders
    };

    forkJoin({
      clients: this.apiService.searchClients(clientsPayload),
      products: this.apiService.searchProducts(productsPayload),
      orders: this.apiService.searchOrders(ordersPayload)
    }).subscribe({
      next: (results) => {
        this.processAdminClientsData(results.clients);
        this.processAdminProductsData(results.products);
        this.processAdminOrdersData(results.orders);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading admin dashboard:', error);
        this.isLoading = false;
      }
    });
  }

  processAdminClientsData(response: any) {
    const clients = response.data || [];
    const totalElements = response.pageDetail?.totalElements || clients.length;

    this.adminStats.totalClients = totalElements;
    this.adminStats.activeClients = clients.filter((c: any) => c.status === 'ACTIVE').length;
    this.adminStats.inactiveClients = clients.filter((c: any) => c.status === 'INACTIVE').length;

    // Get recent clients
    this.recentClients = clients.slice(0, 5).map((client: any) => ({
      id: client.id,
      name: client.name,
      clientCode: client.clientCode,
      emailAddress: client.emailAddress,
      phoneNumber: client.phoneNumber,
      status: client.status,
      createdAt: client.createdAt
    }));
  }

  processAdminProductsData(response: any) {
    const products = response.data || [];
    const totalElements = response.pageDetail?.totalElements || products.length;

    this.adminStats.totalProducts = totalElements;
  }

  processAdminOrdersData(response: any) {
    const orders = response.data || [];
    const totalElements = response.pageDetail?.totalElements || orders.length;

    this.adminStats.totalOrders = totalElements;

    // Calculate total revenue
    this.adminStats.totalRevenue = orders.reduce((sum: number, order: any) => 
      sum + (order.totalAmount || 0), 0
    );

    // Get recent orders (first 5)
    this.recentOrders = orders.slice(0, 5).map((order: any) => ({
      id: order.id,
      orderNumber: order.orderNumber || order.id?.substring(0, 8),
      customerName: order.customerName || 'N/A',
      totalAmount: order.totalAmount || 0,
      orderStatus: order.orderStatus,
      createdAt: order.createdAt,
      totalItems: order.totalItems || 0
    }));

    // Calculate order status distribution
    const statusCounts: any = {};
    orders.forEach((order: any) => {
      const status = order.orderStatus || 'UNKNOWN';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    this.orderStatusData = Object.keys(statusCounts).map(status => ({
      status,
      count: statusCounts[status],
      color: this.getStatusColor(status)
    }));
  }

  /**
   * Load dashboard for CLIENT users (existing logic)
   */
  loadClientDashboard() {
    this.isLoading = true;

    const productsPayload = {
      pageNo: 0,
      pageSize: 100,
      sortBy: 'createdAt',
      sortDir: 'DESC',
      clientId: this.clientId || ''
    };

    const ordersPayload = {
      pageNo: 0,
      pageSize: 10,
      sortBy: 'createdAt',
      sortDir: 'DESC',
      clientId: this.clientId || ''
    };

    const allOrdersPayload = {
      pageNo: 0,
      pageSize: 1000,
      sortBy: 'createdAt',
      sortDir: 'DESC',
      clientId: this.clientId || ''
    };

    forkJoin({
      products: this.apiService.searchProducts(productsPayload),
      orders: this.apiService.searchOrders(ordersPayload),
      allOrders: this.apiService.searchOrders(allOrdersPayload)
    }).subscribe({
      next: (results) => {
        this.processProductsData(results.products);
        this.processOrdersData(results.orders, results.allOrders);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.isLoading = false;
      }
    });
  }

  processProductsData(response: any) {
    const products = response.data || [];
    const totalElements = response.pageDetail?.totalElements || products.length;

    this.stats.totalProducts = totalElements;
    this.stats.activeProducts = products.filter((p: any) => p.status === 'ACTIVE').length;
    this.stats.inactiveProducts = products.filter((p: any) => p.status === 'INACTIVE').length;
    this.stats.outOfStock = products.filter((p: any) => p.quantityAvailable === 0 || p.isInStock === 0).length;

    // Get top products (by price)
    this.topProducts = products
      .filter((p: any) => p.status === 'ACTIVE')
      .sort((a: any, b: any) => (b.unitPrice || 0) - (a.unitPrice || 0))
      .slice(0, 5);

    // Get featured products
    this.featuredProducts = products
      .filter((p: any) => p.isFeatured === 1 && p.status === 'ACTIVE')
      .slice(0, 4);
  }

  getBarHeight(count: number): number {
    if (this.monthlyOrdersData.length === 0) return 0;
    const maxCount = Math.max(...this.monthlyOrdersData.map(d => d.count));
    if (maxCount === 0) return 0;
    return Math.max(10, (count / maxCount) * 100);
  }
  
  processOrdersData(recentResponse: any, allResponse: any) {
    const recentOrders = recentResponse.data || [];
    const allOrders = allResponse.data || [];
    const totalElements = allResponse.pageDetail?.totalElements || allOrders.length;

    this.stats.totalOrders = totalElements;
    
    this.stats.pendingOrders = allOrders.filter((o: any) => o.orderStatus === 'PENDING').length;
    this.stats.completedOrders = allOrders.filter((o: any) => o.orderStatus === 'DELIVERED').length;
    
    this.stats.totalRevenue = allOrders.reduce((sum: number, order: any) => 
      sum + (order.totalAmount || 0), 0
    );
    
    this.stats.averageOrderValue = this.stats.totalOrders > 0 
      ? this.stats.totalRevenue / this.stats.totalOrders 
      : 0;

    this.recentOrders = recentOrders.slice(0, 5).map((order: any) => ({
      id: order.id,
      orderNumber: order.orderNumber || order.id?.substring(0, 8),
      customerName: order.customerName || 'N/A',
      totalAmount: order.totalAmount || 0,
      orderStatus: order.orderStatus,
      createdAt: order.createdAt,
      totalItems: order.totalItems || 0
    }));

    const statusCounts: any = {};
    allOrders.forEach((order: any) => {
      const status = order.orderStatus || 'UNKNOWN';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    this.orderStatusData = Object.keys(statusCounts).map(status => ({
      status,
      count: statusCounts[status],
      color: this.getStatusColor(status)
    }));

    this.calculateMonthlyOrders(allOrders);
  }

  calculateMonthlyOrders(orders: any[]) {
    const monthCounts: { [key: string]: number } = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    orders.forEach(order => {
      if (order.createdAt) {
        const date = new Date(order.createdAt);
        const monthYear = `${months[date.getMonth()]} ${date.getFullYear()}`;
        monthCounts[monthYear] = (monthCounts[monthYear] || 0) + 1;
      }
    });

    this.monthlyOrdersData = Object.keys(monthCounts)
      .sort()
      .slice(-6)
      .map(month => ({
        month,
        count: monthCounts[month]
      }));
  }

  getStatusColor(status: string): string {
    const colorMap: { [key: string]: string } = {
      'PENDING': '#ffc107',
      'CONFIRMED': '#0dcaf0',
      'PAID': '#0d6efd',
      'SHIPPED': '#17a2b8',
      'DELIVERED': '#198754',
      'CANCELLED': '#dc3545',
      'REFUNDED': '#fd7e14'
    };
    return colorMap[status] || '#6c757d';
  }

  getStatusBadgeClass(status: string): string {
    const classMap: { [key: string]: string } = {
      'PENDING': 'bg-warning text-dark',
      'CONFIRMED': 'bg-info text-white',
      'PAID': 'bg-primary text-white',
      'SHIPPED': 'bg-info text-white',
      'DELIVERED': 'bg-success text-white',
      'CANCELLED': 'bg-danger text-white',
      'REFUNDED': 'bg-warning text-dark',
      'ACTIVE': 'bg-success text-white',
      'INACTIVE': 'bg-secondary text-white'
    };
    return classMap[status] || 'bg-secondary text-white';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  }

  formatDate(date: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatTime(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('en-KE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getProductImage(product: TopProduct): string {
    if (product.imageUrls && product.imageUrls.length > 0) {
      return product.imageUrls[0];
    }
    return 'assets/images/product.png';
  }

  calculatePercentage(value: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  }

  getStatusPercentage(status: string): number {
    const statusData = this.orderStatusData.find(s => s.status === status);
    return statusData ? this.calculatePercentage(statusData.count, this.stats.totalOrders) : 0;
  }

  calculateTrend(current: number, previous: number): { value: number; isPositive: boolean } {
    if (previous === 0) return { value: 0, isPositive: true };
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(Math.round(change)),
      isPositive: change >= 0
    };
  }
}