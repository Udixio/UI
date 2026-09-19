import { render } from '@testing-library/svelte';
import Smoke from './Smoke.svelte';

it('renders a Svelte 5 component in jsdom', () => {
  const { getByText } = render(Smoke, { props: { label: 'hi' } });
  expect(getByText('hi')).toBeInTheDocument();
});
