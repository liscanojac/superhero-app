import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { routes } from '../../app.routes';
import { listRowFromImageOnly } from '../../models/superhero-list.mappers';
import { Superhero } from '../../services/superhero';
import { HeroCard } from './hero-card';

const sample = listRowFromImageOnly({
  response: 'success',
  id: '42',
  name: 'Zeta',
  url: '',
});

describe('HeroCard', () => {
  let softRemove: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    softRemove = vi.fn();
  });

  async function createFixture(
    dialogAfterClosed: unknown = true,
  ): Promise<ComponentFixture<HeroCard>> {
    await TestBed.configureTestingModule({
      imports: [HeroCard],
      providers: [
        provideRouter(routes),
        { provide: Superhero, useValue: { deleteHero: softRemove } },
        {
          provide: MatDialog,
          useValue: {
            open: vi.fn(() => ({
              afterClosed: () => of(dialogAfterClosed),
            })),
          },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(HeroCard);
    fixture.componentRef.setInput('hero', sample);
    fixture.detectChanges();
    return fixture;
  }

  it('should create', async () => {
    const fixture = await createFixture();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show name and letter fallback when url is empty', async () => {
    const fixture = await createFixture();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Zeta');
    expect(root.querySelector('.hero-card-photo-fallback')?.textContent?.trim()).toBe(
      'Z',
    );
  });

  it('should call deleteHero when delete is confirmed in the dialog', async () => {
    const fixture = await createFixture(true);
    const btn = fixture.nativeElement.querySelector(
      'button.hero-card-remove',
    ) as HTMLButtonElement;
    btn.click();
    await fixture.whenStable();
    expect(softRemove).toHaveBeenCalledWith('42');
  });

  it('should not remove when the dialog is dismissed', async () => {
    const fixture = await createFixture(false);
    const btn = fixture.nativeElement.querySelector(
      'button.hero-card-remove',
    ) as HTMLButtonElement;
    btn.click();
    await fixture.whenStable();
    expect(softRemove).not.toHaveBeenCalled();
  });
});
