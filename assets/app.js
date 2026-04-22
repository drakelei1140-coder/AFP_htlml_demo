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

const GLOBAL_SIDEBAR_MENU = [
  {
    title: '商户管理',
    items: [
      { text: '企业管理', href: 'enterprise-list.html' },
      { text: '商铺管理', href: 'shop-list.html' },
      { text: '商户审核', href: 'merchant-list.html' },
      { text: '群组管理', href: 'group-management.html' },
      { text: '已签约商户', href: 'signed-merchants.html' },
      { text: '取消签约商户', href: 'cancelled-merchants.html' },
      { text: '拒绝签约商户', href: 'rejected-merchants.html' },
      {
        text: '资料修改待审核',
        children: [
          { text: '企业资料修改待审核', href: 'enterprise-change-review.html' },
          { text: '商铺资料修改待审核', href: 'shop-change-review.html' },
          { text: '商户资料修改待审核', href: 'merchant-change-review.html' }
        ]
      },
      { text: '终端设备申请/回收单审批', href: 'terminal-approval.html' },
      { text: '商户进件', href: 'merchant-onboarding.html' },
      { text: 'AFP 字段映射配置', href: 'afp-mapping.html' }
    ]
  },
  {
    title: '合约管理',
    items: [
      { text: '已生成的合约', href: 'generated-contracts.html' },
      { text: '合约字段映射配置', href: 'contract-mapping.html' }
    ]
  },
  {
    title: '其他模块',
    items: [
      { text: 'O/S补件', href: 'os-supplement.html' },
      { text: '通道管理', href: 'channel-management.html' }
    ]
  }
];

function renderGlobalSidebar(containerId = 'appSidebar', activeHref = '') {
  const container = document.getElementById(containerId);
  if (!container) return;

  const html = GLOBAL_SIDEBAR_MENU.map(group => {
    const rows = group.items.map(item => {
      if (item.children) {
        const children = item.children
          .map(child => `<a class="lvl3 ${child.href === activeHref ? 'active' : ''}" href="${child.href}">${child.text}</a>`)
          .join('');
        return `<li><div>${item.text}</div>${children}</li>`;
      }
      const isActive = item.href === activeHref;
      return `<li><a ${isActive ? 'class="active"' : ''} href="${item.href}">${item.text}</a></li>`;
    }).join('');
    return `<div class="menu-group"><div class="menu-title">${group.title}</div><ul class="menu-list">${rows}</ul></div>`;
  }).join('');

  container.innerHTML = html;
}

window.addEventListener('DOMContentLoaded', () => {
  applyBrandPaletteFromLogo();
  bindMultiSelect();
  bindPersonTables();
  initGroupRelationPickers();
  if (document.querySelector('.sticky-nav')) bindStickyNav();
});


const GROUP_STORE_KEY = 'afp_group_demo_store_v1';

