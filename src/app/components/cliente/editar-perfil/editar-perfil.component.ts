import { Component, OnInit, OnDestroy, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { ClienteService } from '../../../services/cliente.service';
import { AuthService } from '../../../services/auth.service';
import { MapaService } from '../../../services/mapa.service'; // Reintegrar MapaService

import { ClienteResponse } from '../../../dto/cliente-response';
import { Ubicacion } from '../../../dto/ubicacion';
import { ClienteUpdateRequest } from '../../../dto/cliente-update-request';

import { MessageService, ConfirmationService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
  selector: 'app-editar-perfil',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ToastModule,
    ProgressSpinnerModule,
    ButtonModule,
    ConfirmDialogModule
  ],
  templateUrl: './editar-perfil.component.html',
  styleUrls: ['./editar-perfil.component.css'],
  providers: [MessageService, ConfirmationService]
})
export class EditarPerfilComponent implements OnInit, AfterViewInit, OnDestroy {
  editarPerfilForm!: FormGroup;
  isLoading: boolean = true;
  isLoadingMessage: string = 'Cargando tu información...';
  isSubmitting: boolean = false;
  isDeleting: boolean = false;
  clienteActual: ClienteResponse | null = null;
  clienteId: string | null = null;

  private mapaSub!: Subscription;
  private marcadorSub!: Subscription;

