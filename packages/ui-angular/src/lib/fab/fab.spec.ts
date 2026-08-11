import { ComponentFixture, TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Fab } from './fab';

expect.extend(toHaveNoViolations);

const addIcon = '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>';

describe('Fab (Angular, consuming @udixio/core)', () => {
  let fixture: ComponentFixture<Fab>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Fab],
    }).compileComponents();
    fixture = TestBed.createComponent(Fab);
    fixture.componentRef.setInput('label', 'Create');
    fixture.componentRef.setInput('icon', addIcon);
  });

  it('renders a named action with safe form defaults', () => {
    fixture.detectChanges();
    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector('button');

    expect(button.type).toBe('button');
    expect(button.getAttribute('aria-label')).toBe('Create');
    expect(button.querySelector('udx-icon svg')).not.toBeNull();
    expect(button.querySelector('.touch-target')).not.toBeNull();
    expect(button.querySelector('.state-layer')).not.toBeNull();
  });

  it('keeps an empty-label control out of rendering and the accessibility tree', () => {
    fixture.componentRef.setInput('label', '');
    fixture.detectChanges();
    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector('button');

    expect(button.hidden).toBe(true);
    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders the visible label only when extended', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.label')).toBeNull();

    fixture.componentRef.setInput('extended', true);
    fixture.detectChanges();
    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector('button');
    expect(button.textContent?.trim()).toBe('Create');
    expect(button.hasAttribute('aria-label')).toBe(false);
  });

  it('forwards native action attributes and shared classes', () => {
    fixture.componentRef.setInput('type', 'submit');
    fixture.componentRef.setInput('tabIndex', 2);
    fixture.componentRef.setInput('title', 'Create item');
    fixture.componentRef.setInput('className', 'consumer-class');
    fixture.detectChanges();
    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector('button');

    expect(button.type).toBe('submit');
    expect(button.tabIndex).toBe(2);
    expect(button.title).toBe('Create item');
    expect(button.className).toContain('consumer-class');
  });

  it('blocks disabled actions', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button').disabled).toBe(true);
  });

  it('renders links and makes disabled links inert', () => {
    fixture.componentRef.setInput('href', '/create');
    fixture.componentRef.setInput('aria-current', 'page');
    fixture.detectChanges();
    let link: HTMLAnchorElement = fixture.nativeElement.querySelector('a');
    expect(link.getAttribute('href')).toBe('/create');
    expect(link.getAttribute('aria-current')).toBe('page');

    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    link = fixture.nativeElement.querySelector('a');
    expect(link.hasAttribute('href')).toBe(false);
    expect(link.getAttribute('aria-disabled')).toBe('true');
    expect(link.tabIndex).toBe(-1);
  });

  it('connects pointer feedback and cleans it up', () => {
    fixture.detectChanges();
    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector('button');
    const pointerDown = new MouseEvent('pointerdown', {
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(pointerDown, 'pointerType', { value: 'mouse' });
    button.dispatchEvent(pointerDown);
    const ripple = button.querySelector('[data-udixio-ripple]');

    expect(ripple).not.toBeNull();
    fixture.destroy();
    expect(ripple?.isConnected).toBe(false);
  });

  it('has no automated accessibility violations', async () => {
    fixture.detectChanges();
    expect(await axe(fixture.nativeElement)).toHaveNoViolations();
  });
});
