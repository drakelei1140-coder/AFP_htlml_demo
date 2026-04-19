function toggleFilters() {
  const extra = document.querySelectorAll('.filter-extra');
  const btn = document.getElementById('toggleFilterBtn');
  const expanded = btn.dataset.expanded === '1';
  extra.forEach(el => el.classList.toggle('hidden', expanded));
  btn.dataset.expanded = expanded ? '0' : '1';
  btn.textContent = expanded ? '展开' : '收起';
}

function rgbToHex(r, g, b) {
  return `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`;
}

function mixWithWhite(r, g, b, ratio = 0.85) {
  return [
    Math.round(r + (255 - r) * ratio),
    Math.round(g + (255 - g) * ratio),
    Math.round(b + (255 - b) * ratio)
  ];
}

function mixWithBlack(r, g, b, ratio = 0.2) {
  return [
    Math.round(r * (1 - ratio)),
    Math.round(g * (1 - ratio)),
    Math.round(b * (1 - ratio))
  ];
}

function rotateRgb(r, g, b, dr, dg, db) {
  return [
    Math.max(0, Math.min(255, r + dr)),
    Math.max(0, Math.min(255, g + dg)),
    Math.max(0, Math.min(255, b + db))
  ];
}

function applyBrandPaletteFromLogo() {
  const img = new Image();
  img.src = 'logo.jpg';

  img.onload = () => {
    const canvas = document.createElement('canvas');
    const size = 72;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(img, 0, 0, size, size);
    const { data } = ctx.getImageData(0, 0, size, size);
    const buckets = new Map();

    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3];
      if (a < 200) continue;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      if ((r > 240 && g > 240 && b > 240) || (r < 20 && g < 20 && b < 20)) continue;

      const qr = Math.round(r / 18) * 18;
      const qg = Math.round(g / 18) * 18;
      const qb = Math.round(b / 18) * 18;
      const key = `${qr},${qg},${qb}`;
      buckets.set(key, (buckets.get(key) || 0) + 1);
    }

    if (!buckets.size) return;
    const [top] = [...buckets.entries()].sort((a, b) => b[1] - a[1]);
    const [pr, pg, pb] = top[0].split(',').map(Number);

    const [pdr, pdg, pdb] = mixWithBlack(pr, pg, pb, 0.2);
    const [psr, psg, psb] = mixWithWhite(pr, pg, pb, 0.84);
    const [pgr, pgg, pgb] = mixWithWhite(pr, pg, pb, 0.92);
    const [bgr, bgg, bgb] = mixWithWhite(pr, pg, pb, 0.95);

    // 从 logo 主色衍生不同语义色，确保全站不再使用默认蓝色语义
    const [sr, sg, sb] = rotateRgb(pr, pg, pb, -28, 12, -22);
    const [wr, wg, wb] = rotateRgb(pr, pg, pb, 18, -6, -28);
    const [dr, dg, db] = rotateRgb(pr, pg, pb, 20, -26, -20);

    const root = document.documentElement;
    root.style.setProperty('--primary', rgbToHex(pr, pg, pb));
    root.style.setProperty('--primary-dark', rgbToHex(pdr, pdg, pdb));
    root.style.setProperty('--primary-soft', rgbToHex(psr, psg, psb));
    root.style.setProperty('--primary-ghost', rgbToHex(pgr, pgg, pgb));
    root.style.setProperty('--bg', rgbToHex(bgr, bgg, bgb));

    root.style.setProperty('--success', rgbToHex(sr, sg, sb));
    root.style.setProperty('--success-soft', rgbToHex(...mixWithWhite(sr, sg, sb, 0.86)));
    root.style.setProperty('--warning', rgbToHex(wr, wg, wb));
    root.style.setProperty('--warning-soft', rgbToHex(...mixWithWhite(wr, wg, wb, 0.86)));
    root.style.setProperty('--danger', rgbToHex(dr, dg, db));
    root.style.setProperty('--danger-soft', rgbToHex(...mixWithWhite(dr, dg, db, 0.86)));
  };
}

