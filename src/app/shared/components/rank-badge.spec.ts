import { TestBed, ComponentFixture } from '@angular/core/testing';
import { RankBadgeComponent } from './rank-badge';

describe('RankBadgeComponent', () => {
  let component: RankBadgeComponent;
  let fixture: ComponentFixture<RankBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RankBadgeComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(RankBadgeComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should return correct medal classes and text for gold medal (rank 1)', () => {
    component.rank = 1;
    fixture.detectChanges();
    expect(component.getMedalClass()).toBe('gold');
    expect(component.getRankText()).toBe('1');
  });

  it('should return correct medal classes and text for silver medal (rank 2)', () => {
    component.rank = 2;
    fixture.detectChanges();
    expect(component.getMedalClass()).toBe('silver');
    expect(component.getRankText()).toBe('2');
  });

  it('should return correct medal classes and text for bronze medal (rank 3)', () => {
    component.rank = 3;
    fixture.detectChanges();
    expect(component.getMedalClass()).toBe('bronze');
    expect(component.getRankText()).toBe('3');
  });

  it('should return correct medal classes and text for normal rank (> 3)', () => {
    component.rank = 4;
    fixture.detectChanges();
    expect(component.getMedalClass()).toBe('normal');
    expect(component.getRankText()).toBe('#4');
  });
});
