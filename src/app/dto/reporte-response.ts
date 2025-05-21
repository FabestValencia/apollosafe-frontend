// src/app/dto/reporte-response.ts
import { Ubicacion } from './ubicacion';

export interface ReporteResponse {
  idReporte: string;
  titulo: string;
  descripcion: string;
  categorias: string[]; // Nombres de las categorías
  comentarios: string[]; // IDs o lista simplificada de comentarios (el backend devuelve List<String>)
  ubicacion: Ubicacion;
  imagenes: string[];
  fechaPublicacion: string; // O tipo Date
  estadoReporte?: string; // Añadido basado en el modelo Reporte.java (EstadoReporte estadoReporte)
                           // y la necesidad de mostrarlo en el mapa. Confirma si este campo
                           // se incluye en la respuesta del backend.
}