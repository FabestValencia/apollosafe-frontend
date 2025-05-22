// src/app/servicios/mapa.service.ts
import { Injectable } from '@angular/core';
import mapboxgl, { LngLatLike, Map, Marker, Popup } from 'mapbox-gl'; // [cite: 155]
import { Observable, Subject } from 'rxjs'; // [cite: 155]
import { ReporteMapaDTO } from '../dto/reporte-mapa.dto'; // Ajusta la ruta si es necesario

@Injectable({
  providedIn: 'root'
})
export class MapaService {
  private map!: Map; // [cite: 156]
  private marcadoresAnteriores: Marker[] = []; // Para gestionar los marcadores en el mapa [cite: 156]
  private posicionActual: LngLatLike = [-75.67270, 4.53252]; // Coordenadas de Armenia, Quindío por defecto [cite: 156]
  private accessToken = 'pk.eyJ1IjoiZmFiZXN0MjMwNCIsImEiOiJjbWF5Z3d1enkwNWhzMmpxMGc4eXRtZWFsIn0.WJ6XDG4BD0yWu1FcD_0A8g'; // ¡¡¡REEMPLAZA ESTO!!! [cite: 157, 165]

  // Subject para emitir la ubicación cuando se hace clic o se arrastra un marcador en el mapa de creación/edición
  private marcadorUbicacionSubject = new Subject<mapboxgl.LngLat>();
  marcadorUbicacion$ = this.marcadorUbicacionSubject.asObservable();

  // Subject para emitir la instancia del mapa una vez que está listo
  private mapaListoSubject = new Subject<void>();
  mapaListo$ = this.mapaListoSubject.asObservable();

  constructor() {
    // Es buena práctica configurar el token de acceso una sola vez.
    // Mapbox GL JS lo almacenará internamente.
    // Si no tienes un token aquí, Mapbox tratará de buscarlo en mapboxgl.accessToken
    // Si el accessToken está vacío o no es válido, Mapbox no funcionará.
    if (this.accessToken && this.accessToken !== 'pk.eyJ1IjoiZmFiZXN0MjMwNCIsImEiOiJjbWF5Z3d1enkwNWhzMmpxMGc4eXRtZWFsIn0.WJ6XDG4BD0yWu1FcD_0A8g') {
      mapboxgl.accessToken = this.accessToken;
    } else {
      console.error('Mapbox Access Token no está configurado en MapaService.');
    }
  }

  public crearMapa(
    containerId: string,
    center?: LngLatLike,
    zoom?: number,
    pitch?: number,
    interactive: boolean = true,
    conSeleccionUbicacion: boolean = false // Nuevo parámetro para indicar si el mapa es para selección
  ): void {
    if (!mapboxgl.accessToken) {
      console.error('Mapbox Access Token no está configurado. El mapa no se puede crear.');
      return;
    }

    if (this.map) {
      this.map.remove();
    }

    this.map = new mapboxgl.Map({
      container: containerId, // [cite: 157]
      style: 'mapbox://styles/mapbox/streets-v12', // Estilo estándar, puedes cambiarlo [cite: 157]
      center: center || this.posicionActual, // [cite: 157]
      zoom: zoom || 15,
      pitch: pitch || 45, // [cite: 157]
      interactive: interactive
    });

    this.map.addControl(new mapboxgl.NavigationControl()); // [cite: 157]
    this.map.addControl(
      new mapboxgl.GeolocateControl({ // [cite: 158]
        positionOptions: { enableHighAccuracy: true }, // [cite: 158]
        trackUserLocation: true, // [cite: 158]
        showUserHeading: true
      })
    );

    this.map.on('load', () => {
      this.mapaListoSubject.next(); // Emite que el mapa está listo
      if (conSeleccionUbicacion) {
        this.configurarSeleccionUbicacion();
      }
    });
  }

