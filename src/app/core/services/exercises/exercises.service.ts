import { inject, Injectable, signal } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { AuthService } from '../auth/auth.service';
import { map, Observable, of, tap, from } from 'rxjs';
import { handleGraphqlError } from '../../../shared/utils/handle-graphql-error';
import { Exercise } from '../../../shared/interfaces/exercise.interface';
import { ExercisePerformanceVM } from '../../../shared/interfaces/tracking.interface';
import { wrapperExerciseAPItoVM } from '../../../shared/wrappers/exercises.wrapper';
import { CREATE_EXERCISE, GET_EXERCISES } from '../../apollo/exercises.queries';
import { NetworkStatusService } from '../network/network-status.service';
import { IndexedDbStorageService } from '../storage/indexed-db.service';

@Injectable({ providedIn: 'root' })
export class ExercisesService {
    exercises = signal<Exercise[]>([]);

    private readonly apollo = inject(Apollo);
    private readonly authSvc = inject(AuthService);
    private readonly networkSvc = inject(NetworkStatusService);
    private readonly idb = inject(IndexedDbStorageService);

    getExercises(force = false): Observable<Exercise[]> {
        if (!force && this.exercises().length > 0) {
            return of(this.exercises());
        }

        return this.apollo
            .query<{ exercises: Exercise[] }>({
                query: GET_EXERCISES,
                fetchPolicy: 'network-only',
            })
            .pipe(
                tap(({ data }) => {
                    if (data) this.exercises.set(data.exercises);
                }),
                handleGraphqlError(this.authSvc),
                map((res) => res.data!.exercises),
            );
    }

    // Helper para generar IDs compatibles con MongoDB ObjectId en el frontend
    private generateObjectId(): string {
        const timestamp = Math.floor(new Date().getTime() / 1000).toString(16);
        const randomHex = 'xxxxxxxxxxxxxxxx'.replace(/[x]/g, () => Math.floor(Math.random() * 16).toString(16));
        return (timestamp + randomHex).toLowerCase();
    }

    createExercise(exercise: Exercise): Observable<Exercise> {
        // Generar un ObjectId válido de Mongoose en el frontend
        const newId = exercise.id || this.generateObjectId();
        const exerciseWithId = { ...exercise, id: newId };

        if (this.networkSvc.isOnline()) {
            return this.apollo
                .mutate<{ createExercise: Exercise }>({
                    mutation: CREATE_EXERCISE,
                    variables: { input: exerciseWithId },
                })
                .pipe(
                    tap(async (res) => {
                        const newExercise = res.data?.createExercise;
                        if (newExercise) {
                            await this.updateLocalCache(newExercise);
                        }
                    }),
                    map((res) => res.data!.createExercise)
                );
        } else {
            const pending = {
                id: newId,
                operationName: 'CreateExercise',
                variables: { input: exerciseWithId },
                status: 'pending' as const,
                createdAt: Date.now()
            };

            return from(this.saveOfflineMutation(pending, exerciseWithId));
        }
    }

    private async saveOfflineMutation(pending: any, newExercise: Exercise): Promise<Exercise> {
        await this.idb.db.pendingMutations.put(pending);
        await this.updateLocalCache(newExercise);
        return newExercise;
    }

    private async updateLocalCache(newExercise: Exercise) {
        this.exercises.update(current => {
            const existing = current.find(e => e.id === newExercise.id);
            if (existing) return current;
            return [...current, newExercise];
        });

        const cacheKey = JSON.stringify({ operationName: 'GetExercises', variables: {} });
        
        try {
            const cached = await this.idb.db.graphqlCache.get(cacheKey);
            if (cached && cached.data && cached.data.exercises) {
                const existingInCache = cached.data.exercises.find((e: any) => e.id === newExercise.id);
                if (!existingInCache) {
                    const updatedData = {
                        ...cached.data,
                        exercises: [...cached.data.exercises, newExercise]
                    };
                    
                    await this.idb.db.graphqlCache.put({
                        cacheKey,
                        data: updatedData,
                        updatedAt: Date.now()
                    });
                }
            }
        } catch (e) {
            console.error('Error updating IndexedDB offline cache:', e);
        }
    }

    wrapperExerciseAPItoVM(): ExercisePerformanceVM[] {
        return wrapperExerciseAPItoVM(this.exercises());
    }
}
