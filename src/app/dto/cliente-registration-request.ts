import { Ubicacion } from './ubicacion';

export interface ClienteRegistrationRequest {
  nombreCompleto: string;
  ciudadResidencia: string;
  telefono: string;
  direccion: Ubicacion;
  email: string;
  contrasena: string;
}