function bindStickyNav() {
  const tags = document.querySelectorAll('.nav-tag[data-target]');
  const sections = Array.from(tags)
    .map(t => document.getElementById(t.dataset.target))
    .filter(Boolean);

  tags.forEach(tag => tag.addEventListener('click', () => {
    const target = document.getElementById(tag.dataset.target);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));

  const onScroll = () => {
    let current = sections[0]?.id;
    sections.forEach(sec => {
      const top = sec.getBoundingClientRect().top;
      if (top <= 180) current = sec.id;
    });
    tags.forEach(tag => tag.classList.toggle('active', tag.dataset.target === current));
  };
  window.addEventListener('scroll', onScroll);
  onScroll();
}

function bindMultiSelect() {
  document.querySelectorAll('.ant-select[data-multiple="true"]').forEach(select => {
    const valuesEl = select.querySelector('.ant-select-values');
    const options = Array.from(select.querySelectorAll('.ant-option input[type="checkbox"]'));

    const render = () => {
      const selected = options.filter(o => o.checked).map(o => o.value);
      if (!selected.length) {
        valuesEl.innerHTML = '<span class="ant-select-placeholder">请选择服务通道</span>';
      } else {
        valuesEl.innerHTML = selected
          .map(v => `<span class="ant-tag">${v}<span class="x" data-val="${v}">×</span></span>`)
          .join('');

        valuesEl.querySelectorAll('.x').forEach(x => {
          x.addEventListener('click', e => {
            e.stopPropagation();
            const target = options.find(o => o.value === x.dataset.val);
            if (target) target.checked = false;
            render();
          });
        });
      }
    };

    select.addEventListener('click', e => {
      if (e.target.closest('.ant-select-dropdown')) return;
      select.classList.toggle('open');
    });

    options.forEach(o => o.addEventListener('change', render));

    document.addEventListener('click', e => {
      if (!select.contains(e.target)) select.classList.remove('open');
    });

    render();
  });
}

function bindPersonTables() {
  document.querySelectorAll('.person-table').forEach(table => {
    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    const bindRowEvents = row => {
      row.querySelectorAll('.delete-person').forEach(btn => {
        btn.addEventListener('click', () => {
          if (!confirm('确认删除该相关人员吗？')) return;
          row.remove();
        });
      });
    };

    tbody.querySelectorAll('tr').forEach(bindRowEvents);

    const addBtn = table.parentElement.querySelector('.add-person-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        const now = new Date().toISOString().slice(0, 10);
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><input placeholder="人员姓名" /></td>
          <td>
            <select>
              <option>法人</option>
              <option>负责人</option>
              <option>财务联系人</option>
              <option>运营联系人</option>
            </select>
          </td>
          <td><input placeholder="+852-xxxx-xxxx" /></td>
          <td><input placeholder="name@company.com" /></td>
          <td><select><option>身份证</option><option>护照</option><option>商业登记证</option></select></td>
          <td><input placeholder="证件号码" /></td>
          <td><input type="radio" name="${table.id}-default" /></td>
          <td>${now}</td>
          <td class="ops"><button class="btn link">编辑</button><button class="btn link delete-person">删除</button></td>
        `;
        tbody.appendChild(tr);
        bindRowEvents(tr);
      });
    }
  });
}

function confirmToggle(name, action) {
  alert(`是否${action}该企业：${name}`);
}

function resubmit(id) {
  alert(`企业 ${id} 已重新提交审核，状态变更为：待审核（mock）`);
}

window.addEventListener('DOMContentLoaded', () => {
  applyBrandPaletteFromLogo();
  bindMultiSelect();
  bindPersonTables();
  if (document.querySelector('.sticky-nav')) bindStickyNav();
});
