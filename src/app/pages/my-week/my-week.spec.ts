import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Apollo } from 'apollo-angular';

import { MyWeek } from './my-week';
import { apolloMock } from '../../core/testing/apollo.mock';

describe('MyWeek', () => {
    let component: MyWeek;
    let fixture: ComponentFixture<MyWeek>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MyWeek],
            providers: [{ provide: Apollo, useValue: apolloMock }],
        }).compileComponents();

        fixture = TestBed.createComponent(MyWeek);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
