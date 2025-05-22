import { Component, OnInit, OnDestroy, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray, FormControl, AbstractControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { MapaService } from '../../../services/mapa.service';
import { ReporteService } from '../../../services/reporte.service';
import { AuthService } from '../../../services/auth.service';
import { CategoriaService } from '../../../services/categoria.service';

import { CreacionReportRequest } from '../../../dto/creacion-report-request';
import { Ubicacion } from '../../../dto/ubicacion';
import { CategoriaResponse } from '../../../dto/categoria-response';

import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ButtonModule } from 'primeng/button'; // Para pButton

@Component({
  selector: 'app-crear-reporte',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule, // Si tienes algún routerLink interno
    ToastModule,
    ProgressSpinnerModule,
    ButtonModule
  ],
  templateUrl: './crear-reporte.component.html',
  styleUrls: ['./crear-reporte.component.css'],
  providers: [MessageService]
})
export class CrearReporteComponent implements OnInit, AfterViewInit, OnDestroy {
  crearReporteForm!: FormGroup;
  categoriasDisponibles: CategoriaResponse[] = [];
  isLoading: boolean = false; // Para carga general de datos como categorías
  isLoadingCategorias: boolean = false; // Específico para la carga de categorías
  isSubmitting: boolean = false; // Para el estado de envío del formulario

  private mapaSub!: Subscription;
  private marcadorSub!: Subscription;

  constructor(
    private fb: FormBuilder,
    private mapaService: MapaService,
    private reporteService: ReporteService,
    private authService: AuthService,
    private categoriaService: CategoriaService,
    private messageService: MessageService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.crearReporteForm = this.fb.group({
      titulo: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
      descripcion: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
      // FormArray para los checkboxes de categorías
      categoriasIds: this.fb.array([], [Validators.required,this.minSelectedCheckboxes(1)]),
      ubicacion: this.fb.group({
        latitud: [{ value: null, disabled: true }, Validators.required],
        longitud: [{ value: null, disabled: true }, Validators.required]
      }),
      imagenes: this.fb.array([this.fb.control('')])
    });

    this.cargarCategorias();

    this.marcadorSub = this.mapaService.marcadorUbicacion$.subscribe(coords => {
      this.crearReporteForm.get('ubicacion')?.patchValue({
        latitud: coords.lat,
        longitud: coords.lng
      });
      this.cdr.detectChanges();
    });
  }

  ngAfterViewInit(): void {
    this.mapaSub = this.mapaService.mapaListo$.subscribe(() => {
      // Mapa listo, si hay una ubicación previa (ej. al editar) se podría colocar un marcador
    });
    this.mapaService.crearMapa('mapaCrearReporte', undefined, 13, undefined, true, true);
  }

  // Validator para asegurar que al menos un checkbox esté seleccionado
  minSelectedCheckboxes(min = 1) {
    const validator: import('@angular/forms').ValidatorFn = (formArray: AbstractControl) => {
      const totalSelected = (formArray as FormArray).controls
        .map(control => control.value)
        .reduce((prev, next) => next ? prev + next : prev, 0);
      return totalSelected >= min ? null : { required: true };
    };
    return validator;
  }


  get fc() { return this.crearReporteForm.controls; }
  get ubicacionFc() { return (this.crearReporteForm.get('ubicacion') as FormGroup).controls; }
  get imagenesFormArray() { return this.crearReporteForm.get('imagenes') as FormArray; }
  get categoriasFormArray() { return this.crearReporteForm.get('categoriasIds') as FormArray; }


