// src/app/services/theme.service.ts
// Aplica los colores del tenant en tiempo real usando CSS variables

import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ThemeService {

  // Aplica el tema del tenant actual al documento
  applyTheme(tenantId?: string): void {
    const id = tenantId || localStorage.getItem('tenant_id') || 'empresa_a';
    const themes = environment.themes as Record<string, any>;
    const theme  = themes[id] || environment.theme;

    const root = document.documentElement;
    root.style.setProperty('--primary',    theme.primaryColor);
    root.style.setProperty('--secondary',  theme.secondaryColor);
    root.style.setProperty('--accent',     theme.accentColor);
    root.style.setProperty('--bg',         theme.background);
    root.style.setProperty('--card-bg',    theme.cardBg);
    root.style.setProperty('--border-clr', theme.borderColor);
    root.style.setProperty('--text',       theme.textColor);
    root.style.setProperty('--nav-active', theme.navActive);
  }

  // Devuelve el tema actual
  getTheme(tenantId?: string): any {
    const id = tenantId || localStorage.getItem('tenant_id') || 'empresa_a';
    const themes = environment.themes as Record<string, any>;
    return themes[id] || environment.theme;
  }

  // Devuelve el nombre de la empresa
  getTenantName(): string {
    const id = localStorage.getItem('tenant_id') || 'empresa_a';
    const themes = environment.themes as Record<string, any>;
    return themes[id]?.name || 'Empresa';
  }

  // Devuelve true si el usuario logueado es admin
  isAdmin(): boolean {
    return localStorage.getItem('rol') === 'admin';
  }
}