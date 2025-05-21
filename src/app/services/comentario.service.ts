import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ComentarioRequest } from '../dto/comentario-request';
import { ComentarioResponse } from '../dto/comentario-response';
import { ErrorResponse } from '../dto/error-response';

@Injectable({
  providedIn: 'root'
})
export class ComentarioService {
  // El backend tiene el endpoint de comentarios bajo /reports/comentario
  private apiUrl = 'http://localhost:8080/reports';

  constructor(private http: HttpClient) { }

  crearComentario(request: ComentarioRequest): Observable<ComentarioResponse> {
    return this.http.post<ComentarioResponse>(`${this.apiUrl}/comentario`, request).pipe(
      catchError(this.handleError)
    );
  }

  // Nota: El backend tiene `listarComentariosPorReporte` en `ComentarioServiceImpl`
  // pero no un endpoint directo en `ComentarioController`.
  // Los comentarios se obtienen a través de `ReporteController` GET `/reports/{id}`
  // que devuelve `DetalleReporteResponse` (que incluye los comentarios).
  // Si necesitaras un endpoint específico para listar comentarios, deberías añadirlo al backend.
  // Por ahora, este método no es directamente utilizable con tu backend actual.
  /*
  listarComentariosPorReporte(idReporte: string): Observable<ComentarioResponse[]> {
    // Asumiendo que tuvieras un endpoint GET /reports/{idReporte}/comments
    return this.http.get<ComentarioResponse[]>(`${this.apiUrl}/${idReporte}/comments`).pipe(
      catchError(this.handleError)
    );
  }
  */

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocurrió un error en la operación de comentario.';
    if (error.error && error.error.message) {
      const errResponse = error.error as ErrorResponse;
      errorMessage = `${errResponse.message}`;
    } else if (error.message) {
      errorMessage = error.message;
    }
    console.error(error);
    return throwError(() => new Error(errorMessage));
  }
}
