import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Challenge } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ChallengesService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/challenges';

  getChallenges(): Observable<Challenge[]> {
    return this.http.get<Challenge[]>(this.apiUrl);
  }

  getChallenge(id: number): Observable<Challenge> {
    return this.http.get<Challenge>(`${this.apiUrl}/${id}`);
  }

  createChallenge(challenge: Omit<Challenge, 'id'>): Observable<Challenge> {
    return this.http.post<Challenge>(this.apiUrl, challenge);
  }

  updateChallenge(id: number, challenge: Partial<Challenge>): Observable<Challenge> {
    return this.http.patch<Challenge>(`${this.apiUrl}/${id}`, challenge);
  }

  deleteChallenge(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  joinChallenge(id: number, userId: number, currentParticipants: number[]): Observable<Challenge> {
    const updatedParticipants = Array.from(new Set([...currentParticipants, userId]));
    return this.http.patch<Challenge>(`${this.apiUrl}/${id}`, {
      participants: updatedParticipants
    });
  }
}
