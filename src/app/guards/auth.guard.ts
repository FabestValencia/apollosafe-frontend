// src/app/guards/auth.guard.ts
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true; // El usuario está autenticado, permite el acceso a la ruta
  }

  // El usuario no está autenticado, redirige a la página de login
  // Se guarda la URL a la que intentaba acceder para redirigirlo después del login (opcional)
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false; // No permite el acceso a la ruta
};