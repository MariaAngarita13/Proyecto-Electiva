import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-mis-resultados',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mis-resultados.component.html',
  styleUrl: './mis-resultados.component.css',
  encapsulation: ViewEncapsulation.None
})
export class MisResultadosComponent implements OnInit {
  partidas: any[] = [];
  loading = false;
  usuarioId = parseInt(localStorage.getItem('usuario_id') || '0');
  usuarioNombre = localStorage.getItem('usuario_nombre') || 'Jugador';

  constructor(private api: ApiService, private auth: AuthService, private router: Router) {}

  ngOnInit() { this.cargarResultados(); }

  cargarResultados() {
    if (!this.usuarioId) return;
    this.loading = true;
    this.api.getPartidasPorUsuario(this.usuarioId).subscribe({
      next: data => { this.partidas = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
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