import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import { RegisterData, LoginData, User } from '@shared/schema';

interface AuthResponse {
  user: User;
  token: string;
}

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['auth', 'user'],
    queryFn: async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No token found');
      }
      
      const response = await apiRequest('GET', '/api/auth/user', undefined, {
        Authorization: `Bearer ${token}`,
      });
      return response.json();
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const loginMutation = useMutation<AuthResponse, Error, LoginData>({
    mutationFn: async (credentials: LoginData) => {
      const response = await apiRequest('POST', '/api/login', credentials);
      return response.json();
    },
    onSuccess: (data) => {
      localStorage.setItem('authToken', data.token);
      queryClient.setQueryData(['auth', 'user'], data.user);
    },
  });

  const registerMutation = useMutation<AuthResponse, Error, RegisterData>({
    mutationFn: async (userData: RegisterData) => {
      const response = await apiRequest('POST', '/api/register', userData);
      return response.json();
    },
    onSuccess: (data) => {
      localStorage.setItem('authToken', data.token);
      queryClient.setQueryData(['auth', 'user'], data.user);
    },
  });

  const logout = useMutation({
    mutationFn: async () => {
      localStorage.removeItem('authToken');
    },
    onSuccess: () => {
      queryClient.setQueryData(['auth', 'user'], null);
      queryClient.clear();
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    loginMutation,
    registerMutation,
    logout,
  };
}
