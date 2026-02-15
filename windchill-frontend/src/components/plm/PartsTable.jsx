import React from 'react';
import { Link } from 'react-router-dom';
import './PartsTable.css';

const PartsTable = ({ parts }) => {
  return (
    <div className="parts-table-wrap">
      <table className="parts-table">
        <thead>
          <tr>
            <th>Number</th>
            <th>Name</th>
            <th>Rev</th>
            <th>Iter</th>
            <th>State</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {(parts || []).map(p => (
            <tr key={p.id}>
              <td className="mono">{p.partNumber}</td>
              <td>{p.name}</td>
              <td>{p.revision}</td>
              <td>{p.iteration}</td>
              <td><span className={`pill pill-${(p.lifecycleState || '').toLowerCase()}`}>{p.lifecycleState}</span></td>
              <td style={{ textAlign: 'right' }}>
                <Link className="link" to={`/plm/parts/${p.id}`}>Open</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PartsTable;
