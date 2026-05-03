import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { Observable } from 'rxjs';
import type {
  SuperheroApiResponse,
  SuperheroApiSuccess,
  SuperheroImageOnlyResponse,
  SuperheroListRow,
  SuperheroSearchResponse,
  SuperheroSearchSuccess,
} from '../models/superhero-api.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private static readonly invalidCharacterIdMessage = 'Character ID must contain only digits with no leading zeros.';
  private readonly http = inject(HttpClient);
  
  private characterUrl(characterId: string): string {
    if (!this.isNumericId(characterId)) {
      throw new Error(ApiService.invalidCharacterIdMessage);
    }
    return `${environment.apiUrl}/${environment.apiKey}/${characterId}`;
  }

  private isNumericId(characterId: string): boolean {
    const characterIdLength = characterId.length;
    if (characterIdLength === 0) {
      return false;
    }
    if (characterId[0] === '0') {
      return characterIdLength === 1;
    }
    for (let i = 0; i < characterIdLength; i++) {
      const c = characterId.charCodeAt(i);
      if (c < 48 || c > 57) {
        return false;
      }
    }
    return true;
  }

  getCharacterById(characterId: string): Observable<SuperheroApiResponse> {
    return this.http.get<SuperheroApiResponse>(this.characterUrl(characterId));
  }

  getCharacterImageById(characterId: string): Observable<SuperheroImageOnlyResponse> {
    return this.http.get<SuperheroImageOnlyResponse>(
      `${this.characterUrl(characterId)}/image`,
    );
  }

  searchHeroesByName(name: string): Observable<SuperheroSearchResponse> {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error('Search name must be non-empty.');
    }
    const key = environment.apiKey?.trim();
    if (!key) {
      throw new Error('API key is required for search.');
    }
    const base = environment.apiUrl.replace(/\/$/, '');
    const url = `${base}/${key}/search/${encodeURIComponent(trimmed)}`;
    return this.http.get<SuperheroSearchResponse>(url);
  }
}

export function normalizeSuperheroSearchResults(
  results: SuperheroSearchSuccess['results'],
): SuperheroListRow[] {
  if (results == null) {
    return [];
  }
  const list = Array.isArray(results) ? results : [results];
  return list.map((row) =>
    searchHasSuccessResponse(row as SuperheroApiSuccess & { id?: string | number }),
  );
}

function searchHasSuccessResponse(
  row: SuperheroApiSuccess & { id?: string | number },
): SuperheroListRow {
  const id = String(row.id ?? '').trim();
  const withId =
    id === row.id ? row : ({ ...row, id } as SuperheroApiSuccess);
  if (withId.response === 'success') {
    return { ...withId, created: false };
  }
  return { ...withId, response: 'success', created: false };
}
