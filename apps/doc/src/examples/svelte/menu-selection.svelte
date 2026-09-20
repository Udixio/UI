<script lang="ts">
  import { Menu, MenuGroup, MenuHeadline, MenuItem } from '@udixio/ui-svelte';

  type Density = 'comfortable' | 'compact';
  type Language = 'english' | 'french';

  let density = $state<Density>('comfortable');
  let spellCheck = $state(true);
  let language = $state<Language>('english');
</script>

<div class="flex flex-wrap items-start justify-center gap-6">
  <Menu accessibleLabel="Editor preferences">
    <MenuGroup label="Density">
      <MenuItem
        label="Comfortable"
        selectionType="single"
        selected={density === 'comfortable'}
        onSelectedChange={(selected) => selected && (density = 'comfortable')}
      />
      <MenuItem
        label="Compact"
        selectionType="single"
        selected={density === 'compact'}
        onSelectedChange={(selected) => selected && (density = 'compact')}
      />
    </MenuGroup>
    <MenuGroup label="Tools">
      <MenuItem label="Spell checking" selectionType="multiple" bind:selected={spellCheck} />
      <MenuItem label="Grammar suggestions" selectionType="multiple" defaultSelected />
    </MenuGroup>
  </Menu>

  <Menu purpose="selection" accessibleLabel="Language">
    <MenuHeadline label="Language" />
    <MenuItem
      label="English"
      selected={language === 'english'}
      onSelectedChange={(selected) => selected && (language = 'english')}
    />
    <MenuItem
      label="French"
      selected={language === 'french'}
      onSelectedChange={(selected) => selected && (language = 'french')}
    />
  </Menu>
</div>
