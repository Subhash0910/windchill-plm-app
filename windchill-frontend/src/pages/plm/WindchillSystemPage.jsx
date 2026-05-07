import React, { useEffect, useState } from 'react';
import styles from './WindchillSystemPage.module.css';

/* ── Mock system data — replaces /bin/windchill status output ────────────── */
const useSystemStatus = () => {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    // In production this would call GET /api/v1/admin/system/status
    setTimeout(() => {
      setStatus({
        serverName: 'windchill-plm-1',
        version: '1.0.0-SNAPSHOT',
        profile: window._env_?.SPRING_PROFILES_ACTIVE || 'demo',
        uptime: '2d 4h 17m',
        startedAt: new Date(Date.now() - 2 * 86400000 - 4 * 3600000).toISOString(),
        javaVersion: '17.0.11',
        heapUsedMb: 312,
        heapMaxMb: 512,
        dbStatus: 'CONNECTED',
        dbUrl: 'H2 in-memory (demo)',
        flywayStatus: 'DISABLED (demo mode)',
        cacheType: 'SIMPLE',
        mlService: { enabled: false, url: 'http://localhost:9999', status: 'DISABLED' },
        methodServers: [
          { id: 'MS-001', name: 'Default Method Server', status: 'RUNNING', host: 'localhost', port: 8080, threads: 10, load: 12 },
          { id: 'MS-002', name: 'Background Worker',      status: 'STOPPED', host: 'localhost', port: 8081, threads: 0,  load: 0  },
        ],
        contexts: [
          { code: 'DEFAULT', name: 'Default Product Context', type: 'PRODUCT', active: true, partCount: 47, docCount: 12 },
        ],
        recentEvents: [
          { ts: new Date(Date.now() - 60000).toISOString(),        level: 'INFO',  msg: 'Admin user login: admin@windchill.local' },
          { ts: new Date(Date.now() - 300000).toISOString(),       level: 'INFO',  msg: 'ECR-0042 promoted to UNDER_REVIEW' },
          { ts: new Date(Date.now() - 900000).toISOString(),       level: 'WARN',  msg: 'ML service unreachable — AI features disabled' },
          { ts: new Date(Date.now() - 3600000).toISOString(),      level: 'INFO',  msg: 'DemoDataInitializer: 47 parts seeded' },
          { ts: new Date(Date.now() - 2 * 86400000).toISOString(), level: 'INFO',  msg: 'Application started on profile: demo' },
        ],
        registeredActions: [
          { name: 'CreatePart',       processor: 'com.windchill.api.controller.PartController', method: 'POST /api/v1/plm/parts', auth: 'MANAGER' },
          { name: 'PromotePart',      processor: 'com.windchill.service.plm.PartServiceImpl',   method: 'POST /api/v1/plm/parts/{id}/promote', auth: 'MANAGER' },
          { name: 'CheckOutPart',     processor: 'com.windchill.service.plm.PartServiceImpl',   method: 'POST /api/v1/plm/parts/{id}/checkout', auth: 'ENGINEER' },
          { name: 'SubmitECR',        processor: 'com.windchill.api.controller.ChangeRequestController', method: 'POST /api/v1/plm/changes/{id}/submit', auth: 'ENGINEER' },
          { name: 'ApproveECR',       processor: 'com.windchill.api.controller.ChangeRequestController', method: 'POST /api/v1/plm/changes/{id}/approve', auth: 'MANAGER' },
        ],
      });
    }, 600);
  }, []);

  return status;
};

const StatusDot = ({ ok }) => (
  <span className={ok ? styles.dotGreen : styles.dotRed} />
);

const EventLevelBadge = ({ level }) => {
  const cls = level === 'WARN' ? styles.levelWarn : level === 'ERROR' ? styles.levelError : styles.levelInfo;
  return <span className={`${styles.levelBadge} ${cls}`}>{level}</span>;
};

const MetricCard = ({ label, value, sub }) => (
  <div className={styles.metricCard}>
    <div className={styles.metricValue}>{value}</div>
    <div className={styles.metricLabel}>{label}</div>
    {sub && <div className={styles.metricSub}>{sub}</div>}
  </div>
);

