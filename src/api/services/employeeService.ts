import { apiClient } from '../apiClient';
import { Employee } from '../../types/models';

export const employeeService = {
    getAll: () => apiClient.get<Employee[]>('/api/Employee'),
    getById: (id: number) => apiClient.get<Employee>(`/api/Employee/${id}`),
    create: (employee: Employee) => apiClient.post<Employee>('/api/Employee', employee),
    update: (id: number, employee: Employee) => apiClient.put<void>(`/api/Employee/${id}`, employee),
    delete: (id: number) => apiClient.delete<void>(`/api/Employee/${id}`),
    uploadPhoto: (id: number, file: File) => {
        const formData = new FormData();
        formData.append('photo', file);
        return apiClient.request<{ message: string }>(`/api/Employee/${id}/photo`, {
            method: 'POST',
            body: formData as any,
            headers: {
                // Let the browser set the Content-Type automatically for FormData
                'Content-Type': undefined,
            } as any,
        });
    }
};
