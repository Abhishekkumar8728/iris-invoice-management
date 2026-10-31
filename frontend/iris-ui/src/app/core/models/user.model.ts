import { UserRole } from './auth.model';

export interface User {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  mobile?: string;
  role: UserRole;
  department?: string;
  designation?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserRequest {
  employeeId: string;
  name: string;
  email: string;
  mobile?: string;
  password: string;
  role: UserRole;
  department?: string;
  designation?: string;
  isActive?: boolean;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  mobile?: string;
  role?: UserRole;
  department?: string;
  designation?: string;
  isActive?: boolean;
}

export interface UserListResponse {
  success: boolean;
  message: string;
  data: {
    users: User[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface UserResponse {
  success: boolean;
  message: string;
  data: User;
}