import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { convertToParamMap } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

const matDialogMock = {
  open: vi.fn(() => ({
    afterClosed: () => of(false),
  })),
};

import { routes } from '../../app.routes';
import { listRowFromImageOnly } from '../../models/superhero-list.mappers';
import { ApiService } from '../../services/api-service';
import { Superhero } from '../../services/superhero';
import { HeroDetails } from './hero-details';

const apiHero = listRowFromImageOnly({
  response: 'success',
  id: '7',
  name: 'Seven',
  url: 'https://example.com/x.png',
});

describe('HeroDetails', () => {
  it('should create and load API hero from Http', async () => {
    const getCharacterById = vi.fn(() =>
      of({ ...apiHero, response: 'success' as const }),
    );
    await TestBed.configureTestingModule({
      imports: [HeroDetails],
      providers: [
        provideRouter(routes),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ id: '7' })),
          },
        },
        { provide: ApiService, useValue: { getCharacterById } },
        {
          provide: Superhero,
          useValue: { superheroList: () => [] },
        },
        { provide: MatDialog, useValue: matDialogMock },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(HeroDetails);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.hero()?.name).toBe('Seven');
    expect(getCharacterById).toHaveBeenCalledWith('7');
  });

  it('should load local hero from list when id is not API', async () => {
    const getCharacterById = vi.fn();
    await TestBed.configureTestingModule({
      imports: [HeroDetails],
      providers: [
        provideRouter(routes),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ id: '3000' })),
          },
        },
        { provide: ApiService, useValue: { getCharacterById } },
        {
          provide: Superhero,
          useValue: {
            superheroList: () => [
              { ...apiHero, id: '3000', name: 'Local', created: true },
            ],
          },
        },
        { provide: MatDialog, useValue: matDialogMock },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(HeroDetails);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(getCharacterById).not.toHaveBeenCalled();
    expect(fixture.componentInstance.hero()?.name).toBe('Local');
  });
});
