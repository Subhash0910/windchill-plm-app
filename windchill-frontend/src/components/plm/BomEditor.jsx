import React, { useEffect, useState } from 'react';
import Button from '../atoms/Button/Button';
import { plmApi } from '../../services/plmApi';
import './BomEditor.css';

const BomEditor = ({ parentPartId, candidateChildren }) => {
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({ childPartId: '', quantity: 1, unit: 'EA', findNumber: '', sortOrder: 10, lineNote: '' });

  const load = async () => {
    if (!parentPartId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await plmApi.listBom(parentPartId);
      setLines(data || []);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load BOM');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentPartId]);

  const add = async () => {
    try {
      setError(null);
      await plmApi.addBomLine(parentPartId, {
        childPartId: Number(form.childPartId),
        quantity: Number(form.quantity),
        unit: form.unit,
        findNumber: form.findNumber,
        sortOrder: Number(form.sortOrder),
        lineNote: form.lineNote,
      });
      setForm({ childPartId: '', quantity: 1, unit: 'EA', findNumber: '', sortOrder: 10, lineNote: '' });
      await load();
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to add BOM line');
    }
  };

  const remove = async (id) => {
    try {
      setError(null);
      await plmApi.deleteBomLine(id);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to delete BOM line');
    }
  };

  return (
    <div className="bom-wrap">
      <div className="bom-title">BOM</div>

      {loading ? (
        <div className="plm-muted">Loading BOM...</div>
      ) : (
        <table className="bom-table">
          <thead>
            <tr>
              <th>Find</th>
              <th>Child</th>
              <th>Qty</th>
              <th>Unit</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(lines || []).map(l => (
              <tr key={l.id}>
                <td className="mono">{l.findNumber || '-'}</td>
                <td className="mono">{l.childPartId}</td>
                <td>{l.quantity}</td>
                <td>{l.unit}</td>
                <td style={{ textAlign: 'right' }}>
                  <button className="link-btn" onClick={() => remove(l.id)}>Remove</button>
                </td>
              </tr>
            ))}
            {(!lines || lines.length === 0) && (
              <tr><td colSpan="5" className="plm-muted" style={{ padding: 10 }}>No BOM lines yet.</td></tr>
            )}
          </tbody>
        </table>
      )}

      <div className="bom-add">
        <select className="plm-select" value={form.childPartId} onChange={e => setForm({ ...form, childPartId: e.target.value })}>
          <option value="">Select child part</option>
          {(candidateChildren || []).map(p => (
            <option key={p.id} value={p.id}>{p.partNumber} - {p.name}</option>
          ))}
        </select>
        <input className="plm-input" type="number" min="0" step="1" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} placeholder="Qty" />
        <input className="plm-input" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} placeholder="Unit" />
        <input className="plm-input" value={form.findNumber} onChange={e => setForm({ ...form, findNumber: e.target.value })} placeholder="Find" />
        <Button variant="secondary" size="sm" onClick={add} disabled={!form.childPartId}>Add</Button>
      </div>

      {error && <div className="plm-error">{error}</div>}
    </div>
  );
};

export default BomEditor;
