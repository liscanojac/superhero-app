import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { routes } from '../../app.routes';
import { Home } from './home';

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [provideRouter(routes)],
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show the app title, tagline, and Enter link to heroes', () => {
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const title = root.querySelector('#home-title');
    const tagline = root.querySelector('.home-tagline');
    const enter = root.querySelector('a.home-enter');

    expect(title?.textContent?.replace(/\s+/g, ' ').trim()).toBe('Superhero App');
    expect(tagline?.textContent?.trim().length).toBeGreaterThan(0);
    expect(enter?.textContent?.trim()).toBe('Enter');
    expect(enter?.getAttribute('href')).toBe('/heroes');
  });
});
