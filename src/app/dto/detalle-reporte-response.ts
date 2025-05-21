import { ReporteResponse } from './reporte-response';
import { ComentarioResponse } from './comentario-response';

export interface DetalleReporteResponse {
  reporte: ReporteResponse;
  comentarios: ComentarioResponse[];
}