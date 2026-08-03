import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NumericPagination } from './numeric-pagination';

describe('NumericPagination', () => {
  let component: NumericPagination;
  let fixture: ComponentFixture<NumericPagination>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NumericPagination]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NumericPagination);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
