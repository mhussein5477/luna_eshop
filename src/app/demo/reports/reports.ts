import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import Swal from 'sweetalert2';
import { ApiService } from '../api-service';
import { AuthSessionService } from '../auth-session';

interface ReportType {
  id: string;
  title: string;
  description: string;
  icon: string;
  endpoint: 'orders' | 'products';
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: 'reports.html',
  styleUrls: ['reports.scss']
})
export class Reports implements OnInit {
  
  // Report types
  reportTypes: ReportType[] = [
    {
      id: 'orders',
      title: 'Orders Report',
      description: 'View and analyze order data, including status and more filters',
      icon: 'fa-shopping-cart',
      endpoint: 'orders'
    },
    {
      id: 'products',
      title: 'Products Report',
      description: 'Analyze product performance, inventory levels, and pricing data',
      icon: 'fa-box',
      endpoint: 'products'
    }
  ];

  // Active report
  activeReport: ReportType | null = null;

  // Loading states
  isLoadingData = false;
  isDownloading = false;

  // Client info
  clientId: string | null = null;

  // Orders filters
  ordersFilters = {
    pageNo: 0,
    pageSize: 100,
    sortBy: 'createdAt',
    sortDir: 'DESC',
    isDownload: 0,
    id: '',
    productId: '',
    clientId: '',
    clientCode: '',
    orderStatus: '',
    customerEmail: '',
    customerName: '',
    customerPhone: '',
    customerAddress: ''
  };

  // Products filters
  productsFilters = {
    pageNo: 0,
    pageSize: 100,
    sortBy: 'name',
    sortDir: 'ASC',
    isDownload: 0,
    id: '',
    clientId: '',
    clientCode: '',
    clientName: '',
    name: '',
    description: '',
    categoryId: '',
    unitPrice: null as number | null,
    currencyCode: '',
    discountAmount: null as number | null,
    taxAmount: null as number | null,
    quantityAvailable: null as number | null,
    isInStock: null as number | null,
    isFeatured: null as number | null,
    unitOfMeasure: '',
    status: ''
  };

  // Order status options
  orderStatuses = ['PENDING', 'CONFIRMED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'];
  
  // Product status options
  productStatuses = ['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK'];

  // Sort directions
  sortDirections = ['ASC', 'DESC'];

  // Data
  ordersData: any[] = [];
  productsData: any[] = [];
  
  // Summary statistics
  ordersSummary = {
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    pendingOrders: 0,
    completedOrders: 0
  };

  productsSummary = {
    totalProducts: 0,
    activeProducts: 0,
    outOfStock: 0,
    totalInventoryValue: 0
  };

  constructor(
    private apiService: ApiService,
    private authService: AuthSessionService
  ) {}

  ngOnInit() {
    // Get client ID from auth session
    this.clientId = this.authService.clientId;
    
    // Set default active report
    this.activeReport = this.reportTypes[0];
    
    // Initialize filters with client ID
    this.ordersFilters.clientId = this.clientId || '';
    this.productsFilters.clientId = this.clientId || '';
    
    // Load initial data
    this.applyFilters();
  }

  // Select report type
  selectReport(report: ReportType) {
    this.activeReport = report;
    this.applyFilters();
  }

  // Apply filters and fetch data
  applyFilters() {
    if (!this.activeReport) return;

    this.isLoadingData = true;

    if (this.activeReport.endpoint === 'orders') {
      this.fetchOrdersReport();
    } else if (this.activeReport.endpoint === 'products') {
      this.fetchProductsReport();
    }
  }

  // Fetch orders report
  fetchOrdersReport() {
    const payload = this.cleanPayload(this.ordersFilters);
    
    this.apiService.searchOrders(payload).subscribe({
      next: (response: any) => {
        this.ordersData = response.data || [];
        this.calculateOrdersSummary();
        this.isLoadingData = false;
      },
      error: (error) => {
        console.error('Error fetching orders:', error);
        this.showError('Failed to load orders report');
        this.isLoadingData = false;
      }
    });
  }

  // Fetch products report
  fetchProductsReport() {
    const payload = this.cleanPayload(this.productsFilters);
    
    this.apiService.searchProducts(payload).subscribe({
      next: (response: any) => {
        this.productsData = response.data || [];
        this.calculateProductsSummary();
        this.isLoadingData = false;
      },
      error: (error) => {
        console.error('Error fetching products:', error);
        this.showError('Failed to load products report');
        this.isLoadingData = false;
      }
    });
  }

