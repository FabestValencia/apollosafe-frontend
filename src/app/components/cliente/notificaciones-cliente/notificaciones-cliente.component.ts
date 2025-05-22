import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common'; // DatePipe
import { NotificacionService } from '../../../services/notificacion.service';
import { NotificacionDTO } from '../../../dto/notificacion.dto';

// PrimeNG
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip'; // Para pTooltip
import { MessageService } from 'primeng/api';


@Component({
  selector: 'app-notificaciones-cliente',
  standalone: true,
  imports: [
    CommonModule,
    ProgressSpinnerModule,
    ButtonModule,
    ToastModule,
    TooltipModule,
    DatePipe // Añadir DatePipe
  ],
  templateUrl: './notificaciones-cliente.component.html',
  styleUrls: ['./notificaciones-cliente.component.css'],
  providers: [MessageService, DatePipe] // Añadir DatePipe
})
export class NotificacionesClienteComponent implements OnInit {
  notificaciones: NotificacionDTO[] = [];
  isLoading: boolean = true;

  constructor(
    private notificacionService: NotificacionService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.cargarNotificaciones();
  }

  cargarNotificaciones(): void {
    this.isLoading = true;
    this.notificacionService.getMisNotificaciones().subscribe({
      next: (data) => {
        this.notificaciones = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las notificaciones.' });
        console.error(err);
      }
    });
  }

  marcarLeida(notificacion: NotificacionDTO): void {
    if (notificacion.leido) return;

    this.notificacionService.marcarComoLeida(notificacion.idNotificacion).subscribe({
      next: () => {
        notificacion.leido = true; // Actualizar UI inmediatamente
        // Opcional: recargar notificaciones this.cargarNotificaciones();
        this.messageService.add({ severity: 'success', summary: 'Leída', detail: 'Notificación marcada como leída.' });
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo marcar como leída.' });
      }
    });
  }

  marcarTodasLeidas(): void {
    this.notificacionService.marcarTodasComoLeidas().subscribe({
        next: () => {
            this.notificaciones.forEach(n => n.leido = true);
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Todas las notificaciones marcadas como leídas.' });
        },
        error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron marcar todas como leídas.' });
        }
    });
  }

  hayNotificacionesNoLeidas(): boolean {
    return this.notificaciones.some(n => !n.leido);
  }
}
