export interface ComentarioResponse {
  idComentario: string;
  idClienteComenta: string;
  idReporte: string;
  descripcion: string;
  fechaPublicacion: string; // O tipo Date
}