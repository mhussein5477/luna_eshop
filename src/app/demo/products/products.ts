import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Pagination } from '../widget/pagination/pagination';
import { ApiService } from '../api-service'; 
import { LoaderMaterial } from '../component/loader-material/loader-material';
import Swal from 'sweetalert2';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AuthSessionService } from '../auth-session';

declare var bootstrap: any;

interface Product {
  id?: string;
  clientId: string;
  name: string;
  description: string;
  categoryId: string;
  unitPrice: number;
  currencyCode: string;
  discountAmount: number;
  taxAmount: number;
  quantityAvailable: number;
  isInStock: number;
  isFeatured: number;
  unitOfMeasure: string;
  status?: string; // ACTIVE or INACTIVE
  imageUrl?: string | null;
  imageUrls?: string[];
}

interface ProductCategory {
  id?: string;
  name: string;
  description: string;
}

interface Client {
  id: string;
  name: string;
  clientCode: string;
}

@Component({
  selector: 'app-products',
  templateUrl: './products.html',
  styleUrl: './products.scss',
  imports: [CommonModule, FormsModule, Pagination, LoaderMaterial],
})
export class Products implements OnDestroy {
  searchName = '';
  selectedFilter = 'all';
  isLoadingProducts = false;
  isSubmitting = false;
  modalMode: 'add' | 'edit' | 'view' = 'add';
  selectedProduct: any = null;
  
  // Image upload
  selectedFiles: File[] = [];
  isUploadingImages = false;
  
  // Dev mode check
  isDevMode = false;
  clients: Client[] = [];
  
  // Debouncer for search
  private searchSubject = new Subject<string>();
  
  // Category modal
  showCategoryModal = false;
  isSavingCategory = false;
  newCategory: ProductCategory = {
    name: '',
    description: ''
  };

  categories: ProductCategory[] = [];
  products: Product[] = [];
  totalElements = 0;

  searchPayload = {
    pageNo: 0,
    pageSize: 10,
    sortBy: 'id',
    sortDir: 'DESC',
    name: '',
    clientId: ''
  };

  newProduct: Product = {
    clientId: '',
    name: '',
    description: '',
    categoryId: '',
    unitPrice: 0,
    currencyCode: 'KES',
    discountAmount: 0,
    taxAmount: 0,
    quantityAvailable: 0,
    isInStock: 1,
    isFeatured: 0,
    unitOfMeasure: 'pcs',
    status: 'ACTIVE',
    imageUrls: []
  };

