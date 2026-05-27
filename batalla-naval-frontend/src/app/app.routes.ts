// src/app/app.routes.ts

import { Routes } from '@angular/router';
import { AutenticacionComponent }  from './autenticacion/autenticacion.component';
import { PartidasComponent }       from './partidas/partidas.component';
import { UsuariosComponent }       from './usuarios/usuarios.component';
import { RankingComponent }        from './ranking/ranking.component';
import { EstadisticasComponent }   from './estadisticas/estadisticas.component';
import { JuegoComponent }          from './juego/juego.component';
import { MisResultadosComponent }  from './mis-resultados/mis-resultados.component';
import { authGuard }               from './guards/auth.guard';
import { adminGuard }              from './guards/admin.guard';

export const routes: Routes = [
  { path: '',               redirectTo: '/login', pathMatch: 'full' },
  { path: 'login',          component: AutenticacionComponent },

  // ─── Rutas JUGADOR (cualquier usuario logueado) ───────────
  { path: 'juego',          component: JuegoComponent,        canActivate: [authGuard] },
  { path: 'mis-resultados', component: MisResultadosComponent,canActivate: [authGuard] },
  { path: 'ranking',        component: RankingComponent,      canActivate: [authGuard] },
  { path: 'estadisticas',   component: EstadisticasComponent, canActivate: [authGuard] },

  // ─── Rutas ADMIN (solo admins) ────────────────────────────
  { path: 'partidas',       component: PartidasComponent,     canActivate: [adminGuard] },
  { path: 'usuarios',       component: UsuariosComponent,     canActivate: [adminGuard] },

  { path: '**',             redirectTo: '/login' }
];