function nowText() {
  const d = new Date();
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

function seedGroupStore() {
  return {
    groups: [
      { id: 'GRP-HK-340211', name: '跨境电商', region: '香港', objectType: 'enterprise', usageType: 'analytics', status: 'enabled', sortNo: 10, remark: '重点跟踪跨境业务', createdBy: 'Olivia', createdAt: '2026-01-08 09:11:00', updatedBy: 'Olivia', updatedAt: '2026-04-15 10:20:00' },
      { id: 'GRP-HK-700112', name: '重点商户', region: '香港', objectType: 'enterprise', usageType: 'operations', status: 'disabled', sortNo: 20, remark: '核心高GMV企业', createdBy: 'Aaron', createdAt: '2026-01-12 16:10:00', updatedBy: 'Aaron', updatedAt: '2026-04-20 12:08:00' },
      { id: 'GRP-HK-210088', name: '线下旗舰店', region: '香港', objectType: 'store', usageType: 'analytics', status: 'enabled', sortNo: 15, remark: '门店经营标杆', createdBy: 'Mina', createdAt: '2026-02-02 12:00:00', updatedBy: 'Mina', updatedAt: '2026-04-14 09:20:00' },
      { id: 'GRP-HK-990123', name: '夜间营业门店', region: '香港', objectType: 'store', usageType: 'custom', status: 'disabled', sortNo: 30, remark: '营运时段标识', createdBy: 'Mina', createdAt: '2026-02-10 08:00:00', updatedBy: 'Olivia', updatedAt: '2026-04-19 21:30:00' },
      { id: 'GRP-SG-338001', name: '新加坡重点观察', region: '新加坡', objectType: 'enterprise', usageType: 'operations', status: 'enabled', sortNo: 5, remark: '新市场策略分层', createdBy: 'Jay', createdAt: '2026-03-01 10:10:00', updatedBy: 'Jay', updatedAt: '2026-04-17 15:22:00' }
    ],
    enterpriseRelations: [
      { relationId: 'ER-1', enterpriseId: 'CID-2026-0004', groupId: 'GRP-HK-340211', createdBy: 'Olivia', createdAt: '2026-02-01 10:00:00' },
      { relationId: 'ER-2', enterpriseId: 'CID-2026-0004', groupId: 'GRP-HK-700112', createdBy: 'Olivia', createdAt: '2026-02-03 12:00:00' }
    ],
    storeRelations: [
      { relationId: 'SR-1', storeId: 'SID-3001', groupId: 'GRP-HK-210088', createdBy: 'Olivia', createdAt: '2026-02-05 11:00:00' },
      { relationId: 'SR-2', storeId: 'SID-3001', groupId: 'GRP-HK-990123', createdBy: 'Olivia', createdAt: '2026-02-18 09:00:00' }
    ],
    timelineLogs: [
      { logId: 'LOG-1', groupId: 'GRP-HK-340211', actionType: '创建群组', fieldName: 'all', oldValue: '', newValue: '创建群组', operator: 'Olivia', operatedAt: '2026-01-08 09:11:00' },
      { logId: 'LOG-2', groupId: 'GRP-HK-700112', actionType: '停用', fieldName: 'status', oldValue: '启用', newValue: '停用', operator: 'Aaron', operatedAt: '2026-04-20 12:08:00' },
      { logId: 'LOG-3', groupId: 'GRP-HK-990123', actionType: '停用', fieldName: 'status', oldValue: '启用', newValue: '停用', operator: 'Olivia', operatedAt: '2026-04-19 21:30:00' }
    ]
  };
}

function getGroupStore() {
  try {
    const parsed = JSON.parse(localStorage.getItem(GROUP_STORE_KEY) || 'null');
    if (parsed && parsed.groups) return parsed;
  } catch (_) {}
  const seeded = seedGroupStore();
  localStorage.setItem(GROUP_STORE_KEY, JSON.stringify(seeded));
  return seeded;
}

function saveGroupStore(store) {
  localStorage.setItem(GROUP_STORE_KEY, JSON.stringify(store));
}

function usageTypeLabel(v) {
  return ({ analytics: '统计分析', operations: '运营处理', custom: '其他 / 自定义' })[v] || '-';
}

function objectTypeLabel(v) {
  return v === 'enterprise' ? '企业' : '商铺';
}

function statusBadge(v) {
  return v === 'enabled' ? '<span class="badge success">启用</span>' : '<span class="badge warning">停用</span>';
}

function randomGroupId(region) {
  const code = ({ 香港: 'HK', 澳门: 'MO', 新加坡: 'SG' })[region] || 'OT';
  return `GRP-${code}-${Math.floor(Math.random() * 900000 + 100000)}`;
}

function appendTimeline(store, payload) {
  store.timelineLogs.push({ logId: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`, ...payload });
}

function initGroupManagementPage() {
  const page = document.getElementById('groupPage');
  if (!page) return;

  const refs = {
    filterRegion: document.getElementById('filterRegion'),
    filterId: document.getElementById('filterId'),
    filterName: document.getElementById('filterName'),
    filterObjectType: document.getElementById('filterObjectType'),
    filterUsageType: document.getElementById('filterUsageType'),
    filterStatus: document.getElementById('filterStatus'),
    tableBody: document.getElementById('groupTableBody'),
    formDialog: document.getElementById('groupFormDialog'),
    timelineDialog: document.getElementById('timelineDialog')
  };

  let editingId = '';

  const renderTable = () => {
    const store = getGroupStore();
    const filters = {
      region: refs.filterRegion.value,
      id: refs.filterId.value.trim(),
      name: refs.filterName.value.trim().toLowerCase(),
      objectType: refs.filterObjectType.value,
      usageType: refs.filterUsageType.value,
      status: refs.filterStatus.value
    };

    const rows = store.groups.filter(g => {
      if (filters.region && g.region !== filters.region) return false;
      if (filters.id && !g.id.toLowerCase().includes(filters.id.toLowerCase())) return false;
      if (filters.name && !g.name.toLowerCase().includes(filters.name)) return false;
      if (filters.objectType && g.objectType !== filters.objectType) return false;
      if (filters.usageType && g.usageType !== filters.usageType) return false;
      if (filters.status && g.status !== filters.status) return false;
      return true;
    }).sort((a, b) => a.sortNo - b.sortNo);

    refs.tableBody.innerHTML = rows.map(g => `
      <tr>
        <td>${g.id}</td>
        <td>${g.name}</td>
        <td>${g.region}</td>
        <td>${objectTypeLabel(g.objectType)}</td>
        <td>${usageTypeLabel(g.usageType)}</td>
        <td>${statusBadge(g.status)}</td>
        <td>${g.remark || '-'}</td>
        <td>${g.createdBy}</td>
        <td>${g.createdAt}</td>
        <td>${g.updatedBy}</td>
        <td>${g.updatedAt}</td>
        <td class="ops">
          <button class="btn link" data-action="edit" data-id="${g.id}">编辑</button>
          <button class="btn link" data-action="toggle" data-id="${g.id}">${g.status === 'enabled' ? '停用' : '启用'}</button>
          <button class="btn link" data-action="delete" data-id="${g.id}">删除</button>
          <button class="btn link" data-action="timeline" data-id="${g.id}">查看时间轴</button>
        </td>
      </tr>`).join('');
  };

  const openForm = group => {
    editingId = group?.id || '';
    document.getElementById('groupDialogTitle').textContent = group ? '编辑群组' : '新增群组';
    document.getElementById('groupIdInput').value = group?.id || '保存后自动生成';
    document.getElementById('groupRegion').value = group?.region || '';
    document.getElementById('groupObjectType').value = group?.objectType || '';
    document.getElementById('groupName').value = group?.name || '';
    document.getElementById('groupUsageType').value = group?.usageType || '';
    document.getElementById('groupSortNo').value = group?.sortNo ?? 100;
    document.getElementById('groupRemark').value = group?.remark || '';
    document.getElementById('groupStatus').value = group?.status || 'enabled';

    document.getElementById('groupRegion').disabled = !!group;
    document.getElementById('groupObjectType').disabled = !!group;
    refs.formDialog.showModal();
  };

  const closeForm = () => refs.formDialog.close();

  const renderTimeline = groupId => {
    const store = getGroupStore();
    const group = store.groups.find(g => g.id === groupId);
    const logs = store.timelineLogs.filter(l => l.groupId === groupId).sort((a, b) => b.operatedAt.localeCompare(a.operatedAt));
    document.getElementById('timelineTitle').textContent = `群组时间轴 · ${group?.name || groupId}`;
    document.getElementById('groupTimeline').innerHTML = logs.length ? logs.map(log => `
      <div class="item">
        <div class="title">${log.actionType}</div>
        <div class="meta">${log.operatedAt} · ${log.operator}</div>
        <div class="summary">${log.fieldName === 'all' ? '创建群组' : `${log.fieldName}: ${log.oldValue || '-'} → ${log.newValue || '-'}`}</div>
      </div>
    `).join('') : '<p class="desc">暂无时间轴记录</p>';
    refs.timelineDialog.showModal();
  };

  page.addEventListener('click', e => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const id = btn.dataset.id;
    const store = getGroupStore();
    const group = store.groups.find(g => g.id === id);
    if (!group) return;

    if (action === 'edit') openForm(group);
    if (action === 'timeline') renderTimeline(id);
    if (action === 'toggle') {
      const next = group.status === 'enabled' ? 'disabled' : 'enabled';
      const actionText = next === 'enabled' ? '启用' : '停用';
      if (!confirm(`确认${actionText}群组「${group.name}」吗？`)) return;
      group.status = next;
      group.updatedAt = nowText();
      group.updatedBy = 'Olivia';
      appendTimeline(store, {
        groupId: id,
        actionType: actionText,
        fieldName: 'status',
        oldValue: next === 'enabled' ? '停用' : '启用',
        newValue: next === 'enabled' ? '启用' : '停用',
        operator: 'Olivia',
        operatedAt: nowText()
      });
      saveGroupStore(store);
      alert(`群组已${actionText}`);
      renderTable();
    }
    if (action === 'delete') {
      if (!confirm(`确认删除群组「${group.name}」吗？该操作不可恢复。`)) return;
      const linked = store.enterpriseRelations.some(r => r.groupId === id) || store.storeRelations.some(r => r.groupId === id);
      if (linked) {
        alert('当前群组已存在关联数据，不能删除，请先解除关联或改为停用');
        return;
      }
      store.groups = store.groups.filter(g => g.id !== id);
      saveGroupStore(store);
      alert('群组已删除');
      renderTable();
    }
  });

  document.getElementById('queryGroupBtn').addEventListener('click', renderTable);
  document.getElementById('resetGroupBtn').addEventListener('click', () => {
    refs.filterRegion.value = '';
    refs.filterId.value = '';
    refs.filterName.value = '';
    refs.filterObjectType.value = '';
    refs.filterUsageType.value = '';
    refs.filterStatus.value = '';
    renderTable();
  });
  document.getElementById('addGroupBtn').addEventListener('click', () => openForm());
  document.getElementById('cancelGroupFormBtn').addEventListener('click', closeForm);
  document.getElementById('closeTimelineBtn').addEventListener('click', () => refs.timelineDialog.close());

  document.getElementById('saveGroupBtn').addEventListener('click', () => {
    const region = document.getElementById('groupRegion').value;
    const objectType = document.getElementById('groupObjectType').value;
    const name = document.getElementById('groupName').value.trim();
    const usageType = document.getElementById('groupUsageType').value;
    const sortNo = Number(document.getElementById('groupSortNo').value || 100);
    const remark = document.getElementById('groupRemark').value.trim();
    const status = document.getElementById('groupStatus').value;

    if (!region || !objectType || !name || !usageType) {
      alert('请完整填写地区、对象类型、群组名称、用途分类等必填字段');
      return;
    }

    const store = getGroupStore();
    const duplicated = store.groups.some(g => g.name.toLowerCase() === name.toLowerCase() && g.id !== editingId);
    if (duplicated) {
      alert('群组名称已存在，请修改后重试');
      return;
    }

    if (!editingId) {
      const id = randomGroupId(region);
      const newGroup = {
        id,
        name,
        region,
        objectType,
        usageType,
        status,
        sortNo,
        remark,
        createdBy: 'Olivia',
        createdAt: nowText(),
        updatedBy: 'Olivia',
        updatedAt: nowText()
      };
      store.groups.push(newGroup);
      appendTimeline(store, { groupId: id, actionType: '创建群组', fieldName: 'all', oldValue: '', newValue: '创建群组', operator: 'Olivia', operatedAt: nowText() });
      saveGroupStore(store);
      closeForm();
      renderTable();
      alert('新增成功');
      return;
    }

    const target = store.groups.find(g => g.id === editingId);
    if (!target) return;

    const changes = [
      ['群组名称', target.name, name, '修改群组名称', 'name'],
      ['用途分类', usageTypeLabel(target.usageType), usageTypeLabel(usageType), '修改用途分类', 'usageType'],
      ['备注', target.remark || '-', remark || '-', '修改备注', 'remark'],
      ['状态', target.status === 'enabled' ? '启用' : '停用', status === 'enabled' ? '启用' : '停用', status === 'enabled' ? '启用' : '停用', 'status']
    ].filter(item => item[1] !== item[2]);

    target.name = name;
    target.usageType = usageType;
    target.sortNo = sortNo;
    target.remark = remark;
    target.status = status;
    target.updatedBy = 'Olivia';
    target.updatedAt = nowText();

    changes.forEach(([label, oldV, newV, actionType, fieldName]) => {
      appendTimeline(store, { groupId: target.id, actionType, fieldName: label, oldValue: oldV, newValue: newV, operator: 'Olivia', operatedAt: nowText() });
    });

    saveGroupStore(store);
    closeForm();
    renderTable();
    alert('编辑成功');
  });

  renderTable();
}

function initGroupRelationPickers() {
  const pickers = document.querySelectorAll('.group-picker');
  if (!pickers.length) return;
  const store = getGroupStore();

  pickers.forEach((node, index) => {
    const objectType = node.dataset.objectType;
    const region = node.dataset.region || '香港';
    const selected = new Set((node.dataset.selected || '').split(',').filter(Boolean));

    const candidateGroups = store.groups.filter(g => g.region === region && g.objectType === objectType && (g.status === 'enabled' || selected.has(g.id)));

    const wrap = document.createElement('div');
    wrap.className = 'ant-select openable';
    wrap.innerHTML = `<div class="ant-select-values"></div><span class="ant-select-arrow">▼</span><div class="ant-select-dropdown"></div>`;
    node.appendChild(wrap);

    const valuesEl = wrap.querySelector('.ant-select-values');
    const dropdown = wrap.querySelector('.ant-select-dropdown');

    const updateHidden = () => { hidden.value = [...selected].join(','); };

    function render() {
      dropdown.innerHTML = candidateGroups.map(g => {
        const checked = selected.has(g.id) ? 'checked' : '';
        const disabled = g.status !== 'enabled' && !selected.has(g.id);
        return `<label class="ant-option ${disabled ? 'disabled' : ''}"><input type="checkbox" value="${g.id}" ${checked} ${disabled ? 'disabled' : ''}>${g.name}${g.status !== 'enabled' ? ' <small>（已停用）</small>' : ''}</label>`;
      }).join('');

      const selectedGroups = candidateGroups.filter(g => selected.has(g.id));
      valuesEl.innerHTML = selectedGroups.length ? selectedGroups.map(g => `<span class="ant-tag ${g.status !== 'enabled' ? 'disabled' : ''}">${g.name}${g.status !== 'enabled' ? '（已停用）' : ''}<span class="x" data-id="${g.id}">×</span></span>`).join('') : `<span class="ant-select-placeholder">请选择${objectType === 'enterprise' ? '企业' : '商铺'}群组</span>`;

      valuesEl.querySelectorAll('.x').forEach(x => x.addEventListener('click', e => {
        e.stopPropagation();
        selected.delete(x.dataset.id);
        render();
      }));

      dropdown.querySelectorAll('input[type="checkbox"]').forEach(input => {
        input.addEventListener('change', () => {
          if (input.checked) selected.add(input.value);
          else selected.delete(input.value);
          render();
        });
      });

      updateHidden();
    }

    wrap.addEventListener('click', e => {
      if (e.target.closest('.ant-select-dropdown')) return;
      wrap.classList.toggle('open');
    });
    document.addEventListener('click', e => {
      if (!wrap.contains(e.target)) wrap.classList.remove('open');
    });

    const hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.name = `groupRelation-${index}`;
    node.appendChild(hidden);

    render();
  });
}
