import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.css',
  encapsulation: ViewEncapsulation.None
})
export class UsuariosComponent implements OnInit {
  usuarios: any[] = [];
  loading = false;

  constructor(private api: ApiService, private auth: AuthService, private router: Router) {}

  ngOnInit() { this.cargarUsuarios(); }

  cargarUsuarios() {
    this.loading = true;
    this.api.getUsuarios().subscribe({
      next: data => { this.usuarios = data; this.loading = false; },
      error: () => this.loading = false
    });
  }

  logout() { this.auth.logout(); this.router.navigate(['/login']); }
  irA(ruta: string) { this.router.navigate([ruta]); }
}