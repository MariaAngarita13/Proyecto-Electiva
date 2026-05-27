import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-estadisticas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './estadisticas.component.html',
  styleUrl: './estadisticas.component.css',
  encapsulation: ViewEncapsulation.None
})
export class EstadisticasComponent implements OnInit {
  usuarioId  = parseInt(localStorage.getItem('usuario_id') || '1');
  stats: any = null;
  loading    = false;
  error      = '';
  isAdmin    = false;
  tenantName = '';

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private router: Router,
    private themeService: ThemeService
  ) {}

  ngOnInit() {
    this.themeService.applyTheme();
    this.isAdmin    = this.auth.isAdmin();
    this.tenantName = this.themeService.getTenantName();
    this.buscar();
  }

  buscar() {
    if (!this.usuarioId) return;
    this.loading = true; this.error = '';
    this.api.getEstadisticas(this.usuarioId).subscribe({
      next:  data => { this.stats = data; this.loading = false; },
      error: ()   => { this.error = 'Error al cargar estadísticas'; this.loading = false; }
    });
  }

  winRate(): number {
    if (!this.stats || !this.stats.total) return 0;
    return Math.round((this.stats.ganadas / this.stats.total) * 100);
  }

  logout() { this.auth.logout(); this.router.navigate(['/login']); }
  irA(ruta: string) { this.router.navigate([ruta]); }
}