import React from 'react';
import {
  Button,
  Card,
  Checkbox,
  Chip,
  Fab,
  Icon,
  IconButton,
  NavigationRail,
  NavigationRailItem,
  ProgressIndicator,
  Switch,
} from '@udixio/ui-react';
import { iAdd } from '@udixio/icons-rounded-400/add';
import { iHome } from '@udixio/icons-rounded-400/home';
import { iTaskAltFilled } from '@udixio/icons-rounded-400/task_alt.filled';
import { iCalendarToday } from '@udixio/icons-rounded-400/calendar_today';
import { iPerson } from '@udixio/icons-rounded-400/person';
import { iNotifications } from '@udixio/icons-rounded-400/notifications';
import { iFlag } from '@udixio/icons-rounded-400/flag';
import { iSettings } from '@udixio/icons-rounded-400/settings';
import { iSettingsFilled } from '@udixio/icons-rounded-400/settings.filled';
import { iStar } from '@udixio/icons-rounded-400/star';
import { iStarFilled } from '@udixio/icons-rounded-400/star.filled';
import { iLabel } from '@udixio/icons-rounded-400/label';
import { iLabelFilled } from '@udixio/icons-rounded-400/label.filled';
import { iDescription } from '@udixio/icons-rounded-400/description';
import { iDescriptionFilled } from '@udixio/icons-rounded-400/description.filled';
import { iShare } from '@udixio/icons-rounded-400/share';
import { iDashboard } from '@udixio/icons-rounded-400/dashboard';
import { iDashboardFilled } from '@udixio/icons-rounded-400/dashboard.filled';
import { iAnalytics } from '@udixio/icons-rounded-400/analytics';
import { iAnalyticsFilled } from '@udixio/icons-rounded-400/analytics.filled';

/*
  Chaque device a son propre zoom pour simuler son écran réel :
  - Phone   0.75 → ~200 dp virtual (phone réel ~390 dp)
  - Tablet  0.60 → ~720 dp virtual (tablette réelle ~768 dp)
  - Desktop 0.50 → ~1152 dp virtual (desktop standard ~1280 dp)

  Breakpoints calculés pour que les devices remplissent exactement
  la largeur du container au seuil d'apparition.
*/
const PHONE_ZOOM = 0.75;
const TABLET_ZOOM = 0.60;
const DESKTOP_ZOOM = 0.50;

/* ─────────────────────────────────────────
   Device frame — h-full w-full, no aspect-ratio
   (sizing handled by parent wrapper)
   Le contenu est positionné en absolu avec zoom pour
   simuler un grand écran à l'échelle 1.
───────────────────────────────────────── */
const DeviceFrame = ({
  children,
  className = '',
  borderRadius = '1.5rem',
  zoom = PHONE_ZOOM,
}: {
  children: React.ReactNode;
  className?: string;
  borderRadius?: string;
  zoom?: number;
}) => {
  const inv = `${(1 / zoom) * 100}%`;
  return (
    <div
      className={`relative h-full w-full border-[6px] border-outline shadow-xl overflow-hidden bg-surface ${className}`}
      style={{ borderRadius }}
    >
      {/* Contenu à l'échelle 1, zoomé pour tenir dans le frame */}
      <div
        className="absolute top-0 left-0 flex flex-col"
        style={{ zoom, width: inv, height: inv }}
      >
        {children}
      </div>
      <div className="absolute inset-0 z-10" />
    </div>
  );
};

const StatusBar = ({ light = false }: { light?: boolean }) => (
  <div
    className={`h-6 shrink-0 flex items-center justify-between px-4 ${light ? 'bg-surface-container-high' : 'bg-surface'} text-on-surface-variant`}
  >
    <span className="text-label-small">9:41</span>
    <div className="flex gap-1 opacity-70 text-label-small">
      <span>▲▲▲</span>
      <span>▐▌</span>
    </div>
  </div>
);

