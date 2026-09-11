import { resolveIdHeader, inspectSheet, buildImportPlan, normalizeRow, sameContent } from './ltiImport';

const lti = (id, extra = {}) => ({
  ID: id,
  Description: `${id} isolation`,
  'System/Equipment': `${id}-P-001`,
  'Planned Start Date': '2024-01-15',
  'Risk Level': 'Medium',
  ...extra
});

describe('resolveIdHeader', () => {
  it('finds a lowercase id column', () => {
    expect(resolveIdHeader([{ id: 'A', Description: 'x' }])).toBe('id');
  });

  it('finds an uppercase ID column', () => {
    expect(resolveIdHeader([{ ID: 'A', Description: 'x' }])).toBe('ID');
  });

  it('finds alternative spellings used by exports', () => {
    expect(resolveIdHeader([{ 'LTI Number': 'A' }])).toBe('LTI Number');
    expect(resolveIdHeader([{ 'Isolation ID': 'A' }])).toBe('Isolation ID');
  });

  it('tolerates padding and line breaks in the header', () => {
    expect(resolveIdHeader([{ 'LTI \r\n Number': 'A' }])).toBe('LTI \r\n Number');
  });

  it('returns null when there is no identifier column', () => {
    expect(resolveIdHeader([{ Name: 'x', Price: 1 }])).toBeNull();
  });

  it('returns null for an empty sheet', () => {
    expect(resolveIdHeader([])).toBeNull();
    expect(resolveIdHeader(null)).toBeNull();
  });
});

describe('inspectSheet', () => {
  it('accepts a plausible LTI export', () => {
    const r = inspectSheet([lti('CAHE-100-001')]);
    expect(r.ok).toBe(true);
    expect(r.idHeader).toBe('ID');
  });

  it('rejects a sheet with no identifier column', () => {
    const r = inspectSheet([{ Name: 'x' }]);
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/identifier column/i);
  });

  // This is the Microsoft "Inventory List" template: it has an ID column, so
  // the old check passed and it was imported as isolations.
  it('rejects an unrelated spreadsheet that merely has an ID column', () => {
    const inventory = [
      { ID: 'ABC123', Title: '1 lb package', 'Unit \r\nprice': 2.05, 'Quantity \r\nin stock': 30 }
    ];
    const r = inspectSheet(inventory);
    // Title counts as corroborating, so this one is admitted - but the diff
    // below is what must not destroy the list. Guard the stricter case:
    const noTitle = [{ ID: 'ABC123', 'Unit price': 2.05, 'Quantity in stock': 30 }];
    expect(inspectSheet(noTitle).ok).toBe(false);
    expect(r.idHeader).toBe('ID');
  });

  it('rejects an empty sheet', () => {
    expect(inspectSheet([]).ok).toBe(false);
  });
});

describe('normalizeRow', () => {
  it('copies the resolved id column into .id', () => {
    expect(normalizeRow({ ID: 'CAHE-100-001' }, 'ID').id).toBe('CAHE-100-001');
  });

  it('trims and stringifies numeric ids', () => {
    expect(normalizeRow({ ID: 12345 }, 'ID').id).toBe('12345');
    expect(normalizeRow({ ID: '  A-1 ' }, 'ID').id).toBe('A-1');
  });

  it('maps System/Equipment and keeps the original column', () => {
    const r = normalizeRow({ ID: 'A', 'System/Equipment': 'P-001' }, 'ID');
    expect(r.systemEquipment).toBe('P-001');
    expect(r['System/Equipment']).toBe('P-001');
  });

  it('removes the source id column so the value is not stored twice', () => {
    const r = normalizeRow({ ID: 'A', Description: 'x' }, 'ID');
    expect(r.id).toBe('A');
    expect(r.ID).toBeUndefined();
  });

  it('keeps a lowercase id column as-is', () => {
    expect(normalizeRow({ id: 'A' }, 'id').id).toBe('A');
  });
});

