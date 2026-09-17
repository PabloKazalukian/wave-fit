import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Apollo } from 'apollo-angular';

import { AvatarComponent } from './avatar';
import { apolloMock } from '../../../../core/testing/apollo.mock';

describe('Avatar', () => {
    let component: AvatarComponent;
    let fixture: ComponentFixture<AvatarComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AvatarComponent],
            providers: [{ provide: Apollo, useValue: apolloMock }],
        }).compileComponents();

        fixture = TestBed.createComponent(AvatarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
