import { ReactNode } from 'react';

type SectionPageProps = {
  kicker: string;
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function SectionPage({ kicker, title, description, actions, children }: SectionPageProps) {
  return (
    <div className="page-stack">
      <div className="page-title-row">
        <div>
          <div className="eyebrow">{kicker}</div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        {actions ? <div className="page-actions">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}