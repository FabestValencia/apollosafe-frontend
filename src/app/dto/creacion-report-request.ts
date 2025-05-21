import { Ubicacion } from './ubicacion';

export interface CreacionReportRequest {
  idCliente: string;
  titulo: string;
  descripcion: string;
  categoriasIds: string[]; // Array de IDs de las categorías
  ubicacion: Ubicacion;
  imagenes: string[]; // Array de URLs de imágenes
}