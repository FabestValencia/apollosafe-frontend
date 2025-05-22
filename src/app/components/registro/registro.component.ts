import { Component, OnInit, OnDestroy, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router'; // Importa RouterModule

// Asumiendo que renombraste UsersService a ClienteService
import { ClienteService } from '../../services/cliente.service';
import { ClienteRegistrationRequest } from '../../dto/cliente-registration-request';
import { Ubicacion } from '../../dto/ubicacion';

// Para el Mapa
import { MapaService } from '../../services/mapa.service';
import { Subscription } from 'rxjs';

// PrimeNG para mensajes y spinner
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ButtonModule } from 'primeng/button'; // Para pButton

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule, // Añade RouterModule
    ToastModule,
    ProgressSpinnerModule,
    ButtonModule // Para pButton
  ],
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.css'],
  providers: [MessageService]
})
export class RegistroComponent implements OnInit, AfterViewInit, OnDestroy {
  registroForm!: FormGroup;
  isLoading: boolean = false;

  private mapaSub!: Subscription;
  private marcadorSub!: Subscription;

  constructor(
    private formBuilder: FormBuilder,
    private clienteService: ClienteService, // Usar ClienteService
    private router: Router,
    private mapaService: MapaService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.crearFormulario();

    this.marcadorSub = this.mapaService.marcadorUbicacion$.subscribe(coords => {
      this.registroForm.get('direccion')?.patchValue({
        latitud: coords.lat,
        longitud: coords.lng
      });
      this.cdr.detectChanges();
    });
  }

  ngAfterViewInit(): void {
    this.mapaSub = this.mapaService.mapaListo$.subscribe(() => {
      // Mapa listo
    });
    // ID del div del mapa en el HTML de registro
    this.mapaService.crearMapa('mapaRegistroCliente', undefined, 12, undefined, true, true);
  }

  private crearFormulario(): void {
    this.registroForm = this.formBuilder.group({
      nombreCompleto: ['', [Validators.required, Validators.maxLength(100)]],
      // fechaNacimiento: ['', Validators.required], // Omitido por ahora
      ciudadResidencia: ['', [Validators.required, Validators.maxLength(50)]],
      telefono: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(10), Validators.pattern('^[0-9]*$')]],
      direccion: this.formBuilder.group({
        latitud: [{ value: null, disabled: true }, Validators.required],
        longitud: [{ value: null, disabled: true }, Validators.required]
      }),
      email: ['', [Validators.required, Validators.email]],
      contrasena: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern('^(?=.*\\d)(?=.*[a-z])(?=.*[A-Z]).*$')
      ]],
      confirmarContrasena: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  private passwordMatchValidator(formGroup: AbstractControl): ValidationErrors | null {
    const password = formGroup.get('contrasena')?.value;
    const confirmarContrasena = formGroup.get('confirmarContrasena')?.value;
    if (password !== confirmarContrasena) {
      formGroup.get('confirmarContrasena')?.setErrors({ passwordsMismatch: true });
      return { passwordsMismatch: true };
    } else {
      if (formGroup.get('confirmarContrasena')?.hasError('passwordsMismatch')) {
        formGroup.get('confirmarContrasena')?.setErrors(null);
      }
      return null;
    }
  }

  onSubmit(): void {
    if (this.registroForm.invalid) {
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Formulario inválido. Revisa los campos marcados.' });
      this.registroForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const rawFormValue = this.registroForm.getRawValue();

    const request: ClienteRegistrationRequest = {
      nombreCompleto: rawFormValue.nombreCompleto,
      ciudadResidencia: rawFormValue.ciudadResidencia,
      telefono: rawFormValue.telefono,
      direccion: rawFormValue.direccion as Ubicacion, // El grupo 'direccion' ya tiene lat y lng
      email: rawFormValue.email,
      contrasena: rawFormValue.contrasena
    };

    if (!request.direccion.latitud || !request.direccion.longitud) {
        this.messageService.add({ severity: 'warn', summary: 'Ubicación Requerida', detail: 'Por favor, selecciona tu dirección principal en el mapa.' });
        this.isLoading = false;
        return;
    }

    this.clienteService.registrarCliente(request).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'success',
          summary: '¡Registro Exitoso!',
          detail: `Bienvenido/a ${response.nombreCompleto}. Revisa tu email para verificar tu cuenta.`
        });
        this.registroForm.reset();
        // Considera redirigir a la página de login o a una página de "verificación pendiente"
        setTimeout(() => this.router.navigate(['/login']), 3000);
      },
      error: (err) => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error en el Registro',
          detail: err.message || 'No se pudo completar el registro. Inténtalo de nuevo.'
        });
        console.error(err);
      }
    });
  }

  get fc() {
    return this.registroForm.controls;
  }

  get direccionFc() {
    return (this.registroForm.get('direccion') as FormGroup).controls;
  }

  ngOnDestroy(): void {
    this.mapaService.removerMapa();
    if (this.mapaSub) {
      this.mapaSub.unsubscribe();
    }
    if (this.marcadorSub) {
      this.marcadorSub.unsubscribe();
    }
  }
}
