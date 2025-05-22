import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms'; // ReactiveFormsModule

import { CategoriaService } from '../../../services/categoria.service';
import { CategoriaResponse } from '../../../dto/categoria-response';
import { CategoriaRequest } from '../../../dto/categoria-request';

// PrimeNG
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog'; // Para p-dialog
import { InputTextModule } from 'primeng/inputtext'; // Para pInputText
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip'; // Para pTooltip
import { MessageService, ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-gestion-categorias',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule, // Añadir ReactiveFormsModule
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    
    ToastModule,
    ConfirmDialogModule,
    ProgressSpinnerModule,
    TooltipModule
  ],
  templateUrl: './gestion-categorias.component.html',
  styleUrls: ['./gestion-categorias.component.css'],
  providers: [MessageService, ConfirmationService]
})
export class GestionCategoriasComponent implements OnInit {
  categorias: CategoriaResponse[] = [];
  isLoading: boolean = true;

  mostrarDialogCategoria: boolean = false;
  esEdicion: boolean = false;
  categoriaForm!: FormGroup;
  categoriaSeleccionadaId: string | null = null; // Para guardar el ID al editar
  isSubmittingDialog: boolean = false;

  constructor(
    private categoriaService: CategoriaService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.inicializarFormulario();
    this.cargarCategorias();
  }

  inicializarFormulario(): void {
    this.categoriaForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(50)]],
      descripcion: ['', [Validators.required, Validators.maxLength(200)]]
    });
  }

  // Getter para acceder fácilmente a los controles del formulario en la plantilla
  get cf() {
    return this.categoriaForm.controls;
  }

  cargarCategorias(): void {
    this.isLoading = true;
    this.categoriaService.listarCategoriasActivas().subscribe({
      next: (data) => {
        this.categorias = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.messageService.add({severity:'error', summary:'Error de Carga', detail:'No se pudieron cargar las categorías. Intente más tarde.'});
        console.error("Error al cargar categorías:", err);
      }
    });
  }

  abrirDialogNuevaCategoria(): void {
    this.esEdicion = false;
    this.categoriaSeleccionadaId = null;
    this.categoriaForm.reset(); // Limpiar el formulario
    this.mostrarDialogCategoria = true;
  }

  abrirDialogEditarCategoria(categoria: CategoriaResponse): void {
    this.esEdicion = true;
    this.categoriaSeleccionadaId = categoria.idCategoria;
    this.categoriaForm.setValue({ // Usar setValue para asegurar que todos los campos se llenen
      nombre: categoria.nombre,
      descripcion: categoria.descripcion
    });
    this.mostrarDialogCategoria = true;
  }

  guardarCategoria(): void {
    if (this.categoriaForm.invalid) {
      this.messageService.add({severity:'warn', summary:'Atención', detail:'Formulario inválido. Revise los campos.'});
      this.categoriaForm.markAllAsTouched(); // Marcar todos para mostrar errores
      return;
    }

    this.isSubmittingDialog = true;
    const categoriaRequest: CategoriaRequest = this.categoriaForm.value;

    if (this.esEdicion && this.categoriaSeleccionadaId) {
      // Actualizar categoría existente
      this.categoriaService.actualizarCategoria(this.categoriaSeleccionadaId, categoriaRequest).subscribe({
        next: () => {
          this.messageService.add({severity:'success', summary:'Éxito', detail:'Categoría actualizada correctamente.'});
          this.finalizarOperacionDialog();
        },
        error: (err) => {
          this.isSubmittingDialog = false;
          this.messageService.add({severity:'error', summary:'Error al Actualizar', detail: err.message || 'No se pudo actualizar la categoría.'});
        }
      });
    } else {
      // Crear nueva categoría
      this.categoriaService.crearCategoria(categoriaRequest).subscribe({
        next: () => {
          this.messageService.add({severity:'success', summary:'Éxito', detail:'Categoría creada correctamente.'});
          this.finalizarOperacionDialog();
        },
        error: (err) => {
          this.isSubmittingDialog = false;
          this.messageService.add({severity:'error', summary:'Error al Crear', detail: err.message || 'No se pudo crear la categoría. Verifique si el nombre ya existe.'});
        }
      });
    }
  }

  finalizarOperacionDialog(): void {
    this.isSubmittingDialog = false;
    this.mostrarDialogCategoria = false;
    this.categoriaForm.reset();
    this.cargarCategorias(); // Recargar la lista de categorías
  }

  confirmarEliminarCategoria(categoria: CategoriaResponse): void {
    this.confirmationService.confirm({
      message: `¿Estás seguro de que deseas eliminar la categoría "${categoria.nombre}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle text-danger',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.eliminarCategoria(categoria.idCategoria);
      }
    });
  }

  eliminarCategoria(idCategoria: string): void {
    this.isLoading = true; // Podrías usar un spinner específico para la fila si lo deseas
    this.categoriaService.eliminarCategoria(idCategoria).subscribe({
      next: () => {
        this.messageService.add({severity:'success', summary:'Éxito', detail:'Categoría eliminada correctamente.'});
        this.cargarCategorias(); // Recargar la lista (isLoading se pondrá a false dentro de cargarCategorias)
      },
      error: (err) => {
         this.isLoading = false; // Asegurarse de quitar el spinner en caso de error
         this.messageService.add({severity:'error', summary:'Error al Eliminar', detail: err.message || 'No se pudo eliminar la categoría.'});
      }
    });
  }
}