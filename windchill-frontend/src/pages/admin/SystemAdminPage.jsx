import React, { useEffect, useState, useCallback } from 'react';
import Card from '../../components/molecules/Card/Card';
import Button from '../../components/atoms/Button/Button';
import { dataUtilitiesApi } from '../../services/dataUtilitiesApi';
import './SystemAdminPage.css';

const CATEGORIES = ['', 'PART', 'CHANGE', 'DOCUMENT', 'NOTIFICATION', 'SYSTEM', 'UI'];
const SCOPE_LABELS = { SYSTEM: 'System', CONTEXT: 'Context', USER: 'User' };
const SCOPE_COLORS = { SYSTEM: '#4f46e5', CONTEXT: '#0891b2', USER: '#059669' };
const TARGET_TYPES = ['PART', 'DOCUMENT', 'ECR', 'ECO', 'ECN', 'CHANGE_TASK'];

const StatusBadge = ({ ok, label }) => (
  <span className={`sa-badge ${ok ? 'sa-badge--ok' : 'sa-badge--err'}`}>
    {label || (ok ? 'OK' : 'ERROR')}
  </span>
);

const SystemAdminPage = () => {
  const [systemInfo, setSystemInfo] = useState(null);
  const [dbStats, setDbStats] = useState(null);
  const [cacheStats, setCacheStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [seedContextId, setSeedContextId] = useState('1');
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState(null);

  const [reindexing, setReindexing] = useState(false);

  // ── Preferences state ──────────────────────────────────────────────────
  const [prefs, setPrefs] = useState([]);
  const [prefsLoading, setPrefsLoading] = useState(false);
  const [prefCategory, setPrefCategory] = useState('');
  const [editingPref, setEditingPref] = useState(null);
  const [editValue, setEditValue] = useState('');

  // ── Numbering schemes state ────────────────────────────────────────────
  const [schemes, setSchemes] = useState([]);
  const [schemesLoading, setSchemesLoading] = useState(false);
  const [genResult, setGenResult] = useState(null);

  // ── Object templates state ─────────────────────────────────────────────
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [applyResult, setApplyResult] = useState(null);

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [info, db, cache] = await Promise.all([
        dataUtilitiesApi.getSystemInfo(),
        dataUtilitiesApi.getDbStats(),
        dataUtilitiesApi.getCacheStats(),
      ]);
      setSystemInfo(info);
      setDbStats(db);
      setCacheStats(cache);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load system info');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleSeed = async () => {
    const id = parseInt(seedContextId, 10);
    if (!id || id < 1) {
      setError('Enter a valid context ID (>=1)');
      return;
    }
    const ok = window.confirm(
      `Seed demo data into context ${id}? This will create realistic sample parts, BOMs, ECRs, and documents if the database is empty.`
    );
    if (!ok) return;

    try {
      setSeeding(true);
      setError(null);
      setSeedResult(null);
      const res = await dataUtilitiesApi.seedDemoData(id);
      setSeedResult(res.data || res);
      await loadAll();
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Seed failed');
    } finally {
      setSeeding(false);
    }
  };

  const handleReindex = async () => {
    try {
      setReindexing(true);
      setError(null);
      await dataUtilitiesApi.reindex();
      alert('Reindex triggered successfully.');
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Reindex failed');
    } finally {
      setReindexing(false);
    }
  };

  // ── Preferences ──────────────────────────────────────────────────────────
  const loadPrefs = useCallback(async (category) => {
    try {
      setPrefsLoading(true);
      const data = await dataUtilitiesApi.getPreferences(category ? { category } : {});
      setPrefs(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load preferences');
    } finally {
      setPrefsLoading(false);
    }
  }, []);

  useEffect(() => { loadPrefs(prefCategory); }, [prefCategory, loadPrefs]);

  const handleEditPref = (pref) => {
    setEditingPref(pref.id);
    setEditValue(pref.prefValue);
  };

  const handleSavePref = async (pref) => {
    try {
      await dataUtilitiesApi.createPreference({ ...pref, prefValue: editValue });
      setEditingPref(null);
      setEditValue('');
      loadPrefs(prefCategory);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to save preference');
    }
  };

  const handleDeletePref = async (id) => {
    if (!window.confirm('Delete this preference?')) return;
    try {
      await dataUtilitiesApi.deletePreference(id);
      loadPrefs(prefCategory);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to delete preference');
    }
  };

  // ── Numbering schemes ───────────────────────────────────────────────────
  const loadSchemes = useCallback(async () => {
    try {
      setSchemesLoading(true);
      const data = await dataUtilitiesApi.getNumberingSchemes();
      setSchemes(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load numbering schemes');
    } finally {
      setSchemesLoading(false);
    }
  }, []);

  useEffect(() => { loadSchemes(); }, [loadSchemes]);

  const handleResetScheme = async (id) => {
    if (!window.confirm('Reset sequence to start value?')) return;
    try {
      await dataUtilitiesApi.resetNumberingScheme(id);
      loadSchemes();
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to reset scheme');
    }
  };

  const handleGenerateNumber = async (targetType) => {
    try {
      const res = await dataUtilitiesApi.generateNumber(targetType);
      setGenResult({ targetType, number: res.data?.generatedNumber || res.message });
      loadSchemes();
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to generate number');
    }
  };

  // ── Object templates ────────────────────────────────────────────────────
  const loadTemplates = useCallback(async () => {
    try {
      setTemplatesLoading(true);
      const data = await dataUtilitiesApi.getTemplates();
      setTemplates(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load templates');
    } finally {
      setTemplatesLoading(false);
    }
  }, []);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  const handleApplyTemplate = async (id) => {
    try {
      const res = await dataUtilitiesApi.applyTemplate(id);
      setApplyResult(res.data || res);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to apply template');
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!window.confirm('Delete this template?')) return;
    try {
      await dataUtilitiesApi.deleteTemplate(id);
      loadTemplates();
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to delete template');
    }
  };

  const renderTableCounts = (counts) => {
    if (!counts) return null;
    return (
      <table className="sa-table">
        <thead>
          <tr>
            <th>Table</th>
            <th>Row Count</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(counts).map(([table, count]) => (
            <tr key={table}>
              <td className="mono">{table}</td>
              <td className="mono">{count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="sa-page">
      <div className="page-title">System Admin</div>
      <div className="page-sub">
        System health, database statistics, cache management, and demo data seeding.
      </div>

      {error && <div className="plm-error">{error}</div>}

      <div className="sa-actions-row">
        <Button variant="primary" size="sm" onClick={loadAll} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh All'}
        </Button>
      </div>

      {/* ── System Health ─────────────────────────────────────────────── */}
      <Card className="sa-card">
        <div className="sa-card-title">System Health</div>

        {loading && !systemInfo && <div className="plm-muted">Loading system info...</div>}

        {systemInfo && (
          <div className="sa-grid sa-grid--4col">
            <div className="sa-stat">
              <div className="sa-stat-label">Java Version</div>
              <div className="sa-stat-value mono">{systemInfo.javaVersion}</div>
              <div className="sa-stat-sub mono">{systemInfo.javaVendor}</div>
            </div>
            <div className="sa-stat">
              <div className="sa-stat-label">OS</div>
              <div className="sa-stat-value mono">{systemInfo.osName}</div>
              <div className="sa-stat-sub mono">{systemInfo.osVersion}</div>
            </div>
            <div className="sa-stat">
              <div className="sa-stat-label">Memory (Used / Max)</div>
              <div className="sa-stat-value mono">
                {systemInfo.memoryUsedMB} MB / {systemInfo.memoryMaxMB} MB
              </div>
              <div className="sa-stat-sub">
                {systemInfo.memoryMaxMB > 0
                  ? `${Math.round((systemInfo.memoryUsedMB / systemInfo.memoryMaxMB) * 100)}% used`
                  : ''}
              </div>
            </div>
            <div className="sa-stat">
              <div className="sa-stat-label">Processors</div>
              <div className="sa-stat-value mono">{systemInfo.availableProcessors}</div>
            </div>
            <div className="sa-stat">
              <div className="sa-stat-label">DB Version</div>
              <div className="sa-stat-value mono">{systemInfo.dbVersion}</div>
              <StatusBadge ok={!!systemInfo.dbVersion && systemInfo.dbVersion !== 'unknown'} />
            </div>
            <div className="sa-stat">
              <div className="sa-stat-label">Uptime</div>
              <div className="sa-stat-value mono">{systemInfo.uptime}</div>
            </div>
            <div className="sa-stat">
              <div className="sa-stat-label">Active Profiles</div>
              <div className="sa-stat-value mono">{systemInfo.activeProfiles}</div>
            </div>
            <div className="sa-stat">
              <div className="sa-stat-label">Disk Space (Free / Total)</div>
              <div className="sa-stat-value mono">
                {systemInfo.diskFreeGB} GB / {systemInfo.diskTotalGB} GB
              </div>
            </div>
          </div>
        )}

        {systemInfo && (
          <div className="sa-health-checks">
            <div className="sa-health-row">
              <span>Backend Status</span>
              <StatusBadge ok label="RUNNING" />
            </div>
            <div className="sa-health-row">
              <span>Database Connection</span>
              <StatusBadge
                ok={!!systemInfo.dbVersion && !systemInfo.dbVersion.startsWith('unknown')}
                label={systemInfo.dbVersion && !systemInfo.dbVersion.startsWith('unknown') ? 'CONNECTED' : 'UNKNOWN'}
              />
            </div>
            <div className="sa-health-row">
              <span>Redis</span>
              <StatusBadge ok={false} label="NOT CONFIGURED" />
            </div>
          </div>
        )}
      </Card>

      {/* ── Database Stats ─────────────────────────────────────────────── */}
      <Card className="sa-card">
        <div className="sa-card-title">Database Statistics</div>

        {dbStats && (
          <>
            {renderTableCounts(dbStats.tableCounts)}
            <div className="sa-db-total">
              <strong>Total Rows:</strong> {dbStats.totalRows}
            </div>
          </>
        )}
        {!dbStats && !loading && <div className="plm-muted">No data loaded.</div>}
      </Card>

      {/* ── Cache Management ───────────────────────────────────────────── */}
      <Card className="sa-card">
        <div className="sa-card-title">Cache Management</div>

        {cacheStats && (
          <div className="sa-cache-section">
            <div className="sa-health-row">
              <span>Redis Connected</span>
              <StatusBadge ok={cacheStats.redisConnected} label={cacheStats.redisConnected ? 'CONNECTED' : 'DISCONNECTED'} />
            </div>
            <div className="sa-cache-info mono">{cacheStats.redisInfo}</div>
            <div className="sa-cache-info mono" style={{ marginTop: 8 }}>{cacheStats.hibernateL2Cache}</div>
          </div>
        )}
        {!cacheStats && !loading && <div className="plm-muted">No cache stats loaded.</div>}
      </Card>

      {/* ── Demo Data ──────────────────────────────────────────────────── */}
      <Card className="sa-card">
        <div className="sa-card-title">Demo Data Seeding</div>
        <p className="sa-desc">
          Seeds realistic Windchill-style demo data (parts, BOMs, ECRs, documents) into a context.
          This operation is idempotent — it will skip if data already exists.
        </p>

        <div className="sa-seed-controls">
          <label className="sa-seed-label">
            Context ID:
            <input
              type="number"
              className="plm-input"
              value={seedContextId}
              onChange={(e) => setSeedContextId(e.target.value)}
              min="1"
              style={{ width: 100, marginLeft: 8 }}
            />
          </label>
          <Button variant="primary" size="sm" onClick={handleSeed} disabled={seeding}>
            {seeding ? 'Seeding...' : 'Seed Demo Data'}
          </Button>
        </div>

        {seedResult && (
          <div className={`sa-seed-result ${seedResult.skipped ? 'sa-seed-result--skip' : 'sa-seed-result--ok'}`}>
            {seedResult.skipped
              ? `Skipped — ${seedResult.existingPartCount} parts already exist.`
              : `Seeded: ${seedResult.partsCreated} parts, ${seedResult.bomsCreated} BOMs, ${seedResult.ecrsCreated} ECRs, ${seedResult.docsCreated} documents.`}
          </div>
        )}
      </Card>

      {/* ── Reindex ────────────────────────────────────────────────────── */}
      <Card className="sa-card">
        <div className="sa-card-title">Full-Text Reindex</div>
        <p className="sa-desc">
          Triggers a Hibernate Search / Lucene mass reindex for all entities.
        </p>
        <Button variant="secondary" size="sm" onClick={handleReindex} disabled={reindexing}>
          {reindexing ? 'Reindexing...' : 'Trigger Reindex'}
        </Button>
      </Card>

      {/* ── Preferences ────────────────────────────────────────────────── */}
      <Card className="sa-card">
        <div className="sa-card-title">Preferences</div>
        <p className="sa-desc">
          Hierarchical preference system: System defaults → Context overrides → User overrides.
          Edit values inline.
        </p>

        <div className="sa-actions-row">
          <label className="sa-seed-label">
            Category:
            <select
              className="plm-input"
              value={prefCategory}
              onChange={(e) => setPrefCategory(e.target.value)}
              style={{ width: 140, marginLeft: 8 }}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c || 'ALL'}</option>
              ))}
            </select>
          </label>
          <Button variant="secondary" size="sm" onClick={() => loadPrefs(prefCategory)} disabled={prefsLoading}>
            {prefsLoading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>

        {prefs.length > 0 && (
          <table className="sa-table">
            <thead>
              <tr>
                <th>Key</th>
                <th>Value</th>
                <th>Type</th>
                <th>Category</th>
                <th>Scope</th>
                <th style={{ width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {prefs.map((p) => (
                <tr key={p.id}>
                  <td className="mono" style={{ fontSize: 12 }}>{p.prefKey}</td>
                  <td>
                    {editingPref === p.id ? (
                      <input
                        className="plm-input"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        style={{ width: 130 }}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSavePref(p); if (e.key === 'Escape') setEditingPref(null); }}
                      />
                    ) : (
                      <span className="mono" style={{ fontSize: 12 }}>{p.prefValue}</span>
                    )}
                  </td>
                  <td style={{ fontSize: 11, color: '#8288a1' }}>{p.prefType}</td>
                  <td style={{ fontSize: 11, color: '#8288a1' }}>{p.category}</td>
                  <td>
                    <span
                      className="sa-badge"
                      style={{
                        background: (SCOPE_COLORS[p.scope] || '#6b7280') + '18',
                        color: SCOPE_COLORS[p.scope] || '#6b7280',
                      }}
                    >
                      {SCOPE_LABELS[p.scope] || p.scope}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {editingPref === p.id ? (
                        <>
                          <Button variant="primary" size="sm" onClick={() => handleSavePref(p)}>Save</Button>
                          <Button variant="secondary" size="sm" onClick={() => setEditingPref(null)}>Cancel</Button>
                        </>
                      ) : (
                        <>
                          <Button variant="secondary" size="sm" onClick={() => handleEditPref(p)}>Edit</Button>
                          <Button variant="secondary" size="sm" onClick={() => handleDeletePref(p.id)}>Del</Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!prefsLoading && prefs.length === 0 && <div className="plm-muted">No preferences found.</div>}
      </Card>

      {/* ── Numbering Schemes ──────────────────────────────────────────── */}
      <Card className="sa-card">
        <div className="sa-card-title">Numbering Schemes</div>
        <p className="sa-desc">
          Configurable auto-numbering for parts, documents, and change objects.
          Generate a test number to preview the scheme output.
        </p>

        <div className="sa-actions-row">
          <Button variant="secondary" size="sm" onClick={loadSchemes} disabled={schemesLoading}>
            {schemesLoading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>

        {genResult && (
          <div className="sa-seed-result sa-seed-result--ok" style={{ marginBottom: 10 }}>
            Generated: <strong>{genResult.number}</strong> for {genResult.targetType}
            <button
              style={{ marginLeft: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', textDecoration: 'underline' }}
              onClick={() => setGenResult(null)}
            >
              dismiss
            </button>
          </div>
        )}

        {schemes.length > 0 && (
          <table className="sa-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Target Type</th>
                <th>Format</th>
                <th>Current Seq</th>
                <th>Min Digits</th>
                <th>Status</th>
                <th style={{ width: 180 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {schemes.map((s) => (
                <tr key={s.id}>
                  <td>{s.schemeName}</td>
                  <td><span className="sa-badge sa-badge--ok">{s.targetType}</span></td>
                  <td className="mono" style={{ fontSize: 12 }}>
                    {(s.prefix || '')}{'SEQ'}{(s.suffix || '')}
                  </td>
                  <td className="mono">{s.sequenceCurrent}</td>
                  <td>{s.minDigits}</td>
                  <td>
                    <StatusBadge ok={s.isActive} label={s.isActive ? 'ACTIVE' : 'INACTIVE'} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      <Button variant="primary" size="sm" onClick={() => handleGenerateNumber(s.targetType)}>
                        Generate
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => handleResetScheme(s.id)}>
                        Reset
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!schemesLoading && schemes.length === 0 && <div className="plm-muted">No numbering schemes found.</div>}
      </Card>

      {/* ── Object Templates ────────────────────────────────────────────── */}
      <Card className="sa-card">
        <div className="sa-card-title">Object Templates</div>
        <p className="sa-desc">
          Pre-filled templates for rapid object creation. Click "Use Template" to get
          pre-filled field values.
        </p>

        <div className="sa-actions-row">
          <Button variant="secondary" size="sm" onClick={loadTemplates} disabled={templatesLoading}>
            {templatesLoading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>

        {applyResult && (
          <div className="sa-seed-result sa-seed-result--ok" style={{ marginBottom: 10 }}>
            Template <strong>{applyResult.templateName}</strong> applied for {applyResult.targetType}.
            <button
              style={{ marginLeft: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', textDecoration: 'underline' }}
              onClick={() => setApplyResult(null)}
            >
              dismiss
            </button>
            {applyResult.prefilledFields && Object.keys(applyResult.prefilledFields).length > 0 && (
              <pre className="mono" style={{ marginTop: 6, fontSize: 11, whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(applyResult.prefilledFields, null, 2)}
              </pre>
            )}
          </div>
        )}

        {templates.length > 0 && (
          <div className="sa-template-grid">
            {templates.map((t) => (
              <div key={t.id} className="sa-template-card">
                <div className="sa-template-icon">
                  {t.iconName || 'file'}
                </div>
                <div className="sa-template-body">
                  <div className="sa-template-name">{t.templateName}</div>
                  <div className="sa-template-meta">
                    <span className="sa-badge sa-badge--ok">{t.targetType}</span>
                    {t.category && (
                      <span className="sa-badge" style={{ background: '#eef2ff', color: '#4f46e5', marginLeft: 6 }}>
                        {t.category}
                      </span>
                    )}
                    <span className="sa-badge" style={{
                      background: t.isPublic ? '#e3f5e8' : '#fff7e0',
                      color: t.isPublic ? '#1b7f3a' : '#996a00',
                      marginLeft: 6,
                    }}>
                      {t.isPublic ? 'PUBLIC' : 'PRIVATE'}
                    </span>
                  </div>
                  {t.description && <div className="sa-template-desc">{t.description}</div>}
                </div>
                <div className="sa-template-actions">
                  <Button variant="primary" size="sm" onClick={() => handleApplyTemplate(t.id)}>
                    Use Template
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => handleDeleteTemplate(t.id)}>
                    Del
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        {!templatesLoading && templates.length === 0 && <div className="plm-muted">No templates found.</div>}
      </Card>

      {/* ── Server Logs ────────────────────────────────────────────────── */}
      <Card className="sa-card">
        <div className="sa-card-title">Server Logs</div>
        <p className="sa-desc">
          Recent system events from the Java ManagementFactory runtime.
        </p>
        <div className="sa-log-box mono">
          {systemInfo ? (
            <pre className="sa-log-pre">
{`[SYSTEM] Java Version:    ${systemInfo.javaVersion}
[SYSTEM] OS:              ${systemInfo.osName} ${systemInfo.osVersion}
[SYSTEM] Uptime:           ${systemInfo.uptime}
[SYSTEM] Memory Used/Max:  ${systemInfo.memoryUsedMB}MB / ${systemInfo.memoryMaxMB}MB
[SYSTEM] Processors:       ${systemInfo.availableProcessors}
[SYSTEM] DB Version:       ${systemInfo.dbVersion}
[SYSTEM] Active Profiles:   ${systemInfo.activeProfiles}
[SYSTEM] Disk Free/Total:   ${systemInfo.diskFreeGB}GB / ${systemInfo.diskTotalGB}GB`}
            </pre>
          ) : (
            <div className="plm-muted">System info not loaded. Click "Refresh All".</div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default SystemAdminPage;