/* ─── Phone ── Focus task tracker
   Montre : Card (elevated / filled / outlined), Checkbox, Chip (filter),
            ProgressIndicator circular, Fab tertiary extended, IconButton
─────────────────────────────────────────── */
const PhoneMockup = () => (
  <DeviceFrame zoom={PHONE_ZOOM}>
    <StatusBar />

    {/* Top app bar */}
    <div className="h-14 shrink-0 bg-surface flex items-center px-4 gap-2">
      <span className="flex-1 text-title-large text-on-surface font-medium">Focus</span>
      <IconButton icon={iNotifications} variant="standard" label="Notifications" />
      <div className="h-9 w-9 rounded-full bg-tertiary-container flex items-center justify-center text-on-tertiary-container text-label-large font-bold shrink-0">
        AL
      </div>
    </div>

    {/* Filter chips */}
    <div className="shrink-0 flex gap-2 px-4 pb-3">
      <Chip label="All" variant="elevated" activated />
      <Chip label="Active" variant="outlined" />
      <Chip label="Done" variant="outlined" />
    </div>

    {/* Scrollable content */}
    <div className="flex-1 relative overflow-hidden px-4 space-y-3 pb-2">

      {/* Circular progress summary */}
      <Card variant="elevated">
        <div className="p-3 flex items-center gap-4">
          <ProgressIndicator variant="circular-determinate" value={67} />
          <div>
            <p className="text-title-small text-on-surface font-semibold">Daily Goal</p>
            <p className="text-body-small text-on-surface-variant">4 of 6 completed</p>
          </div>
        </div>
      </Card>

      {/* Task list */}
      <Card variant="filled">
        <div className="p-3 space-y-2">
          <p className="text-label-medium text-primary font-semibold">Work</p>
          {[
            { task: 'Finalize Q3 report', done: true },
            { task: 'Review pull request', done: false },
            { task: 'Sync with design team', done: false },
          ].map(({ task, done }) => (
            <label key={task} className="flex items-center gap-2 cursor-pointer">
              <Checkbox defaultChecked={done} />
              <span className={`text-body-small text-on-surface flex-1 ${done ? 'line-through opacity-50' : ''}`}>
                {task}
              </span>
            </label>
          ))}
        </div>
      </Card>

      {/* Overdue item */}
      <Card variant="outlined">
        <div className="p-3 flex items-center gap-3">
          <Icon icon={iFlag} className="size-5 text-error shrink-0" />
          <div className="min-w-0">
            <p className="text-body-small text-on-surface font-medium">Submit expense report</p>
            <p className="text-label-small text-error">Overdue · 2 days</p>
          </div>
        </div>
      </Card>
    </div>

    {/* Bottom navigation — 80 dp Material */}
    <div className="h-20 shrink-0 bg-surface-container border-t border-outline-variant flex items-center justify-around px-2">
      {[
        { label: 'Home', icon: iHome, active: false },
        { label: 'Focus', icon: iTaskAltFilled, active: true },
        { label: 'Cal', icon: iCalendarToday, active: false },
        { label: 'Me', icon: iPerson, active: false },
      ].map(({ label, icon, active }) => (
        <div
          key={label}
          className={`text-label-small flex flex-col items-center gap-1 ${active ? 'text-secondary' : 'text-on-surface-variant'}`}
        >
          {active && <div className="w-14 h-0.5 rounded-full bg-secondary-container -mb-1" />}
          <Icon icon={icon} className="size-6" />
          <span>{label}</span>
        </div>
      ))}
    </div>

    {/*
      FAB positionné en dehors du div overflow-hidden, comme enfant direct
      du zoom wrapper (position:absolute = contexte de positionnement).
      bottom-24 (96dp) = 16dp au-dessus de la barre de nav (h-20 = 80dp).
    */}
    <div className="absolute bottom-24 right-4">
      <Fab icon={iAdd} variant="tertiary" label="New task" extended />
    </div>
  </DeviceFrame>
);

