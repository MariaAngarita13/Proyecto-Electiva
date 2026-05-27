// src/app/guards/admin.guard.ts

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  if (!auth.isAdmin()) {
    // Jugador intentando acceder a ruta de admin → lo manda al juego
    router.navigate(['/juego']);
    return false;
  }

  return true;
};