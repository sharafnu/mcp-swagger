/**
 * HTTP utility functions for making API requests
 */

import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios';

export class HttpUtils {
  private client: AxiosInstance;

  constructor(config: AxiosRequestConfig = {}) {
    this.client = axios.create({
      timeout: 10000,
      ...config
    });
  }

  /**
   * Make GET request
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.get<T>(url, config);
  }

  /**
   * Make POST request
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.post<T>(url, data, config);
  }

  /**
   * Make PUT request
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.put<T>(url, data, config);
  }

  /**
   * Make DELETE request
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.delete<T>(url, config);
  }

  /**
   * Make PATCH request
   */
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.patch<T>(url, data, config);
  }

  /**
   * Set default headers
   */
  setDefaultHeaders(headers: Record<string, string>): void {
    Object.assign(this.client.defaults.headers, headers);
  }

  /**
   * Set authentication header
   */
  setAuthHeader(token: string, type: 'Bearer' | 'Basic' | 'ApiKey' = 'Bearer'): void {
    this.client.defaults.headers['Authorization'] = `${type} ${token}`;
  }

  /**
   * Set API key header
   */
  setApiKeyHeader(key: string, headerName: string = 'X-API-Key'): void {
    this.client.defaults.headers[headerName] = key;
  }

  /**
   * Create a new instance with different config
   */
  createInstance(config: AxiosRequestConfig): HttpUtils {
    return new HttpUtils(config);
  }
}