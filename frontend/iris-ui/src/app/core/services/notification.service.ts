import { Injectable, inject } from '@angular/core';

import {
  HttpClient,
  HttpParams
} from '@angular/common/http';

import {
  Observable
} from 'rxjs';

import {
  environment
} from '../../../environments/environment';

import {
  Notification,
  NotificationListResponse,
  NotificationResponse
} from '../models/notification.model';


@Injectable({
  providedIn: 'root'
})
export class NotificationService {


  private readonly http =
    inject(HttpClient);


  private readonly apiUrl =
    environment.apiUrl;


  

  getNotifications(
    page = 1,
    limit = 20,
    unreadOnly = false
  ): Observable<NotificationListResponse> {

    let params =
      new HttpParams()
        .set('page', page)
        .set('limit', limit);


    if (unreadOnly) {

      params =
        params.set(
          'unreadOnly',
          'true'
        );

    }


    return this.http.get<NotificationListResponse>(
      `${this.apiUrl}/notifications`,
      {
        params
      }
    );

  }


  

  getUnreadNotifications(
    limit = 10
  ): Observable<NotificationListResponse> {

    return this.getNotifications(
      1,
      limit,
      true
    );

  }


  

  markAsRead(
    id: string
  ): Observable<NotificationResponse> {

    return this.http.patch<NotificationResponse>(
      `${this.apiUrl}/notifications/${id}/read`,
      {}
    );

  }


  

  markAllAsRead(): Observable<NotificationResponse> {

    return this.http.patch<NotificationResponse>(
      `${this.apiUrl}/notifications/read-all`,
      {}
    );

  }


  

  getId(
    notification: Notification
  ): string {

    return (
      notification.id ||
      notification._id ||
      ''
    );

  }

}