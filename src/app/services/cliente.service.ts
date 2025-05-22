import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ClienteRegistrationRequest } from '../dto/cliente-registration-request';
import { ClienteResponse } from '../dto/cliente-response';
import { ErrorResponse } from '../dto/error-response'; // Asegúrate que la importación sea correcta
import { ClienteUpdateRequest } from '../dto/cliente-update-request';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private apiUrl = 'http://localhost:8080/clientes';

  constructor(private http: HttpClient) { }

  registrarCliente(request: ClienteRegistrationRequest): Observable<ClienteResponse> { // [cite: 334]
    return this.http.post<ClienteResponse>(this.apiUrl, request).pipe(
      catchError(this.handleError)
    );
  }

  // Obtener datos del cliente autenticado ("/me")
  getAuthenticatedCliente(): Observable<ClienteResponse> {
    return this.http.get<ClienteResponse>(`${this.apiUrl}/me`).pipe(
      catchError(this.handleError)
    );
  }

  // Obtener un cliente por ID (generalmente para admins)
  getClienteById(idCliente: string): Observable<ClienteResponse> {
    return this.http.get<ClienteResponse>(`${this.apiUrl}/${idCliente}`).pipe(
      catchError(this.handleError)
    );
  }

  // Eliminar un cliente (generalmente para admins)
  eliminarCliente(idCliente: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${idCliente}`).pipe(
      catchError(this.handleError)
    );
  }

  updateCliente(idCliente: string, data: Partial<ClienteUpdateRequest>): Observable<ClienteResponse> {
   return this.http.put<ClienteResponse>(`${this.apiUrl}/${idCliente}`, data).pipe(
       catchError(this.handleError)
  );
 }

  // Buscar clientes (no implementado en el backend todavía, pero es común)
  // buscarClientes(params: BusquedaClienteRequest): Observable<Page<ClienteResponse>> {
  //   // Adaptar a cómo tu backend espera los parámetros de búsqueda (query params o body)
  //   return this.http.get<Page<ClienteResponse>>(`${this.apiUrl}`, { params: ... }).pipe(
  //     catchError(this.handleError)
  //   );
  // }


  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocurrió un error desconocido.';
    if (error.error) {
      if (Array.isArray(error.error)) {
        const errors = error.error as ErrorResponse[];
        errorMessage = errors.map(err => err.message).join(', ');
      } else if (error.error.message) {
        const errResponse = error.error as ErrorResponse;
        errorMessage = `${errResponse.message}`;
      } else if (typeof error.error === 'string') {
        errorMessage = error.error;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    console.error(error);
    return throwError(() => new Error(errorMessage));
  }
}