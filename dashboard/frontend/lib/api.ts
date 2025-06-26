import { authService } from './auth';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export interface Dataset {
  _id: string;
  name: string;
  description?: string;
  category?: string;
  data: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface CreateDatasetRequest {
  name: string;
  description?: string;
  category?: string;
  data: string[];
}

export interface DatasetsResponse {
  datasets: Dataset[];
  total: number;
  page: number;
  limit: number;
}

export interface CategoriesResponse {
  categories: string[];
  total: number;
}

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log(`Making API request to: ${url}`, {
        method: config.method || 'GET',
        headers: config.headers,
      });

      const response = await fetch(url, config);
      
      if (!response.ok) {
        // Try to get error details from response
        let errorMessage = `API Error: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = `${response.status}: ${errorData.error}`;
          }
        } catch (jsonError) {
          // If can't parse error as JSON, use status text
        }
        
        console.error(`API request failed for ${endpoint}:`, {
          status: response.status,
          statusText: response.statusText,
          url,
        });
        
        throw new Error(errorMessage);
      }

      // Handle 204 No Content responses (like delete operations)
      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Get all datasets with optional filtering
  async getDatasets(params?: {
    search?: string;
    category?: string;
    page?: number;
    limit?: number;
  }): Promise<DatasetsResponse> {
    const searchParams = new URLSearchParams();
    
    if (params?.search) searchParams.append('search', params.search);
    if (params?.category) searchParams.append('category', params.category);
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const queryString = searchParams.toString();
    const endpoint = `/datasets${queryString ? `?${queryString}` : ''}`;
    
    return this.request<DatasetsResponse>(endpoint);
  }

  // Get all categories
  async getCategories(): Promise<CategoriesResponse> {
    return this.request<CategoriesResponse>('/datasets/categories');
  }

  // Get dataset by ID
  async getDataset(id: string): Promise<Dataset> {
    return this.request<Dataset>(`/datasets/${id}`);
  }

  // Create new dataset
  async createDataset(data: CreateDatasetRequest): Promise<Dataset> {
    return this.request<Dataset>('/datasets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Update dataset
  async updateDataset(id: string, data: Partial<CreateDatasetRequest>): Promise<Dataset> {
    return this.request<Dataset>(`/datasets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Delete dataset
  async deleteDataset(id: string): Promise<void> {
    return this.request<void>(`/datasets/${id}`, {
      method: 'DELETE',
    });
  }

  // Search datasets with text search
  async searchDatasets(query: string, category?: string, limit?: number): Promise<{
    datasets: Dataset[];
    total: number;
    query: string;
  }> {
    const searchParams = new URLSearchParams();
    searchParams.append('q', query);
    if (category) searchParams.append('category', category);
    if (limit) searchParams.append('limit', limit.toString());

    return this.request(`/datasets/search?${searchParams.toString()}`);
  }

  // Health check
  async healthCheck(): Promise<{
    status: string;
    timestamp: string;
    database: string;
  }> {
    return this.request('/health');
  }

  // Debug method to test authentication
  async testAuth(): Promise<{
    authenticated: boolean;
    user?: any;
    token?: string;
  }> {
    const token = authService.getToken();
    const user = authService.getUser();
    const isAuthenticated = authService.isAuthenticated();
    
    console.log('Auth Debug:', {
      hasToken: !!token,
      hasUser: !!user,
      isAuthenticated,
      tokenPreview: token ? token.substring(0, 20) + '...' : 'No token',
      user: user ? { id: user.id, email: user.email } : 'No user'
    });

    return {
      authenticated: isAuthenticated,
      user,
      token: token ? token.substring(0, 20) + '...' : undefined
    };
  }
}

export const apiClient = new ApiClient(); 