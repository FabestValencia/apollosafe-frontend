import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClienteService } from '../../../services/cliente.service';
import { ClienteResponse } from '../../../dto/cliente-response'; // Asegúrate que la ruta sea correcta
import { BusquedaClienteRequest } from '../../../dto/busqueda-cliente-request'; // Asegúrate que la ruta sea correcta

// PrimeNG
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Page } from '../../../dto/page'; // Necesitarás un DTO Page si el backend devuelve paginación

@Component({
  selector: 'app-gestion-usuarios',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, InputTextModule, ToastModule, ConfirmDialogModule, ProgressSpinnerModule, TooltipModule],
  templateUrl: './gestion-usuarios.component.html',
  styleUrls: ['./gestion-usuarios.component.css'],
  providers: [MessageService, ConfirmationService]
})
export class GestionUsuariosComponent implements OnInit {
  clientes: ClienteResponse[] = [];
  isLoading: boolean = true;

  // Para paginación si el backend lo soporta así
  // totalRecords: number = 0;
  // rows: number = 10;

  constructor(
    private clienteService: ClienteService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) { }

  ngOnInit(): void {
    this.cargarClientes();
  }

  cargarClientes(/*event?: LazyLoadEvent*/): void { // LazyLoadEvent para paginación del servidor
    this.isLoading = true;
    // El backend tiene un endpoint /clientes (GET) que espera BusquedaClienteRequest
    // y devuelve Page<ClienteResponse>. Adaptamos la llamada.
    const request: BusquedaClienteRequest = {
      nombreCompleto: '.*', // Comodín para todos los nombres
      email: '.*',         // Comodín para todos los emails
      page: 0, // O tomar del LazyLoadEvent si implementas paginación del servidor
      size: 100 // Un tamaño grande para traer "todos" por ahora, idealmente paginar
    };

    this.clienteService.buscarClientes(request).subscribe({
      next: (paginaClientes: Page<ClienteResponse>) => { // Asumiendo que buscarClientes devuelve Page
        this.clientes = paginaClientes.content;
        // this.totalRecords = paginaClientes.totalElements; // Para paginación del servidor
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.messageService.add({severity:'error', summary:'Error', detail:'No se pudieron cargar los clientes.'});
        console.error("Error al cargar clientes:", err);
      }
    });
  }

  verDetallesCliente(cliente: ClienteResponse): void {
    this.messageService.add({severity:'info', summary:'Info', detail:`Ver detalles de ${cliente.nombreCompleto} (pendiente).`});
    // Podrías abrir un modal o navegar a una página de detalle del cliente
  }

  editarCliente(cliente: ClienteResponse): void {
     this.messageService.add({severity:'info', summary:'Info', detail:`Editar cliente ${cliente.nombreCompleto} (pendiente).`});
    // Abrir un modal con un formulario para editar, similar a GestionCategorias
  }

  confirmarEliminarCliente(cliente: ClienteResponse): void {
    this.confirmationService.confirm({
      message: `¿Estás seguro de que deseas eliminar al cliente "${cliente.nombreCompleto}"? Esta acción es permanente.`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle text-danger',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.eliminarCliente(cliente.id); // Asumimos que ClienteResponse tiene 'id'
      }
    });
  }

  eliminarCliente(idCliente: string): void {
    this.isLoading = true;
    this.clienteService.eliminarCliente(idCliente).subscribe({
      next: () => {
        this.messageService.add({severity:'success', summary:'Éxito', detail:'Cliente eliminado correctamente.'});
        this.cargarClientes(); // Recargar la lista
      },
      error: (err) => {
        this.isLoading = false;
        this.messageService.add({severity:'error', summary:'Error al Eliminar', detail: err.message || 'No se pudo eliminar el cliente.'});
      }
    });
  }
}