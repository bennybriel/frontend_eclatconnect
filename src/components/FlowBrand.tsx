import React from 'react';
import { EclatLogo } from './EclatLogo';

export interface FlowPerk {
  icon: React.ReactNode;
  text: string;
}

interface FlowBrandProps {
  kicker: string;
  title: React.ReactNode;
  note?: string;
  perks?: FlowPerk[];
  photo?: boolean;
  children?: React.ReactNode;
}

/** The purple brand panel beside the account and notification forms. */
export const FlowBrand: React.FC<FlowBrandProps> = ({ kicker, title, note, perks, photo = true, children }) => (
  <aside className="fl-brand">
    <div className="fl-brand-logo">
      <EclatLogo light size={36} />
    </div>
    <span className="fl-brand-kicker">{kicker}</span>
    <h1 className="fl-brand-title">{title}</h1>
    {note && <p className="fl-brand-note">{note}</p>}
    {perks && perks.length > 0 && (
      <ul className="fl-perks">
        {perks.map(p => (
          <li key={p.text}>
            <span className="fl-perk-icon" aria-hidden="true">{p.icon}</span>
            {p.text}
          </li>
        ))}
      </ul>
    )}
    {children}
    {photo && (
      <picture className="fl-brand-photo">
        <source type="image/webp" srcSet="/hero-student-560.webp" />
        <img src="/hero-student.png?v=20261123b" alt="" width={635} height={682} loading="lazy" decoding="async" />
      </picture>
    )}
  </aside>
);
