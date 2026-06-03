import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { Telemetry, Badge } from '../models';

@Injectable({
  providedIn: 'root'
})
export class TelemetryService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000';

  getTelemetryForUser(userId: number): Observable<Telemetry[]> {
    return this.http.get<Telemetry[]>(`${this.apiUrl}/telemetry?userId=${userId}`);
  }

  getBadgesForUser(userId: number): Observable<Badge[]> {
    return this.http.get<Badge[]>(`${this.apiUrl}/badges?userId=${userId}`);
  }

  submitTelemetry(telemetry: Omit<Telemetry, 'id'>): Observable<Telemetry> {
    return this.http.post<Telemetry>(`${this.apiUrl}/telemetry`, telemetry);
  }

  // Combined call to fetch user dashboard data: telemetry and badges
  getDashboardData(userId: number): Observable<[Telemetry[], Badge[]]> {
    return forkJoin([
      this.getTelemetryForUser(userId),
      this.getBadgesForUser(userId)
    ]);
  }
}
