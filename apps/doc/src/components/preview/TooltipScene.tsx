import { IconButton, Tooltip } from '@udixio/ui-react';
import { iFormatBold } from '@udixio/icons-rounded-400/format_bold';
import { iFormatItalic } from '@udixio/icons-rounded-400/format_italic';
import { iFormatUnderlined } from '@udixio/icons-rounded-400/format_underlined';
import { iUndo } from '@udixio/icons-rounded-400/undo';

/**
 * Hydrated (`client:visible`): the tooltip surface is positioned by
 * `AnchorPositioner`, which renders nothing until mounted on the client.
 */
export function TooltipScene() {
  return (
    <div className="flex items-center gap-1">
      <IconButton label="Undo" icon={iUndo} />
      <Tooltip text="Bold" defaultOpen position="top">
        <IconButton label="Bold" icon={iFormatBold} variant="tonal" />
      </Tooltip>
      <IconButton label="Italic" icon={iFormatItalic} />
      <IconButton label="Underline" icon={iFormatUnderlined} />
    </div>
  );
}
