import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExtraSessionCreate } from './extra-session-create';

describe('ExtraSessionCreate', () => {
  let component: ExtraSessionCreate;
  let fixture: ComponentFixture<ExtraSessionCreate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExtraSessionCreate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExtraSessionCreate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
