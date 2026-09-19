import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Apollo } from 'apollo-angular';

import { RoutineListBoxComponent as RoutineListBox } from './routine-list-box';
import { apolloMock } from '../../../../../core/testing/apollo.mock';

describe('RoutineListBox', () => {
    let component: RoutineListBox;
    let fixture: ComponentFixture<RoutineListBox>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [RoutineListBox],
            providers: [{ provide: Apollo, useValue: apolloMock }],
        }).compileComponents();

        fixture = TestBed.createComponent(RoutineListBox);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
