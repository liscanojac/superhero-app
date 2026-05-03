import { TestBed } from '@angular/core/testing';
import { ApiService } from './api-service';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import type { SuperheroApiResponse, SuperheroImageOnlyResponse } from '../models/superhero-api.model';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;
  const invalidIdMessage =
    'Character ID must contain only digits with no leading zeros.';
  function expectedCharacterUrl(id: string): string {
    return `${environment.apiUrl}/${environment.apiKey}/${id}`;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('isNumericId (private)', () => {
    
    function isNumericId(characterId: string): boolean {
      const impl = service as unknown as { isNumericId(id: string): boolean };
      return impl.isNumericId.call(service, characterId);
    }

    describe('valid whole-number ids (digits only, no leading zeros)', () => {
      it('accepts single non-zero digits', () => {
        expect(isNumericId('1')).toBe(true);
        expect(isNumericId('2')).toBe(true);
        expect(isNumericId('9')).toBe(true);
      });

      it('accepts multi-digit numbers without leading zero', () => {
        expect(isNumericId('10')).toBe(true);
        expect(isNumericId('99')).toBe(true);
        expect(isNumericId('1234567890')).toBe(true);
      });

      it('accepts lone zero as whole number (no leading-zero issue)', () => {
        expect(isNumericId('0')).toBe(true);
      });

      it('accepts a long digit string (smoke for no accidental limits)', () => {
        expect(isNumericId('1' + '0'.repeat(64))).toBe(true);
      });
    });

    describe('invalid — leading zeros', () => {
      it('rejects zero followed by more digits', () => {
        expect(isNumericId('01')).toBe(false);
        expect(isNumericId('0123')).toBe(false);
        expect(isNumericId('00')).toBe(false);
        expect(isNumericId('000')).toBe(false);
      });
    });

    describe('invalid — empty or not only digits', () => {
      it('rejects empty string', () => {
        expect(isNumericId('')).toBe(false);
      });

      it('rejects letters mixed with digits', () => {
        expect(isNumericId('12a')).toBe(false);
        expect(isNumericId('a12')).toBe(false);
        expect(isNumericId('1a2')).toBe(false);
      });

      it('rejects sign characters', () => {
        expect(isNumericId('-1')).toBe(false);
        expect(isNumericId('+1')).toBe(false);
        expect(isNumericId('-0')).toBe(false);
      });

      it('rejects decimal and grouping characters', () => {
        expect(isNumericId('12.3')).toBe(false);
        expect(isNumericId('1,234')).toBe(false);
        expect(isNumericId('1_234')).toBe(false);
      });

      it('rejects scientific / exponent notation as text', () => {
        expect(isNumericId('1e3')).toBe(false);
        expect(isNumericId('1E3')).toBe(false);
        expect(isNumericId('10e2')).toBe(false);
      });

      it('rejects whitespace padding or internal space', () => {
        expect(isNumericId(' 1')).toBe(false);
        expect(isNumericId('1 ')).toBe(false);
        expect(isNumericId(' 1 ')).toBe(false);
        expect(isNumericId('1 2')).toBe(false);
      });

      it('rejects tabs and newlines', () => {
        expect(isNumericId('1\t')).toBe(false);
        expect(isNumericId('\n1')).toBe(false);
        expect(isNumericId('1\n2')).toBe(false);
      });

      it('rejects only whitespace', () => {
        expect(isNumericId(' ')).toBe(false);
        expect(isNumericId('\t')).toBe(false);
        expect(isNumericId('\n')).toBe(false);
      });
    });

    describe('nice-to-have / edge cases', () => {
      it('rejects Unicode digits that look like ASCII (fullwidth)', () => {
        expect(isNumericId('０')).toBe(false); // U+FF10
        expect(isNumericId('１')).toBe(false); // U+FF11
        expect(isNumericId('１２３')).toBe(false);
      });

      it('rejects invisible or format characters', () => {
        expect(isNumericId('1\u200b2')).toBe(false); // zero-width space
        expect(isNumericId('\ufeff1')).toBe(false); // BOM
      });

      it('rejects common non-id tokens', () => {
        expect(isNumericId('NaN')).toBe(false);
        expect(isNumericId('Infinity')).toBe(false);
        expect(isNumericId('null')).toBe(false);
        expect(isNumericId('undefined')).toBe(false);
      });

      it('rejects emoji and arbitrary symbols', () => {
        expect(isNumericId('1🙂')).toBe(false);
      });

      it('rejects empty-looking but non-empty junk', () => {
        expect(isNumericId('\u00a0')).toBe(false); // NBSP alone
      });
    });
  });

  describe('getCharacterById', () => {
    it('GETs the character URL built from environment and id', async () => {
      const id = '731';
      const mockBody = { response: 'error', error: 'bad luck' } as SuperheroApiResponse;
      const responsePromise = firstValueFrom(service.getCharacterById(id));
      const req = httpMock.expectOne(expectedCharacterUrl(id));
      expect(req.request.method).toBe('GET');
      expect(req.request.url).toBe(expectedCharacterUrl(id));
      expect(req.request.body).toBeNull();
      req.flush(mockBody);
      await expect(responsePromise).resolves.toEqual(mockBody);
    });

    it('GETs for id 0 (lone zero is valid)', async () => {
      const id = '0';
      const mockBody = { response: 'error', error: 'not found' } as SuperheroApiResponse;
      const responsePromise = firstValueFrom(service.getCharacterById(id));
      const req = httpMock.expectOne(expectedCharacterUrl(id));
      req.flush(mockBody);
      await expect(responsePromise).resolves.toEqual(mockBody);
    });

    it('resolves with a success-shaped API body', async () => {
      const id = '1';
      const mockBody = {
        response: 'success',
        id: '1',
        name: 'Test Hero',
        powerstats: {
          intelligence: '0',
          strength: '0',
          speed: '0',
          durability: '0',
          power: '0',
          combat: '0',
        },
        biography: {
          'full-name': '',
          'alter-egos': '',
          aliases: [],
          'place-of-birth': '',
          'first-appearance': '',
          publisher: '',
          alignment: '',
        },
        appearance: {
          gender: '',
          race: '',
          height: [],
          weight: [],
          'eye-color': '',
          'hair-color': '',
        },
        work: { occupation: '', base: '' },
        connections: { 'group-affiliation': '', relatives: '' },
        image: { url: '' },
      } as SuperheroApiResponse;

      const responsePromise = firstValueFrom(service.getCharacterById(id));
      httpMock.expectOne(expectedCharacterUrl(id)).flush(mockBody);
      await expect(responsePromise).resolves.toEqual(mockBody);
    });

    it('rejects when the backend returns HTTP error', async () => {
      const id = '999';
      const responsePromise = firstValueFrom(service.getCharacterById(id));
      const req = httpMock.expectOne(expectedCharacterUrl(id));
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

      const err = await responsePromise.catch((e: unknown) => e);
      expect(err).toBeInstanceOf(HttpErrorResponse);
      expect((err as HttpErrorResponse).status).toBe(500);
      expect((err as HttpErrorResponse).error).toBe('Server error');
    });

    it('throws before HTTP when id is invalid', () => {
      expect(() => service.getCharacterById('01')).toThrow(invalidIdMessage);
    });

    it('throws before HTTP for other invalid ids', () => {
      for (const badId of ['', ' 1', '12a', '-1', '1.2', '00']) {
        expect(() => service.getCharacterById(badId)).toThrow(invalidIdMessage);
      }
    });

    it('does not issue an HTTP request when id is invalid', () => {
      expect(() => service.getCharacterById('01')).toThrow(invalidIdMessage);
      httpMock.expectNone(() => true);
    });
  });

  describe('getCharacterImageById', () => {
    it('GETs {characterUrl}/image', async () => {
      const id = '731';
      const mockBody = {
        response: 'success',
        id,
        name: 'Test',
        url: 'https://example.com/x.png',
      } as SuperheroImageOnlyResponse;
      const responsePromise = firstValueFrom(service.getCharacterImageById(id));
      const expectedUrl = `${expectedCharacterUrl(id)}/image`;
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      expect(req.request.url).toBe(expectedUrl);
      expect(req.request.body).toBeNull();
      req.flush(mockBody);
      await expect(responsePromise).resolves.toEqual(mockBody);
    });

    it('GETs image endpoint for id 0', async () => {
      const id = '0';
      const mockBody = {
        response: 'success',
        id,
        name: 'Zero',
        url: 'https://example.com/0.png',
      } as SuperheroImageOnlyResponse;

      const responsePromise = firstValueFrom(service.getCharacterImageById(id));
      const req = httpMock.expectOne(`${expectedCharacterUrl(id)}/image`);
      req.flush(mockBody);
      await expect(responsePromise).resolves.toEqual(mockBody);
    });

    it('resolves with an error-shaped API body (HTTP 200)', async () => {
      const id = '2';
      const mockBody = { response: 'error', error: 'invalid id' } as SuperheroImageOnlyResponse;

      const responsePromise = firstValueFrom(service.getCharacterImageById(id));
      httpMock.expectOne(`${expectedCharacterUrl(id)}/image`).flush(mockBody);
      await expect(responsePromise).resolves.toEqual(mockBody);
    });

    it('rejects when the backend returns HTTP error', async () => {
      const id = '88';
      
      const responsePromise = firstValueFrom(service.getCharacterImageById(id));
      const req = httpMock.expectOne(`${expectedCharacterUrl(id)}/image`);
      req.flush('Not found', { status: 404, statusText: 'Not Found' });

      const err = await responsePromise.catch((e: unknown) => e);
      expect(err).toBeInstanceOf(HttpErrorResponse);
      expect((err as HttpErrorResponse).status).toBe(404);
      expect((err as HttpErrorResponse).error).toBe('Not found');
    });

    it('throws before HTTP when id is invalid', () => {
      expect(() => service.getCharacterImageById('')).toThrow(invalidIdMessage);
    });

    it('throws before HTTP for other invalid ids', () => {
      for (const badId of ['01', 'abc', '1 ', 'NaN']) {
        expect(() => service.getCharacterImageById(badId)).toThrow(invalidIdMessage);
      }
    });

    it('does not issue an HTTP request when id is invalid', () => {
      expect(() => service.getCharacterImageById('0123')).toThrow(invalidIdMessage);
      httpMock.expectNone(() => true);
    });
  });

});