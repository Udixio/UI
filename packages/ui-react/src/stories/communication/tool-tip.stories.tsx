import type { Meta, StoryObj } from '@storybook/react';
import { Button, ReactProps, ToolTip, ToolTipInterface } from '../../lib';

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta = {
  title: 'Communication/ToolTip',
  component: ToolTip,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/react/configure/story-layout
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/react/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
} satisfies Meta<typeof ToolTip>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/react/writing-stories/args

const createToolTipStory = (
  variant: ReactProps<ToolTipInterface>['variant'],
  auto = false,
) => {
  const ToolTipStory: Story = (args: ReactProps<ToolTipInterface>) => (
    <div className="h-96 relative">
      <div className="h-96 relative">
        <div className="absolute top-0 left-0">
          <ToolTip
            position="bottom-right"
            {...args}
            text="Cliquez pour plus d'infos"
            title="Info rapide"
          >
            <Button variant={'filledTonal'} label={'Bottom-right'}></Button>
          </ToolTip>
        </div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2">
          <ToolTip
            position="bottom"
            {...args}
            text="Cet élément représente les statistiques globales de votre projet."
            title="Statistiques"
          >
            <Button variant={'filledTonal'} label={'Bottom-center'}></Button>
          </ToolTip>
        </div>
        <div className="absolute top-0 right-0">
          <ToolTip
            position="bottom-left"
            {...args}
            text="Cliquez ici pour télécharger le fichier associé."
            title="Téléchargement"
          >
            <Button variant={'filledTonal'} label={'Bottom-left'}></Button>
          </ToolTip>
        </div>
        <div className="absolute top-1/2 left-0 -translate-y-1/2">
          <ToolTip
            position="right"
            {...args}
            text="Cette action ne peut pas être annulée une fois confirmée."
            title="Attention"
          >
            <Button variant={'filledTonal'} label={'Center-right'}></Button>
          </ToolTip>
        </div>
        <div className="absolute top-1/2 right-0 -translate-y-1/2">
          <ToolTip
            position="left"
            {...args}
            text="Modifiez les paramètres dans l'onglet dédié à la personnalisation."
            title="Personnalisation"
          >
            <Button variant={'filledTonal'} label={'Center-left'}></Button>
          </ToolTip>
        </div>
        <div className="absolute bottom-0 left-0">
          <ToolTip
            position="top-right"
            {...args}
            text="L'action demandée supprimera toutes les données correspondantes."
            title="Suppression de données"
          >
            <Button variant={'filledTonal'} label={'Top-right'}></Button>
          </ToolTip>
        </div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
          <ToolTip
            position="top"
            {...args}
            text="Double-cliquez pour agrandir l'aperçu de l'élément sélectionné."
            title="Aperçu"
          >
            <Button variant={'filledTonal'} label={'Top-center'}></Button>
          </ToolTip>
        </div>
        <div className="absolute bottom-0 right-0">
          <ToolTip
            position="top-left"
            {...args}
            text="Passez la souris sur d'autres icônes pour plus de détails."
            title="Icones et navigation"
          >
            <Button variant={'filledTonal'} label={'Top-left'}></Button>
          </ToolTip>
        </div>
      </div>
    </div>
  );
  ToolTipStory.args = {
    variant: variant,
    title: 'Title',
    text: 'Supporting line text lorem ipsum dolor sit amet, consectetur',
    buttons: [
      {
        label: 'Label',
        onClick: () => {},
      },
      {
        label: 'Label',
        onClick: () => {},
      },
    ],
    ...(auto ? { position: undefined } : {}),
  };
  return ToolTipStory;
};
export const Plain = createToolTipStory('plain');
export const PlainAuto = createToolTipStory('plain', true);
export const Rich = createToolTipStory('rich');
export const RichAuto = createToolTipStory('rich', true);
