import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Apollo } from 'apollo-angular';

import { CoachManage } from './coach-manage';
import { apolloMock } from '../../../../../core/testing/apollo.mock';

describe('CoachManage', () => {
    let component: CoachManage;
    let fixture: ComponentFixture<CoachManage>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CoachManage],
            providers: [{ provide: Apollo, useValue: apolloMock }, provideRouter([])],
        }).compileComponents();

        fixture = TestBed.createComponent(CoachManage);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('planId', '');
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
