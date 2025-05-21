import { Ubicacion } from './ubicacion';

export interface ClienteResponse {
  id: string;
  nombreCompleto: string;
  ciudadResidencia: string;
  telefono: string;
  direccion: Ubicacion;
  email: string;
}