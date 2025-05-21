export interface ErrorResponse {
  type: string; // O el nombre del campo que tu backend devuelve, ej: "ERROR"
  message: string;
}