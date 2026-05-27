import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { ThemeService } from '../services/theme.service';

const TENANT_MAP: Record<string, string> = {
  'empresaa.com': 'empresa_a',
  'empresab.com': 'empresa_b',
};

@Component({
  selector: 'app-autenticacion',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './autenticacion.component.html',
  styleUrl: './autenticacion.component.css'
})
export class AutenticacionComponent {

  // Paso 1: elegir rol
  rolSeleccionado: 'admin' | 'jugador' | null = null;

  correo   = '';
  password = '';
  nombre          = '';
  correoReg       = '';
  passwordReg     = '';
  passwordConfirm = '';

  modo: 'login' | 'registro' = 'login';
  loading          = false;
  error            = '';
  exitoRegistro    = '';
  empresaDetectada = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private themeService: ThemeService
  ) {}

  // Seleccionar rol en el paso 1
  seleccionarRol(rol: 'admin' | 'jugador') {
    this.rolSeleccionado = rol;
    this.modo            = 'login';
    this.error           = '';
    this.exitoRegistro   = '';
    this.correo          = '';
    this.password        = '';
  }

  volverRol() {
    this.rolSeleccionado = null;
    this.error           = '';
  }

  cambiarModo(modo: 'login' | 'registro') {
    this.modo          = modo;
    this.error         = '';
    this.exitoRegistro = '';
  }

  onCorreoChange() {
    const tenantId = this.detectarTenant(this.correo);
    this.empresaDetectada = tenantId ? this.themeService.getTheme(tenantId).name : '';
  }

  private detectarTenant(correo: string): string | null {
    const dominio = correo.split('@')[1]?.toLowerCase();
    return TENANT_MAP[dominio] || null;
  }

  login() {
    this.error   = '';
    this.loading = true;

    const tenantId = this.detectarTenant(this.correo);
    if (!tenantId) {
      this.error   = 'El correo no pertenece a ninguna empresa registrada';
      this.loading = false;
      return;
    }

    this.authService.login(this.correo, this.password, tenantId).subscribe({
      next: (res) => {
        this.loading = false;
        const rol = res.rol;
        if (rol === 'admin') {
          this.router.navigate(['/partidas']);
        } else {
          this.router.navigate(['/juego']);
        }
      },
      error: (err) => {
        this.loading = false;
        this.error   = err?.error?.error || 'Correo o contraseña incorrectos';
      }
    });
  }

  registro() {
    this.error         = '';
    this.exitoRegistro = '';

    if (!this.nombre || !this.correoReg || !this.passwordReg || !this.passwordConfirm) {
      this.error = 'Todos los campos son obligatorios';
      return;
    }
    if (this.passwordReg !== this.passwordConfirm) {
      this.error = 'Las contraseñas no coinciden';
      return;
    }
    const tenantId = this.detectarTenant(this.correoReg);
    if (!tenantId) {
      this.error = 'El correo no pertenece a ninguna empresa registrada';
      return;
    }

    this.loading = true;
    this.authService.registro(this.nombre, this.correoReg, this.passwordReg, tenantId).subscribe({
      next: () => {
        this.loading         = false;
        this.exitoRegistro   = '✅ Cuenta creada. Ya puedes iniciar sesión.';
        this.nombre          = '';
        this.correoReg       = '';
        this.passwordReg     = '';
        this.passwordConfirm = '';
        setTimeout(() => this.cambiarModo('login'), 2000);
      },
      error: (err) => {
        this.loading = false;
        this.error   = err?.error?.error || 'Error al registrar usuario';
      }
    });
  }
}