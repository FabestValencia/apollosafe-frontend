import { Component, OnInit, OnDestroy, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { MapaService } from '../../services/mapa.service';
import { CategoriaService } from '../../services/categoria.service';
import { ReporteService } from '../../services/reporte.service';
import { ClienteService } from '../../services/cliente.service'; // Asumiendo que tienes este servicio

import { CategoriaResponse } from '../../dto/categoria-response';
import { ReporteMapaDTO } from '../../dto/reporte-mapa.dto';
import { Ubicacion } from '../../dto/ubicacion';

// PrimeNG
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';


@Component({
  selector: 'app-home-cliente',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule, // Para routerLink, routerLinkActive
    RouterOutlet, // Para el outlet secundario donde se cargarán las vistas hijas
    ReactiveFormsModule,
    ProgressSpinnerModule,
    ToastModule
  ],
  templateUrl: './home-cliente.component.html',
  styleUrls: ['./home-cliente.component.css'],
  providers: [MessageService]
})
export class HomeClienteComponent implements OnInit, AfterViewInit, OnDestroy {
  nombreUsuario: string | null = null;
  tieneNotificacionesNuevas: boolean = false; // Simulado, debería venir de un servicio

  preferenciasForm!: FormGroup;
  categoriasDisponibles: CategoriaResponse[] = [];
  isLoadingCategorias: boolean = false;
  isLoadingReportes: boolean = false;

  private mapaSub!: Subscription;
  private marcadorSub!: Subscription;
  private clienteId: string | null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder,
    private mapaService: MapaService,
    private categoriaService: CategoriaService,
    private reporteService: ReporteService,
    private clienteService: ClienteService, // Inyectar ClienteService
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {
    this.clienteId = this.authService.getCurrentUserId(); // Obtener el ID del cliente (email)
  }

  ngOnInit(): void {
    this.nombreUsuario = this.authService.getCurrentUserId(); // O un nombre más amigable si lo tienes

    this.preferenciasForm = this.fb.group({
      ubicacionTexto: [{ value: 'Mi ubicación actual', disabled: true }], // Solo visual
      ubicacionCoords: [null as Ubicacion | null], // Aquí guardaremos el objeto Ubicacion
      radioKm: [5, [Validators.required, Validators.min(1), Validators.max(50)]],
      notificacionesPush: [true],
      categoriasInteres: this.fb.array([])
    });

    this.cargarCategorias();
    // this.cargarPreferenciasCliente(); // Se llamará después de cargar categorías si se implementa
    // this.cargarReportesParaMapa(); // Se llamará en ngAfterViewInit cuando el mapa esté listo

    this.marcadorSub = this.mapaService.marcadorUbicacion$.subscribe(coords => {
      const nuevaUbicacion: Ubicacion = { latitud: coords.lat, longitud: coords.lng };
      this.preferenciasForm.get('ubicacionCoords')?.setValue(nuevaUbicacion);
      this.preferenciasForm.get('ubicacionTexto')?.setValue(`Lat: ${coords.lat.toFixed(4)}, Lng: ${coords.lng.toFixed(4)}`);
      this.preferenciasForm.markAsDirty(); // Marcar el form como dirty para habilitar guardar
      this.cdr.detectChanges();
    });
  }

  ngAfterViewInit(): void {
     if (this.mapaSub) { this.mapaSub.unsubscribe(); } // Desuscribir si ya existe
     this.mapaSub = this.mapaService.mapaListo$.subscribe(() => {
         const prefsUbicacion = this.preferenciasForm.get('ubicacionCoords')?.value as Ubicacion | null;
         if (prefsUbicacion && typeof prefsUbicacion.latitud === 'number' && typeof prefsUbicacion.longitud === 'number') {
             const mapboxCoords: [number, number] = [prefsUbicacion.longitud, prefsUbicacion.latitud];
             this.mapaService.centrarMapaEn(mapboxCoords);
             this.mapaService.colocarMarcadorEditable(mapboxCoords);
         }
         // Cargar reportes una vez que el mapa está listo
         this.cargarReportesParaMapa();
     });
     this.mapaService.crearMapa('mapaClienteDashboard', undefined, 13, undefined, true, false);
  }

  get categoriasInteresFormArray() {
    return this.preferenciasForm.get('categoriasInteres') as FormArray;
  }

  cargarCategorias(): void {
    this.isLoadingCategorias = true;
    this.categoriaService.listarCategoriasActivas().subscribe({
      next: (cats) => {
        this.categoriasDisponibles = cats;
        this.categoriasInteresFormArray.clear(); // Limpiar array antes de añadir
        this.categoriasDisponibles.forEach(() => this.categoriasInteresFormArray.push(new FormControl(false)));
        this.isLoadingCategorias = false;
        // this.cargarPreferenciasCliente(); // Ahora carga las preferencias después de tener las categorías
      },
      error: (err) => {
        this.isLoadingCategorias = false;
        this.messageService.add({ severity: 'error', summary: 'Error Categorías', detail: 'No se pudieron cargar las categorías.' });
      }
    });
  }