  private configurarSeleccionUbicacion(): void {
    if (!this.map) return;

    this.map.on('click', (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] | undefined; }) => {
      this.limpiarMarcadoresPreviosSeleccion();

      const coords = e.lngLat;
      const nuevoMarcador = new mapboxgl.Marker({ color: 'red', draggable: true })
        .setLngLat(coords)
        .addTo(this.map);

      this.marcadoresAnteriores.push(nuevoMarcador); // Gestiona este marcador específico
      this.marcadorUbicacionSubject.next(coords);

      nuevoMarcador.on('dragend', () => {
        const lngLat = nuevoMarcador.getLngLat();
        this.marcadorUbicacionSubject.next(lngLat);
      });
    });
  }

  // Limpia solo el marcador de selección de ubicación
  private limpiarMarcadoresPreviosSeleccion(): void {
    this.marcadoresAnteriores.forEach(marcador => marcador.remove());
    this.marcadoresAnteriores = [];
  }

  // Coloca un marcador en el mapa de creación si ya hay una ubicación
  public colocarMarcadorEditable(ubicacion: LngLatLike | null): void {
    if (!this.map || !ubicacion) return;

    this.limpiarMarcadoresPreviosSeleccion(); // Limpia cualquier marcador anterior

    const marcador = new mapboxgl.Marker({ color: 'red', draggable: true })
      .setLngLat(ubicacion)
      .addTo(this.map);

    this.marcadoresAnteriores.push(marcador); // Añade a la lista de marcadores de selección

    marcador.on('dragend', () => {
      const lngLat = marcador.getLngLat();
      this.marcadorUbicacionSubject.next(lngLat);
    });
  }


  public pintarMarcadoresVisualizacion(reportes: ReporteMapaDTO[]): void { // Renombrado para claridad [cite: 161]
    if (!this.map) {
      console.warn('Mapa no inicializado al intentar pintar marcadores.');
      return;
    }

    // Limpiar SOLO los marcadores de visualización, no los de selección si es otro mapa.
    // Esta función asume que this.map es el mapa de visualización.
    // Si usas la misma instancia de mapa para todo, necesitas una mejor gestión de marcadores.
    // Por ahora, vamos a asumir que se llama en el contexto del mapa de inicio/visualización.
    this.marcadoresAnteriores.forEach(marcador => marcador.remove());
    this.marcadoresAnteriores = [];

    reportes.forEach(reporte => {
      if (!reporte.ubicacion || typeof reporte.ubicacion.longitud !== 'number' || typeof reporte.ubicacion.latitud !== 'number') {
        console.warn('Reporte con ubicación inválida o faltante:', reporte);
        return; // Saltar este reporte
      }

      const popupContent = `
        <div style="max-width: 280px; font-family: Arial, sans-serif; font-size: 14px;">
          <h6 class="mb-1" style="font-size: 16px; color: #333; margin-top:0;">${reporte.titulo || 'Reporte'}</h6>
          ${reporte.imagenUrl ? `<img src="${reporte.imagenUrl}" alt="${reporte.titulo}" class="img-fluid rounded mb-2" style="max-height: 120px; width: 100%; object-fit: cover; border: 1px solid #eee;">` : ''}
          <p class="mb-1 small" style="font-size: 13px; color: #555;">${reporte.descripcion ? reporte.descripcion.substring(0, 70) + (reporte.descripcion.length > 70 ? '...' : '') : 'Sin descripción.'}</p>
          <div class="mt-1">
            ${reporte.categoria ? `<span class="badge bg-secondary me-1" style="font-size: 11px; padding: 3px 6px;">${reporte.categoria}</span>` : ''}
            ${reporte.estadoReporte ? `<span class="badge" style="font-size: 11px; padding: 3px 6px; background-color: ${this.getHexColorPorEstado(reporte.estadoReporte)}; color: white;">${reporte.estadoReporte}</span>` : ''}
          </div>
          <a href="/reportes/${reporte.idReporte}" target="_blank" class="btn btn-sm btn-link p-0 mt-2" style="font-size: 13px; text-decoration: none;">Ver detalles</a>
        </div>
      `; // [cite: 179]

      const marker = new mapboxgl.Marker({ color: this.getHexColorPorEstado(reporte.estadoReporte) }) // [cite: 161]
        .setLngLat([reporte.ubicacion.longitud, reporte.ubicacion.latitud]) // [cite: 161]
        .setPopup(new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(popupContent))
        .addTo(this.map); // [cite: 161]
      this.marcadoresAnteriores.push(marker); // Gestionar estos marcadores
    });
  }

  private getHexColorPorEstado(estado?: string): string {
    switch (estado?.toUpperCase()) {
      case 'PUBLICADO': return '#007bff'; // Azul (Bootstrap primary)
      case 'VERIFICADO': return '#28a745'; // Verde (Bootstrap success)
      case 'RECHAZADO': return '#dc3545'; // Rojo (Bootstrap danger)
      case 'RESUELTO': return '#6c757d';  // Gris (Bootstrap secondary)
      case 'ELIMINADO': return '#343a40'; // Negro/Gris Oscuro (Bootstrap dark)
      default: return '#ffc107'; // Amarillo (Bootstrap warning) para estados desconocidos o por defecto
    }
  }

  public centrarMapaEn(coordenadas: LngLatLike, zoomLevel?: number): void {
    if (this.map) {
      this.map.flyTo({
        center: coordenadas,
        zoom: zoomLevel || 15,
        essential: true // Asegura que la animación ocurra
      });
    }
  }

  public obtenerCentroActual(): LngLatLike | undefined {
    return this.map?.getCenter();
  }

  public obtenerZoomActual(): number | undefined {
    return this.map?.getZoom();
  }

  public removerMapa(): void {
    if (this.map) {
      this.map.remove();
      // @ts-ignore
      this.map = undefined; // Ayuda al recolector de basura
    }
    this.marcadoresAnteriores.forEach(m => m.remove());
    this.marcadoresAnteriores = [];
  }
}