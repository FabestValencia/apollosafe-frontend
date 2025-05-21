import { Routes } from '@angular/router';
import { InicioComponent } from './components/inicio/inicio.component';
import { LoginComponent } from './components/login/login.component';
import { RegistroComponent } from './components/registro/registro.component';

export const routes: Routes = [
  { path: '', component: InicioComponent },
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegistroComponent }, // Cambiado de 'register' a 'registro' para consistencia
  { path: '**', pathMatch: 'full', redirectTo: '/' } // Ruta comodín para redirigir a inicio si no se encuentra la ruta
];