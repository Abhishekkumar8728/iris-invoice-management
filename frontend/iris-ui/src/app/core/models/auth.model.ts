export interface LoginRequest {
  identifier: string;
  password: string;
}

export type UserRole =
  | 'ADMIN'
  | 'FINANCE'
  | 'APPROVER'
  | 'USER';

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
}

export interface LoginResponse {
  success: boolean;
  message: string;

  data: {
    accessToken: string;
    refreshToken?: string;
    user?: User;
  };
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  message: string;

  data: {
    accessToken: string;
    refreshToken?: string;
  };
}

export interface MeResponse {
  success: boolean;
  message: string;
  data: User;
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;

  data?: {
    otp?: string;
  };
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

export interface CreateUserRequest {
  employeeId: string;
  name: string;
  email: string;
  mobile?: string;

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

    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface UserResponse {
  success: boolean;
  message: string;
  data: User;
}
export interface RegisterRequest {

  employeeId: string;

  name: string;

  email: string;

  mobile?: string;

  password: string;

  department?: string;

  role?: UserRole;

}


export interface RegisterResponse {

  success: boolean;

  message: string;

  data: User;

}

export interface CreateAdminUserRequest {
  employeeId: string;
  name: string;
  email: string;
  mobile?: string;
  password: string;
  role: 'ADMIN' | 'FINANCE' | 'APPROVER' | 'USER';
  department?: string;
  designation?: string;
  isActive?: boolean;
}