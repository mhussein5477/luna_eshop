import { TestBed } from '@angular/core/testing';

import { AuthSession } from './auth-session';

describe('AuthSession', () => {
  let service: AuthSession;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthSession);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
