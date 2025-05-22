import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs'; // 'of' para simular datos
import { NotificacionDTO } from '../dto/notificacion.dto';
import { AuthService } from './auth.service'; // Para obtener el id del cliente

@Injectable({
  providedIn: 'root'
})
export class NotificacionService {
  private apiUrl = 'http://localhost:8080/api/notificaciones'; // URL base de tu API de notificaciones (ejemplo)

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  // Obtener notificaciones para el usuario actual (ejemplo con endpoint REST)
  getMisNotificaciones(): Observable<NotificacionDTO[]> {
    const clienteId = this.authService.getCurrentUserId();
    if (!clienteId) {
      return of([]); // No hay usuario, no hay notificaciones
    }
    // TODO: Reemplazar con la llamada real al backend cuando el endpoint exista
    // return this.http.get<NotificacionDTO[]>(`${this.apiUrl}/cliente/${clienteId}`);

    // Datos simulados por ahora:
    const simulatedNotificaciones: NotificacionDTO[] = [
      { idNotificacion: '1', idClienteDestino: clienteId, descripcion: 'Tu reporte "Hueco en la vía principal" ha sido actualizado a VERIFICADO.', leido: false, fechaPublicacion: new Date(Date.now() - 3600000).toISOString() },
      { idNotificacion: '2', idClienteDestino: clienteId, descripcion: 'Nuevo comentario en tu reporte "Poste de luz caído".', leido: true, fechaPublicacion: new Date(Date.now() - 86400000).toISOString() },
      { idNotificacion: '3', idClienteDestino: clienteId, descripcion: '¡Bienvenido a UQAlerta! Completa tu perfil para una mejor experiencia.', leido: false, fechaPublicacion: new Date(Date.now() - 172800000).toISOString() },
      { idNotificacion: '4', idClienteDestino: clienteId, descripcion: 'Recordatorio: La zona cerca a la biblioteca estará cerrada mañana por mantenimiento.', leido: true, fechaPublicacion: new Date(Date.now() - 259200000).toISOString() },
    ];
    return of(simulatedNotificaciones.sort((a,b) => new Date(b.fechaPublicacion).getTime() - new Date(a.fechaPublicacion).getTime()));
  }

  // Marcar una notificación como leída (ejemplo con endpoint REST)
  marcarComoLeida(idNotificacion: string): Observable<any> {
    // TODO: Reemplazar con la llamada real al backend
    // return this.http.patch(`${this.apiUrl}/${idNotificacion}/leida`, {});
    console.log(`Simulando marcar notificación ${idNotificacion} como leída`);
    return of({ success: true });
  }

  // Marcar todas como leídas (ejemplo con endpoint REST)
  marcarTodasComoLeidas(): Observable<any> {
    const clienteId = this.authService.getCurrentUserId();
    if (!clienteId) return of({success: false, message: "Usuario no identificado"});
    // TODO: Reemplazar con la llamada real al backend
    // return this.http.patch(`${this.apiUrl}/cliente/${clienteId}/marcar-todas-leidas`, {});
    console.log(`Simulando marcar todas las notificaciones como leídas para el cliente ${clienteId}`);
    return of({ success: true });
  }

  // Conexión WebSocket (implementación más avanzada para notificaciones en tiempo real)
  // Esto requeriría librerías como ngx-socket-io o StompJS.
  // conectarWebSocket(): Observable<NotificacionDTO> { ... }
}