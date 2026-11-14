import '@angular/compiler';
import { Component, type ApplicationRef } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { Search } from '../../src/lib/search/search';

@Component({
  selector: 'search-motion-fixture',
  standalone: true,
  imports: [Search],
  template: `
    <udx-search label="Search" defaultQuery="chair" />
    <udx-search label="Disabled search" defaultQuery="chair" disabled />
  `,
})
class SearchMotionFixture {}

declare global {
  interface Window {
    searchMotionApp?: ApplicationRef;
  }
}

bootstrapApplication(SearchMotionFixture).then((app) => {
  window.searchMotionApp = app;
});
