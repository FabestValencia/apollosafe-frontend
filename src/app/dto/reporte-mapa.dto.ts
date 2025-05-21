// src/app/dto/reporte-mapa.dto.ts
import { Ubicacion } from './ubicacion';

export interface ReporteMapaDTO {
  idReporte: string;
  titulo: string;
  ubicacion: Ubicacion;
  descripcion?: string;
  imagenUrl?: string;
  categoria?: string;
  estadoReporte?: string;
}