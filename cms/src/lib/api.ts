const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  image: string;
  category_id: number;
  category?: { id: number; name: string };
  colors: string[];
  sizes: string[];
  stock: number;
  is_featured: boolean;
  is_active: boolean;
}

export interface Catalogue {
  id: number;
  name: string;
  description: string;
  image: string;
  status: boolean;
  sort_order: number;
  products: Product[];
  created_at: string;
  updated_at: string;
}

export interface CreateCatalogueInput {
  name: string;
  description?: string;
  image?: string;
  status?: boolean;
  sort_order?: number;
  products?: {
    id?: number;
    name: string;
    price: number;
    description?: string;
    image?: string;
    category_id: number;
    colors?: string[];
    sizes?: string[];
    stock?: number;
    is_featured?: boolean;
    is_active?: boolean;
  }[];
}

export const cmsApi = {
  async getCatalogues(params?: { status?: string; search?: string }) {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    
    const res = await fetch(`${API_URL}/catalogues?${query}`);
    return res.json();
  },

  async getCatalogue(id: number): Promise<Catalogue> {
    const res = await fetch(`${API_URL}/catalogues/${id}`);
    return res.json();
  },

  async createCatalogue(data: CreateCatalogueInput) {
    const res = await fetch(`${API_URL}/catalogues`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async updateCatalogue(id: number, data: Partial<CreateCatalogueInput>) {
    const res = await fetch(`${API_URL}/catalogues/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async deleteCatalogue(id: number) {
    const res = await fetch(`${API_URL}/catalogues/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  async addProductsToCatalogue(catalogueId: number, productIds: number[]) {
    const res = await fetch(`${API_URL}/catalogues/${catalogueId}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_ids: productIds }),
    });
    return res.json();
  },

  async removeProductsFromCatalogue(catalogueId: number, productIds: number[]) {
    const res = await fetch(`${API_URL}/catalogues/${catalogueId}/products`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_ids: productIds }),
    });
    return res.json();
  },

  async getProducts(params?: { category?: string }) {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    
    const res = await fetch(`${API_URL}/products?${query}`);
    return res.json();
  },

  async getCategories() {
    const res = await fetch(`${API_URL}/categories`);
    return res.json();
  },
};
