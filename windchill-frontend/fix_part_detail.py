import sys

file_path = "c:\\Users\\subha\\windchill-plm-app\\windchill-frontend\\src\\pages\\plm\\PartDetailPage.jsx"

with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
skip = False

for i, line in enumerate(lines):
    if "{!whereUsedLoading && !whereUsedError && (" in line:
        new_lines.append(line)
        new_lines.append("""                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {whereUsed && whereUsed.length > 0 && (
                          <div style={{ width: '100%', height: '500px', border: '1px solid var(--wc-border)', borderRadius: 'var(--wc-radius-md)' }}>
                             <ImpactVisualizer part={part} whereUsed={whereUsed} />
                          </div>
                        )}
                        <div style={{ overflowX: 'auto' }}>
                          <table className="parts-table" style={{ width: '100%' }}>
                            <thead><tr><th>Number</th><th>Name</th><th>State</th><th></th></tr></thead>
                            <tbody>
                              {(whereUsed || []).map(p => (
                                <tr key={p.id}>
                                  <td className="mono">{p.partNumber}</td>
                                  <td>{p.name}</td>
                                  <td><StateBadge state={p.lifecycleState} size="sm" /></td>
                                  <td style={{ textAlign: 'right' }}>
                                    <Button variant="secondary" size="sm" onClick={() => navigate(`/plm/parts/${p.id}`)}>Open</Button>
                                  </td>
                                </tr>
                              ))}
                              {(whereUsed || []).length === 0 && (
                                <tr><td colSpan={4} className="plm-muted" style={{ padding: 12 }}>Not used in any parent assembly.</td></tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
""")
        skip = True
    elif "                    )}" in line and skip:
        new_lines.append(line)
        skip = False
    elif not skip:
        new_lines.append(line)

with open(file_path, "w", encoding="utf-8") as f:
    f.writelines(new_lines)

print("File fixed.")
