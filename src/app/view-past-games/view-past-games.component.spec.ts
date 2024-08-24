import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewPastGamesComponent } from './view-past-games.component';

describe('ViewPastGamesComponent', () => {
  let component: ViewPastGamesComponent;
  let fixture: ComponentFixture<ViewPastGamesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewPastGamesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewPastGamesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
