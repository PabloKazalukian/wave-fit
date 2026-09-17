import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Apollo } from 'apollo-angular';
import { ExercisesTableComponent } from './exercises-table';
import { apolloMock } from '../../../../../core/testing/apollo.mock';

describe('ExercisesTable', () => {
    let component: ExercisesTableComponent;
    let fixture: ComponentFixture<ExercisesTableComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ExercisesTableComponent],
            providers: [{ provide: Apollo, useValue: apolloMock }],
        }).compileComponents();

        fixture = TestBed.createComponent(ExercisesTableComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
