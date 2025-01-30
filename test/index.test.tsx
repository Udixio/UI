import { fireEvent, render, screen } from '@testing-library/react';
import { composeStory } from '@storybook/react';

import Meta, {
  Filled as FilledButtonStory,
} from '../stories/action/button.stories';

const FilledButton = composeStory(FilledButtonStory, Meta);

test('Checks if the button can be clicked', () => {
  render(<FilledButton label="Submit" />);

  const buttonElements = screen.getAllByRole('button', {
    name: 'Submit',
  });

  buttonElements.forEach((button) => {
    fireEvent.click(button);
  });
});
