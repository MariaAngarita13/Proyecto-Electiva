// src/app/partidas/partidas.component.ts

import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-partidas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './partidas.component.html',
  styleUrl: './partidas.component.css',
  encapsulation: ViewEncapsulation.None
})
export class PartidasComponent implements OnInit {
  partidas:   any[] = [];
  loading     = false;
  tenantName  = this.themeService.getTenantName();
  isAdmin     = this.auth.isAdmin();

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private router: Router,
    private themeService: ThemeService
  ) {}

  ngOnInit() {
    this.themeService.applyTheme();
    this.cargarPartidas();
  }

  cargarPartidas() {
    this.loading = true;
    this.api.getPartidas().subscribe({
      next:  data => { this.partidas = data; this.loading = false; },
      error: ()   => { this.loading = false; }
    });
  }

  eliminarPartida(id: number) {
    if (!confirm('¿Eliminar esta partida?')) return;
    this.api.eliminarPartida(id).subscribe(() => this.cargarPartidas());
  }

  getCount(resultado: string): number {
    return this.partidas.filter(p => p.resultado === resultado).length;
  }

  getWinRate(): number {
    if (!this.partidas.length) return 0;
    return Math.round((this.getCount('ganada') / this.partidas.length) * 100);
  }

  logout() { this.auth.logout(); this.router.navigate(['/login']); }
  irA(ruta: string) { this.router.navigate([ruta]); }
}