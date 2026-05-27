import { inject, Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { timer, of } from 'rxjs';
import { switchMap, catchError, filter } from 'rxjs/operators';
import { NetworkStatusService } from './network/network-status.service';

@Injectable({
  providedIn: 'root',
})
export class WarmupService {
  private readonly apollo = inject(Apollo);
  private readonly networkSvc = inject(NetworkStatusService);

  constructor() {
    this.startWarmup();
  }

  private startWarmup() {
    // Check if the application is running in standalone mode (installed PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    
    if (isStandalone) {
      console.log('[Warmup] Running as installed PWA (standalone mode). Disabling heartbeat warmup ping.');
      return;
    }

    console.log('[Warmup] Running in browser. Initializing heartbeat warmup ping (every 30s)...');
    
    timer(0, 30000)
      .pipe(
        // Only trigger the ping if we are currently online
        filter(() => this.networkSvc.isOnline()),
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
