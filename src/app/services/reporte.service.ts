// src/app/servicios/reporte.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ReporteResponse } from '../dto/reporte-response';
import { CreacionReportRequest } from '../dto/creacion-report-request';
import { DetalleReporteResponse } from '../dto/detalle-reporte-response';
import { ErrorResponse } from '../dto/error-response';

@Injectable({
  providedIn: 'root'
})
export class ReporteService {
  private apiUrl = 'http://localhost:8080/reports';

  constructor(private http: HttpClient) { }

  crearReporte(request: CreacionReportRequest): Observable<ReporteResponse> {
    return this.http.post<ReporteResponse>(this.apiUrl, request).pipe(
      catchError(this.handleError)
    );
  }

  obtenerDetalleReporte(idReporte: string): Observable<DetalleReporteResponse> {
    return this.http.get<DetalleReporteResponse>(`${this.apiUrl}/${idReporte}`).pipe(
      catchError(this.handleError)
    );
  }

  listarTodosLosReportes(): Observable<ReporteResponse[]> {
    return this.http.get<ReporteResponse[]>(this.apiUrl).pipe(
      catchError(this.handleError)
    );
  }

  listarReportesCliente(idCliente: string): Observable<ReporteResponse[]> {
    return this.http.get<ReporteResponse[]>(`${this.apiUrl}/cliente/${idCliente}`).pipe(
      catchError(this.handleError)
    );
  }

  eliminarReporte(idReporte: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${idReporte}`).pipe(
      catchError(this.handleError)
    );
  }

  // Si implementas marcar como importante, actualizar estado, etc., irían aquí.
  // Ejemplo:
  // marcarComoImportante(idReporte: string): Observable<any> {
  //   return this.http.post(`${this.apiUrl}/${idReporte}/important`, {}).pipe(
  //     catchError(this.handleError)
  //   );
  // }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocurrió un error en la operación de reporte.';
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