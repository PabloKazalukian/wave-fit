import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RoutinePlanForm } from './routine-form';
import { RoutinePlanFormFacade } from './routine-form.facade';
import { of } from 'rxjs';
import { Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormArray, FormControl } from '@angular/forms';

describe('RoutinePlanForm', () => {
    let component: RoutinePlanForm;
    let fixture: ComponentFixture<RoutinePlanForm>;
    let router: Router;

    const signalMock = <T>(value: T) => Object.assign(() => value, { set: jasmine.createSpy() });

    const mockFacade = {
        initFacade: jasmine.createSpy('initFacade'),
        submitPlan: jasmine.createSpy('submitPlan').and.returnValue(of({ id: '123' })),
        show: signalMock(false),
        complete: signalMock(false),
        showConfirmSave: signalMock(false),
        showConfirmCancel: signalMock(false),
        notification: signalMock({ show: false }),
        handleCloseNotification: jasmine.createSpy('handleCloseNotification'),
        loading: () => false,
        removeForm: jasmine.createSpy('removeForm'),
        routineForm: {
            valid: true,
            markAllAsTouched: jasmine.createSpy('markAllAsTouched'),
            get: jasmine.createSpy('get').and.callFake((key: string) => {
                switch (key) {
                    case 'name':
                    case 'weekly_distribution':
                    case 'description':
                        return new FormControl('');
                    case 'routineDays':
                        return new FormArray([]);
                    default:
                        return null;
                }
            }),
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
        router = TestBed.inject(Router);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should open save confirmation dialog when onSubmit is called and form is valid', () => {
        mockFacade.routineForm.valid = true;
        component.onSubmit();
        expect(mockFacade.showConfirmSave.set).toHaveBeenCalledWith(true);
    });

    it('should show error notification when onSubmit is called and form is invalid', () => {
        mockFacade.routineForm.valid = false;
        component.onSubmit();
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
        expect(router.navigate).toHaveBeenCalledWith(['/routines']);
    });
});
