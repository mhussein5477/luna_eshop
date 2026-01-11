import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoaderMaterial } from './loader-material';

describe('LoaderMaterial', () => {
  let component: LoaderMaterial;
  let fixture: ComponentFixture<LoaderMaterial>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoaderMaterial]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoaderMaterial);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
