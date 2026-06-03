import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Device } from '../models';

@Injectable({
  providedIn: 'root'
})
export class DevicesService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/devices';

  getDevices(): Observable<Device[]> {
    return this.http.get<Device[]>(this.apiUrl);
  }

  getDevice(id: number): Observable<Device> {
    return this.http.get<Device>(`${this.apiUrl}/${id}`);
  }

  createDevice(device: Omit<Device, 'id'>): Observable<Device> {
    return this.http.post<Device>(this.apiUrl, device);
  }

  updateDevice(id: number, device: Partial<Device>): Observable<Device> {
    return this.http.patch<Device>(`${this.apiUrl}/${id}`, device);
  }

  deleteDevice(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
