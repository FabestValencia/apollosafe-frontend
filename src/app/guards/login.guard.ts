// src/app/guards/login.guard.ts
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const loginGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('LoginGuard activado. ¿Está autenticado?', authService.isAuthenticated());

  if (authService.isAuthenticated()) {
    // Si el usuario ya está autenticado, redirigirlo fuera de login/registro
    const roles = authService.getRoles();
    if (roles.includes('ROLE_ADMIN')) { // Tu backend en CustomUserDetails añade "ROLE_" + Clase.toUpperCase()
      router.navigate(['/admin/home']); // Redirige al home del admin
      return false; // No permitir acceso a login/registro
    } else if (roles.includes('ROLE_CLIENTE')) {
      router.navigate(['/cliente/home']); // Redirige al home del cliente
      return false; // No permitir acceso a login/registro
    }
    console.log('LoginGuard: Usuario NO autenticado, permitiendo acceso a login/registro.'); // DEBUG
    // Si tiene otro rol o no se define una redirección específica, podría ir a un home general
    router.navigate(['/']); // O a una ruta por defecto para usuarios logueados sin panel específico
    return false;
  }
  return true; // Permite el acceso a la ruta de login/registro si no está autenticado
};