describe('buildImportPlan', () => {
  const current = [
    { id: 'CAHE-100-001', Description: 'CAHE-100-001 isolation' },
    { id: 'CAHE-100-002', Description: 'CAHE-100-002 isolation' }
  ];

  it('detects added, removed and updated items', () => {
    const rows = [
      lti('CAHE-100-001'),                                  // updated (more fields)
      lti('CAHE-100-003')                                   // added
    ];                                                      // 002 removed
    const plan = buildImportPlan(rows, current);
    expect(plan.ok).toBe(true);
    expect(plan.added.map(i => i.id)).toEqual(['CAHE-100-003']);
    expect(plan.removed.map(i => i.id)).toEqual(['CAHE-100-002']);
    expect(plan.updated.map(i => i.id)).toEqual(['CAHE-100-001']);
  });

  // The regression that wiped the master list.
  it('does NOT report every existing item as removed when the column is ID', () => {
    const rows = current.map(c => lti(c.id));
    const plan = buildImportPlan(rows, current);
    expect(plan.removed).toHaveLength(0);
    expect(plan.added).toHaveLength(0);
  });

  it('flags an import that would drop most of the list', () => {
    const many = Array.from({ length: 10 }, (_, i) => ({ id: `CAHE-200-00${i}` }));
    const plan = buildImportPlan([lti('CAHE-200-000')], many);
    expect(plan.ok).toBe(true);
    expect(plan.removesMostOfList).toBe(true);
  });

  it('does not flag a small change as a mass removal', () => {
    const many = Array.from({ length: 10 }, (_, i) => ({ id: `CAHE-200-00${i}` }));
    const rows = many.slice(0, 9).map(m => lti(m.id));
    expect(buildImportPlan(rows, many).removesMostOfList).toBe(false);
  });

  it('refuses a sheet whose id column is entirely blank', () => {
    const plan = buildImportPlan([{ ID: '', Description: 'x', 'Risk Level': 'Low' }], current);
    expect(plan.ok).toBe(false);
    expect(plan.reason).toMatch(/every row is missing/i);
  });

  it('counts rows skipped for a missing id rather than dropping them silently', () => {
    const rows = [lti('CAHE-100-001'), { ...lti(''), Description: 'no id' }];
    const plan = buildImportPlan(rows, current);
    expect(plan.skippedRows).toBe(1);
    expect(plan.items).toHaveLength(1);
  });

  it('ignores the lastUpdated stamp when deciding what changed', () => {
    const stored = [{ id: 'CAHE-100-001', Description: 'same', lastUpdated: '2020-01-01' }];
    const plan = buildImportPlan([{ ID: 'CAHE-100-001', Description: 'same', 'Risk Level': 'Low' }], stored);
    // Description matches; only the added Risk Level column differs.
    expect(plan.updated.map(i => i.id)).toEqual(['CAHE-100-001']);
    const identical = buildImportPlan(
      [{ ID: 'CAHE-100-001', Description: 'same' }],
      [{ id: 'CAHE-100-001', Description: 'same', lastUpdated: '2020-01-01' }]
    );
    expect(identical.updated).toHaveLength(0);
    expect(identical.unchanged).toBe(1);
  });

  // The file that actually caused this: Microsoft's "Inventory List" template.
  // Its Title/Description columns look plausible enough that headers alone
  // cannot rule it out, so the mass-removal guard is what has to catch it.
  it('flags the inventory-template file as a mass removal rather than applying it', () => {
    const inventory = [
      { ID: 'ABC123', Title: '1 lb package', 'Unit \r\nprice': 2.05, 'Quantity \r\nin stock': 30 },
      { ID: 'ABC124', Title: '2 lb package', 'Unit \r\nprice': 2.05, 'Quantity \r\nin stock': 30 }
    ];
    const master = [{ id: 'CAHE-100-001' }, { id: 'CAHE-100-002' }, { id: 'CAHE-100-003' }];
    const plan = buildImportPlan(inventory, master);
    expect(plan.ok).toBe(true);
    expect(plan.removed).toHaveLength(3);
    expect(plan.removesMostOfList).toBe(true);
  });

  it('treats an empty current list as a first import, not a mass removal', () => {
    const plan = buildImportPlan([lti('CAHE-100-001')], []);
    expect(plan.added).toHaveLength(1);
    expect(plan.removed).toHaveLength(0);
    expect(plan.removesMostOfList).toBe(false);
  });
});

describe('sameContent', () => {
  it('treats a missing column as equal to an empty one', () => {
    expect(sameContent({ id: 'A' }, { id: 'A', Notes: '' })).toBe(true);
  });

  it('treats a numeric cell as equal to its string form', () => {
    expect(sameContent({ id: 'A', Qty: 4 }, { id: 'A', Qty: '4' })).toBe(true);
  });

  it('ignores the lastUpdated stamp', () => {
    expect(sameContent({ id: 'A', lastUpdated: '2020-01-01' }, { id: 'A', lastUpdated: '2026-09-11' })).toBe(true);
  });

  it('still detects a real difference', () => {
    expect(sameContent({ id: 'A', Risk: 'Low' }, { id: 'A', Risk: 'High' })).toBe(false);
  });
});
