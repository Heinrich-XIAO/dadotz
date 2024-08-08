import { Injectable } from '@angular/core';
import { SupabaseClient, User, createClient } from '@supabase/supabase-js';
import { environment } from '../environments/environment';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase!: SupabaseClient;
  user = new BehaviorSubject<User | null>(null);

  constructor(private router: Router) {
    this.supabase = createClient(environment.supabase.url, environment.supabase.key);
    this.supabase.auth.onAuthStateChange((event, session) => {
      console.log(event, session);
      if (event == 'SIGNED_IN' || event == "TOKEN_REFRESHED") {
        this.user.next(session!.user);
        this.router.navigate(["/dashboard"]);
      } else {
        this.user.next(null);
      }
    })
  }

  async signInWithGoogle() {
    await this.supabase.auth.signInWithOAuth({
      provider: 'google'
    });
  }

  async signOut() {
    await this.supabase.auth.signOut()
  }

  get currentUser() {
    return this.user.asObservable();
  }
}
