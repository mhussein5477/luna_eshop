import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CheckOUT } from './checkout';

describe('CheckOUT', () => {
  let component: CheckOUT;
  let fixture: ComponentFixture<CheckOUT>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckOUT]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CheckOUT);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
