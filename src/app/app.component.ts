// src/app/app.component.ts
import { Component } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router'; // Ambas importaciones

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,   // Para que <router-outlet> funcione
    RouterModule,   // Para que routerLink en app.component.html funcione (si lo usas ahí)
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  // ...
}