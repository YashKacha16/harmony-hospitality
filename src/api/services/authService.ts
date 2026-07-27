import { apiClient } from '../apiClient';
import { LoginDto, Employee } from '../../types/models';

interface LoginResponse {
    message: string;
    employee: Employee;
}

interface LogoutResponse {
    message: string;
}

export const authService = {
    login: (credentials: LoginDto) => apiClient.post<LoginResponse>('/api/Auth/login', credentials),
    logout: () => apiClient.post<LogoutResponse>('/api/Auth/logout', {}),
};
