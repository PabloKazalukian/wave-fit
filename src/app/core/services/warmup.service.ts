import { inject, Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { timer, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class WarmupService {
  private readonly apollo = inject(Apollo);

  constructor() {
    this.startWarmup();
  }

  private startWarmup() {
    console.log('Warmup service initialized. Pinging server every 30s...');
    // Emitir cada 30 segundos (30000ms), comenzando inmediatamente (0)
    timer(0, 30000)
      .pipe(
        switchMap(() =>
          this.apollo.query({
            query: gql`
              query Warmup {
                warmup
              }
            `,
            fetchPolicy: 'network-only',
          })
        ),
        catchError((err) => {
          // Fallo silencioso, solo logueamos para debug si es necesario
          console.warn('Warmup ping failed (expected if server is sleeping or offline):', err.message);
          return of(null);
        })
      )
      .subscribe();
  }
}
