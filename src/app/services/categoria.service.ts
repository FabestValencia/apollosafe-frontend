import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CategoriaResponse } from '../dto/categoria-response';
import { CategoriaRequest } from '../dto/categoria-request'; // Necesario para crear/actualizar
import { ErrorResponse } from '../dto/error-response';

@Injectable({
  providedIn: 'root'
})
export class CategoriaService {
  private apiUrl = 'http://localhost:8080/categorias';

  constructor(private http: HttpClient) { }

  listarCategoriasActivas(): Observable<CategoriaResponse[]> {
    return this.http.get<CategoriaResponse[]>(this.apiUrl).pipe(
      catchError(this.handleError)
    );
  }

  obtenerCategoriaPorId(idCategoria: string): Observable<CategoriaResponse> {
    return this.http.get<CategoriaResponse>(`${this.apiUrl}/${idCategoria}`).pipe(
      catchError(this.handleError)
    );
  }

  crearCategoria(request: CategoriaRequest): Observable<CategoriaResponse> {
    return this.http.post<CategoriaResponse>(this.apiUrl, request).pipe(
      catchError(this.handleError)
    );
  }

  actualizarCategoria(idCategoria: string, request: CategoriaRequest): Observable<CategoriaResponse> {
    return this.http.put<CategoriaResponse>(`${this.apiUrl}/${idCategoria}`, request).pipe(
      catchError(this.handleError)
    );
  }

  eliminarCategoria(idCategoria: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${idCategoria}`).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocurrió un error en la operación de categoría.';
    if (error.error && error.error.message) {
      const errResponse = error.error as ErrorResponse; // Asumiendo que el backend devuelve este formato
      errorMessage = `${errResponse.message}`;
    } else if (error.message) {
      errorMessage = error.message;
    }
    console.error(error);
    return throwError(() => new Error(errorMessage));
  }
}
