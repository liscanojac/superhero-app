
export type SuperheroPowerstatsApi = {
  intelligence: string;
  strength: string;
  speed: string;
  durability: string;
  power: string;
  combat: string;
};

export type SuperheroBiographyApi = {
  'full-name': string;
  'alter-egos': string;
  aliases: string[];
  'place-of-birth': string;
  'first-appearance': string;
  publisher: string;
  alignment: string;
};

export type SuperheroAppearanceApi = {
  gender: string;
  race: string;
  height: string[];
  weight: string[];
  'eye-color': string;
  'hair-color': string;
};

export type SuperheroWorkApi = {
  occupation: string;
  base: string;
};

export type SuperheroConnectionsApi = {
  'group-affiliation': string;
  relatives: string;
};

export type SuperheroImageApi = {
  url: string;
};

export type SuperheroApiSuccess = {
  response: 'success';
  id: string;
  name: string;
  powerstats: SuperheroPowerstatsApi;
  biography: SuperheroBiographyApi;
  appearance: SuperheroAppearanceApi;
  work: SuperheroWorkApi;
  connections: SuperheroConnectionsApi;
  image: SuperheroImageApi;
};

export type SuperheroListRow = SuperheroApiSuccess & {
  created: boolean;
};

export type SuperheroApiError = {
  response: 'error';
  error: string;
};

export type SuperheroApiResponse = SuperheroApiSuccess | SuperheroApiError;

export type SuperheroSearchSuccess = {
  response: 'success';
  'results-for': string;
  results: SuperheroApiSuccess | SuperheroApiSuccess[] | null | undefined;
};

export type SuperheroSearchResponse = SuperheroSearchSuccess | SuperheroApiError;

export type SuperheroImageOnlySuccess = {
  response: 'success';
  id: string;
  name: string;
  url: string;
};

export type SuperheroImageOnlyResponse = SuperheroImageOnlySuccess | SuperheroApiError;