import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataSection } from './data-section';

describe('DataSection', () => {
  let component: DataSection;
  let fixture: ComponentFixture<DataSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataSection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DataSection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