  constructor(
    private fb: FormBuilder,
    private clienteService: ClienteService,
    private authService: AuthService,
    private mapaService: MapaService, // Inyectar MapaService
    private messageService: MessageService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.clienteId = this.authService.getCurrentUserId();

    this.editarPerfilForm = this.fb.group({
      nombreCompleto: ['', [Validators.required, Validators.maxLength(100)]],
      ciudadResidencia: ['', [Validators.required, Validators.maxLength(50)]],
      telefono: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(10), Validators.pattern('^[0-9]*$')]],
      // Sub-FormGroup para la ubicación (latitud, longitud)
      direccion: this.fb.group({
        latitud: [{ value: null, disabled: true }, Validators.required],
        longitud: [{ value: null, disabled: true }, Validators.required]
      }),
      email: [{ value: '', disabled: true }],
      nuevaContrasena: ['', [
        Validators.minLength(8),
        Validators.pattern('^(?=.*\\d)(?=.*[a-z])(?=.*[A-Z]).*$')
      ]],
      confirmarNuevaContrasena: ['']
    }, { validators: this.passwordMatchValidator });

    // Suscribirse a los cambios de ubicación del mapa
    this.marcadorSub = this.mapaService.marcadorUbicacion$.subscribe(coords => {
      this.editarPerfilForm.get('direccion')?.patchValue({
        latitud: coords.lat,
        longitud: coords.lng
      });
      this.editarPerfilForm.get('direccion')?.markAsDirty(); // Marcar como modificado
      this.editarPerfilForm.markAsDirty();
      this.cdr.detectChanges();
    });

    if (this.clienteId) {
      this.cargarDatosCliente();
    } else {
      this.isLoading = false;
      this.messageService.add({ severity: 'error', summary: 'Error de Autenticación', detail: 'No se pudo identificar al usuario.' });
      this.router.navigate(['/login']);
    }
  }

  ngAfterViewInit(): void {
    // Crear el mapa DESPUÉS de que el FormGroup esté inicializado y los datos del cliente cargados (si es posible)
    // La lógica de centrar y colocar marcador se hará en cargarDatosCliente o cuando el mapa esté listo.
    // Se crea el mapa aquí y se le indica que es para selección/edición.
    this.mapaService.crearMapa('mapaEditarPerfil', undefined, 13, undefined, true, true);

    if (this.mapaSub) { this.mapaSub.unsubscribe(); } // Evitar múltiples suscripciones si se llama de nuevo
    this.mapaSub = this.mapaService.mapaListo$.subscribe(() => {
      // Si los datos del cliente ya se cargaron y tienen ubicación, colocar el marcador
      if (this.clienteActual && this.clienteActual.direccion &&
          typeof this.clienteActual.direccion.latitud === 'number' &&
          typeof this.clienteActual.direccion.longitud === 'number') {
        const ubicacionActual: [number, number] = [this.clienteActual.direccion.longitud, this.clienteActual.direccion.latitud];
        this.mapaService.colocarMarcadorEditable(ubicacionActual);
        this.mapaService.centrarMapaEn(ubicacionActual, 15);
      } else {
        // Podrías centrar el mapa en una ubicación por defecto si no hay datos del cliente aún
      }
    });
  }

  cargarDatosCliente(): void {
    this.isLoading = true;
    this.isLoadingMessage = 'Cargando tu información...';
    this.clienteService.getAuthenticatedCliente().subscribe({
      next: (cliente) => {
        this.clienteActual = cliente;
        this.editarPerfilForm.patchValue({
          nombreCompleto: cliente.nombreCompleto,
          ciudadResidencia: cliente.ciudadResidencia,
          telefono: cliente.telefono,
          direccion: cliente.direccion, // Esto llenará el sub-grupo latitud y longitud
          email: cliente.email
        });

        // Si el mapa ya está inicializado (a través de mapaListo$), colocar el marcador.
        // Esto es por si los datos del cliente llegan después de que el mapa esté listo.
        if (this.mapaService && cliente.direccion &&
            typeof cliente.direccion.latitud === 'number' &&
            typeof cliente.direccion.longitud === 'number') {
          const ubicacionActual: [number, number] = [cliente.direccion.longitud, cliente.direccion.latitud];
          this.mapaService.colocarMarcadorEditable(ubicacionActual);
          this.mapaService.centrarMapaEn(ubicacionActual, 15);
        }

        this.isLoading = false;
        this.editarPerfilForm.markAsPristine();
      },
      error: (err) => {
        this.isLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Error de Carga', detail: 'No se pudieron cargar tus datos de perfil.' });
        console.error(err);
      }
    });
  }

  private passwordMatchValidator(formGroup: AbstractControl): ValidationErrors | null {
    const nuevaContrasena = formGroup.get('nuevaContrasena')?.value;
    const confirmarNuevaContrasena = formGroup.get('confirmarNuevaContrasena')?.value;

    if (!nuevaContrasena && !confirmarNuevaContrasena) {
      if (formGroup.get('confirmarNuevaContrasena')?.hasError('passwordsMismatch')) {
         formGroup.get('confirmarNuevaContrasena')?.setErrors(null);
      }
      return null;
    }
    if (nuevaContrasena && !confirmarNuevaContrasena && formGroup.get('confirmarNuevaContrasena')?.touched) {
        formGroup.get('confirmarNuevaContrasena')?.setErrors({ requiredIfNewPresent: true });
        // No retornar aquí para permitir que la validación de passwordsMismatch también se evalúe si es necesario
    } else if (formGroup.get('confirmarNuevaContrasena')?.hasError('requiredIfNewPresent') && confirmarNuevaContrasena) {
        formGroup.get('confirmarNuevaContrasena')?.setErrors(null); // Limpiar si ya se ingresó confirmación
    }

    if (nuevaContrasena && nuevaContrasena !== confirmarNuevaContrasena && confirmarNuevaContrasena) { // Solo error si ambas están llenas y no coinciden
      formGroup.get('confirmarNuevaContrasena')?.setErrors({ passwordsMismatch: true });
      return { passwordsMismatch: true };
    } else if (formGroup.get('confirmarNuevaContrasena')?.hasError('passwordsMismatch') && (nuevaContrasena === confirmarNuevaContrasena)) {
        formGroup.get('confirmarNuevaContrasena')?.setErrors(null);
    }
    return null;
  }

  onSubmit(): void {
    this.editarPerfilForm.get('direccion')?.enable(); // Habilitar temporalmente para obtener el valor
    if (this.editarPerfilForm.invalid) {
      this.messageService.add({ severity: 'warn', summary: 'Formulario Inválido', detail: 'Por favor, revisa los campos marcados.' });
      this.editarPerfilForm.markAllAsTouched();
      Object.keys(this.editarPerfilForm.controls).forEach(field => {
         const control = this.editarPerfilForm.get(field);
         control?.markAsDirty({ onlySelf: true });
         if (control instanceof FormGroup) { // Marcar controles de subgrupos también
             Object.keys(control.controls).forEach(subField => {
                 control.get(subField)?.markAsTouched({ onlySelf: true });
                 control.get(subField)?.markAsDirty({ onlySelf: true });
             });
         }
      });
      this.editarPerfilForm.get('direccion')?.disable(); // Volver a deshabilitar
      return;
    }
    if (!this.editarPerfilForm.dirty) {
        this.messageService.add({ severity: 'info', summary: 'Sin Cambios', detail: 'No has realizado ninguna modificación.' });
        this.editarPerfilForm.get('direccion')?.disable(); // Volver a deshabilitar
        return;
    }
    if (!this.clienteId) {
      this.messageService.add({ severity: 'error', summary: 'Error de Usuario', detail: 'No se pudo identificar al usuario.' });
      this.editarPerfilForm.get('direccion')?.disable(); // Volver a deshabilitar
      return;
    }

    this.isSubmitting = true;
    const formValue = this.editarPerfilForm.getRawValue();
    this.editarPerfilForm.get('direccion')?.disable(); // Volver a deshabilitar después de obtener el valor

    const datosActualizados: ClienteUpdateRequest = {
      nombreCompleto: formValue.nombreCompleto,
      ciudadResidencia: formValue.ciudadResidencia,
      telefono: formValue.telefono,
      direccion: formValue.direccion as Ubicacion // El sub-grupo 'direccion' contiene latitud y longitud
    };

    if (formValue.nuevaContrasena) {
      datosActualizados.contrasena = formValue.nuevaContrasena;
    }

    // TODO: Implementar el método real en ClienteService y el endpoint en el backend
    this.clienteService.updateCliente(this.clienteId, datosActualizados).subscribe({
      next: (clienteActualizado) => {
        this.isSubmitting = false;
        this.messageService.add({ severity: 'success', summary: 'Perfil Actualizado', detail: 'Tu información ha sido guardada.' });
        this.editarPerfilForm.markAsPristine();
        // Actualizar clienteActual para reflejar los cambios y rellenar el formulario.
        this.clienteActual = clienteActualizado;
        this.editarPerfilForm.patchValue({
            nombreCompleto: clienteActualizado.nombreCompleto,
            ciudadResidencia: clienteActualizado.ciudadResidencia,
            telefono: clienteActualizado.telefono,
            direccion: clienteActualizado.direccion,
            nuevaContrasena: '', // Limpiar campos de contraseña
            confirmarNuevaContrasena: ''
        });
        this.editarPerfilForm.get('direccion')?.disable(); // Asegurarse que siga deshabilitado
        this.editarPerfilForm.markAsPristine(); // Marcar como no modificado
      },
      error: (err) => {
        this.isSubmitting = false;
        this.messageService.add({ severity: 'error', summary: 'Error al Actualizar', detail: err.message || 'No se pudo actualizar tu perfil.' });
      }
    });
  }

  confirmarEliminacionCuenta(): void {
    this.confirmationService.confirm({
        message: '¿Estás seguro de que deseas eliminar tu cuenta? Esta acción es permanente y no se puede deshacer. Todos tus datos y reportes serán eliminados.',
        header: 'Confirmar Eliminación de Cuenta',
        icon: 'pi pi-exclamation-triangle text-danger',
        acceptLabel: 'Sí, eliminar mi cuenta',
        rejectLabel: 'Cancelar',
        acceptButtonStyleClass: 'p-button-danger',
        rejectButtonStyleClass: 'p-button-text',
        accept: () => {
            this.eliminarCuentaDefinitivamente();
        }
    });
  }

  eliminarCuentaDefinitivamente(): void {
    if (!this.clienteId) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo identificar al usuario.' });
        return;
    }
    this.isDeleting = true;
    this.clienteService.eliminarCliente(this.clienteId).subscribe({
        next: () => {
            this.isDeleting = false;
            this.messageService.add({ severity: 'success', summary: 'Cuenta Eliminada', detail: 'Tu cuenta ha sido eliminada. Serás redirigido.' });
            this.authService.logout();
            setTimeout(() => this.router.navigate(['/']), 3000);
        },
        error: (err) => {
            this.isDeleting = false;
            this.messageService.add({ severity: 'error', summary: 'Error al Eliminar', detail: `No se pudo eliminar tu cuenta: ${err.message}` });
        }
    });
  }

  get fc() { return this.editarPerfilForm.controls; }
  get direccionFc() { return (this.editarPerfilForm.get('direccion') as FormGroup).controls; }

  ngOnDestroy(): void {
    this.mapaService.removerMapa();
    if (this.mapaSub) this.mapaSub.unsubscribe();
    if (this.marcadorSub) this.marcadorSub.unsubscribe();
  }
}
