function toggleFilters() {
  const extra = document.querySelectorAll('.filter-extra');
  const btn = document.getElementById('toggleFilterBtn');
  const expanded = btn.dataset.expanded === '1';
  extra.forEach(el => el.classList.toggle('hidden', expanded));
  btn.dataset.expanded = expanded ? '0' : '1';
  btn.textContent = expanded ? '展开' : '收起';
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
  if (document.querySelector('.sticky-nav')) bindStickyNav();
});
