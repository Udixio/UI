import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiAngular } from './ui-angular';

describe('UiAngular', () => {
  let component: UiAngular;
  let fixture: ComponentFixture<UiAngular>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiAngular],
    }).compileComponents();

    fixture = TestBed.createComponent(UiAngular);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
