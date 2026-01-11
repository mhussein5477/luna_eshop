import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TopBarHome } from './top-bar-home';

describe('TopBarHome', () => {
  let component: TopBarHome;
  let fixture: ComponentFixture<TopBarHome>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TopBarHome]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TopBarHome);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
