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
  const nr = Math.round(r + (255 - r) * ratio);
  const ng = Math.round(g + (255 - g) * ratio);
  const nb = Math.round(b + (255 - b) * ratio);
  return [nr, ng, nb];
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

      // 过滤近白与近黑，优先提取 logo 主色
      if ((r > 240 && g > 240 && b > 240) || (r < 20 && g < 20 && b < 20)) continue;

      const qr = Math.round(r / 20) * 20;
      const qg = Math.round(g / 20) * 20;
      const qb = Math.round(b / 20) * 20;
      const key = `${qr},${qg},${qb}`;
      buckets.set(key, (buckets.get(key) || 0) + 1);
    }

    if (!buckets.size) return;
    const [top] = [...buckets.entries()].sort((a, b) => b[1] - a[1]);
    const [pr, pg, pb] = top[0].split(',').map(Number);
    const [sr, sg, sb] = mixWithWhite(pr, pg, pb, 0.88);
    const [br, bg, bb] = mixWithWhite(pr, pg, pb, 0.95);

    const root = document.documentElement;
    root.style.setProperty('--primary', rgbToHex(pr, pg, pb));
    root.style.setProperty('--primary-soft', rgbToHex(sr, sg, sb));
    root.style.setProperty('--bg', rgbToHex(br, bg, bb));
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

function confirmToggle(name, action) {
  alert(`是否${action}该企业：${name}`);
}

function resubmit(id) {
  alert(`企业 ${id} 已重新提交审核，状态变更为：待审核（mock）`);
}

window.addEventListener('DOMContentLoaded', () => {
  applyBrandPaletteFromLogo();
  if (document.querySelector('.sticky-nav')) bindStickyNav();
});
