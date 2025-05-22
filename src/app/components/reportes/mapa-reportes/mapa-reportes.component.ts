import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

import { MapaService } from '../../../services/mapa.service';
import { ReporteService } from '../../../services/reporte.service';
import { ReporteMapaDTO } from '../../../dto/reporte-mapa.dto';
import { ReporteResponse } from '../../../dto/reporte-response'; // Asumiendo que usas este

import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-mapa-reportes',
  standalone: true,
  imports: [CommonModule, ProgressSpinnerModule, ToastModule],
  templateUrl: './mapa-reportes.component.html',
  styleUrls: ['./mapa-reportes.component.css'],
  providers: [MessageService]
})
export class MapaReportesComponent implements OnInit, AfterViewInit, OnDestroy {
  isLoading: boolean = true;
  reportesParaMapa: ReporteMapaDTO[] = [];
  private mapaSub!: Subscription;

  constructor(
    private mapaService: MapaService,
    private reporteService: ReporteService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    // La carga de reportes se hará después de que el mapa esté listo en ngAfterViewInit
  }

  ngAfterViewInit(): void {
    if (this.mapaSub) { this.mapaSub.unsubscribe(); }
    this.mapaSub = this.mapaService.mapaListo$.subscribe(() => {
      this.cargarReportesPublicos();
    });
    // Crear el mapa. El ID debe coincidir con el del HTML.
    // interactive = true, conSeleccionUbicacion = false
    this.mapaService.crearMapa('mapaPublicoReportes', undefined, 12, 0, true, false);
  }

  cargarReportesPublicos(): void {
    this.isLoading = true;
    this.reporteService.listarTodosLosReportes().subscribe({
      next: (reportes: ReporteResponse[]) => {
        this.reportesParaMapa = reportes.map(r => ({
          idReporte: r.idReporte,
          titulo: r.titulo,
          ubicacion: r.ubicacion,
          descripcion: r.descripcion,
          imagenUrl: r.imagenes && r.imagenes.length > 0 ? r.imagenes[0] : undefined,
          categoria: r.categorias && r.categorias.length > 0 ? r.categorias.join(', ') : 'General',
          estadoReporte: r.estadoReporte || 'Publicado' // Asumir 'Publicado' si no viene
        }));
        this.mapaService.pintarMarcadoresVisualizacion(this.reportesParaMapa);
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los reportes.' });
        console.error(err);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.mapaSub) {
      this.mapaSub.unsubscribe();
    }
    this.mapaService.removerMapa();
  }
}
