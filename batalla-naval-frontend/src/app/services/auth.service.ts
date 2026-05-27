// src/app/services/auth.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { ThemeService } from './theme.service';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private themeService: ThemeService) {}

  login(correo: string, password: string, tenantId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { correo, password, tenant_id: tenantId }).pipe(
      tap((res: any) => {
        localStorage.setItem('token',          res.token);
        localStorage.setItem('usuario_id',     res.usuario_id.toString());
        localStorage.setItem('usuario_nombre', res.nombre);
        localStorage.setItem('usuario_correo', res.correo);
        localStorage.setItem('tenant_id',      res.tenant_id);
        localStorage.setItem('rol',            res.rol || 'jugador');

        // Aplicar tema del tenant inmediatamente después del login
        this.themeService.applyTheme(res.tenant_id);
      })
    );
  }

  registro(nombre: string, correo: string, password: string, tenantId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/usuarios`, {
      nombre, correo, password, tenant_id: tenantId
    });
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario_id');
    localStorage.removeItem('usuario_nombre');
    localStorage.removeItem('usuario_correo');
    localStorage.removeItem('tenant_id');
    localStorage.removeItem('rol');
  }

  getToken(): string | null         { return localStorage.getItem('token'); }
  getUsuarioId(): string | null     { return localStorage.getItem('usuario_id'); }
  getUsuarioNombre(): string | null { return localStorage.getItem('usuario_nombre'); }
  getUsuarioCorreo(): string | null { return localStorage.getItem('usuario_correo'); }
  getTenantId(): string | null      { return localStorage.getItem('tenant_id'); }
  getRol(): string | null           { return localStorage.getItem('rol'); }
  isAdmin(): boolean                { return this.getRol() === 'admin'; }
  isLoggedIn(): boolean             { return !!this.getToken(); }
}