import type {
  SuperheroApiSuccess,
  SuperheroImageOnlySuccess,
  SuperheroListRow,
} from './superhero-api.model';
import { LocalHeroInput } from './superhero-creator.model';

function getTrimmedOrDashedPlaceeholderString(value: string | undefined): string {
  const trimmedValue = (value ?? '').trim();
  return trimmedValue.length > 0 ? trimmedValue : '-';
}

function getTrimmedOrEmptyString(value: string | undefined): string {
  return (value ?? '').trim();
}

function parseAliasesCsv(csv: string | undefined): string[] {
  if (!csv?.trim()) {
    return [];
  }
  return csv
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function heightWeightPair(a: string | undefined, b: string | undefined): string[] {
  const x = (a ?? '').trim();
  const y = (b ?? '').trim();
  if (!x && !y) {
    return ['-', '-'];
  }
  return [x || '-', y || '-'];
}

export function listRowFromImageOnly(
  row: SuperheroImageOnlySuccess,
): SuperheroListRow {
  return {
    response: 'success',
    id: row.id,
    name: row.name,
    powerstats: {
      intelligence: '-',
      strength: '-',
      speed: '-',
      durability: '-',
      power: '-',
      combat: '-',
    },
    biography: {
      'full-name': '',
      'alter-egos': 'No alter egos found.',
      aliases: [],
      'place-of-birth': '-',
      'first-appearance': '-',
      publisher: '',
      alignment: 'good',
    },
    appearance: {
      gender: '-',
      race: '-',
      height: ['-', '-'],
      weight: ['-', '-'],
      'eye-color': '-',
      'hair-color': '-',
    },
    work: {
      occupation: '-',
      base: '-',
    },
    connections: {
      'group-affiliation': '-',
      relatives: '-',
    },
    image: { url: row.url },
    created: false,
  };
}

export function createLocalHeroInputsFromApi(
  hero: SuperheroApiSuccess,
  options?: { name?: string },
): LocalHeroInput {
  const name = (options?.name ?? hero.name).trim();
  const pw = hero.powerstats;
  const bio = hero.biography;
  const app = hero.appearance;
  const work = hero.work;
  const conn = hero.connections;

  const alterRaw = (bio['alter-egos'] ?? '').trim();
  const alterEgos =
    alterRaw === '' || alterRaw === 'No alter egos found.' ? undefined : alterRaw;

  return {
    name,
    imageUrl: optionalNonEmpty(hero.image?.url),
    intelligence: statFromApi(pw?.intelligence),
    strength: statFromApi(pw?.strength),
    speed: statFromApi(pw?.speed),
    durability: statFromApi(pw?.durability),
    power: statFromApi(pw?.power),
    combat: statFromApi(pw?.combat),
    fullName: optionalNonEmpty(bio['full-name']),
    alterEgos,
    aliasesCsv: aliasesToCsv(bio.aliases),
    placeOfBirth: dashToOptional(bio['place-of-birth']),
    firstAppearance: dashToOptional(bio['first-appearance']),
    publisher: optionalNonEmpty(bio.publisher),
    alignment: normalizeAlignmentFromApi(bio.alignment),
    gender: normalizeGenderFromApi(app.gender),
    race: dashToOptional(app.race),
    height0: dashToOptional(app.height?.[0]),
    height1: dashToOptional(app.height?.[1]),
    weight0: dashToOptional(app.weight?.[0]),
    weight1: dashToOptional(app.weight?.[1]),
    eyeColor: dashToOptional(app['eye-color']),
    hairColor: dashToOptional(app['hair-color']),
    occupation: dashToOptional(work.occupation),
    base: dashToOptional(work.base),
    groupAffiliation: dashToOptional(conn['group-affiliation']),
    relatives: dashToOptional(conn.relatives),
  };
}

function optionalNonEmpty(s: string | undefined): string | undefined {
  const t = (s ?? '').trim();
  return t.length > 0 ? t : undefined;
}

function dashToOptional(s: string | undefined): string | undefined {
  const t = (s ?? '').trim();
  if (t === '' || t === '-' || t.toLowerCase() === 'null') {
    return undefined;
  }
  return t;
}

// this stats are limited because in hero creator the inputs have min and max 
function statFromApi(stat: string | undefined): string | undefined {
  const trimmedStat = (stat ?? '').trim();
  if (trimmedStat === '' || trimmedStat === '-' || trimmedStat.toLowerCase() === 'null') {
    return undefined;
  }
  if (!/^-?\d+$/.test(trimmedStat)) {
    return undefined;
  }
  const n = Number(trimmedStat);
  if (!Number.isFinite(n)) {
    return undefined;
  }
  const statLimited = Math.min(100, Math.max(0, Math.trunc(n)));
  return String(statLimited);
}

function aliasesToCsv(aliases: string[] | undefined): string | undefined {
  if (!aliases?.length) {
    return undefined;
  }
  const parts = aliases.map((a) => String(a).trim()).filter((a) => a.length > 0);
  return parts.length > 0 ? parts.join(', ') : undefined;
}

function normalizeGenderFromApi(s: string | undefined): string {
  const t = (s ?? '').trim();
  if (t === 'Male' || t === 'Female') {
    return t;
  }
  return 'Unknown';
}

function normalizeAlignmentFromApi(s: string | undefined): string {
  const t = (s ?? '').trim().toLowerCase();
  if (t === 'good' || t === 'bad' || t === 'neutral') {
    return t;
  }
  if ((s ?? '').trim() === '-') {
    return '-';
  }
  return 'good';
}

export function addHeroToList(
  id: string,
  newHero: LocalHeroInput,
): SuperheroListRow {
  const name = newHero.name.trim();
  const imageUrl = (newHero.imageUrl ?? '').trim();
  const alterEgosRaw = (newHero.alterEgos ?? '').trim();
  const alterEgos =
    alterEgosRaw.length > 0 ? alterEgosRaw : 'No alter egos found.';
  const alignment = (newHero.alignment ?? 'good').trim() || 'good';

  return {
    response: 'success',
    id,
    name,
    powerstats: {
      intelligence: getTrimmedOrDashedPlaceeholderString(newHero.intelligence),
      strength: getTrimmedOrDashedPlaceeholderString(newHero.strength),
      speed: getTrimmedOrDashedPlaceeholderString(newHero.speed),
      durability: getTrimmedOrDashedPlaceeholderString(newHero.durability),
      power: getTrimmedOrDashedPlaceeholderString(newHero.power),
      combat: getTrimmedOrDashedPlaceeholderString(newHero.combat),
    },
    biography: {
      'full-name': getTrimmedOrEmptyString(newHero.fullName),
      'alter-egos': alterEgos,
      aliases: parseAliasesCsv(newHero.aliasesCsv),
      'place-of-birth': getTrimmedOrDashedPlaceeholderString(newHero.placeOfBirth),
      'first-appearance': getTrimmedOrDashedPlaceeholderString(newHero.firstAppearance),
      publisher: getTrimmedOrEmptyString(newHero.publisher),
      alignment,
    },
    appearance: {
      gender: getTrimmedOrDashedPlaceeholderString(newHero.gender),
      race: getTrimmedOrDashedPlaceeholderString(newHero.race),
      height: heightWeightPair(newHero.height0, newHero.height1),
      weight: heightWeightPair(newHero.weight0, newHero.weight1),
      'eye-color': getTrimmedOrDashedPlaceeholderString(newHero.eyeColor),
      'hair-color': getTrimmedOrDashedPlaceeholderString(newHero.hairColor),
    },
    work: {
      occupation: getTrimmedOrDashedPlaceeholderString(newHero.occupation),
      base: getTrimmedOrDashedPlaceeholderString(newHero.base),
    },
    connections: {
      'group-affiliation': getTrimmedOrDashedPlaceeholderString(newHero.groupAffiliation),
      relatives: getTrimmedOrDashedPlaceeholderString(newHero.relatives),
    },
    image: { url: imageUrl },
    created: true,
  };
}
