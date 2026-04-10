import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExtraSessionContent } from './extra-session-content';

describe('ExtraSessionContent', () => {
  let component: ExtraSessionContent;
  let fixture: ComponentFixture<ExtraSessionContent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExtraSessionContent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExtraSessionContent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