  cargarCategorias(): void {
    this.isLoading = true;
    this.isLoadingCategorias = true;
    this.categoriaService.listarCategoriasActivas().subscribe({
      next: (cats) => {
        this.categoriasDisponibles = cats;
        // Inicializar el FormArray de categorías con un FormControl por cada categoría disponible
        this.categoriasFormArray.clear(); // Limpiar antes de añadir
        this.categoriasDisponibles.forEach(() => this.categoriasFormArray.push(new FormControl(false)));
        this.isLoading = false;
        this.isLoadingCategorias = false;
      },
      error: (err) => {
        console.error('Error al cargar categorías', err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las categorías.' });
        this.isLoading = false;
        this.isLoadingCategorias = false;
      }
    });
  }

  agregarCampoImagen(): void {
    this.imagenesFormArray.push(this.fb.control(''));
  }

  removerCampoImagen(index: number): void {
    if (this.imagenesFormArray.length > 1) {
      this.imagenesFormArray.removeAt(index);
    } else {
      this.imagenesFormArray.at(0).reset('');
    }
  }

  onSubmit(): void {
    if (this.crearReporteForm.invalid) {
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Formulario inválido. Por favor, revisa todos los campos marcados.' });
      this.crearReporteForm.markAllAsTouched();
      Object.keys(this.crearReporteForm.controls).forEach(field => {
        const control = this.crearReporteForm.get(field);
        control?.markAsDirty({ onlySelf: true }); // Marcar todos para mostrar errores
      });
      // Marcar el formArray de categorías como 'touched' para que se muestre el error si es inválido
      this.categoriasFormArray.markAsTouched();
      this.categoriasFormArray.markAsDirty();
      return;
    }

    const idCliente = this.authService.getCurrentUserId();
    if (!idCliente) {
      this.messageService.add({ severity: 'error', summary: 'Error de Autenticación', detail: 'No se pudo obtener el ID del cliente. Por favor, inicia sesión de nuevo.' });
      return;
    }

    this.isSubmitting = true;
    const formValue = this.crearReporteForm.getRawValue();

    // Mapear los valores booleanos del FormArray de categorías a los IDs de las categorías seleccionadas
    const idsCategoriasSeleccionadas: string[] = this.categoriasDisponibles
      .filter((cat, index) => formValue.categoriasIds[index]) // formValue.categoriasIds es ahora un array de booleans
      .map(cat => cat.idCategoria);

    if (idsCategoriasSeleccionadas.length === 0) {
        this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Debe seleccionar al menos una categoría.' });
        this.isSubmitting = false;
        this.categoriasFormArray.setErrors({ 'required': true }); // Marcar error en el FormArray
        this.categoriasFormArray.markAsTouched();
        return;
    }


    const urlsImagenesValidas = (formValue.imagenes as string[])
      .map(url => url ? url.trim() : '')
      .filter(url => url !== '');

    const request: CreacionReportRequest = {
      idCliente: idCliente,
      titulo: formValue.titulo,
      descripcion: formValue.descripcion,
      categoriasIds: idsCategoriasSeleccionadas,
      ubicacion: formValue.ubicacion as Ubicacion,
      imagenes: urlsImagenesValidas
    };

    if (!request.ubicacion.latitud || !request.ubicacion.longitud) {
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Por favor, selecciona una ubicación en el mapa.' });
      this.isSubmitting = false;
      this.crearReporteForm.get('ubicacion')?.markAllAsTouched();
      return;
    }

    this.reporteService.crearReporte(request).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.messageService.add({ severity: 'success', summary: '¡Reporte Creado!', detail: `El reporte "${response.titulo}" ha sido publicado.` });
        this.crearReporteForm.reset();
        this.imagenesFormArray.clear();
        this.agregarCampoImagen();
        this.categoriasFormArray.controls.forEach(control => control.setValue(false)); // Desmarcar checkboxes
        this.categoriasFormArray.markAsPristine();
        this.mapaService.colocarMarcadorEditable(null); // Limpia el marcador del mapa
        // this.router.navigate(['/reportes', response.idReporte]); O a "Mis Reportes"
      },
      error: (err) => {
        this.isSubmitting = false;
        this.messageService.add({ severity: 'error', summary: 'Error al Crear', detail: err.message || 'No se pudo crear el reporte.' });
        console.error(err);
      }
    });
  }

  ngOnDestroy(): void {
    this.mapaService.removerMapa();
    if (this.mapaSub) this.mapaSub.unsubscribe();
    if (this.marcadorSub) this.marcadorSub.unsubscribe();
  }
}
