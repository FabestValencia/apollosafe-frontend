import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

// PrimeNG Modules
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { AuthService } from '../../services/auth.service';
import { LoginRequest } from '../../dto/login-request';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    InputTextModule,
    ButtonModule,
    ToastModule,
    ProgressSpinnerModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  providers: [MessageService]
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    const loginRequest: LoginRequest = {
      username: this.loginForm.get('username')?.value,
      password: this.loginForm.get('password')?.value
    };

    this.authService.login(loginRequest).subscribe({
      next: (response) => {
        this.loading = false;
        // Redirigir según el rol del usuario
        if (response.roles.includes('ADMIN')) {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/cliente']);
        }
      },
      error: (error) => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message || 'Credenciales incorrectas. Por favor, intenta de nuevo.'
        });
      }
    });
  }
}