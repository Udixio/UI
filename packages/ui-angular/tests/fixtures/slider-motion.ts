import '@angular/compiler';
import { Component, signal } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { Slider } from '../../src/lib/slider/slider';
const state = window as unknown as { changes: number[]; dispose: () => void; removeEnabled: () => void };
state.changes = [];
@Component({ selector: 'slider-motion-fixture', standalone: true, imports: [Slider], template: `@if (visible()) { <udx-slider aria-label="Enabled" [defaultValue]="20" (valueChange)="record($event)" /> }<udx-slider aria-label="Other" [defaultValue]="40" /><udx-slider aria-label="Disabled" [defaultValue]="50" disabled (valueChange)="record($event)" />` })
class SliderMotionFixture { visible = signal(true); constructor() { state.removeEnabled = () => this.visible.set(false); } record(value: number) { state.changes.push(value); } }
bootstrapApplication(SliderMotionFixture).then(app => { state.dispose = () => app.destroy(); });
