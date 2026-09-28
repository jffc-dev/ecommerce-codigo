import { computed, Service, signal } from '@angular/core';

interface User {
  email: string
  password: string
}

interface StoredSession {
  email: string
}

const SESSION_STORAGE_KEY = 'auth_session';

@Service()
export class AuthService {

  readonly currentUser = signal<User | null>(this.restoreSession())
  readonly isAuthenticated = computed<boolean>(() => this.currentUser() !== null)

  login(email: string, password: string){
    // TODO validar las credenciales con supabase

    const user: User = { email, password };
    this.currentUser.set(user)
    this.persistSession(user)
  }

  logout(){
    this.currentUser.set(null)
    localStorage.removeItem(SESSION_STORAGE_KEY)
  }

  private restoreSession(): User | null {
    try {
      const raw = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!raw) {
        return null;
      }

      const stored = JSON.parse(raw) as StoredSession;
      return { email: stored.email, password: '' };
    } catch {
      return null;
    }
  }

  private persistSession(user: User): void {
    const stored: StoredSession = { email: user.email };
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(stored));
  }

}
