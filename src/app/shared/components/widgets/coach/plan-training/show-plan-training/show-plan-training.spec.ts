import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShowPlanTraining } from './show-plan-training';

describe('ShowPlanTraining', () => {
    let component: ShowPlanTraining;
    let fixture: ComponentFixture<ShowPlanTraining>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ShowPlanTraining],
        }).compileComponents();

        fixture = TestBed.createComponent(ShowPlanTraining);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
