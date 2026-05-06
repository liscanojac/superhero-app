import { Component, DestroyRef, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { firstValueFrom, of, throwError, timer } from 'rxjs';
import { map, take } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { listRowFromImageOnly } from '../models/superhero-list.mappers';
import type {
  SuperheroListRow,
  SuperheroSearchSuccess,
} from '../models/superhero-api.model';

import { ApiService } from './api-service';
import { Superhero } from './superhero';

// Superhero.nameSearch - buffer
const NAME_SEARCH_DEBOUNCE_MS = 550;

@Component({ standalone: true, template: '' })
class NameSearchHost {}

function flushMicrotasks(): Promise<void> {
  return Promise.resolve().then(() => undefined);
}

describe('Superhero', () => {
  let searchHeroesByName: ReturnType<typeof vi.fn>;
  let getCharacterImageById: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    searchHeroesByName = vi.fn().mockReturnValue(
      of<SuperheroSearchSuccess>({
        response: 'success',
        'results-for': '',
        results: [],
      }),
    );
    getCharacterImageById = vi.fn().mockReturnValue(
      of({ response: 'error' as const, error: 'mock default' }),
    );

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        {
          provide: ApiService,
          useValue: {
            searchHeroesByName,
            getCharacterImageById,
          },
        },
      ],
    });
  });

  describe('construction and signals', () => {
    it('should be created', () => {
      const service = TestBed.inject(Superhero);
      expect(service).toBeTruthy();
    });

    it('hasMore is true initially and becomes false when nextId passes MAX (731)', () => {
      const service = TestBed.inject(Superhero);
      expect(service.hasMore()).toBe(true);
      const internal = service as unknown as {
        nextId: { set(v: number): void };
      };
      internal.nextId.set(732);
      expect(service.hasMore()).toBe(false);
    });

    it('listFilter defaults to all', () => {
      const service = TestBed.inject(Superhero);
      expect(service.listFilter()).toBe('all');
    });
  });

  describe('setHeroesListFilter', () => {
    it('sets filter for all, created, and api', () => {
      const service = TestBed.inject(Superhero);
      service.setHeroesListFilter('created');
      expect(service.listFilter()).toBe('created');
      service.setHeroesListFilter('api');
      expect(service.listFilter()).toBe('api');
      service.setHeroesListFilter('all');
      expect(service.listFilter()).toBe('all');
    });

    it('ignores invalid filter values', () => {
      const service = TestBed.inject(Superhero);
      service.setHeroesListFilter('api');
      service.setHeroesListFilter('invalid' as 'api');
      expect(service.listFilter()).toBe('api');
    });
  });

  describe('addCreatedHero', () => {
    it('prepends a local hero in full API shape', () => {
      const service = TestBed.inject(Superhero);
      service.superheroList.set([]);
      service.addCreatedHero({
        name: 'Custom',
        imageUrl: 'https://example.com/a.png',
        publisher: 'AC',
        occupation: 'Some occupation',
        fullName: 'Full N',
        alignment: 'bad',
      });
      const list = service.superheroList();
      expect(list.length).toBe(1);
      const h = list[0];
      expect(h.created).toBe(true);
      expect(h.name).toBe('Custom');
      expect(h.image.url).toBe('https://example.com/a.png');
      expect(h.biography.publisher).toBe('AC');
      expect(h.work.occupation).toBe('Some occupation');
      expect(h.biography['full-name']).toBe('Full N');
      expect(h.biography.alignment).toBe('bad');
      expect(h.powerstats.intelligence).toBe('-');
      expect(Number.parseInt(h.id, 10)).toBeGreaterThanOrEqual(3000);
    });

    it('assigns increasing ids from 3000 upward', () => {
      const service = TestBed.inject(Superhero);
      service.superheroList.set([]);
      service.addCreatedHero({ name: 'A' });
      service.addCreatedHero({ name: 'B' });
      const ids = service.superheroList().map((h) => Number.parseInt(h.id, 10));
      expect(ids[0]).toBeGreaterThan(ids[1]);
      expect(Math.min(...ids)).toBeGreaterThanOrEqual(3000);
    });

    it('does nothing when name is empty or whitespace-only', () => {
      const service = TestBed.inject(Superhero);
      service.superheroList.set([]);
      service.addCreatedHero({ name: '' });
      service.addCreatedHero({ name: '   \t  ' });
      expect(service.superheroList()).toEqual([]);
    });
  });

  describe('deleteHero', () => {
    it('removes the hero from the list', () => {
      const service = TestBed.inject(Superhero);
      service.superheroList.set([
        listRowFromImageOnly({
          response: 'success',
          id: '7',
          name: 'Seven',
          url: '',
        }),
      ]);
      service.deleteHero('7');
      expect(service.superheroList().length).toBe(0);
    });

    it('records deleted ids so batch loads do not re-append them (filterRemovedHeroes)', async () => {
      const service = TestBed.inject(Superhero);
      const img = {
        response: 'success' as const,
        id: '99',
        name: 'N',
        url: 'https://img',
      };
      getCharacterImageById.mockReturnValue(of(img));

      service.deleteHero('99');
      service.loadThumbnailsForIds([99]);
      await flushMicrotasks();

      expect(service.superheroList().some((r) => r.id === '99')).toBe(false);
    });
  });

  describe('setHeroCreatorPrefill / consumeHeroCreatorPrefill', () => {
    it('prefill is consumed once', () => {
      const service = TestBed.inject(Superhero);
      service.setHeroCreatorPrefill({ name: 'A', publisher: 'P' });
      expect(service.consumeHeroCreatorPrefill()).toEqual({
        name: 'A',
        publisher: 'P',
      });
      expect(service.consumeHeroCreatorPrefill()).toBeNull();
    });

    it('consumeHeroCreatorPrefill returns null when nothing was set', () => {
      const service = TestBed.inject(Superhero);
      expect(service.consumeHeroCreatorPrefill()).toBeNull();
    });

    it('setHeroCreatorPrefill replaces previous prefill', () => {
      const service = TestBed.inject(Superhero);
      service.setHeroCreatorPrefill({ name: 'First' });
      service.setHeroCreatorPrefill({ name: 'Second' });
      expect(service.consumeHeroCreatorPrefill()?.name).toBe('Second');
    });
  });

  describe('nameSearch', () => {
    let originalApiKey: string;

    beforeEach(() => {
      originalApiKey = environment.apiKey;
    });

    afterEach(() => {
      environment.apiKey = originalApiKey;
    });

    async function setupNameSearch(): Promise<{
      service: Superhero;
      fixture: ReturnType<typeof TestBed.createComponent<NameSearchHost>>;
      searchQuery: ReturnType<typeof signal<string>>;
    }> {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [NameSearchHost],
        providers: [
          provideHttpClient(),
          {
            provide: ApiService,
            useValue: {
              searchHeroesByName,
              getCharacterImageById,
            },
          },
        ],
      });
      const service = TestBed.inject(Superhero);
      const fixture = TestBed.createComponent(NameSearchHost);
      const injector = fixture.componentRef.injector;
      const destroyRef = injector.get(DestroyRef);
      const searchQuery = signal('');
      service.nameSearch({ searchQuery, destroyRef, injector });
      return { service, fixture, searchQuery };
    }

    it('clears api search results when query is blank after debounce', async () => {
      environment.apiKey = 'k';
      const { service, fixture, searchQuery } = await setupNameSearch();

      const internal = service as unknown as {
        apiSearchResultsInternal: { set(rows: SuperheroListRow[]): void };
      };
      internal.apiSearchResultsInternal.set([
        listRowFromImageOnly({
          response: 'success',
          id: '1',
          name: 'X',
          url: '',
        }),
      ]);
      searchQuery.set('  ');
      await new Promise((r) => setTimeout(r, NAME_SEARCH_DEBOUNCE_MS));
      expect(service.apiSearchResults().length).toBe(0);
      expect(service.apiSearchLoading()).toBe(false);

      fixture.destroy();
    });

    it('does not call API when list filter is created', async () => {
      environment.apiKey = 'k';
      const { service, fixture, searchQuery } = await setupNameSearch();

      service.setHeroesListFilter('created');
      searchQuery.set('batman');
      await new Promise((r) => setTimeout(r, NAME_SEARCH_DEBOUNCE_MS));
      expect(searchHeroesByName).not.toHaveBeenCalled();
      expect(service.apiSearchResults()).toEqual([]);

      fixture.destroy();
    });

    it('does not call API when api key is missing', async () => {
      environment.apiKey = '';
      const { service, fixture, searchQuery } = await setupNameSearch();

      service.setHeroesListFilter('api');
      searchQuery.set('batman');
      await new Promise((r) => setTimeout(r, NAME_SEARCH_DEBOUNCE_MS));
      expect(searchHeroesByName).not.toHaveBeenCalled();

      fixture.destroy();
    });

    it('searches by trimmed query and maps success results', async () => {
      environment.apiKey = 'secret';
      const batRow = listRowFromImageOnly({
        response: 'success',
        id: '42',
        name: 'Bat',
        url: 'http://i',
      });
      searchHeroesByName.mockReturnValue(
        of({
          response: 'success',
          'results-for': 'bat',
          results: [batRow],
        }),
      );

      const { service, fixture, searchQuery } = await setupNameSearch();

      service.setHeroesListFilter('api');
      searchQuery.set('  bat  ');
      await new Promise((r) => setTimeout(r, NAME_SEARCH_DEBOUNCE_MS));

      expect(searchHeroesByName).toHaveBeenCalledWith('bat');
      expect(service.apiSearchResults().length).toBe(1);
      expect(service.apiSearchResults()[0].name).toBe('Bat');
      expect(service.apiSearchLoading()).toBe(false);

      fixture.destroy();
    });

    it('maps error search response to empty results', async () => {
      environment.apiKey = 'k';
      searchHeroesByName.mockReturnValue(
        of({ response: 'error', error: 'not found' }),
      );

      const { service, fixture, searchQuery } = await setupNameSearch();

      service.setHeroesListFilter('api');
      searchQuery.set('nobody');
      await new Promise((r) => setTimeout(r, NAME_SEARCH_DEBOUNCE_MS));

      expect(service.apiSearchResults()).toEqual([]);
      expect(service.apiSearchLoading()).toBe(false);

      fixture.destroy();
    });

    it('catchError maps HTTP failures to empty results', async () => {
      environment.apiKey = 'k';
      searchHeroesByName.mockReturnValue(
        throwError(() => new Error('network')),
      );

      const { service, fixture, searchQuery } = await setupNameSearch();

      service.setHeroesListFilter('api');
      searchQuery.set('fail');
      await new Promise((r) => setTimeout(r, NAME_SEARCH_DEBOUNCE_MS));

      expect(service.apiSearchResults()).toEqual([]);
      expect(service.apiSearchLoading()).toBe(false);

      fixture.destroy();
    });

    it('does not repeat search when query and mode are unchanged (distinctUntilChanged)', async () => {
      environment.apiKey = 'k';
      const { service, fixture, searchQuery } = await setupNameSearch();

      service.setHeroesListFilter('api');
      searchQuery.set('once');
      await new Promise((r) => setTimeout(r, NAME_SEARCH_DEBOUNCE_MS));
      searchQuery.set('once ');
      await new Promise((r) => setTimeout(r, NAME_SEARCH_DEBOUNCE_MS));

      expect(searchHeroesByName).toHaveBeenCalledTimes(1);

      fixture.destroy();
    });
  });

  describe('loadNextThumbnailBatch', () => {
    function successImage(id: number) {
      return {
        response: 'success' as const,
        id: String(id),
        name: `Hero ${id}`,
        url: `https://example.com/${id}.png`,
      };
    }

    it('loads BATCH_SIZE (15) thumbnails starting at nextId and advances nextId', async () => {
      const service = TestBed.inject(Superhero);
      getCharacterImageById.mockImplementation((characterId: string) =>
        of(successImage(Number.parseInt(characterId, 10))),
      );

      service.superheroList.set([]);
      service.loadNextThumbnailBatch();
      await flushMicrotasks();

      expect(getCharacterImageById).toHaveBeenCalledTimes(15);
      const internal = service as unknown as { nextId: () => number };
      expect(internal.nextId()).toBe(16);
      expect(service.superheroList().length).toBe(15);
      expect(service.isLoadingBatch()).toBe(false);
    });

    it('skips null/error image responses but keeps successes', async () => {
      const service = TestBed.inject(Superhero);
      let call = 0;
      getCharacterImageById.mockImplementation((characterId: string) => {
        call += 1;
        const id = Number.parseInt(characterId, 10);
        if (call === 3) {
          return of({ response: 'error' as const, error: 'x' });
        }
        return of(successImage(id));
      });

      service.superheroList.set([]);
      service.loadNextThumbnailBatch();
      await flushMicrotasks();

      expect(service.superheroList().length).toBe(14);
    });

    it('returns early when hasMore is false', () => {
      const service = TestBed.inject(Superhero);
      const internal = service as unknown as {
        nextId: { set(v: number): void };
      };
      internal.nextId.set(732);

      service.loadNextThumbnailBatch();
      expect(getCharacterImageById).not.toHaveBeenCalled();
    });

    it('returns early when a batch is already loading', async () => {
      const service = TestBed.inject(Superhero);
      getCharacterImageById.mockReturnValue(
        timer(80).pipe(
          take(1),
          map((i) => successImage(i + 1)),
        ),
      );

      service.loadNextThumbnailBatch();
      service.loadNextThumbnailBatch();

      expect(getCharacterImageById).toHaveBeenCalledTimes(15);

      await firstValueFrom(timer(120));
      expect(service.isLoadingBatch()).toBe(false);
    });

    it('clears batchLoading when forkJoin fails', async () => {
      const service = TestBed.inject(Superhero);
      getCharacterImageById.mockReturnValue(
        throwError(() => new Error('http')),
      );

      service.loadNextThumbnailBatch();
      await flushMicrotasks();

      expect(service.isLoadingBatch()).toBe(false);
    });
  });

  describe('loadThumbnailsForIds', () => {
    function successImage(id: number) {
      return {
        response: 'success' as const,
        id: String(id),
        name: `Hero ${id}`,
        url: `https://example.com/${id}.png`,
      };
    }

    it('returns early when ids is empty', () => {
      const service = TestBed.inject(Superhero);
      service.loadThumbnailsForIds([]);
      expect(getCharacterImageById).not.toHaveBeenCalled();
    });

    it('returns early when batch is already loading', async () => {
      const service = TestBed.inject(Superhero);
      getCharacterImageById.mockReturnValue(
        timer(80).pipe(
          take(1),
          map(() => successImage(1)),
        ),
      );

      service.loadThumbnailsForIds([1, 2]);
      service.loadThumbnailsForIds([3]);

      expect(getCharacterImageById).toHaveBeenCalledTimes(2);

      await firstValueFrom(timer(120));
    });

    it('appends mapped rows for successful responses', async () => {
      const service = TestBed.inject(Superhero);
      getCharacterImageById.mockImplementation((characterId: string) =>
        of(successImage(Number.parseInt(characterId, 10))),
      );

      service.superheroList.set([]);
      service.loadThumbnailsForIds([100, 101]);
      await flushMicrotasks();

      const list = service.superheroList();
      expect(list.length).toBe(2);
      expect(list.map((r) => r.id).sort()).toEqual(['100', '101']);
      expect(service.isLoadingBatch()).toBe(false);
    });

    it('clears batchLoading when forkJoin fails', async () => {
      const service = TestBed.inject(Superhero);
      getCharacterImageById.mockReturnValue(
        throwError(() => new Error('http')),
      );

      service.loadThumbnailsForIds([5]);
      await flushMicrotasks();

      expect(service.isLoadingBatch()).toBe(false);
    });
  });

});
