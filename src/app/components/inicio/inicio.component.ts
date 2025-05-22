import { Component } from '@angular/core';
import { RouterModule } from '@angular/router'; // Necesario para routerLink
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [RouterModule, CommonModule], // Agrega RouterModule
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.css']
})
export class InicioComponent {
  // No se necesita lógica especial para la página de bienvenida estática por ahora
}
