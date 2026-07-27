import { useState } from 'react';
import { Menu, MenuGroup, MenuHeadline, MenuItem } from '@udixio/ui-react';

type Density = 'comfortable' | 'compact';
type Language = 'english' | 'french';

export default function MenuSelectionReact() {
  const [density, setDensity] = useState<Density>('comfortable');
  const [spellCheck, setSpellCheck] = useState(true);
  const [language, setLanguage] = useState<Language>('english');

  return (
    <div className="flex flex-wrap items-start justify-center gap-6">
      <Menu accessibleLabel="Editor preferences">
        <MenuGroup label="Density">
          <MenuItem
            label="Comfortable"
            selectionType="single"
            selected={density === 'comfortable'}
            onSelectedChange={(selected) =>
              selected && setDensity('comfortable')
            }
          />
          <MenuItem
            label="Compact"
            selectionType="single"
            selected={density === 'compact'}
            onSelectedChange={(selected) => selected && setDensity('compact')}
          />
        </MenuGroup>
        <MenuGroup label="Tools">
          <MenuItem
            label="Spell checking"
            selectionType="multiple"
            selected={spellCheck}
            onSelectedChange={setSpellCheck}
          />
          <MenuItem
            label="Grammar suggestions"
            selectionType="multiple"
            defaultSelected
          />
        </MenuGroup>
      </Menu>

      <Menu purpose="selection" accessibleLabel="Language">
        <MenuHeadline label="Language" />
        <MenuItem
          label="English"
          selected={language === 'english'}
          onSelectedChange={(selected) => selected && setLanguage('english')}
        />
        <MenuItem
          label="French"
          selected={language === 'french'}
          onSelectedChange={(selected) => selected && setLanguage('french')}
        />
      </Menu>
    </div>
  );
}
