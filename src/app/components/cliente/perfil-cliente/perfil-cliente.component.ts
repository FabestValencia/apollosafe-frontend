import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // Para routerLink
import { ClienteService } from '../../../services/cliente.service';
import { AuthService } from '../../../services/auth.service';
import { ClienteResponse } from '../../../dto/cliente-response';

import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';


@Component({
  selector: 'app-perfil-cliente',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    InputTextModule,
    ButtonModule,
    ProgressSpinnerModule,
    ToastModule
  ],
  templateUrl: './perfil-cliente.component.html',
  styleUrls: ['./perfil-cliente.component.css'],
  providers: [MessageService]
})
export class PerfilClienteComponent implements OnInit {
  cliente: ClienteResponse | null = null;
  isLoading: boolean = true;
  clienteId: string | null = null;

  constructor(
    private clienteService: ClienteService,
    private authService: AuthService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.clienteId = this.authService.getCurrentUserId();
    if (this.clienteId) {
      this.cargarDatosCliente();
    } else {
      this.isLoading = false;
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo identificar al usuario.' });
    }
  }

  cargarDatosCliente(): void {
    this.isLoading = true;
    // Usamos getAuthenticatedCliente que debería devolver los datos del usuario logueado
    this.clienteService.getAuthenticatedCliente().subscribe({
      next: (data) => {
        this.cliente = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Error al Cargar Perfil', detail: err.message || 'No se pudieron cargar tus datos.' });
        console.error(err);
      }
    });
  }
}
