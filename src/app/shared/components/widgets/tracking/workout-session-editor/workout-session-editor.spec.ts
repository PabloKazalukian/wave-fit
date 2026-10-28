import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { WorkoutSessionEditor } from './workout-session-editor';

describe('WorkoutSessionEditor', () => {
    let component: WorkoutSessionEditor;
    let fixture: ComponentFixture<WorkoutSessionEditor>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [WorkoutSessionEditor],
            providers: [
                provideNoopAnimations(),
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(WorkoutSessionEditor);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create the editor component', () => {
        expect(component).toBeTruthy();
    });

    it('should accept editorContext input', () => {
        expect(component.editorContext).toBeDefined();
    });

    it('should have default loading state', () => {
        expect(component.loading()).toBe(false);
    });
});