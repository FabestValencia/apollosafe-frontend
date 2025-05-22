// src/app/guards/roles.guard.ts
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const rolesGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Primero, verificar si el usuario está autenticado. Si no, authGuard ya debería haberlo manejado,
  // pero es una buena práctica verificarlo aquí también.
  if (!authService.isAuthenticated()) {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  // Obtener los roles esperados de la data de la ruta
  const expectedRoles: string[] | undefined = route.data['expectedRoles']; //

  // Si no se definen roles esperados en la ruta, permitir el acceso (asumiendo que authGuard ya hizo su trabajo)
  if (!expectedRoles || expectedRoles.length === 0) {
    return true;
  }

  // Obtener los roles del usuario actual
  const userRoles = authService.getRoles(); //

  // Verificar si el usuario tiene al menos uno de los roles esperados
  const hasRequiredRole = expectedRoles.some(role => userRoles.includes(role)); //

  if (hasRequiredRole) {
    return true; // El usuario tiene el rol requerido, permite el acceso
  } else {
    // El usuario no tiene el rol requerido, redirige a una página de "no autorizado"
    router.navigate(['/unauthorized']); //
    return false; // No permite el acceso
  }
};