/* ─── Tablet ── Notes writer
   Montre : NavigationRail, Chip (filter + tag), ProgressIndicator linear,
            Button (filled / outlined), Switch, IconButton tonal
─────────────────────────────────────────── */
const TabletMockup = () => (
  <DeviceFrame borderRadius="1.25rem" zoom={TABLET_ZOOM}>
    <StatusBar light />
    <div className="flex flex-1 overflow-hidden">

      {/* NavigationRail */}
      <div className="shrink-0 bg-surface-container border-r border-outline-variant overflow-hidden">
        <NavigationRail
          selectedItem={0}
          className={() => ({
            navigationRail: '!pt-2',
            segments: '!mt-2',
          })}
        >
          <NavigationRailItem icon={iDescription} iconSelected={iDescriptionFilled} label="Notes" />
          <NavigationRailItem icon={iStar} iconSelected={iStarFilled} label="Starred" />
          <NavigationRailItem icon={iLabel} iconSelected={iLabelFilled} label="Tags" />
          <NavigationRailItem icon={iSettings} iconSelected={iSettingsFilled} label="Settings" />
        </NavigationRail>
      </div>

      {/* Notes list */}
      <div className="w-48 shrink-0 border-r border-outline-variant bg-surface overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-3 border-b border-outline-variant shrink-0">
          <span className="text-label-large text-on-surface font-semibold">Notes</span>
          <IconButton icon={iAdd} variant="tonal" label="New note" size="xSmall" />
        </div>
        {/* Filter chips */}
        <div className="flex gap-2 px-3 py-2 shrink-0">
          <Chip label="All" variant="elevated" activated />
          <Chip label="Starred" variant="outlined" icon={iStar} />
        </div>
        {/* Note items */}
        {[
          { title: 'Design system', excerpt: 'Token structure revised...', time: '2h', starred: true },
          { title: 'Weekly goals', excerpt: 'Focus on shipping...', time: 'Yesterday', starred: false },
          { title: 'Meeting notes', excerpt: 'Discussed roadmap...', time: 'Mon', starred: false },
          { title: 'Sprint retro', excerpt: 'Highlights & actions...', time: 'Fri', starred: false },
        ].map((note, i) => (
          <div
            key={note.title}
            className={`px-3 py-3 border-b border-outline-variant cursor-pointer ${i === 0 ? 'bg-secondary-container/40' : ''}`}
          >
            <div className="flex items-start gap-1 mb-0.5">
              <span className="text-label-medium text-on-surface font-medium flex-1 leading-tight">{note.title}</span>
              {note.starred && <Icon icon={iStarFilled} className="size-4 text-tertiary shrink-0 mt-0.5" />}
            </div>
            <p className="text-body-small text-on-surface-variant truncate">{note.excerpt}</p>
            <p className="text-label-small text-on-surface-variant mt-1">{note.time}</p>
          </div>
        ))}
      </div>

      {/* Note detail */}
      <div className="flex-1 flex flex-col min-w-0 bg-surface">
        <div className="flex-1 p-5 overflow-hidden">
          <h2 className="text-headline-small text-on-surface font-bold mb-2">Design system</h2>
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-label-small text-on-surface-variant">Jun 23, 2026</span>
            <Chip label="Design" variant="outlined" />
            <Chip label="Tokens" variant="outlined" />
          </div>
          <p className="text-body-medium text-on-surface-variant leading-relaxed">
            Revised the token structure for color and typography. Primary palette uses HCT-based generation. All semantic tokens updated to Material 3 spec…
          </p>
          {/* Linear progress */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-label-small text-on-surface-variant">Document progress</span>
              <span className="text-label-small text-primary font-semibold">40%</span>
            </div>
            <ProgressIndicator variant="linear-determinate" value={40} />
          </div>
        </div>
        {/* Action bar: Button filled + outlined + Switch */}
        <div className="shrink-0 px-5 py-3 border-t border-outline-variant flex items-center gap-3">
          <Button variant="filled" label="Save" />
          <Button variant="outlined" label="Share" icon={iShare} />
          <div className="flex-1" />
          <span className="text-label-small text-on-surface-variant">Published</span>
          <Switch />
        </div>
      </div>

    </div>
  </DeviceFrame>
);

/* ─── Desktop ── Projects dashboard
   Montre : Button (tonal + filled), Card (filled / elevated), Chip (statuts),
            ProgressIndicator linear, NavigationRail
─────────────────────────────────────────── */
const DesktopMockup = () => (
  <DeviceFrame borderRadius="0.625rem" zoom={DESKTOP_ZOOM}>
    {/* Chrome bar */}
    <div className="h-8 shrink-0 bg-surface-container-highest flex items-center gap-2 px-3 border-b border-outline-variant">
      <div className="flex gap-1.5">
        <div className="w-3 h-3 rounded-full bg-error-container" />
        <div className="w-3 h-3 rounded-full bg-tertiary-container" />
        <div className="w-3 h-3 rounded-full bg-primary-container" />
      </div>
      <div className="flex-1 flex justify-center">
        <div className="bg-surface rounded px-6 py-1 text-label-small text-on-surface-variant">
          app.udixio.com/dashboard
        </div>
      </div>
    </div>
    <div className="flex flex-1 overflow-hidden">

      {/* NavigationRail */}
      <div className="shrink-0 bg-surface-container border-r border-outline-variant overflow-hidden">
        <NavigationRail
          selectedItem={0}
          className={() => ({
            navigationRail: '!pt-2',
            segments: '!mt-2',
          })}
        >
          <NavigationRailItem icon={iDashboard} iconSelected={iDashboardFilled} label="Dashboard" />
          <NavigationRailItem icon={iAnalytics} iconSelected={iAnalyticsFilled} label="Analytics" />
          <NavigationRailItem icon={iDescription} iconSelected={iDescriptionFilled} label="Reports" />
          <NavigationRailItem icon={iSettings} iconSelected={iSettingsFilled} label="Settings" />
        </NavigationRail>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-surface-container-lowest">

        {/* Top bar: tonal + filled Button side by side */}
        <div className="shrink-0 flex items-center gap-3 px-5 py-4 bg-surface border-b border-outline-variant">
          <div>
            <h2 className="text-title-large text-on-surface font-semibold">Dashboard</h2>
            <p className="text-body-small text-on-surface-variant">Mon, Jun 23</p>
          </div>
          <div className="flex-1" />
          <Button variant="tonal" label="Import" />
          <Button variant="filled" label="New project" icon={iAdd} />
        </div>

        {/* Stats row: 3 filled cards with linear progress */}
        <div className="grid grid-cols-3 gap-3 px-5 pt-4 pb-3">
          {[
            { label: 'Completion', value: '78%', color: 'bg-primary-container text-on-primary-container', progress: 78 },
            { label: 'Active tasks', value: '23 / 40', color: 'bg-secondary-container text-on-secondary-container', progress: 57 },
            { label: 'On schedule', value: '91%', color: 'bg-tertiary-container text-on-tertiary-container', progress: 91 },
          ].map(({ label, value, color, progress }) => (
            <Card key={label} variant="filled">
              <div className={`p-4 ${color} rounded-xl`}>
                <p className="text-label-small opacity-70 mb-1">{label}</p>
                <p className="text-headline-small font-bold mb-3">{value}</p>
                <ProgressIndicator variant="linear-determinate" value={progress} />
              </div>
            </Card>
          ))}
        </div>

        {/* Projects grid: elevated cards with Chip status */}
        <div className="px-5 pb-4">
          <h3 className="text-title-medium text-on-surface font-semibold mb-3">Active Projects</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: 'Design System', status: 'Active', progress: 82, due: 'Aug 30', active: true },
              { name: 'Mobile App', status: 'Review', progress: 65, due: 'Jul 15', active: false },
              { name: 'Backend API', status: 'Active', progress: 48, due: 'Sep 1', active: true },
              { name: 'Marketing Site', status: 'Planned', progress: 12, due: 'Oct 10', active: false },
            ].map(({ name, status, progress, due, active }) => (
              <Card key={name} variant="elevated">
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-label-large text-on-surface font-semibold flex-1">{name}</span>
                    <Chip
                      label={status}
                      variant={active ? 'elevated' : 'outlined'}
                      activated={active}
                    />
                  </div>
                  <ProgressIndicator variant="linear-determinate" value={progress} />
                  <p className="text-label-small text-on-surface-variant mt-2">Due {due}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>

      </div>
    </div>
  </DeviceFrame>
);

/* ─────────────────────────────────────────
   Export

   Les breakpoints correspondent aux zooms par device :
   le tablet n'apparaît que quand il y a la place pour
   son frame × (1/TABLET_ZOOM) en contenu, idem pour desktop.

   Hauteurs : les devices remplissent exactement la largeur du container.
   Phone seul    : h-[min(80cqw,400px)]
   Phone + tablet: @[650px]  h-[54cqw]   — (0.462+1.333) × 54cqw ≈ 97cqw ≈ 650px
   Tous les 3    : @[1200px] h-[27cqw]   — (0.462+1.333+1.778) × 27cqw ≈ 97cqw ≈ 1200px
───────────────────────────────────────── */
export const ThemeApercu: React.FC = () => (
  <div className="@container p-6">
    <div className="flex gap-4 items-end h-[min(80cqw,400px)] @[650px]:h-[54cqw] @[1200px]:h-[27cqw]">
      {/* Phone — toujours visible, centré quand seul */}
      <div className="h-full aspect-[9/19.5] shrink-0 mx-auto @[650px]:mx-0">
        <PhoneMockup />
      </div>

      {/* Tablet — à partir de 650px de conteneur */}
      <div className="hidden @[650px]:block h-full aspect-[4/3] shrink-0">
        <TabletMockup />
      </div>

      {/* Desktop — à partir de 1200px de conteneur */}
      <div className="hidden @[1200px]:block h-full aspect-[16/9] shrink-0">
        <DesktopMockup />
      </div>
    </div>
  </div>
);