const WindchillSystemPage = () => {
  const status = useSystemStatus();

  if (!status) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingBanner}>
          <div className={styles.loadingSpinner} />
          Querying method server status…
        </div>
      </div>
    );
  }

  const heapPct = Math.round((status.heapUsedMb / status.heapMaxMb) * 100);

  return (
    <div className={styles.page}>

      {/* ── Banner ── */}
      <div className={styles.banner}>
        <div className={styles.bannerLeft}>
          <div className={styles.bannerIcon}>🖥️</div>
          <div>
            <div className={styles.bannerTitle}>Windchill System Administration</div>
            <div className={styles.bannerSub}>
              Server: <span className={styles.mono}>{status.serverName}</span>
              {' · '}Version: <span className={styles.mono}>{status.version}</span>
              {' · '}Profile: <span className={styles.profileChip}>{status.profile}</span>
            </div>
          </div>
        </div>
        <div className={styles.bannerRight}>
          <div className={styles.uptimeBadge}>
            <StatusDot ok={true} />
            Running · {status.uptime}
          </div>
        </div>
      </div>

      {/* ── Metrics row ── */}
      <div className={styles.metricsRow}>
        <MetricCard label="Heap Used" value={`${status.heapUsedMb} MB`} sub={`${heapPct}% of ${status.heapMaxMb} MB`} />
        <MetricCard label="Java Version" value={status.javaVersion} sub="OpenJDK" />
        <MetricCard label="Database" value={status.dbStatus} sub={status.dbUrl} />
        <MetricCard label="Cache" value={status.cacheType} sub="Spring Cache" />
        <MetricCard label="ML Service" value={status.mlService.enabled ? 'ENABLED' : 'DISABLED'} sub={status.mlService.url} />
      </div>

      <div className={styles.grid}>

        {/* ── Method Servers ── */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}>Method Servers</div>
            <span className={styles.cardBadge}>{status.methodServers.length}</span>
          </div>
          <div className={styles.cardBody}>
            {status.methodServers.map(ms => (
              <div key={ms.id} className={styles.msRow}>
                <div className={styles.msLeft}>
                  <StatusDot ok={ms.status === 'RUNNING'} />
                  <div>
                    <div className={styles.msName}>{ms.name}</div>
                    <div className={styles.msMeta}>
                      <span className={styles.mono}>{ms.host}:{ms.port}</span>
                      {' · '}Threads: {ms.threads}
                      {' · '}Load: {ms.load}%
                    </div>
                  </div>
                </div>
                <div className={styles.msActions}>
                  {ms.status === 'RUNNING' ? (
                    <button className={`${styles.msBtn} ${styles.msBtnStop}`} onClick={() => alert('Stop not implemented in demo')}>Stop</button>
                  ) : (
                    <button className={`${styles.msBtn} ${styles.msBtnStart}`} onClick={() => alert('Start not implemented in demo')}>Start</button>
                  )}
                  <button className={styles.msBtn} onClick={() => alert('Restart not implemented in demo')}>Restart</button>
                </div>
              </div>
            ))}
            <div className={styles.cardFooter}>
              Equivalent to: <span className={styles.mono}>./bin/windchill MethodServer status</span>
            </div>
          </div>
        </div>

        {/* ── PLM Contexts ── */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}>PLM Contexts</div>
            <span className={styles.cardBadge}>{status.contexts.length}</span>
          </div>
          <div className={styles.cardBody}>
            <table className={styles.sysTable}>
              <thead>
                <tr><th>Code</th><th>Name</th><th>Type</th><th>Parts</th><th>Docs</th><th>Active</th></tr>
              </thead>
              <tbody>
                {status.contexts.map(c => (
                  <tr key={c.code}>
                    <td className={styles.mono}>{c.code}</td>
                    <td>{c.name}</td>
                    <td>{c.type}</td>
                    <td className={styles.mono}>{c.partCount}</td>
                    <td className={styles.mono}>{c.docCount}</td>
                    <td>{c.active ? '✅' : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Registered Action Processors ── */}
        <div className={`${styles.card} ${styles.cardFullWidth}`}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}>Registered Action Processors</div>
            <div className={styles.cardHeaderSub}>Windchill-style action model registration</div>
          </div>
          <div className={styles.cardBody}>
            <table className={styles.sysTable}>
              <thead>
                <tr><th>Action</th><th>Processor Class</th><th>Endpoint</th><th>Min Auth</th></tr>
              </thead>
              <tbody>
                {status.registeredActions.map(a => (
                  <tr key={a.name}>
                    <td className={styles.mono}>{a.name}</td>
                    <td className={`${styles.mono} ${styles.processorCell}`}>{a.processor}</td>
                    <td className={styles.mono}>{a.method}</td>
                    <td><span className={styles.authBadge}>{a.auth}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className={styles.cardFooter}>
              In production Windchill, action processors are registered via XML in
              {' '}<span className={styles.mono}>codebase/config/actions/*.xml</span>.
              This table mirrors that registry for the REST layer.
            </div>
          </div>
        </div>

        {/* ── System Event Log ── */}
        <div className={`${styles.card} ${styles.cardFullWidth}`}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}>System Event Log</div>
            <div className={styles.cardHeaderSub}>Recent server-side events</div>
          </div>
          <div className={styles.cardBody}>
            {status.recentEvents.map((ev, i) => (
              <div key={i} className={styles.eventRow}>
                <EventLevelBadge level={ev.level} />
                <span className={`${styles.mono} ${styles.eventTs}`}>{new Date(ev.ts).toLocaleString()}</span>
                <span className={styles.eventMsg}>{ev.msg}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── Shell equivalents footer ── */}
      <div className={styles.shellCard}>
        <div className={styles.shellTitle}>Windchill Shell Equivalents</div>
        <div className={styles.shellGrid}>
          <div className={styles.shellCmd}>
            <span className={styles.shellPrompt}>$</span>
            <span className={styles.mono}>./bin/windchill MethodServer start</span>
            <span className={styles.shellArrow}>→</span>
            <span className={styles.shellDesc}>Start Method Server above</span>
          </div>
          <div className={styles.shellCmd}>
            <span className={styles.shellPrompt}>$</span>
            <span className={styles.mono}>./bin/windchill MethodServer stop</span>
            <span className={styles.shellArrow}>→</span>
            <span className={styles.shellDesc}>Stop Method Server above</span>
          </div>
          <div className={styles.shellCmd}>
            <span className={styles.shellPrompt}>$</span>
            <span className={styles.mono}>./bin/windchill status</span>
            <span className={styles.shellArrow}>→</span>
            <span className={styles.shellDesc}>This page</span>
          </div>
          <div className={styles.shellCmd}>
            <span className={styles.shellPrompt}>$</span>
            <span className={styles.mono}>./bin/windchill shell</span>
            <span className={styles.shellArrow}>→</span>
            <span className={styles.shellDesc}>Windchill interactive shell (H2 console in demo)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WindchillSystemPage;