  constructor(
    private apiService: ApiService,
    private authService: AuthSessionService
  ) {
    // Setup debounced search
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.performSearch(searchTerm);
    });
  }

  ngOnInit() {
    this.checkDevMode();

    const clientId = this.authService.clientId;

    if (!this.isDevMode && clientId) {
      // 🔐 lock search to logged-in client
      this.searchPayload.clientId = clientId;
      this.newProduct.clientId = clientId;
    }

    if (this.isDevMode) {
      this.loadClients();
    }

    this.loadProducts();
    this.loadCategories();
  }

  ngOnDestroy() {
    this.searchSubject.complete();
  }

  checkDevMode() {
    this.isDevMode = this.authService.role === 'ROLE_ADMIN';
  }

  loadClients() {
    this.apiService.getAllClients().subscribe({
      next: (res: any) => {
        this.clients = res.data ?? [];
      },
      error: (err) => {
        console.error('Failed to load clients', err);
      }
    });
  }

  get activeProduct() {
    return this.modalMode === 'add' ? this.newProduct : this.selectedProduct;
  }

  get filteredProducts() {
    let filtered = this.products;

    if (this.selectedFilter === 'featured') {
      filtered = filtered.filter(p => p.isFeatured === 1);
    } else if (this.selectedFilter === 'sale') {
      filtered = filtered.filter(p => p.discountAmount > 0);
    }

    return filtered;
  }

  onSearchChange(searchTerm: string) {
    this.searchName = searchTerm;
    this.searchSubject.next(searchTerm);
  }

  private performSearch(searchTerm: string) {
    this.searchPayload.name = searchTerm.trim();
    this.searchPayload.pageNo = 0;
    this.loadProducts();
  }

  setFilter(filter: string) {
    this.selectedFilter = filter;
  }

  loadProducts() {
    this.isLoadingProducts = true;

    this.apiService.searchProducts(this.searchPayload).subscribe({
      next: (res: any) => {
        const data = res.data ?? [];
        this.totalElements = res.pageDetail?.totalElements ?? data.length;
        this.products = data;
      },
      error: (err) => {
        console.error('Failed to load products', err);
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: 'Failed to load products',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true
        });
      },
      complete: () => this.isLoadingProducts = false
    });
  }

  loadCategories() {
    const payload = {
      pageNo: 0,
      pageSize: 100,
      sortBy: 'name',
      sortDir: 'ASC'
    };

    this.apiService.searchProductCategories(payload).subscribe({
      next: (res: any) => {
        this.categories = res.data ?? [];
      },
      error: (err) => console.error('Failed to load categories', err)
    });
  }

  openAddProductModal() {
    this.modalMode = 'add';
    this.selectedProduct = null;
    this.selectedFiles = [];
    this.resetForm();
    this.showModal('productModal');
  }

  editProduct(product: Product) {
    this.modalMode = 'edit';
    this.selectedProduct = { ...product };
    this.selectedFiles = [];
    this.showModal('productModal');
  }

  viewProduct(product: Product) {
    this.modalMode = 'view';
    this.selectedProduct = { ...product };
    this.showModal('productModal');
  }

  /**
   * Change product status (ACTIVE/INACTIVE)
   */
  changeProductStatus(product: Product) {
    const newStatus = product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const actionText = newStatus === 'ACTIVE' ? 'activate' : 'deactivate';

    Swal.fire({
      title: `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} Product?`,
      text: `Are you sure you want to ${actionText} "${product.name}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: newStatus === 'ACTIVE' ? '#28a745' : '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: `Yes, ${actionText} it!`,
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed && product.id) {
        this.apiService.changeProductStatus(product.id, newStatus).subscribe({
          next: (response: any) => {
            Swal.fire({
              toast: true,
              position: 'top-end',
              icon: 'success',
              title: `Product ${actionText}d successfully`,
              showConfirmButton: false,
              timer: 2000,
              timerProgressBar: true
            });
            this.loadProducts();
          },
          error: (err) => {
            console.error('Failed to change product status', err);
            Swal.fire({
              toast: true,
              position: 'top-end',
              icon: 'error',
              title: 'Failed to change product status',
              showConfirmButton: false,
              timer: 3000,
              timerProgressBar: true
            });
          }
        });
      }
    });
  }

  // Handle file selection
  onFileSelected(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.selectedFiles = Array.from(files);
    }
  }

  // Upload images after product creation
  async uploadProductImages(productId: string) {
    if (this.selectedFiles.length === 0) {
      return;
    }

    this.isUploadingImages = true;

    try {
      const formData = new FormData();
      formData.append('id', productId);
      
      this.selectedFiles.forEach((file) => {
        formData.append('images', file);
      });

      await this.apiService.uploadProductImages(formData).toPromise();
      
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Images uploaded successfully',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true
      });

      this.selectedFiles = [];
      this.loadProducts();
    } catch (err) {
      console.error('Failed to upload images', err);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: 'Failed to upload images',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true
      });
    } finally {
      this.isUploadingImages = false;
    }
  }

  submitProduct() {
    if (this.isSubmitting) return;

    if (!this.activeProduct.name?.trim()) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'warning',
        title: 'Product name is required',
        showConfirmButton: false,
        timer: 2000
      });
      return;
    }

    if (!this.activeProduct.categoryId) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'warning',
        title: 'Please select a category',
        showConfirmButton: false,
        timer: 2000
      });
      return;
    }

    if (!this.activeProduct.clientId) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'warning',
        title: this.isDevMode ? 'Please select a client' : 'Client ID not found. Please log in again.',
        showConfirmButton: false,
        timer: 2000
      });
      return;
    }

    this.isSubmitting = true;

    const payload = {
      ...this.activeProduct,
      name: this.activeProduct.name?.trim(),
      description: this.activeProduct.description?.trim(),
      isInStock: this.activeProduct.isInStock ? 1 : 0,
      isFeatured: this.activeProduct.isFeatured ? 1 : 0,
    };

    const request$ = this.modalMode === 'edit'
      ? this.apiService.updateProduct(payload)
      : this.apiService.createProduct(payload);

    request$.subscribe({
      next: async (res: any) => {
        const successMessage = this.modalMode === 'edit' 
          ? 'Product updated successfully' 
          : 'Product added successfully';

        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: successMessage,
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true
        });

        // If adding new product and images selected, upload them
        if (this.modalMode === 'add' && this.selectedFiles.length > 0 && res.data?.id) {
          await this.uploadProductImages(res.data.id);
        }

        this.isSubmitting = false;
        this.closeModal('productModal');
        this.resetForm();
        this.loadProducts();
      },
      error: (err) => {
        console.error('Save product failed', err);
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: 'Failed to save product',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true
        });
        this.isSubmitting = false;
      }
    });
  }

  deleteProduct(product: Product) {
    Swal.fire({
      title: 'Delete Product?',
      text: `Are you sure you want to delete "${product.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        console.log('Delete product:', product);
      }
    });
  }

  openAddCategoryModal() {
    this.newCategory = { name: '', description: '' };
    this.showModal('categoryModal');
  }

  submitCategory() {
    if (this.isSavingCategory) return;

    if (!this.newCategory.name?.trim()) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'warning',
        title: 'Category name is required',
        showConfirmButton: false,
        timer: 2000
      });
      return;
    }

    this.isSavingCategory = true;

    this.apiService.createProductCategory(this.newCategory).subscribe({
      next: (res: any) => {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Category added successfully',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true
        });

        this.isSavingCategory = false;
        this.closeModal('categoryModal');
        this.loadCategories();
        
        if (res.data?.id) {
          this.activeProduct.categoryId = res.data.id;
        }
      },
      error: (err) => {
        console.error('Failed to save category', err);
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: 'Failed to save category',
          showConfirmButton: false,
          timer: 2000
        });
        this.isSavingCategory = false;
      }
    });
  }

  resetForm() {
    const clientId = this.isDevMode ? '' : (this.authService.clientId || '');
    
    this.newProduct = {
      clientId: clientId,
      name: '',
      description: '',
      categoryId: '',
      unitPrice: 0,
      currencyCode: 'KES',
      discountAmount: 0,
      taxAmount: 0,
      quantityAvailable: 0,
      isInStock: 1,
      isFeatured: 0,
      unitOfMeasure: 'pcs',
      status: 'ACTIVE',
      imageUrls: []
    };
    
    this.selectedFiles = [];
  }

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

  onPageChange(event: { page: number; pageSize: number }) {
    this.searchPayload.pageNo = event.page - 1;
    this.searchPayload.pageSize = event.pageSize;
    this.loadProducts();
  }

  // Get product image - returns first image from imageUrls, imageUrl, or default
  getProductImage(product: Product): string {
    if (product.imageUrls && product.imageUrls.length > 0) {
      return product.imageUrls[0];
    }
    if (product.imageUrl) {
      return product.imageUrl;
    }
    return 'assets/images/product.png';
  }

  /**
   * Get status badge class
   */
  getStatusBadgeClass(status?: string): string {
    return status === 'ACTIVE' ? 'bg-success' : 'bg-secondary';
  }
}