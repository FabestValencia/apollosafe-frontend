import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { ClienteRegistrationRequest } from '../dto/cliente-registration-request';
import { ClienteResponse } from '../dto/cliente-response';
import { ClienteUpdateRequest } from '../dto/cliente-update-request'; // Asegúrate de que este DTO exista
import { BusquedaClienteRequest } from '../dto/busqueda-cliente-request'; // DTO para la búsqueda
import { ErrorResponse } from '../dto/error-response';
import { Page } from '../dto/page'; // DTO genérico para paginación

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private apiUrlBase = 'http://localhost:8080/clientes'; // URL base para los endpoints de clientes

  constructor(private http: HttpClient) { }

  registrarCliente(request: ClienteRegistrationRequest): Observable<ClienteResponse> {
    return this.http.post<ClienteResponse>(this.apiUrlBase, request).pipe(
      catchError(this.handleError)
    );
  }

  
  getAuthenticatedCliente(): Observable<ClienteResponse> {
    return this.http.get<ClienteResponse>(`${this.apiUrlBase}/me`).pipe(
      catchError(this.handleError)
    );
  }


  getClienteById(idCliente: string): Observable<ClienteResponse> {
    return this.http.get<ClienteResponse>(`${this.apiUrlBase}/${idCliente}`).pipe(
      catchError(this.handleError)
    );
  }

  
  actualizarCliente(idClienteActual: string, request: ClienteUpdateRequest): Observable<ClienteResponse> {
    return this.http.put<ClienteResponse>(`${this.apiUrlBase}/me`, request).pipe(
       catchError(this.handleError)
    );
  }

  eliminarCliente(idCliente: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrlBase}/${idCliente}`).pipe(
      catchError(this.handleError)
    );
  }

  buscarClientes(request: BusquedaClienteRequest): Observable<Page<ClienteResponse>> {
    let params = new HttpParams();
    if (request.nombreCompleto && request.nombreCompleto !== '.*') { // No enviar el comodín si es el por defecto
      params = params.append('nombreCompleto', request.nombreCompleto);
    }
    if (request.email && request.email !== '.*') {
      params = params.append('email', request.email);
    }
    if (request.page != null) {
      params = params.append('page', request.page.toString());
    }
    if (request.size != null) {
      params = params.append('size', request.size.toString());
    }

    return this.http.get<Page<ClienteResponse>>(this.apiUrlBase, { params }).pipe(
         catchError(this.handleError)
    );

  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocurrió un error desconocido en la operación del cliente.';
    if (error.error) {
      if (Array.isArray(error.error)) { // Caso de MethodArgumentNotValidException (Spring Validation)
        const errors = error.error as ErrorResponse[];
        errorMessage = errors.map(err => err.message).join(', ');
      } else if (error.error.message) { // Caso de tus excepciones personalizadas
        const errResponse = error.error as ErrorResponse;
        errorMessage = `${errResponse.message}`;
      } else if (typeof error.error === 'string') { // Caso de ResourceNotFoundException u otros que devuelven string
        errorMessage = error.error;
      } else if (error.status === 401) {
        errorMessage = 'No autorizado. Por favor, verifica tu sesión.';
      } else if (error.status === 403) {
        errorMessage = 'No tienes permiso para realizar esta acción.';
      } else if (error.status === 0) {
        errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión o que el backend esté en línea.';
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    console.error("Error detallado del servicio Cliente:", error);
    return throwError(() => new Error(errorMessage));
  }
}