window.__ModuleLoader__.load({
  id: 'dsh-plugin-lgd-trust',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useEffect, useState } = React;

    const ENDPOINT = '/api/lgd-trust/summary';
    const POLL_MS = 120000;

    const S = {
      root: {
        display: 'flex', flexDirection: 'column', gap: '6px',
        border: '1px solid var(--dsw-alias-border-l1)',
        background: 'var(--dsw-alias-bg-layer-1)',
        borderRadius: '10px', padding: '8px 10px',
        fontSize: '12px', lineHeight: '1.5',
        color: 'var(--dsw-alias-label-primary)',
      },
      bar: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' },
      dot: (color) => ({ width: '8px', height: '8px', borderRadius: '50%', background: color, flex: '0 0 auto' }),
      title: { fontWeight: 600, marginRight: '2px' },
      chip: {
        padding: '1px 7px', borderRadius: '999px',
        background: 'var(--dsw-alias-bg-layer-2)',
        border: '1px solid var(--dsw-alias-border-l1)',
        whiteSpace: 'nowrap',
      },
      chipWarn: {
        padding: '1px 7px', borderRadius: '999px',
        border: '1px solid var(--dsw-alias-state-warn-primary)',
        color: 'var(--dsw-alias-state-warn-primary)', whiteSpace: 'nowrap',
      },
      spacer: { flex: '1 1 12px' },
      muted: { color: 'var(--dsw-alias-label-secondary)', whiteSpace: 'nowrap' },
      btn: {
        appearance: 'none', cursor: 'pointer', font: 'inherit',
        color: 'var(--dsw-alias-label-secondary)',
        background: 'transparent',
        border: '1px solid var(--dsw-alias-border-l1)',
        borderRadius: '6px', padding: '1px 8px',
      },
      error: {
        border: '1px solid var(--dsw-alias-state-error-primary)',
        color: 'var(--dsw-alias-state-error-primary)',
        borderRadius: '8px', padding: '6px 8px',
      },
      body: { marginTop: '4px', maxHeight: '30vh', overflow: 'auto' },
      colHead: {
        fontWeight: 600, color: 'var(--dsw-alias-label-secondary)',
        textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '10px',
        margin: '2px 0 3px 0',
      },
      list: { listStyle: 'none', margin: 0, padding: 0 },
      li: { margin: '0 0 2px 0', display: 'flex', gap: '6px', alignItems: 'baseline' },
      mono: { fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace', fontSize: '11px' },
    };

    function dotColor(data) {
      if (!data) return 'var(--dsw-alias-state-idle-primary)';
      if (data.coverage.nv > 0) return 'var(--dsw-alias-state-warn-primary)';
      return 'var(--dsw-alias-state-success-primary, #2e7d32)';
    }

    function TrustPanel(props) {
      const { t } = props;
      const [data, setData] = useState(null);
      const [error, setError] = useState(null);
      const [busy, setBusy] = useState(false);
      const [open, setOpen] = useState(false);

      const load = async () => {
        setBusy(true);
        try {
          const r = await fetch(ENDPOINT, { cache: 'no-store' });
          const j = await r.json();
          if (!r.ok) throw new Error(j && (j.hint || j.error) || ('HTTP ' + r.status));
          setData(j); setError(null);
        } catch (e) {
          setError(String((e && e.message) || e));
        } finally {
          setBusy(false);
        }
      };

      useEffect(() => { load(); const id = setInterval(load, POLL_MS); return () => clearInterval(id); }, []);

      const chips = [];
      if (data) {
        chips.push(h('span', { key: 'cov', style: S.chip }, t('evaluated') + ' ' + data.coverage.evaluated + '/' + data.coverage.total));
        if (data.coverage.nv > 0) chips.push(h('span', { key: 'nv', style: S.chipWarn }, t('nv') + ' ' + data.coverage.nv));
        Object.entries(data.grades || {}).sort().forEach(([g, n]) =>
          chips.push(h('span', { key: 'g' + g, style: S.chip }, g + ' ' + n)));
      }

      const details = open && data ? h('div', { style: S.body },
        h('div', { style: S.colHead }, t('lowest')),
        h('ul', { style: S.list }, (data.lowest || []).map((r) =>
          h('li', { key: r.slug, style: S.li },
            h('span', { style: S.mono }, r.slug),
            h('span', { style: S.muted }, r.grade + ' · ' + r.score)))),
        h('div', { style: { ...S.muted, marginTop: '6px' } }, t('policy')),
      ) : null;

      return h('div', { style: S.root },
        h('div', { style: S.bar },
          h('span', { style: S.dot(dotColor(data)), 'aria-hidden': true }),
          h('span', { style: S.title }, t('title')),
          ...chips,
          h('span', { style: S.spacer }),
          h('button', { type: 'button', style: S.btn, onClick: load, disabled: busy }, t('refresh')),
          h('button', { type: 'button', style: S.btn, onClick: () => setOpen(!open), 'aria-expanded': open },
            open ? t('collapse') : t('expand')),
        ),
        error ? h('div', { style: S.error }, t('error') + ' · ' + error) : details,
      );
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register('lgd-trust', 'en', {
          'title': 'LGD Trust',
          'evaluated': 'evaluated',
          'nv': 'NV (not verified)',
          'lowest': 'Lowest scores',
          'expand': 'Details', 'collapse': 'Hide',
          'refresh': 'Refresh', 'error': 'Snapshot unavailable',
          'policy': 'Read-only · E2 = author-reproducible · NV is never a pass',
        }));
        ctx.effect(() => ctx.locale.register('lgd-trust', 'zh', {
          'title': 'LGD 信任面板',
          'evaluated': '已评测',
          'nv': 'NV（未验证）',
          'lowest': '最低分',
          'expand': '详情', 'collapse': '收起',
          'refresh': '刷新', 'error': '快照不可用',
          'policy': '只读 · E2=作者可复现 · NV 不等于通过',
        }));
        const t = ctx.locale.bind('lgd-trust');
        ctx.slots.inject('conversation.input.dock', () =>
          ctx.slots.register(
            { name: 'conversation.input.dock', id: 'lgd-trust', order: 16 },
            () => h(TrustPanel, { t }),
          ),
        );
      },
    };
  },
});