  // Download report as Excel
  downloadReport() {
    if (!this.activeReport) return;

    this.isDownloading = true;

    if (this.activeReport.endpoint === 'orders') {
      const payload = { ...this.cleanPayload(this.ordersFilters), isDownload: 1 };
      
      this.apiService.searchOrders(payload).subscribe({
        next: (response: any) => {
          this.handleDownloadResponse(response, 'orders-report');
          this.isDownloading = false;
          this.showSuccess('Orders report downloaded successfully');
        },
        error: (error) => {
          console.error('Error downloading orders:', error);
          this.showError('Failed to download orders report');
          this.isDownloading = false;
        }
      });
    } else if (this.activeReport.endpoint === 'products') {
      const payload = { ...this.cleanPayload(this.productsFilters), isDownload: 1 };
      
      this.apiService.searchProducts(payload).subscribe({
        next: (response: any) => {
          this.handleDownloadResponse(response, 'products-report');
          this.isDownloading = false;
          this.showSuccess('Products report downloaded successfully');
        },
        error: (error) => {
          console.error('Error downloading products:', error);
          this.showError('Failed to download products report');
          this.isDownloading = false;
        }
      });
    }
  }

  // Handle download response
  handleDownloadResponse(response: any, filename: string) {
    // If response is a blob
    if (response instanceof Blob) {
      const url = window.URL.createObjectURL(response);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}-${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } else {
      // If backend returns data, convert to CSV
      this.convertToCSV(response, filename);
    }
  }

  // Convert data to CSV and download
  convertToCSV(response: any, filename: string) {
    const data = response.data || [];
    if (data.length === 0) {
      this.showWarning('No data to download');
      return;
    }

    // Get headers from first object
    const headers = Object.keys(data[0]);
    
    // Create CSV content
    let csv = headers.join(',') + '\n';
    
    data.forEach((row: any) => {
      const values = headers.map(header => {
        const value = row[header];
        return typeof value === 'string' ? `"${value}"` : value;
      });
      csv += values.join(',') + '\n';
    });

    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // Clean payload - remove empty values
  cleanPayload(filters: any): any {
    const cleaned: any = {};
    
    Object.keys(filters).forEach(key => {
      const value = filters[key];
      if (value !== '' && value !== null && value !== undefined) {
        cleaned[key] = value;
      }
    });
    
    return cleaned;
  }

  // Reset filters
  resetFilters() {
    if (this.activeReport?.endpoint === 'orders') {
      this.ordersFilters = {
        pageNo: 0,
        pageSize: 100,
        sortBy: 'createdAt',
        sortDir: 'DESC',
        isDownload: 0,
        id: '',
        productId: '',
        clientId: this.clientId || '',
        clientCode: '',
        orderStatus: '',
        customerEmail: '',
        customerName: '',
        customerPhone: '',
        customerAddress: ''
      };
    } else if (this.activeReport?.endpoint === 'products') {
      this.productsFilters = {
        pageNo: 0,
        pageSize: 100,
        sortBy: 'name',
        sortDir: 'ASC',
        isDownload: 0,
        id: '',
        clientId: this.clientId || '',
        clientCode: '',
        clientName: '',
        name: '',
        description: '',
        categoryId: '',
        unitPrice: null,
        currencyCode: '',
        discountAmount: null,
        taxAmount: null,
        quantityAvailable: null,
        isInStock: null,
        isFeatured: null,
        unitOfMeasure: '',
        status: ''
      };
    }
    
    this.applyFilters();
  }

  // Calculate orders summary
  calculateOrdersSummary() {
    this.ordersSummary.totalOrders = this.ordersData.length;
    this.ordersSummary.totalRevenue = this.ordersData.reduce((sum, order) => 
      sum + (order.totalAmount || 0), 0
    );
    this.ordersSummary.averageOrderValue = this.ordersSummary.totalOrders > 0 
      ? this.ordersSummary.totalRevenue / this.ordersSummary.totalOrders 
      : 0;
    this.ordersSummary.pendingOrders = this.ordersData.filter(o => 
      o.orderStatus === 'PENDING'
    ).length;
    this.ordersSummary.completedOrders = this.ordersData.filter(o => 
      o.orderStatus === 'DELIVERED'
    ).length;
  }

  // Calculate products summary
  calculateProductsSummary() {
    this.productsSummary.totalProducts = this.productsData.length;
    this.productsSummary.activeProducts = this.productsData.filter(p => 
      p.status === 'ACTIVE'
    ).length;
    this.productsSummary.outOfStock = this.productsData.filter(p => 
      p.quantityAvailable === 0 || p.isInStock === 0
    ).length;
    this.productsSummary.totalInventoryValue = this.productsData.reduce((sum, product) => 
      sum + ((product.unitPrice || 0) * (product.quantityAvailable || 0)), 0
    );
  }

  // Get status badge class
  getStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'PENDING': 'bg-warning text-dark',
      'CONFIRMED': 'bg-info text-white',
      'IN_TRANSIT': 'bg-primary text-white',
      'DELIVERED': 'bg-success text-white',
      'CANCELLED': 'bg-danger text-white',
      'ACTIVE': 'bg-success text-white',
      'INACTIVE': 'bg-secondary text-white',
      'OUT_OF_STOCK': 'bg-danger text-white'
    };
    
    return statusMap[status] || 'bg-secondary text-white';
  }

  // Format currency
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  }

  // Format date
  formatDate(date: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // SweetAlert helpers
  showSuccess(message: string) {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: message,
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true
    });
  }

  showError(message: string) {
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

  showWarning(message: string) {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'warning',
      title: message,
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true
    });
  }
}