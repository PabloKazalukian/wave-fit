import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Apollo } from 'apollo-angular';

import { NavigatorWeek } from './navigator-week';
import { apolloMock } from '../../../../../../core/testing/apollo.mock';

describe('NavigatorWeek', () => {
    let component: NavigatorWeek;
    let fixture: ComponentFixture<NavigatorWeek>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [NavigatorWeek],
            providers: [{ provide: Apollo, useValue: apolloMock }],
        }).compileComponents();

        fixture = TestBed.createComponent(NavigatorWeek);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
