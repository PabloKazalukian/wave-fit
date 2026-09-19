import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Apollo } from 'apollo-angular';

import { DayOfRoutine } from './day-of-routine';
import { apolloMock } from '../../../../../core/testing/apollo.mock';

describe('DayOfRoutine', () => {
    let component: DayOfRoutine;
    let fixture: ComponentFixture<DayOfRoutine>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DayOfRoutine],
            providers: [{ provide: Apollo, useValue: apolloMock }],
        }).compileComponents();

        fixture = TestBed.createComponent(DayOfRoutine);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
