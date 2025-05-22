import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router'; // RouterModule para routerLink
import { CommonModule, DatePipe } from '@angular/common'; // DatePipe
import { FormsModule } from '@angular/forms'; // Para [(ngModel)]
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subject } from 'rxjs';


import { ReporteService } from '../../../services/reporte.service';
import { AuthService } from '../../../services/auth.service';
import { CategoriaService } from '../../../services/categoria.service'; // Para el filtro de categorías
import { ReporteResponse } from '../../../dto/reporte-response';
import { CategoriaResponse } from '../../../dto/categoria-response'; // Para el filtro

// PrimeNG
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DropdownModule } from 'primeng/dropdown'; // Para filtros
import { CalendarModule } from 'primeng/calendar'; // Para filtros de fecha

@Component({
  selector: 'app-mis-reportes',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule, // Necesario para [(ngModel)]
    TableModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    TooltipModule,
    ProgressSpinnerModule,
    ToastModule,
    ConfirmDialogModule,
    DropdownModule,
    CalendarModule,
    DatePipe
  ],
  templateUrl: './mis-reportes.component.html',
  styleUrls: ['./mis-reportes.component.css'],
  providers: [MessageService, ConfirmationService, DatePipe]
})
export class MisReportesComponent implements OnInit, OnDestroy {
  reportesOriginales: ReporteResponse[] = [];
  reportesFiltrados: ReporteResponse[] = [];
  isLoadingReportes: boolean = true;
  terminoBusqueda: string = '';

  private clienteId: string | null = null;
  private busquedaSubject = new Subject<string>();
  private busquedaSubscription!: Subscription;

  // Para filtros
  mostrarPanelFiltro: boolean = false;
  categoriasFiltro: CategoriaResponse[] = [];
  estadosFiltro: any[] = [ // Podrías obtenerlos del enum EstadoReporte.java
      { label: 'Publicado', value: 'PUBLICADO' },
      { label: 'Verificado', value: 'VERIFICADO' },
      { label: 'Rechazado', value: 'RECHAZADO' },
      { label: 'Resuelto', value: 'RESUELTO' },
      { label: 'Eliminado', value: 'ELIMINADO' }
  ];
  categoriaSeleccionadaFiltro: string | null = null;
  estadoSeleccionadoFiltro: string | null = null;
  fechaDesdeFiltro: Date | null = null;
  fechaHastaFiltro: Date | null = null;


  constructor(
    private reporteService: ReporteService,
    private authService: AuthService,
    private categoriaService: CategoriaService, // Para el filtro
    private router: Router,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.clienteId = this.authService.getCurrentUserId();
    if (this.clienteId) {
      this.cargarReportesCliente();
      this.cargarCategoriasParaFiltro();
    } else {
      this.isLoadingReportes = false;
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo identificar al usuario.'});
    }

    this.busquedaSubscription = this.busquedaSubject.pipe(
      debounceTime(300), // Espera 300ms después de la última pulsación
      distinctUntilChanged() // Solo emite si el valor cambió
    ).subscribe(() => {
      this.aplicarFiltros();
    });
  }

  cargarReportesCliente(): void {
    this.isLoadingReportes = true;
    if (!this.clienteId) return;

    this.reporteService.listarReportesCliente(this.clienteId).subscribe({
      next: (data) => {
        this.reportesOriginales = data.sort((a, b) => new Date(b.fechaPublicacion).getTime() - new Date(a.fechaPublicacion).getTime());
        this.aplicarFiltros(); // Aplicar filtros iniciales (o solo búsqueda si no hay filtros activos)
        this.isLoadingReportes = false;
      },
      error: (err) => {
        this.isLoadingReportes = false;
        this.messageService.add({ severity: 'error', summary: 'Error al cargar reportes', detail: err.message || 'No se pudieron obtener tus reportes.'});
        console.error(err);
      }
    });
  }

  cargarCategoriasParaFiltro(): void {
    this.categoriaService.listarCategoriasActivas().subscribe({
      next: (categorias) => {
        this.categoriasFiltro = categorias;
      },
      error: (err) => {
        console.error('Error al cargar categorías para filtro:', err);
      }
    });
  }

  filtrarReportes(): void {
    this.busquedaSubject.next(this.terminoBusqueda);
  }

