import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Injector,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { DestroyRef } from '@angular/core';
import { MatButtonToggleChange, MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';

import { HeroCard } from '../hero-card/hero-card';
import { SearchBar } from '../search-bar/search-bar';
import type { SuperheroListRow } from '../../models/superhero-api.model';
import { environment } from '../../../environments/environment';
import { Superhero } from '../../services/superhero';
import { HeroesListFilter } from '../../models/superheroes-list-filters';

function nameContainsQuery(hero: SuperheroListRow, qLower: string): boolean {
  return hero.name.toLowerCase().includes(qLower);
}

@Component({
  selector: 'app-heroes',
  imports: [
    HeroCard,
    SearchBar,
    MatButtonToggleModule,
    MatCardModule,
    MatProgressSpinnerModule,
    RouterLink,
  ],
  templateUrl: './heroes.html',
  styleUrl: './heroes.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Heroes implements OnInit {
  private readonly scrollThresholdPx = 160;

  readonly superheroService = inject(Superhero);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  readonly searchQuery = signal('');

  readonly filteredHeroes = computed(() => {
    const list = this.superheroService.superheroList();
    const filterMode = this.superheroService.listFilter();
    if (filterMode === 'all') {
      return list;
    }
    return list.filter((hero) =>
      filterMode === 'created' ? hero.created : !hero.created,
    );
  });

  readonly displayedHeroes = computed(() => {
    const trimmedSearch = this.searchQuery().trim();
    const searchLowered = trimmedSearch.toLowerCase();
    const filterMode = this.superheroService.listFilter();
    const base = this.filteredHeroes();
    const list = this.superheroService.superheroList();

    if (!trimmedSearch) {
      return base;
    }

    if (filterMode === 'created') {
      return base.filter((hero) => nameContainsQuery(hero, searchLowered));
    }

    const searchResults = this.superheroService.apiSearchResults();

    if (filterMode === 'api') {
      if (!environment.apiKey?.trim()) {
        return base.filter((h) => nameContainsQuery(h, searchLowered));
      }
      return searchResults.filter((h) => !h.created);
    }

    const merged: SuperheroListRow[] = [];
    const seen = new Set<string>();
    for (const h of searchResults) {
      if (!seen.has(h.id)) {
        merged.push(h);
        seen.add(h.id);
      }
    }
    const localMatches = list.filter((h) => nameContainsQuery(h, searchLowered));
    for (const h of localMatches) {
      if (!seen.has(h.id)) {
        merged.push(h);
        seen.add(h.id);
      }
    }
    return merged;
  });

  readonly emptyListMessage = computed(() => {
    if (this.searchQuery().trim()) {
      return 'No heroes match your search.';
    }
    switch (this.superheroService.listFilter()) {
      case 'created':
        return 'No heroes in the Created category yet.';
      case 'api':
        return 'No heroes in the API category yet.';
      default:
        return 'No heroes in this list yet.';
    }
  });

  readonly listAppearsEmpty = computed(
    () =>
      this.displayedHeroes().length === 0 &&
      !this.superheroService.isLoadingBatch() &&
      !this.superheroService.apiSearchLoading(),
  );

  private readonly scrollHost =
    viewChild<ElementRef<HTMLElement>>('heroesScroll');

  constructor() {
    this.superheroService.nameSearch({
      searchQuery: this.searchQuery,
      destroyRef: this.destroyRef,
      injector: this.injector,
    });

    afterNextRender(() => {
      this.tryFillViewportIfNeeded();
    });

    effect(() => {
      this.superheroService.superheroList();
      this.superheroService.isLoadingBatch();
      this.superheroService.listFilter();
      this.searchQuery();
      this.displayedHeroes();
      queueMicrotask(() => this.tryFillViewportIfNeeded());
    });
  }

  ngOnInit(): void {
    this.superheroService.setHeroesListFilter('all');
    if (this.superheroService.superheroList().length === 0) {
      this.superheroService.loadNextThumbnailBatch();
    }
  }

  onSourceFilterChange(event: MatButtonToggleChange): void {
    this.superheroService.setHeroesListFilter(event.value as HeroesListFilter);
  }

  onScroll(event: Event): void {
    const el = event.target as HTMLElement;
    this.loadNearBottomEnd(el);
  }

  private loadNearBottomEnd(el: HTMLElement): void {
    if (this.superheroService.listFilter() === 'created' || this.searchQuery().trim()) {
      return;
    }
    if (this.superheroService.isLoadingBatch() || !this.superheroService.hasMore()) {
      return;
    }
    const distanceToBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceToBottom < this.scrollThresholdPx) {
      this.superheroService.loadNextThumbnailBatch();
    }
  }

  private tryFillViewportIfNeeded(): void {
    if (this.superheroService.listFilter() === 'created' || this.searchQuery().trim()) {
      return;
    }
    const el = this.scrollHost()?.nativeElement;
    if (!el || this.superheroService.isLoadingBatch() || !this.superheroService.hasMore()) {
      return;
    }
    if (this.superheroService.superheroList().length === 0) {
      return;
    }
    if (el.scrollHeight <= el.clientHeight + 2) {
      this.superheroService.loadNextThumbnailBatch();
    }
  }
}
