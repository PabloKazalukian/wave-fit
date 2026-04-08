import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InputSearch } from './input-search';

describe('InputSearch', () => {
  let component: InputSearch;
  let fixture: ComponentFixture<InputSearch>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputSearch]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InputSearch);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
