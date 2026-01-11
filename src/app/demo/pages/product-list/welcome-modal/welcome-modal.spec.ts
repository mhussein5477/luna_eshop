import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WelcomeModal } from './welcome-modal';

describe('WelcomeModal', () => {
  let component: WelcomeModal;
  let fixture: ComponentFixture<WelcomeModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WelcomeModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WelcomeModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
