import { Routes } from '@angular/router';

// --- Componentes Generales y de Autenticación ---
import { InicioComponent } from './components/inicio/inicio.component';
import { LoginComponent } from './components/login/login.component';
import { RegistroComponent } from './components/registro/registro.component';
import { UnauthorizedComponent } from './components/unauthorized/unauthorized.component';
import { VerificacionEmailComponent } from './components/auth/verificacion-email/verificacion-email.component';

// --- Componentes de Reportes ---
import { CrearReporteComponent } from './components/reportes/crear-reporte/crear-reporte.component';
// import { DetalleReporteComponent } from './componentes/reportes/detalle-reporte/detalle-reporte.component'; // Comentado porque lo eliminamos
import { MapaReportesComponent } from './components/reportes/mapa-reportes/mapa-reportes.component';

// --- Componentes del Dashboard del Cliente ---
import { HomeClienteComponent } from './components/home-cliente/home-cliente.component';
import { MisReportesComponent } from './components/cliente/mis-reportes/mis-reportes.component';
import { NotificacionesClienteComponent } from './components/cliente/notificaciones-cliente/notificaciones-cliente.component';
import { PerfilClienteComponent } from './components/cliente/perfil-cliente/perfil-cliente.component';
import { EditarPerfilComponent } from './components/cliente/editar-perfil/editar-perfil.component';

// --- Componentes del Dashboard del Administrador ---
import { HomeAdminComponent } from './components/home-admin/home-admin.component';
import { GestionCategoriasComponent } from './components/admin/gestion-categorias/gestion-categorias.component';
import { GestionUsuariosComponent } from './components/admin/gestion-usuarios/gestion-usuarios.component';
import { ModeracionReportesComponent } from './components/admin/moderacion-reportes/moderacion-reportes.component';

// --- Guards ---
import { loginGuard } from './guards/login.guard';
import { authGuard } from './guards/auth.guard';
import { rolesGuard } from './guards/roles.guard';

export const routes: Routes = [
  // Rutas Públicas y de Autenticación
  {
    path: '',
    component: InicioComponent,
    title: 'Bienvenido a ApolloSafe' // Página de bienvenida
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [loginGuard], // Previene acceso si ya está logueado
    title: 'Iniciar Sesión - ApolloSafe'
  },
  {
    path: 'registro',
    component: RegistroComponent,
    canActivate: [loginGuard], // Previene acceso si ya está logueado
    title: 'Registro - ApolloSafe'
  },
  {
    path: 'unauthorized',
    component: UnauthorizedComponent,
    title: 'Acceso Denegado - ApolloSafe'
  },
  {
    path: 'auth/verificar-cuenta', // Ruta para el enlace de verificación de email
    component: VerificacionEmailComponent,
    title: 'Verificación de Cuenta - ApolloSafe'
  },

  // Rutas de Reportes
  {
    path: 'reportes/mapa-publico', // Mapa público de reportes
    component: MapaReportesComponent,
    title: 'Mapa de Reportes - ApolloSafe'
  },
  {
    path: 'reportes/crear', // Crear un nuevo reporte
    component: CrearReporteComponent,
    canActivate: [authGuard, rolesGuard], // Solo clientes autenticados
    data: { expectedRoles: ['ROLE_CLIENTE'] },
    title: 'Crear Nuevo Reporte - ApolloSafe'
  },
  
  {
    path: 'cliente/home',
    component: HomeClienteComponent, // Componente principal del dashboard del cliente
    canActivate: [authGuard, rolesGuard],
    data: { expectedRoles: ['ROLE_CLIENTE'] },
    title: 'Panel de Cliente - ApolloSafe',
    children: [ // Rutas hijas que se renderizarán en el <router-outlet> de HomeClienteComponent
      { path: '', redirectTo: 'mis-reportes', pathMatch: 'full' }, // Redirigir por defecto a 'mis-reportes'
      {
        path: 'mis-reportes',
        component: MisReportesComponent,
        title: 'Mis Reportes - ApolloSafe'
      },
      {
        path: 'notificaciones',
        component: NotificacionesClienteComponent,
        title: 'Mis Notificaciones - ApolloSafe'
      },
      {
        path: 'perfil', // Vista general del perfil
        component: PerfilClienteComponent,
        title: 'Mi Perfil - ApolloSafe'
      },
      {
        path: 'perfil/editar', // Formulario para editar el perfil
        component: EditarPerfilComponent,
        title: 'Editar Perfil - ApolloSafe'
      }
      // Aquí podrías añadir más rutas hijas para el cliente si es necesario
    ]
  },

  // --- Rutas Protegidas del Administrador ---
  {
    path: 'admin/home',
    component: HomeAdminComponent, // Componente principal del dashboard del admin
    canActivate: [authGuard, rolesGuard],
    data: { expectedRoles: ['ROLE_ADMIN'] },
    title: 'Panel de Administración - ApolloSafe',
    children: [ // Rutas hijas para el admin
      { path: '', redirectTo: 'reportes', pathMatch: 'full' }, // Redirigir por defecto a 'moderacion-reportes'
      {
        path: 'categorias',
        component: GestionCategoriasComponent,
        title: 'Gestión de Categorías - ApolloSafe'
      },
      {
        path: 'usuarios',
        component: GestionUsuariosComponent,
        title: 'Gestión de Usuarios - ApolloSafe'
      },
      {
        path: 'reportes',
        component: ModeracionReportesComponent,
        title: 'Moderación de Reportes - ApolloSafe'
      }
      // Aquí podrías añadir más rutas hijas para el admin
    ]
  },

  // Ruta Comodín (Wildcard Route) - Siempre al final
  {
    path: '**', // Captura cualquier ruta no definida anteriormente
    redirectTo: '/', // Redirige a la página de inicio
    pathMatch: 'full'
  }
];