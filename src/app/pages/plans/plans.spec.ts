import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { Apollo } from 'apollo-angular';

import { Plans } from './plans';
import { apolloMock } from '../../core/testing/apollo.mock';

describe('Plans', () => {
    let component: Plans;
    let fixture: ComponentFixture<Plans>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [Plans],
            providers: [
                { provide: Apollo, useValue: apolloMock },
                provideRouter([]),
                provideNoopAnimations(),
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(Plans);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
