import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Apollo } from 'apollo-angular';

import { Coach } from './coach';
import { apolloMock } from '../../core/testing/apollo.mock';

describe('Coach', () => {
    let component: Coach;
    let fixture: ComponentFixture<Coach>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [Coach],
            providers: [{ provide: Apollo, useValue: apolloMock }, provideNoopAnimations()],
        }).compileComponents();

        fixture = TestBed.createComponent(Coach);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
