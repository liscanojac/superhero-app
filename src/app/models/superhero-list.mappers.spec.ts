import type { SuperheroApiSuccess, SuperheroImageOnlySuccess } from './superhero-api.model';
import {
  addHeroToList,
  createLocalHeroInputsFromApi,
  listRowFromImageOnly,
} from './superhero-list.mappers';

function minimalApiSuccess(overrides: Partial<SuperheroApiSuccess> = {}): SuperheroApiSuccess {
  const base: SuperheroApiSuccess = {
    response: 'success',
    id: '1',
    name: 'Test Hero',
    powerstats: {
      intelligence: '10',
      strength: '20',
      speed: '30',
      durability: '40',
      power: '50',
      combat: '60',
    },
    biography: {
      'full-name': 'Full Name',
      'alter-egos': 'No alter egos found.',
      aliases: ['A', 'B'],
      'place-of-birth': 'Earth',
      'first-appearance': 'Comic #1',
      publisher: 'DC',
      alignment: 'good',
    },
    appearance: {
      gender: 'Male',
      race: 'Human',
      height: ["5'10", '178 cm'],
      weight: ['170 lb', '77 kg'],
      'eye-color': 'blue',
      'hair-color': 'black',
    },
    work: {
      occupation: 'Vigilante',
      base: 'Cave',
    },
    connections: {
      'group-affiliation': 'League',
      relatives: 'Parents',
    },
    image: { url: 'https://example.com/h.png' },
  };
  return { ...base, ...overrides };
}

describe('listRowFromImageOnly', () => {
  it('maps image-only payload to list row with placeholders and created false', () => {
    const row: SuperheroImageOnlySuccess = {
      response: 'success',
      id: '42',
      name: 'Thumb',
      url: 'https://cdn/img.png',
    };
    const out = listRowFromImageOnly(row);
    expect(out.response).toBe('success');
    expect(out.id).toBe('42');
    expect(out.name).toBe('Thumb');
    expect(out.image.url).toBe('https://cdn/img.png');
    expect(out.created).toBe(false);
    expect(out.powerstats.intelligence).toBe('-');
    expect(out.biography['alter-egos']).toBe('No alter egos found.');
    expect(out.biography.alignment).toBe('good');
    expect(out.appearance.height).toEqual(['-', '-']);
    expect(out.work.occupation).toBe('-');
  });
});

