import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Apollo } from 'apollo-angular';

import { WeeklyTrackings } from './weekly-trackings';
import { apolloMock } from '../../../../../core/testing/apollo.mock';

describe('WeeklyTrackings', () => {
    let component: WeeklyTrackings;
    let fixture: ComponentFixture<WeeklyTrackings>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [WeeklyTrackings],
            providers: [{ provide: Apollo, useValue: apolloMock }, provideRouter([])],
        }).compileComponents();

        fixture = TestBed.createComponent(WeeklyTrackings);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
