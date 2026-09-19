import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Apollo } from 'apollo-angular';

import { ListPlanTraining } from './list-plan-training';
import { apolloMock } from '../../../../../../core/testing/apollo.mock';

describe('ListPlanTraining', () => {
    let component: ListPlanTraining;
    let fixture: ComponentFixture<ListPlanTraining>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ListPlanTraining],
            providers: [{ provide: Apollo, useValue: apolloMock }],
        }).compileComponents();

        fixture = TestBed.createComponent(ListPlanTraining);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
