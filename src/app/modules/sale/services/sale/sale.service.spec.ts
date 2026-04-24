import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { SaleService } from './sale.service';
import { clearAllCaches } from '../../../../common/decorators/cache';

describe('SaleService', () => {
  let service: SaleService;

  beforeEach(() => {
    clearAllCaches();
    TestBed.configureTestingModule({
      providers: [
        { provide: MatDialog, useValue: {} },
      ],
    });
    service = TestBed.inject(SaleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
