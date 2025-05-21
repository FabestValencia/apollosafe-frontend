import { Component } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router'; // Importa RouterModule

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule], // Añade RouterModule aquí
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'apollosafe-frontend';
  footer = 'Universidad del Quindío - ApolloSafe'; // Variable para el pie de página [cite: 410]
}
