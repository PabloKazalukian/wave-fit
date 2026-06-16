import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HealthConstraints } from './health-constraints';

describe('HealthConstraints', () => {
  let component: HealthConstraints;
  let fixture: ComponentFixture<HealthConstraints>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HealthConstraints]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HealthConstraints);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
