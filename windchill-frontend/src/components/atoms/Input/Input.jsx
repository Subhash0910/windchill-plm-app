import React from 'react';
import './Input.css';

const Input = ({
  label,
  error,
  helperText,
  fullWidth = true,
  ...props
}) => {
  return (
    <div className={`input-wrapper ${fullWidth ? 'full-width' : ''}`}>
      {label && <label className="input-label">{label}</label>}
      <input className={`input ${error ? 'input--error' : ''}`} {...props} />
      {error && helperText && <span className="input-error">{helperText}</span>}
    </div>
  );
};

export default Input;
