import React from 'react';
import { Link } from 'react-router-dom';
import './Breadcrumb.css';

/**
 * Breadcrumb — Windchill-style location trail
 * props.items = [{ label, to? }]
 * Last item is always plain text (current page)
 */
const Breadcrumb = ({ items = [] }) => (
  <nav className="wc-breadcrumb" aria-label="breadcrumb">
    {items.map((item, idx) => {
      const isLast = idx === items.length - 1;
      return (
        <span key={idx} className="wc-breadcrumb__item">
          {idx > 0 && <span className="wc-breadcrumb__sep">›</span>}
          {isLast || !item.to
            ? <span className="wc-breadcrumb__current">{item.label}</span>
            : <Link to={item.to} className="wc-breadcrumb__link">{item.label}</Link>
          }
        </span>
      );
    })}
  </nav>
);

export default Breadcrumb;
