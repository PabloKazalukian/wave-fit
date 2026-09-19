import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Apollo } from 'apollo-angular';

import { Schedule } from './schedule';
import { apolloMock } from '../../../../../../core/testing/apollo.mock';

describe('Schedule', () => {
    let component: Schedule;
    let fixture: ComponentFixture<Schedule>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [Schedule],
            providers: [{ provide: Apollo, useValue: apolloMock }],
        }).compileComponents();

        fixture = TestBed.createComponent(Schedule);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
