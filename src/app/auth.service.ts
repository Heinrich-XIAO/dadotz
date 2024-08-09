import { Injectable } from '@angular/core';
import { User } from '@supabase/supabase-js';
import { BehaviorSubject } from 'rxjs';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user = new BehaviorSubject<User | null>(null);

  constructor(private supabase: SupabaseService) {
    (async () => {
      const currentSession = await this.supabase.getSupabaseClient().auth.getSession();
      if (currentSession.error) throw currentSession.error;

      this.user = new BehaviorSubject<User | null>((currentSession.data.session ? currentSession.data.session.user : null) || null);

      this.supabase.getSupabaseClient().auth.onAuthStateChange((event, session) => {
        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session) this.user.next(session!.user);
        } else {
          this.user.next(null);
        }
      });
    })();
  }

  async signInWithGoogle() {
    await this.supabase.getSupabaseClient().auth.signInWithOAuth({
      provider: 'google'
    });
  }

  async signOut() {
    await this.supabase.getSupabaseClient().auth.signOut()
  }

  get currentUser() {
    return this.user.asObservable();
  }
}
