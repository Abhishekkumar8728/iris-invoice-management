import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  User,
  UserListResponse,
  UserResponse,
  CreateUserRequest,
  UpdateUserRequest
} from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private readonly http = inject(HttpClient);

  private readonly baseUrl = environment.apiUrl;

  getUsers(
    page = 1,
    limit = 10,
    search = '',
    role = '',
    department = '',
    isActive: boolean | null = null
  ): Observable<UserListResponse> {

    let params = new HttpParams()
      .set('page', page)
      .set('limit', limit);

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    if (role) {
      params = params.set('role', role);
    }

    if (department) {
      params = params.set('department', department);
    }

    if (isActive !== null) {
      params = params.set('isActive', isActive);
    }

    return this.http.get<UserListResponse>(
      `${this.baseUrl}/users`,
      { params }
    );
  }

  getUser(id: string): Observable<UserResponse> {
    return this.http.get<UserResponse>(
      `${this.baseUrl}/users/${id}`
    );
  }

  getMe(): Observable<UserResponse> {
    return this.http.get<UserResponse>(
      `${this.baseUrl}/users/me`
    );
  }

  

  createUser(payload: CreateUserRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(
      `${this.baseUrl}/auth/admin/users`,
      payload
    );
  }

  updateUser(
    id: string,
    payload: UpdateUserRequest
  ): Observable<UserResponse> {

    return this.http.patch<UserResponse>(
      `${this.baseUrl}/auth/admin/users/${id}`,
      payload
    );
  }

  activateUser(id: string): Observable<UserResponse> {
    return this.http.patch<UserResponse>(
      `${this.baseUrl}/auth/admin/users/${id}/activate`,
      {}
    );
  }

  deactivateUser(id: string): Observable<UserResponse> {
    return this.http.patch<UserResponse>(
      `${this.baseUrl}/auth/admin/users/${id}/deactivate`,
      {}
    );
  }

  deleteUser(id: string): Observable<{
    success: boolean;
    message: string;
  }> {
    return this.http.delete<{
      success: boolean;
      message: string;
    }>(
      `${this.baseUrl}/auth/admin/users/${id}`
    );
  }
}