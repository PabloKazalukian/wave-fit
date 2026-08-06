import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListPlanTraining } from './list-plan-training';

describe('ListPlanTraining', () => {
    let component: ListPlanTraining;
    let fixture: ComponentFixture<ListPlanTraining>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ListPlanTraining],
        }).compileComponents();

        fixture = TestBed.createComponent(ListPlanTraining);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
