import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient, private auth: AuthService) {}

  private headers(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.auth.getToken()}`,
      'X-Tenant-ID':   this.auth.getTenantId() || ''   // ← tenant en cada petición
    });
  }

  // ─── Usuarios ───
  getUsuarios(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/usuarios`, { headers: this.headers() });
  }

  crearUsuario(data: any): Observable<any> {
    // Ruta pública — igual agregamos el tenant_id en el body
    return this.http.post(`${this.baseUrl}/usuarios`, {
      ...data,
      tenant_id: this.auth.getTenantId()
    });
  }

  eliminarUsuario(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/usuarios/${id}`, { headers: this.headers() });
  }

  buscarUsuarioPorCorreo(correo: string): Observable<any> {
    const tenantId = this.auth.getTenantId();
    return this.http.get<any>(
      `${this.baseUrl}/usuarios/buscar?correo=${encodeURIComponent(correo)}&tenant_id=${tenantId}`,
      { headers: this.headers() }
    );
  }

  // ─── Partidas ───
  getPartidas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/partidas`, { headers: this.headers() });
  }

  crearPartida(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/partidas`, {
      ...data,
      tenant_id: this.auth.getTenantId()   // ← tenant en el body
    }, { headers: this.headers() });
  }

  eliminarPartida(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/partidas/${id}`, { headers: this.headers() });
  }

  getPartidasPorUsuario(usuarioId: number): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.baseUrl}/usuarios/${usuarioId}/partidas`,
      { headers: this.headers() }
    );
  }

  // ─── Estadísticas ───
  getEstadisticas(usuarioId: number): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/estadisticas/${usuarioId}`,
      { headers: this.headers() }
    );
  }

  // ─── Ranking ───
  getRanking(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/ranking`, { headers: this.headers() });
  }
}