import React from 'react';
import { Card, Checkbox, IconButton } from '@udixio/ui-react';
import { iSearch } from '@udixio/icons-rounded-400/search';
import { iSend } from '@udixio/icons-rounded-400/send';

export const ThemeApercu: React.FC = () => {
  return (
    <div className="space-y-8 p-6">

      {/* ── Phone mockups ── */}
      <div className="flex gap-8 flex-wrap justify-center items-start">

        {/* Task Manager */}
        <div className="w-[280px] h-[580px] rounded-[2rem] border-8 border-outline shadow-xl overflow-hidden bg-surface flex flex-col shrink-0">
          <div className="h-6 w-full bg-surface-container flex items-center justify-between px-4 text-[10px] text-on-surface-variant font-medium shrink-0">
            <span>9:41</span>
            <div className="flex gap-1"><span>▲▲▲</span><span>▐▌</span></div>
          </div>
          <div className="flex-1 overflow-y-auto bg-surface-container-lowest p-4 space-y-4">
            <div className="flex items-center justify-between mt-2 mb-6">
              <div>
                <h3 className="text-headline-small text-on-surface">My Tasks</h3>
                <p className="text-body-small text-on-surface-variant">5 pending tasks</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-on-primary text-title-large font-bold">A</div>
            </div>
            {[
              { label: 'Work', color: 'text-primary', items: ['Review PR #102', 'Draft design doc'], checked: [true, false] },
              { label: 'Personal', color: 'text-secondary', items: ['Call the dentist'], checked: [false] },
              { label: 'Groceries', color: 'text-tertiary', items: ['Milk & Eggs', 'Coffee beans'], checked: [true, false] },
            ].map(({ label, color, items, checked }) => (
              <Card key={label} variant="filled" className="bg-surface-container">
                <div className="p-4 space-y-3">
                  <h3 className={`text-label-large ${color}`}>{label}</h3>
                  {items.map((item, i) => (
                    <label key={item} className="flex items-center gap-3 cursor-pointer">
                      <Checkbox defaultChecked={checked[i]} />
                      <span className={`text-body-medium text-on-surface ${checked[i] ? 'line-through opacity-70' : ''}`}>{item}</span>
                    </label>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Chat */}
        <div className="w-[280px] h-[580px] rounded-[2rem] border-8 border-outline shadow-xl overflow-hidden bg-surface flex flex-col shrink-0">
          <div className="h-6 w-full bg-surface flex items-center justify-between px-4 text-[10px] text-on-surface-variant font-medium shrink-0">
            <span>9:41</span>
            <div className="flex gap-1"><span>▲▲▲</span><span>▐▌</span></div>
          </div>
          <div className="h-14 bg-surface-container flex items-center justify-between px-4 border-b border-outline-variant/30 shrink-0">
            <h3 className="text-label-large text-on-surface">Chat</h3>
            <IconButton icon={iSearch} variant="standard" label="Search" />
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-outline-variant/50 bg-surface">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4 hover:bg-surface-container-low transition-colors cursor-pointer flex gap-3 items-start">
                <div className="h-10 w-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container shrink-0">{i}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h4 className="text-title-small truncate">Team #{i}</h4>
                    <span className="text-label-small text-on-surface-variant shrink-0 ml-2">10:4{i}</span>
                  </div>
                  <p className="text-body-small text-on-surface-variant line-clamp-2">Lorem ipsum dolor sit amet, consectetur adipiscing.</p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 bg-surface-container-lowest border-t border-outline-variant/30 shrink-0">
            <div className="flex gap-2 items-center">
              <input
                type="text"
                placeholder="Message..."
                className="flex-1 bg-surface-container-high border-none outline-none text-on-surface placeholder:text-on-surface-variant text-body-medium px-4 py-2.5 rounded-full"
              />
              <IconButton size="small" icon={iSend} variant="filled" label="Send" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Web Dashboard strip ── */}
      <div className="w-full rounded-2xl border border-outline-variant/30 overflow-hidden bg-surface-container flex">
        {/* Sidebar */}
        <div className="w-44 bg-surface-container-high border-r border-outline-variant/30 p-4 flex flex-col gap-1 shrink-0">
          <div className="text-label-small text-on-surface-variant uppercase tracking-widest mb-3">Dashboard</div>
          {['Overview', 'Analytics', 'Reports', 'Settings'].map((item, i) => (
            <div
              key={item}
              className={`px-3 py-2 rounded-lg text-body-medium cursor-pointer transition-colors ${
                i === 0
                  ? 'bg-secondary-container text-on-secondary-container font-medium'
                  : 'text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {item}
            </div>
          ))}
        </div>
        {/* Content */}
        <div className="flex-1 p-5 space-y-4 min-w-0">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Users', value: '12,430', cls: 'bg-primary-container text-on-primary-container' },
              { label: 'Revenue', value: '$48,210', cls: 'bg-secondary-container text-on-secondary-container' },
              { label: 'Growth', value: '+18.4%', cls: 'bg-tertiary-container text-on-tertiary-container' },
            ].map(({ label, value, cls }) => (
              <div key={label} className={`rounded-xl p-4 ${cls}`}>
                <div className="text-label-small opacity-70">{label}</div>
                <div className="text-headline-small font-bold">{value}</div>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-outline-variant/30 overflow-hidden">
            <div className="bg-surface-container-high px-4 py-2 text-label-medium text-on-surface-variant">Recent Activity</div>
            {['Deploy v2.4.1', 'New user signed up', 'Report generated'].map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 border-t border-outline-variant/20 hover:bg-surface-container-low transition-colors">
                <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                <span className="text-body-medium text-on-surface flex-1">{item}</span>
                <span className="text-label-small text-on-surface-variant">{i + 1}h ago</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};
