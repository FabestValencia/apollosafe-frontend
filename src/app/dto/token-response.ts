export interface TokenResponse {
  token: string;
  type: string; // Ejemplo: "Bearer"
  expireAt: string; // Podrías querer manejarlo como Date en el frontend después de recibirlo
  roles: string[];
}