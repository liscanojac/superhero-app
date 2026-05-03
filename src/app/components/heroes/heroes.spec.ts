import { ComponentFixture, TestBed } from '@angular/core/testing';
import { computed, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { listRowFromImageOnly } from '../../models/superhero-list.mappers';
import type { SuperheroListRow } from '../../models/superhero-api.model';
import { Superhero } from '../../services/superhero';
import { HeroesListFilter } from '../../models/superheroes-list-filters';
import { routes } from '../../app.routes';
import { Heroes } from './heroes';

const sampleHero: SuperheroListRow = listRowFromImageOnly({
  response: 'success',
  id: '1',
  name: 'Test Hero',
  url: '',
});

describe('Heroes', () => {
  it('should create', async () => {
    const { fixture } = await mountHeroes([], true);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should request the first batch when the list starts empty', async () => {
    const { fixture, loadSpy } = await mountHeroes([], true);
    fixture.detectChanges();
    expect(loadSpy).toHaveBeenCalledTimes(1);
  });

  it('should not request a batch when the list is already populated', async () => {
    const { fixture, loadSpy } = await mountHeroes([sampleHero], false);
    fixture.detectChanges();
    expect(loadSpy).not.toHaveBeenCalled();
  });

  it('should render hero cards for loaded heroes', async () => {
    const { fixture } = await mountHeroes([sampleHero], true);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('app-hero-card')).toBeTruthy();
    expect(root.textContent).toContain('Test Hero');
  });

  it('should show letter fallback on card when hero has no image URL', async () => {
    const { fixture } = await mountHeroes([sampleHero], true);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const fallback = root.querySelector('.hero-card-photo-fallback');
    expect(fallback?.textContent?.trim()).toBe('T');
    expect(root.querySelector('.hero-card-photo[src]')).toBeFalsy();
  });

  it('should show empty-state card when the filtered list is empty and not loading', async () => {
    const { fixture } = await mountHeroes([], true);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.heroes-empty-card')).toBeTruthy();
    expect(root.textContent).toContain('No heroes in this list yet');
    expect(root.querySelector('app-hero-card')).toBeFalsy();
  });

  it('should show Created empty copy and link when Created filter has no rows', async () => {
    const { fixture } = await mountHeroes([sampleHero], true);
    fixture.componentInstance.superheroService.setHeroesListFilter('created');
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('No heroes in the Created category yet');
    expect(root.querySelector('.heroes-empty-cta')?.getAttribute('href')).toBe('/heroes/create');
  });
});

async function mountHeroes(
  initialList: SuperheroListRow[],
  hasMoreValue: boolean,
): Promise<{
  fixture: ComponentFixture<Heroes>;
  loadSpy: ReturnType<typeof vi.fn>;
}> {
  const list = signal(initialList);
  const batchLoading = signal(false);
  const apiSearchResults = signal<SuperheroListRow[]>([]);
  const apiSearchLoading = signal(false);
  const listFilter = signal<HeroesListFilter>('all');
  const loadSpy = vi.fn();

  await TestBed.configureTestingModule({
    imports: [Heroes],
    providers: [
      provideRouter(routes),
      {
        provide: Superhero,
        useValue: {
          superheroList: list,
          isLoadingBatch: batchLoading.asReadonly(),
          hasMore: computed(() => hasMoreValue),
          loadNextThumbnailBatch: loadSpy,
          deleteHero: vi.fn(),
          apiSearchResults: apiSearchResults.asReadonly(),
          apiSearchLoading: apiSearchLoading.asReadonly(),
          listFilter: listFilter.asReadonly(),
          setHeroesListFilter: (v: HeroesListFilter) => {
            if (v === 'all' || v === 'created' || v === 'api') {
              listFilter.set(v);
            }
          },
          nameSearch: vi.fn(),
        },
      },
      {
        provide: MatDialog,
        useValue: {
          open: vi.fn(() => ({
            afterClosed: () => of(false),
          })),
        },
      },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(Heroes);
  await fixture.whenStable();
  return { fixture, loadSpy };
}
