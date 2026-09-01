import { computed, Service, signal } from '@angular/core';

interface User {
  email: string
  password: string
}

@Service()
export class AuthService {

  readonly currentUser = signal<User | null>(null)
  readonly isAuthenticated = computed<boolean>(() => this.currentUser() !== null)

  login(email: string, password: string){
    // TODO validar las credenciales con supabase

    this.currentUser.set({ email, password})
  }

  logout(){
    this.currentUser.set(null)
  }

}
