import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models';

@Injectable({
  providedIn: 'root'
})
export class LeaderboardService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000';

  getRankings(): Observable<User[]> {
    // Standard json-server sort by points descending
    return this.http.get<User[]>(`${this.apiUrl}/users?_sort=-points`);
  }

  triggerRankCalculation(): Observable<{ message: string }> {
    return this.http.get<{ message: string }>(`${this.apiUrl}/rank`);
  }

  triggerGamificationJob(): Observable<{ message: string }> {
    return this.http.get<{ message: string }>(`${this.apiUrl}/game`);
  }
}
