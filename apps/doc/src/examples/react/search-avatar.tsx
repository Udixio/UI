import { Search } from '@udixio/ui-react';

export default function SearchAvatarReact() {
  return (
    <Search
      label="Search workspace"
      placeholder="Search workspace"
      avatar={
        <span
          className="flex size-[30px] items-center justify-center rounded-full bg-primary text-label-small text-on-primary"
          aria-hidden="true"
        >
          JD
        </span>
      }
    />
  );
}
