import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router'; // RouterModule para routerLink
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';

// PrimeNG para mensajes o spinners
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-verificacion-email',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule, // Para routerLink si lo usas en la plantilla
    ProgressSpinnerModule,
    ToastModule
  ],
  templateUrl: './verificacion-email.component.html',
  styleUrls: ['./verificacion-email.component.css'],
  providers: [MessageService]
})
export class VerificacionEmailComponent implements OnInit {
  isLoading: boolean = true;
  mensaje: string = '';
  esError: boolean = false;
  token: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private messageService: MessageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token'); // Obtener token de los queryParams

    if (this.token) {
      this.authService.verificarCuenta(this.token).subscribe({
        next: (respuestaDelBackend) => {
          this.isLoading = false;
          this.esError = false;
          this.mensaje = respuestaDelBackend; // El backend devuelve un String
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: this.mensaje });
          // Opcional: redirigir al login después de unos segundos
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 5000); // Redirige después de 5 segundos
        },
        error: (err) => {
          this.isLoading = false;
          this.esError = true;
          // El backend para un token inválido/expirado en JwtUtil devuelve "Token inválido o expirado"
          // y ResourceNotFoundException si el cliente no se encuentra.
          // Estos errores son manejados por handleError en AuthService que extrae err.message o el string de error.error
          this.mensaje = err.message || 'Ocurrió un error al verificar la cuenta.';
          this.messageService.add({ severity: 'error', summary: 'Error de Verificación', detail: this.mensaje });
        }
      });
    } else {
      this.isLoading = false;
      this.esError = true;
      this.mensaje = 'Token de verificación no proporcionado o inválido.';
      this.messageService.add({ severity: 'error', summary: 'Error', detail: this.mensaje });
    }
  }
}