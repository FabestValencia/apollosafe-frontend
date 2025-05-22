import { Routes } from '@angular/router';

// Componentes generales
import { InicioComponent } from './components/inicio/inicio.component';
import { LoginComponent } from './components/login/login.component';
import { RegistroComponent } from './components/registro/registro.component';
import { UnauthorizedComponent } from './components/unauthorized/unauthorized.component';
import { VerificacionEmailComponent } from './components/auth/verificacion-email/verificacion-email.component'; // Asegúrate de crear este componente

// Componentes de Reportes
import { CrearReporteComponent } from './components/reportes/crear-reporte/crear-reporte.component';
import { MapaReportesComponent } from './components/reportes/mapa-reportes/mapa-reportes.component'; // Componente para el mapa público de reportes

// Componentes de Cliente
import { HomeClienteComponent } from './components/home-cliente/home-cliente.component';
import { MisReportesComponent } from './components/cliente/mis-reportes/mis-reportes.component';       // Placeholder
import { NotificacionesClienteComponent } from './components/cliente/notificaciones-cliente/notificaciones-cliente.component'; // Placeholder
import { PerfilClienteComponent } from './components/cliente/perfil-cliente/perfil-cliente.component'; // Placeholder
import { EditarPerfilComponent } from './components/cliente/editar-perfil/editar-perfil.component';

// Componentes de Admin
import { HomeAdminComponent } from './components/home-admin/home-admin.component';
import { GestionCategoriasComponent } from './components/admin/gestion-categorias/gestion-categorias.component'; // Placeholder
import { GestionUsuariosComponent } from './components/admin/gestion-usuarios/gestion-usuarios.component';     // Placeholder
import { ModeracionReportesComponent } from './components/admin/moderacion-reportes/moderacion-reportes.component'; // Placeholder


// Guards
import { loginGuard } from './guards/login.guard';
import { authGuard } from './guards/auth.guard';
import { rolesGuard } from './guards/roles.guard';

export const routes: Routes = [
  // Rutas Públicas y de Autenticación
 // { path: '', component: InicioComponent, title: 'Apollo Safe' },
  { path: '', component: EditarPerfilComponent, title: 'Mis Reportes (TEMP)' },
  { path: 'login', component: LoginComponent, /*canActivate: [loginGuard],*/ title: 'Iniciar Sesión' }, //
  { path: 'registro', component: RegistroComponent, /*canActivate: [loginGuard],*/ title: 'Registro de Usuario' }, //
  { path: 'unauthorized', component: UnauthorizedComponent, title: 'Acceso Denegado' }, //
  { path: 'auth/verificar-cuenta', component: VerificacionEmailComponent, title: 'Verificación de Cuenta' }, // Nueva ruta para verificación

  // Rutas de Reportes (generales y creación)
  { path: 'reportes/mapa-publico', component: MapaReportesComponent, title: 'Mapa de Reportes' }, // Mapa público
  {
    path: 'reportes/crear',
    component: CrearReporteComponent,
    canActivate: [authGuard, rolesGuard],
    data: { expectedRoles: ['ROLE_CLIENTE'] }, // Solo clientes pueden crear reportes
    title: 'Crear Nuevo Reporte'
  },


  // Rutas del Dashboard del Cliente
  {
    path: 'cliente/home',
    component: HomeClienteComponent,
    canActivate: [authGuard, rolesGuard],
    data: { expectedRoles: ['ROLE_CLIENTE'] },
    title: 'Panel de Cliente',
    children: [
      // Por defecto, podrías redirigir a una sub-página o simplemente mostrar el contenido base del HomeClienteComponent
      // { path: '', redirectTo: 'mis-reportes', pathMatch: 'full' }, // Opcional: redirigir a 'mis-reportes' por defecto
      { path: 'mis-reportes', component: MisReportesComponent, title: 'Mis Reportes' /* outlet: 'clienteOutlet' // Si usas named outlets */ },
      { path: 'notificaciones', component: NotificacionesClienteComponent, title: 'Mis Notificaciones' /* outlet: 'clienteOutlet' */ },
      { path: 'perfil', component: PerfilClienteComponent, title: 'Editar Perfil' /* outlet: 'clienteOutlet' */ },
      { path: 'perfil/editar', component: EditarPerfilComponent, title: 'Editar Perfil' } 
    ]
  },

  // Rutas del Dashboard del Administrador
  {
    path: 'admin/home',
    component: HomeAdminComponent,
    canActivate: [authGuard, rolesGuard],
    data: { expectedRoles: ['ROLE_ADMIN'] }, //
    title: 'Panel de Administración',
    children: [
      // { path: '', redirectTo: 'dashboard-admin', pathMatch: 'full' }, // Opcional
      { path: 'categorias', component: GestionCategoriasComponent, title: 'Gestión de Categorías' },
      { path: 'usuarios', component: GestionUsuariosComponent, title: 'Gestión de Usuarios' },
      { path: 'reportes', component: ModeracionReportesComponent, title: 'Moderación de Reportes' }
    ]
  },


  // Ruta comodín: Siempre debe ir al final
  { path: '**', redirectTo: '/', pathMatch: 'full' } //
];