describe('createLocalHeroInputsFromApi', () => {
  it('maps core hero fields to LocalHeroInput', () => {
    const hero = minimalApiSuccess();
    const input = createLocalHeroInputsFromApi(hero);
    expect(input.name).toBe('Test Hero');
    expect(input.imageUrl).toBe('https://example.com/h.png');
    expect(input.intelligence).toBe('10');
    expect(input.fullName).toBe('Full Name');
    expect(input.publisher).toBe('DC');
    expect(input.alignment).toBe('good');
    expect(input.gender).toBe('Male');
    expect(input.race).toBe('Human');
    expect(input.height0).toBe("5'10");
    expect(input.height1).toBe('178 cm');
    expect(input.aliasesCsv).toBe('A, B');
    expect(input.alterEgos).toBeUndefined();
    expect(input.groupAffiliation).toBe('League');
  });

  it('uses options.name override when provided', () => {
    const hero = minimalApiSuccess({ name: 'Original' });
    const input = createLocalHeroInputsFromApi(hero, {
      name: 'Copy of Original',
    });
    expect(input.name).toBe('Copy of Original');
  });

  it('treats empty or default alter-egos as undefined', () => {
    const noAlters = createLocalHeroInputsFromApi(
      minimalApiSuccess({
        biography: {
          ...minimalApiSuccess().biography,
          'alter-egos': '',
        },
      }),
    );
    expect(noAlters.alterEgos).toBeUndefined();

    const defaultPhrase = createLocalHeroInputsFromApi(minimalApiSuccess());
    expect(defaultPhrase.alterEgos).toBeUndefined();
  });

  it('preserves non-default alter-egos text', () => {
    const input = createLocalHeroInputsFromApi(
      minimalApiSuccess({
        biography: {
          ...minimalApiSuccess().biography,
          'alter-egos': ' Bruce Wayne ',
        },
      }),
    );
    expect(input.alterEgos).toBe('Bruce Wayne');
  });

  it('maps numeric stats and clamps to 0–100', () => {
    const input = createLocalHeroInputsFromApi(
      minimalApiSuccess({
        powerstats: {
          intelligence: '150',
          strength: '-10',
          speed: ' 45 ',
          durability: '-',
          power: 'null',
          combat: 'not-a-number',
        },
      }),
    );
    expect(input.intelligence).toBe('100');
    expect(input.strength).toBe('0');
    expect(input.speed).toBe('45');
    expect(input.durability).toBeUndefined();
    expect(input.power).toBeUndefined();
    expect(input.combat).toBeUndefined();
  });

  it('drops aliases list when empty after trimming', () => {
    const input = createLocalHeroInputsFromApi(
      minimalApiSuccess({
        biography: {
          ...minimalApiSuccess().biography,
          aliases: ['  ', ''],
        },
      }),
    );
    expect(input.aliasesCsv).toBeUndefined();
  });

  it('normalizes alignment to lowercase good, bad, neutral', () => {
    expect(
      createLocalHeroInputsFromApi(
        minimalApiSuccess({ biography: { ...minimalApiSuccess().biography, alignment: 'BAD' } }),
      ).alignment,
    ).toBe('bad');
    expect(
      createLocalHeroInputsFromApi(
        minimalApiSuccess({
          biography: { ...minimalApiSuccess().biography, alignment: 'Neutral' },
        }),
      ).alignment,
    ).toBe('neutral');
  });

  it('preserves biography alignment dash and defaults unknown to good', () => {
    expect(
      createLocalHeroInputsFromApi(
        minimalApiSuccess({
          biography: { ...minimalApiSuccess().biography, alignment: '-' },
        }),
      ).alignment,
    ).toBe('-');

    expect(
      createLocalHeroInputsFromApi(
        minimalApiSuccess({
          biography: { ...minimalApiSuccess().biography, alignment: 'chaotic' },
        }),
      ).alignment,
    ).toBe('good');
  });

  it('maps Male and Female gender; otherwise Unknown', () => {
    expect(createLocalHeroInputsFromApi(minimalApiSuccess()).gender).toBe('Male');
    expect(
      createLocalHeroInputsFromApi(
        minimalApiSuccess({
          appearance: { ...minimalApiSuccess().appearance, gender: 'Female' },
        }),
      ).gender,
    ).toBe('Female');
    expect(
      createLocalHeroInputsFromApi(
        minimalApiSuccess({
          appearance: { ...minimalApiSuccess().appearance, gender: 'male' },
        }),
      ).gender,
    ).toBe('Unknown');
  });

  it('treats dash, empty, and null-like strings as optional fields', () => {
    const input = createLocalHeroInputsFromApi(
      minimalApiSuccess({
        biography: {
          ...minimalApiSuccess().biography,
          'place-of-birth': '-',
          'first-appearance': 'NULL',
        },
        appearance: {
          ...minimalApiSuccess().appearance,
          race: 'null',
        },
      }),
    );
    expect(input.placeOfBirth).toBeUndefined();
    expect(input.firstAppearance).toBeUndefined();
    expect(input.race).toBeUndefined();
  });

  it('omit image URL when blank', () => {
    const input = createLocalHeroInputsFromApi(
      minimalApiSuccess({ image: { url: '   ' } }),
    );
    expect(input.imageUrl).toBeUndefined();
  });
});

describe('addHeroToList', () => {
  it('builds a created list row with trimmed name and defaults', () => {
    const row = addHeroToList('3001', { name: '  Local  ' });
    expect(row.id).toBe('3001');
    expect(row.name).toBe('Local');
    expect(row.created).toBe(true);
    expect(row.biography['alter-egos']).toBe('No alter egos found.');
    expect(row.biography.alignment).toBe('good');
    expect(row.powerstats.intelligence).toBe('-');
    expect(row.appearance.height).toEqual(['-', '-']);
    expect(row.image.url).toBe('');
  });

  it('maps optional stats and biography fields with dash placeholders', () => {
    const row = addHeroToList('3002', {
      name: 'Z',
      intelligence: '88',
      publisher: 'Pub',
      fullName: 'Secret',
      alterEgos: 'Other self',
      alignment: 'bad',
      gender: 'Female',
      occupation: 'Spy',
    });
    expect(row.powerstats.intelligence).toBe('88');
    expect(row.biography.publisher).toBe('Pub');
    expect(row.biography['full-name']).toBe('Secret');
    expect(row.biography['alter-egos']).toBe('Other self');
    expect(row.biography.alignment).toBe('bad');
    expect(row.appearance.gender).toBe('Female');
    expect(row.work.occupation).toBe('Spy');
  });

  it('parses aliases CSV into an array', () => {
    const row = addHeroToList('3003', {
      name: 'A',
      aliasesCsv: ' one , two,  ',
    });
    expect(row.biography.aliases).toEqual(['one', 'two']);
  });

  it('uses heightWeightPair for height and weight columns', () => {
    const bothEmpty = addHeroToList('3004', { name: 'H' });
    expect(bothEmpty.appearance.height).toEqual(['-', '-']);
    expect(bothEmpty.appearance.weight).toEqual(['-', '-']);

    const partial = addHeroToList('3005', {
      name: 'H',
      height0: "6'0",
      weight1: '90kg',
    });
    expect(partial.appearance.height).toEqual(["6'0", '-']);
    expect(partial.appearance.weight).toEqual(['-', '90kg']);
  });

  it('defaults alignment to good when missing or blank after trim', () => {
    const row = addHeroToList('3006', { name: 'X', alignment: '   ' });
    expect(row.biography.alignment).toBe('good');
  });
});