  aplicarFiltros(): void {
    let reportesTemp = [...this.reportesOriginales];

    // Filtrar por término de búsqueda (título o descripción)
    if (this.terminoBusqueda) {
      const busquedaLower = this.terminoBusqueda.toLowerCase();
      reportesTemp = reportesTemp.filter(r =>
        r.titulo.toLowerCase().includes(busquedaLower) ||
        r.descripcion.toLowerCase().includes(busquedaLower)
      );
    }

    // Filtrar por categoría
    if (this.categoriaSeleccionadaFiltro) {
      reportesTemp = reportesTemp.filter(r => r.categorias.some(cat =>
        // Asumimos que `r.categorias` es un array de strings (nombres de categorías)
        // y `this.categoriaSeleccionadaFiltro` es el ID de la categoría.
        // Necesitaríamos mapear ID a nombre o asegurar que `r.categorias` contenga IDs si filtramos por ID.
        // Por ahora, si `r.categorias` son nombres:
        {
          const categoriaObj = this.categoriasFiltro.find(cf => cf.idCategoria === this.categoriaSeleccionadaFiltro);
          return categoriaObj && r.categorias.includes(categoriaObj.nombre);
        }
      ));
    }

    // Filtrar por estado
    if (this.estadoSeleccionadoFiltro) {
      reportesTemp = reportesTemp.filter(r => r.estadoReporte === this.estadoSeleccionadoFiltro);
    }

    // Filtrar por fecha desde
    if (this.fechaDesdeFiltro) {
        const fechaDesdeTimestamp = this.fechaDesdeFiltro.getTime();
        reportesTemp = reportesTemp.filter(r => new Date(r.fechaPublicacion).getTime() >= fechaDesdeTimestamp);
    }

    // Filtrar por fecha hasta (ajustar para incluir todo el día hasta)
    if (this.fechaHastaFiltro) {
        const fechaHasta = new Date(this.fechaHastaFiltro);
        fechaHasta.setHours(23, 59, 59, 999); // Fin del día
        const fechaHastaTimestamp = fechaHasta.getTime();
        reportesTemp = reportesTemp.filter(r => new Date(r.fechaPublicacion).getTime() <= fechaHastaTimestamp);
    }


    this.reportesFiltrados = reportesTemp;
  }

  aplicarFiltrosDesdePanel(): void {
    this.aplicarFiltros();
  }

  limpiarFiltrosPanel(): void {
    this.categoriaSeleccionadaFiltro = null;
    this.estadoSeleccionadoFiltro = null;
    this.fechaDesdeFiltro = null;
    this.fechaHastaFiltro = null;
    this.aplicarFiltros(); // Volver a aplicar para mostrar todos (o solo con búsqueda)
  }


  togglePanelFiltro(): void {
    this.mostrarPanelFiltro = !this.mostrarPanelFiltro;
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

  // La "Importancia" no viene en el DTO ReporteResponse.
  // Se tendría que añadir al DTO o inferirla si es posible.
  // getImportancia(reporte: ReporteResponse): string { return 'Medium'; } // Placeholder
  // getImportanciaTagSeverity(importancia: string): string {
  //   if (importancia === 'High') return 'danger';
  //   if (importancia === 'Medium') return 'warning';
  //   if (importancia === 'Low') return 'success'; // o 'info'
  //   return 'primary';
  // }

  editarReporte(idReporte: string): void {
    // Lógica para editar el reporte. Podrías:
    // 1. Navegar a una ruta de edición similar a CrearReporteComponent pero para actualizar.
    //    ej. this.router.navigate(['/reportes/editar', idReporte]);
    // 2. Abrir un modal con el formulario de edición.
    this.messageService.add({ severity: 'info', summary: 'Próximamente', detail: `Funcionalidad para editar reporte ${idReporte} no implementada.`});
    console.log('Editar reporte con ID:', idReporte);
  }

  confirmarEliminacion(idReporte: string): void {
    this.confirmationService.confirm({
      message: '¿Estás seguro de que deseas eliminar este reporte? Esta acción no se puede deshacer.',
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.eliminarReporte(idReporte);
      }
    });
  }

  eliminarReporte(idReporte: string): void {
    this.isLoadingReportes = true; // Podrías tener un spinner específico para la fila
    this.reporteService.eliminarReporte(idReporte).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'El reporte ha sido eliminado.' });
        this.cargarReportesCliente(); // Recargar la lista
      },
      error: (err) => {
        this.isLoadingReportes = false;
        this.messageService.add({ severity: 'error', summary: 'Error al eliminar', detail: err.message || 'No se pudo eliminar el reporte.' });
        console.error(err);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.busquedaSubscription) {
      this.busquedaSubscription.unsubscribe();
    }
  }
}
