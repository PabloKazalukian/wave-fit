import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RoutinePlanForm } from './routine-form';
import { RoutinePlanFormFacade } from './routine-form.facade';
import { of } from 'rxjs';
import { Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('RoutinePlanForm', () => {
    let component: RoutinePlanForm;
    let fixture: ComponentFixture<RoutinePlanForm>;
    let facade: RoutinePlanFormFacade;
    let router: Router;

    const mockFacade = {
        initFacade: jasmine.createSpy('initFacade'),
        submitPlan: jasmine.createSpy('submitPlan').and.returnValue(of({ id: '123' })),
        show: { set: jasmine.createSpy('show.set') },
        complete: { set: jasmine.createSpy('complete.set') },
        showConfirmSave: { set: jasmine.createSpy('showConfirmSave.set'), value: () => false },
        showConfirmCancel: { set: jasmine.createSpy('showConfirmCancel.set'), value: () => false },
        notification: {
            set: jasmine.createSpy('notification.set'),
            value: () => ({ show: false }),
        },
        loading: () => false,
        routineForm: {
            valid: true,
            markAllAsTouched: jasmine.createSpy('markAllAsTouched'),
            get: jasmine.createSpy('get').and.returnValue({ value: 'test' }),
        },
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [RoutinePlanForm, NoopAnimationsModule],
            providers: [{ provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } }],
        })
            .overrideComponent(RoutinePlanForm, {
                set: { providers: [{ provide: RoutinePlanFormFacade, useValue: mockFacade }] },
            })
            .compileComponents();

        fixture = TestBed.createComponent(RoutinePlanForm);
        component = fixture.componentInstance;
        facade = fixture.debugElement.injector.get(RoutinePlanFormFacade);
        router = TestBed.inject(Router);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should open save confirmation dialog when onSaveRequested is called and form is valid', () => {
        (mockFacade.routineForm as any).valid = true;
        component.onSaveRequested();
        expect(mockFacade.showConfirmSave.set).toHaveBeenCalledWith(true);
    });

    it('should show error notification when onSaveRequested is called and form is invalid', () => {
        (mockFacade.routineForm as any).valid = false;
        component.onSaveRequested();
        expect(mockFacade.notification.set).toHaveBeenCalled();
    });

    it('should call submitPlan and navigate on confirmSave', fakeAsync(() => {
        component.confirmSave();
        expect(mockFacade.submitPlan).toHaveBeenCalled();
        expect(mockFacade.complete.set).toHaveBeenCalledWith(true);

        tick(3000);
        expect(router.navigate).toHaveBeenCalledWith(['/routines/show/123']);
    }));

    it('should open cancel confirmation dialog when onCancelRequested is called', () => {
        component.onCancelRequested();
        expect(mockFacade.showConfirmCancel.set).toHaveBeenCalledWith(true);
    });

    it('should navigate on confirmCancel', () => {
        component.confirmCancel();
        expect(mockFacade.showConfirmCancel.set).toHaveBeenCalledWith(false);
        expect(router.navigate).toHaveBeenCalledWith(['/routines/create']);
    });
});
