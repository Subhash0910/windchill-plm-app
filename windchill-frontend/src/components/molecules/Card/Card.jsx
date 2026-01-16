import React from 'react';
import './Card.css';

const Card = ({ children, title, subtitle, className = '' }) => {
  return (
    <div className={`card ${className}`}>
      {(title || subtitle) && (
        <div className="card-header">
          {title && <h2 className="card-title">{title}</h2>}
          {subtitle && <p className="card-subtitle">{subtitle}</p>}
        </div>
      )}
      <div className="card-body">{children}</div>
    </div>
  );
};

export default Card;
