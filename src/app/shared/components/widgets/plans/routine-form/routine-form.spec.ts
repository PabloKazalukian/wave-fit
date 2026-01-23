import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RoutinePlanForm } from './routine-form';

describe('RoutinePlanForm', () => {
    let component: RoutinePlanForm;
    let fixture: ComponentFixture<RoutinePlanForm>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [RoutinePlanForm],
        }).compileComponents();

        fixture = TestBed.createComponent(RoutinePlanForm);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
