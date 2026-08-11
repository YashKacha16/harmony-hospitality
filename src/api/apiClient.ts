export const BASE_URL = import.meta.env.VITE_API_URL || 'http://hotel-backend.runasp.net';

export const apiClient = {
    async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = `${BASE_URL}${endpoint}`;
        const headers: Record<string, string> = {};
        if (!(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }
        if (options.headers) {
            Object.entries(options.headers).forEach(([key, value]) => {
                if (value !== undefined) {
                    headers[key] = value as string;
                }
            });
        }

        const response = await fetch(url, {
            ...options,
            headers,
        });

        if (!response.ok) {
            let errorMessage = `HTTP error! status: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } catch (e) {
                // Ignore json parsing error if no response body
            }
            throw new Error(errorMessage);
        }

        // Return null for 204 No Content
        if (response.status === 204) {
            return null as unknown as T;
        }

        return await response.json();
    },

    get<T>(endpoint: string, options?: RequestInit) {
        return this.request<T>(endpoint, { ...options, method: 'GET' });
    },

    post<T>(endpoint: string, body: any, options?: RequestInit) {
        return this.request<T>(endpoint, {
            ...options,
            method: 'POST',
            body: body instanceof FormData ? body : JSON.stringify(body),
        });
    },

    put<T>(endpoint: string, body: any, options?: RequestInit) {
        return this.request<T>(endpoint, {
            ...options,
            method: 'PUT',
            body: body instanceof FormData ? body : JSON.stringify(body),
        });
    },

    delete<T>(endpoint: string, options?: RequestInit) {
        return this.request<T>(endpoint, { ...options, method: 'DELETE' });
    },
};
