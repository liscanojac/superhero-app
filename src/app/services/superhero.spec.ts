import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import {
  createLocalHeroInputFromApiSuccess,
  listRowFromImageOnly,
  listRowFromLocalInput,
} from '../models/superhero-list.mappers';

import { Superhero } from './superhero';

describe('Superhero', () => {
  let service: Superhero;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()],
    });
    service = TestBed.inject(Superhero);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('deleteHero removes the hero from the list', () => {
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

  it('addCreatedHero prepends a local hero in full API shape', () => {
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

  it('addCreatedHero assigns increasing ids from 3000 upward', () => {
    service.superheroList.set([]);
    service.addCreatedHero({ name: 'A' });
    service.addCreatedHero({ name: 'B' });
    const ids = service.superheroList().map((h) => Number.parseInt(h.id, 10));
    expect(ids[0]).toBeGreaterThan(ids[1]);
    expect(Math.min(...ids)).toBeGreaterThanOrEqual(3000);
  });

  it('setHeroCreatorPrefill is consumed once by consumeHeroCreatorPrefill', () => {
    service.setHeroCreatorPrefill({ name: 'A', publisher: 'P' });
    expect(service.consumeHeroCreatorPrefill()).toEqual({
      name: 'A',
      publisher: 'P',
    });
    expect(service.consumeHeroCreatorPrefill()).toBeNull();
  });

  it('createLocalHeroInputFromApiSuccess supports name override for duplicates', () => {
    const row = listRowFromLocalInput('3000', {
      name: 'Original',
      intelligence: '88',
      publisher: 'Pub',
    });
    const dup = createLocalHeroInputFromApiSuccess(row, {
      name: 'Copy of Original',
    });
    expect(dup.name).toBe('Copy of Original');
    expect(dup.intelligence).toBe('88');
    expect(dup.publisher).toBe('Pub');
  });
});