  seleccionarUbicacionEnMapa(): void {
     this.messageService.add({ severity: 'info', summary: 'Fijar Ubicación', detail: 'Haz clic o arrastra el marcador en el mapa para fijar tu ubicación de notificaciones.' });
     const currentCoordsPreferencias = this.preferenciasForm.get('ubicacionCoords')?.value as Ubicacion | null;

     let coordsParaMarcador: [number, number] | undefined;

     if (currentCoordsPreferencias && typeof currentCoordsPreferencias.longitud === 'number' && typeof currentCoordsPreferencias.latitud === 'number') {
         coordsParaMarcador = [currentCoordsPreferencias.longitud, currentCoordsPreferencias.latitud];
     } else {
         const centroActualMapaLike: mapboxgl.LngLatLike | undefined = this.mapaService.obtenerCentroActual();
         let centroActualMapa: mapboxgl.LngLat | undefined;
         if (centroActualMapaLike) {
             // Convertir a LngLat si es necesario
             if (centroActualMapaLike instanceof (window as any).mapboxgl.LngLat) {
                 centroActualMapa = centroActualMapaLike as mapboxgl.LngLat;
             } else if (Array.isArray(centroActualMapaLike)) {
                 centroActualMapa = new (window as any).mapboxgl.LngLat(centroActualMapaLike[0], centroActualMapaLike[1]);
             } else if (typeof centroActualMapaLike === 'object' && centroActualMapaLike !== null && 'lng' in centroActualMapaLike && 'lat' in centroActualMapaLike) {
                 centroActualMapa = new (window as any).mapboxgl.LngLat(centroActualMapaLike.lng, centroActualMapaLike.lat);
             }
         }
         if (centroActualMapa) {
             coordsParaMarcador = [centroActualMapa.lng, centroActualMapa.lat];
         }
     }

     if (coordsParaMarcador) {
         this.mapaService.colocarMarcadorEditable(coordsParaMarcador);
         this.mapaService.centrarMapaEn(coordsParaMarcador);
     } else {
         this.messageService.add({ severity: 'warn', summary: 'Ubicación no disponible', detail: 'No se pudo determinar una ubicación inicial para el marcador.' });
     }
  }

  guardarPreferencias(): void {
    if (this.preferenciasForm.invalid) {
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Verifica los datos del formulario de preferencias.' });
      this.preferenciasForm.markAllAsTouched();
      return;
    }
    if (!this.clienteId) {
        this.messageService.add({ severity: 'error', summary: 'Error Usuario', detail: 'No se pudo identificar al usuario.' });
        return;
    }

    const formValue = this.preferenciasForm.getRawValue();
    const idsCategoriasSeleccionadas = this.categoriasDisponibles
      .filter((cat, index) => formValue.categoriasInteres[index])
      .map(cat => cat.idCategoria);

    const preferenciasAGuardar = {
      ubicacionNotificaciones: formValue.ubicacionCoords as Ubicacion | null,
      radioKmNotificaciones: formValue.radioKm,
      idsCategoriasInteres: idsCategoriasSeleccionadas,
      notificacionesPushActivas: formValue.notificacionesPush
    };

    console.log('Guardando preferencias (simulado):', preferenciasAGuardar);
    // TODO: Implementar this.clienteService.actualizarPreferencias(this.clienteId, preferenciasAGuardar)
    // cuando el backend esté listo para esto.
    this.messageService.add({ severity: 'info', summary: 'Simulación', detail: 'Preferencias guardadas (simulado).' });
    this.preferenciasForm.markAsPristine(); // Marcar como no modificado después de guardar
  }

  cargarReportesParaMapa(): void {
    this.isLoadingReportes = true;
    this.reporteService.listarTodosLosReportes().subscribe({ // O un método más específico
      next: (reportes) => {
        const reportesMapa: ReporteMapaDTO[] = reportes.map(r => ({
          idReporte: r.idReporte,
          titulo: r.titulo,
          ubicacion: r.ubicacion,
          descripcion: r.descripcion,
          imagenUrl: r.imagenes && r.imagenes.length > 0 ? r.imagenes[0] : undefined,
          categoria: r.categorias && r.categorias.length > 0 ? r.categorias.join(', ') : undefined,
          estadoReporte: r.estadoReporte
        }));
        this.mapaService.pintarMarcadoresVisualizacion(reportesMapa);
        this.isLoadingReportes = false;
      },
      error: (err) => {
        this.isLoadingReportes = false;
        this.messageService.add({ severity: 'error', summary: 'Error Mapa', detail: 'No se pudieron cargar los reportes en el mapa.' });
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }

  ngOnDestroy(): void {
    this.mapaService.removerMapa();
    if (this.mapaSub) this.mapaSub.unsubscribe();
    if (this.marcadorSub) this.marcadorSub.unsubscribe();
  }
}