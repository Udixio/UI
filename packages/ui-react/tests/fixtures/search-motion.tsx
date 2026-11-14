import React from 'react';
import { createRoot } from 'react-dom/client';
import { Search } from '../../src/lib/components/Search';

createRoot(document.getElementById('root')!).render(
  <>
    <Search label="Search" defaultQuery="chair" />
    <Search label="Disabled search" defaultQuery="chair" disabled />
  </>,
);
