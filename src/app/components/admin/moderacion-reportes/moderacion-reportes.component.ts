import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms'; // Para [(ngModel)] en p-dropdown

import { ReporteService } from '../../../services/reporte.service';
import { ReporteResponse } from '../../../dto/reporte-response'; // Asegúrate que la ruta sea correcta

// PrimeNG
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DropdownModule } from 'primeng/dropdown'; // Para cambiar estado
import { MessageService, ConfirmationService, SelectItem } from 'primeng/api';

@Component({
  selector: 'app-moderacion-reportes',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TableModule, ButtonModule, InputTextModule, TagModule, TooltipModule, ToastModule, ConfirmDialogModule, ProgressSpinnerModule, DropdownModule, DatePipe],
  templateUrl: './moderacion-reportes.component.html',
  styleUrls: ['./moderacion-reportes.component.css'],
  providers: [MessageService, ConfirmationService, DatePipe]
})
export class ModeracionReportesComponent implements OnInit {
  reportes: ReporteResponse[] = [];
  isLoading: boolean = true;

  opcionesEstado: SelectItem[] = [
    // Basado en tu enum EstadoReporte.java, excluyendo ELIMINADO como acción directa aquí
    { label: 'Publicado', value: 'PUBLICADO' },
    { label: 'Verificado', value: 'VERIFICADO' },
    { label: 'Rechazado', value: 'RECHAZADO' },
    { label: 'Resuelto', value: 'RESUELTO' }
  ];

  constructor(
    private reporteService: ReporteService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.cargarTodosReportes();
  }

  cargarTodosReportes(): void {
    this.isLoading = true;
    this.reporteService.listarTodosLosReportes().subscribe({
      next: (data) => {
        // Necesitas que ReporteResponse tenga idCliente para mostrarlo en la tabla.
        // Asumiremos que tu ReporteMapper.java ya fue actualizado.
        this.reportes = data.sort((a,b) => new Date(b.fechaPublicacion).getTime() - new Date(a.fechaPublicacion).getTime());
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.messageService.add({severity:'error', summary:'Error', detail:'No se pudieron cargar los reportes.'});
        console.error("Error al cargar reportes para moderación:", err);
      }
    });
  }

  verDetalleReporte(idReporte: string): void {
    // this.router.navigate(['/reportes', idReporte]); // Si DetalleReporteComponent existe y es público
    // O abrir un modal con más detalles
    this.messageService.add({severity:'info', summary:'Info', detail:`Ver detalle del reporte ${idReporte} (pendiente).`});
  }

  confirmarCambioEstado(reporte: ReporteResponse, nuevoEstado: string): void {
    if (reporte.estadoReporte === nuevoEstado) return; // No hacer nada si el estado es el mismo

    this.confirmationService.confirm({
      message: `¿Estás seguro de cambiar el estado del reporte "<span class="math-inline">\{reporte\.titulo\}" a "</span>{nuevoEstado}"?`,
      header: 'Confirmar Cambio de Estado',
      icon: 'pi pi-info-circle',
      acceptLabel: 'Sí, cambiar estado',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.ejecutarCambioEstado(reporte.idReporte, nuevoEstado);
      },
      reject: () => {
        // Opcional: resetear el valor del dropdown si el usuario cancela
        // Esto es un poco más complejo porque necesitas guardar el estado original antes del cambio.
        // Por ahora, simplemente no hacemos nada.
         this.cargarTodosReportes(); // Recargar para resetear el dropdown visualmente
      }
    });
  }

  ejecutarCambioEstado(idReporte: string, nuevoEstado: string): void {
    this.isLoading = true; // Podría ser un spinner en la fila
    // TODO: Implementar reporteService.actualizarEstadoReporte(idReporte, nuevoEstado)
    // Este método llamará a un endpoint PATCH o PUT en el backend.
    // Ejemplo: this.reporteService.actualizarEstadoReporte(idReporte, { estado: nuevoEstado }).subscribe({ ... });
    console.log(`Simulando cambio de estado para ${idReporte} a ${nuevoEstado}`);
    setTimeout(() => { // Simulación
        const reporteIndex = this.reportes.findIndex(r => r.idReporte === idReporte);
        if (reporteIndex !== -1) {
            this.reportes[reporteIndex].estadoReporte = nuevoEstado;
            this.reportes = [...this.reportes]; // Forzar actualización de la tabla
        }
        this.messageService.add({severity:'success', summary:'Éxito (Simulado)', detail:`Estado del reporte actualizado a ${nuevoEstado}.`});
        this.isLoading = false;
    }, 1000);
  }


  confirmarEliminarReporte(reporte: ReporteResponse): void {
    this.confirmationService.confirm({
      message: `¿Estás seguro de que deseas eliminar el reporte "${reporte.titulo}"? Esta acción es permanente.`,
      header: 'Confirmar Eliminación Definitiva',
      icon: 'pi pi-exclamation-triangle text-danger',
      acceptLabel: 'Sí, eliminar definitivamente',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.eliminarReporte(reporte.idReporte);
      }
    });
  }

  eliminarReporte(idReporte: string): void {
    this.isLoading = true;
    this.reporteService.eliminarReporte(idReporte).subscribe({
      next: () => {
        this.messageService.add({severity:'success', summary:'Éxito', detail:'Reporte eliminado correctamente.'});
        this.cargarTodosReportes(); // Recarga la lista
      },
      error: (err) => {
        this.isLoading = false;
        this.messageService.add({severity:'error', summary:'Error al Eliminar', detail: err.message || 'No se pudo eliminar el reporte.'});
      }
    });
  }

  getEstadoTagSeverity(estado?: string): string {
    if (!estado) return 'info';
    switch (estado.toUpperCase()) {
      case 'PUBLICADO': return 'info';
      case 'VERIFICADO': return 'success';
      case 'RECHAZADO': return 'danger';
      case 'RESUELTO': return 'warning';
      case 'ELIMINADO': return 'contrast';
      default: return 'primary';
    }
  }
}