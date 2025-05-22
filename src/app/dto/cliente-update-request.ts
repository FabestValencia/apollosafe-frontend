import { Ubicacion } from './ubicacion';

export interface ClienteUpdateRequest {
  nombreCompleto?: string; // El '?' indica que el campo es opcional
  ciudadResidencia?: string;
  telefono?: string;
  direccion?: Ubicacion; // Mantenemos Ubicacion si quieres actualizar lat/lng con el mapa
  contrasena?: string;   // Solo se enviará si el usuario ingresa una nueva
}