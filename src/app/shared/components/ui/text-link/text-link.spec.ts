import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextLink } from './text-link';

describe('TextLink', () => {
  let component: TextLink;
  let fixture: ComponentFixture<TextLink>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TextLink]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TextLink);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
