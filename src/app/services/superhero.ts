import {
  computed,
  DestroyRef,
  inject,
  Injectable,
  Injector,
  Signal,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import {
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  finalize,
  firstValueFrom,
  forkJoin,
  map,
  of,
  switchMap,
} from 'rxjs';
import { take } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { ApiService, normalizeSuperheroSearchResults } from './api-service';
import type {
  SuperheroImageOnlySuccess,
  SuperheroListRow,
} from '../models/superhero-api.model';
import type { CreateLocalHeroInput } from '../models/superhero-list.mappers';
import {
  listRowFromImageOnly,
  listRowFromLocalInput,
} from '../models/superhero-list.mappers';
import { HeroesListFilter } from '../models/superheroes-list-filters';

const MAX_CHARACTER_ID = 731;
const BATCH_SIZE = 15;
const MIN_LOCAL_HERO_ID = 3000;

@Injectable({
  providedIn: 'root',
})
export class Superhero {
  private readonly api = inject(ApiService);

  private readonly nextId = signal(1);
  private readonly batchLoading = signal(false);
  private readonly removedHeroesId = signal<ReadonlySet<string>>(new Set());
  private readonly nextLocalHeroId = signal(MIN_LOCAL_HERO_ID);
  // this id what manages hero duplication
  private readonly heroCreatorPrefill = signal<CreateLocalHeroInput | null>(null);

  readonly superheroList = signal<SuperheroListRow[]>([]);

  private readonly apiSearchResultsInternal = signal<SuperheroListRow[]>([]);
  
  readonly apiSearchResults = this.apiSearchResultsInternal.asReadonly();

  private readonly apiSearchLoadingInternal = signal(false);
  readonly apiSearchLoading = this.apiSearchLoadingInternal.asReadonly();

  private readonly listFilterInternal = signal<HeroesListFilter>('all');

  readonly listFilter = this.listFilterInternal.asReadonly();

  readonly isLoadingBatch = this.batchLoading.asReadonly();
  readonly hasMore = computed(() => this.nextId() <= MAX_CHARACTER_ID);

  // heroes filters
  setHeroesListFilter(value: HeroesListFilter): void {
    if (value === 'all' || value === 'created' || value === 'api') {
      this.listFilterInternal.set(value);
    }
  }

  nameSearch(options: {
    searchQuery: Signal<string>;
    destroyRef: DestroyRef;
    injector: Injector;
  }): void {
    const { searchQuery, destroyRef, injector } = options;
    combineLatest([
      toObservable(searchQuery, { injector }),
      toObservable(this.listFilter, { injector }),
    ])
      .pipe(
        debounceTime(500),
        map(([searchQueryRaw, mode]) => ({ trimmedSearchQuery: searchQueryRaw.trim(), mode })),
        distinctUntilChanged((a, b) => a.trimmedSearchQuery === b.trimmedSearchQuery && a.mode === b.mode),
        switchMap(({ trimmedSearchQuery, mode }) => {
          if (!trimmedSearchQuery || mode === 'created') {
            this.apiSearchLoadingInternal.set(false);
            return of<SuperheroListRow[]>([]);
          }
          if (!environment.apiKey?.trim()) {
            this.apiSearchLoadingInternal.set(false);
            return of<SuperheroListRow[]>([]);
          }
          this.apiSearchLoadingInternal.set(true);
          return this.api.searchHeroesByName(trimmedSearchQuery).pipe(
            map((res) =>
              res.response === 'success'
                ? normalizeSuperheroSearchResults(res.results)
                : [],
            ),
            catchError(() => of<SuperheroListRow[]>([])),
            finalize(() => this.apiSearchLoadingInternal.set(false)),
          );
        }),
        takeUntilDestroyed(destroyRef),
      )
      .subscribe((rows) => {
        this.apiSearchResultsInternal.set(rows);
      });
  }

  addCreatedHero(input: CreateLocalHeroInput): void {
    const name = input.name.trim();
    if (!name) {
      return;
    }
    const id = String(this.allocateLocalHeroId());
    const entry = listRowFromLocalInput(id, input);
    this.superheroList.update((list) => [entry, ...list]);
  }

  private allocateLocalHeroId(): number {
    let assigned = MIN_LOCAL_HERO_ID;
    this.nextLocalHeroId.update((n) => {
      assigned = n;
      return n + 1;
    });
    return assigned;
  }

  setHeroCreatorPrefill(input: CreateLocalHeroInput): void {
    this.heroCreatorPrefill.set(input);
  }

  consumeHeroCreatorPrefill(): CreateLocalHeroInput | null {
    const v = this.heroCreatorPrefill();
    this.heroCreatorPrefill.set(null);
    return v;
  }

  deleteHero(heroId: string): void {
    this.removedHeroesId.update((prev) => new Set<string>([...prev, heroId]));
    this.superheroList.update((list) => list.filter((h) => h.id !== heroId));
  }

  private filterRemovedHeroes(rows: SuperheroListRow[]): SuperheroListRow[] {
    const removed = this.removedHeroesId();
    return rows.filter((row) => !removed.has(row.id));
  }

  loadNextThumbnailBatch(): void {
    if (!this.hasMore() || this.batchLoading()) {
      return;
    }

    const start = this.nextId();
    const end = Math.min(start + BATCH_SIZE - 1, MAX_CHARACTER_ID);
    const ids = Array.from({ length: end - start + 1 }, (_, i) => start + i);

    this.batchLoading.set(true);

    firstValueFrom(
      forkJoin(
        ids.map((id) =>
          this.api.getCharacterImageById(String(id)).pipe(
            map((response) =>
              response.response === 'success' ? response : null,
            ),
            catchError(() => of(null)),
            take(1),
          ),
        ),
      ).pipe(
        map((rows) =>
          rows
            .filter((row): row is SuperheroImageOnlySuccess => row !== null)
            .map((row) => listRowFromImageOnly(row)),
        ),
        finalize(() => this.batchLoading.set(false)),
      ),
    )
      .then((newRows) => {
        this.nextId.set(end + 1);
        const rows = this.filterRemovedHeroes(newRows);
        this.superheroList.update((current) => [...current, ...rows]);
      })
      .catch(() => {
        this.batchLoading.set(false);
      });
  }

  loadThumbnailsForIds(ids: readonly number[]): void {
    if (ids.length === 0 || this.batchLoading()) {
      return;
    }

    this.batchLoading.set(true);

    firstValueFrom(
      forkJoin(
        ids.map((id) =>
          this.api.getCharacterImageById(String(id)).pipe(
            map((response) =>
              response.response === 'success' ? response : null,
            ),
            catchError(() => of(null)),
            take(1),
          ),
        ),
      ).pipe(finalize(() => this.batchLoading.set(false))),
    )
      .then((rows) => {
        const mapped = rows
          .filter((row): row is SuperheroImageOnlySuccess => row !== null)
          .map((row) => listRowFromImageOnly(row));
        const newRows = this.filterRemovedHeroes(mapped);
        this.superheroList.update((current) => [...current, ...newRows]);
      })
      .catch(() => {
        this.batchLoading.set(false);
      });
  }
}
