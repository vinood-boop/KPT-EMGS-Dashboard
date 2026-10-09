const APPLICATION_STATUSES = ['New Application', 'Documents Required', 'Req. Document Submitted', 'Approved', 'Rejected', 'Withdrawn'];
const navLinks = document.querySelectorAll("[data-view-link]");
const viewPanels = document.querySelectorAll("[data-view]");
const pageTitle = document.querySelector(".top-title h1");
const resetDemo = document.querySelector(".reset-btn");
const searchForm = document.querySelector("#searchForm");
const topSearch = document.querySelector("#searchForm input");
const logoutButton = document.querySelector("#logoutButton");
const auditBody = document.querySelector("#auditTable tbody");
const confirmModal = document.querySelector("#confirmModal");
const confirmTitle = document.querySelector("#confirmTitle");
const confirmMessage = document.querySelector("#confirmMessage");
const closeConfirm = document.querySelector("#closeConfirm");
const cancelConfirm = document.querySelector("#cancelConfirm");
const applyConfirm = document.querySelector("#applyConfirm");
const detailModal = document.querySelector("#detailModal");
const detailTitle = document.querySelector("#detailTitle");
const detailBody = document.querySelector("#detailBody");
const closeDetail = document.querySelector("#closeDetail");
const closeDetailAction = document.querySelector("#closeDetailAction");
const clarificationModal = document.querySelector("#clarificationModal");
const closeClarification = document.querySelector("#closeClarification");
const cancelClarification = document.querySelector("#cancelClarification");
const sendClarification = document.querySelector("#sendClarification");
const clarificationMessage = document.querySelector("#clarificationMessage");
const userModal = document.querySelector("#userModal");
const userModalTitle = document.querySelector("#userModalTitle");
const closeUserModal = document.querySelector("#closeUserModal");
const cancelUserModal = document.querySelector("#cancelUserModal");
const saveUserModal = document.querySelector("#saveUserModal");
const userName = document.querySelector("#userName");
const userEmail = document.querySelector("#userEmail");
const userLogin = document.querySelector("#userLogin");
const userPassword = document.querySelector("#userPassword");
const userRole = document.querySelector("#userRole");
const userStatus = document.querySelector("#userStatus");
const notificationButton = document.querySelector("#notificationButton");
const notificationPanel = document.querySelector("#notificationPanel");
const notificationCount = document.querySelector("#notificationCount");
const notificationSummary = document.querySelector("#notificationSummary");
const markNotificationsRead = document.querySelector("#markNotificationsRead");
const universityDetailName = document.querySelector("#universityDetailName");
const universityDetailMeta = document.querySelector("#universityDetailMeta");
const universityDetailStatus = document.querySelector("#universityDetailStatus");
const universityOverview = document.querySelector("#universityOverview");
const universitiesSplitLayout = document.querySelector("#universitiesSplitLayout");
const universitySidePanel = document.querySelector("#universitySidePanel");
const programmesSplitLayout = document.querySelector("#programmesSplitLayout");
const programmeSidePanel = document.querySelector("#programmeSidePanel");
const applicationsSplitLayout = document.querySelector("#applicationsSplitLayout");
const applicationSidePanel = document.querySelector("#applicationSidePanel");

document.querySelectorAll('[data-table="universities"] tbody tr').forEach((row, index) => {
  syncUniversityCounts(row);
  seedUniversityProfile(row, index);
});
seedDashboardExpansion();
seedUniversityApplicants();
seedDashboardNotifications();
const initialTables = new Map([...document.querySelectorAll(".recent-table tbody")].map((body) => [body, body.innerHTML]));
const initialAuditHtml = auditBody?.innerHTML || "";
const initialNotificationHtml = notificationPanel?.querySelector(".notification-list")?.innerHTML || "";
let pendingAction = null;
let editingUserRow = null;
let activeUniversityRow = null;
let activeProgrammeRow = null;
let activeApplicationRow = null;

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setActiveView(viewName) {
  if (viewName === "universities/detail") viewName = "universities";
  const labels = {
    dashboard: "Dashboard",
    universities: "Universities",
    "university-detail": "Universities",
    "university-create": "Add new university",
    programmes: "Programme Approvals",
    applications: "Applications",
    administration: "Administration",
    audit: "Audit Log",
    help: "Help & Support",
    settings: "Settings"
  };
  if (viewName === 'help' && document.querySelector('#hideHelpSupport')?.checked) {
    viewName = 'settings';
    history.replaceState(null, '', '#settings');
  }
  if (!labels[viewName]) viewName = "dashboard";
  const navView = ["university-detail", "university-create"].includes(viewName) ? "universities" : viewName;
  navLinks.forEach((link) => link.classList.toggle("active", link.dataset.viewLink === navView));
  viewPanels.forEach((panel) => panel.classList.toggle("active", panel.dataset.view === viewName));
  if (pageTitle) pageTitle.textContent = labels[viewName] || "Dashboard";
  if (viewName === "dashboard") renderDashboardData();
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

function currentTimestamp() {
  const now = new Date();
  const date = now.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const time = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  return `${date}, ${time}`;
}

function addAudit(action, entity, user = "Farah Kamil") {
  if (!auditBody) return;
  const row = document.createElement("tr");
  row.innerHTML = `<td>${currentTimestamp()}</td><td>${user}</td><td>${action}</td><td>${entity}</td>`;
  auditBody.prepend(row);
  filterAudit();
}

function openConfirm(title, message, action, label = "Confirm", cancelLabel = "Cancel") {
  pendingAction = action;
  if (confirmTitle) confirmTitle.textContent = title;
  if (confirmMessage) confirmMessage.textContent = message;
  if (applyConfirm) applyConfirm.textContent = label;
  if (cancelConfirm) cancelConfirm.textContent = cancelLabel;
  if (confirmModal) confirmModal.hidden = false;
}

function closeConfirmModal() {
  pendingAction = null;
  if (confirmModal) confirmModal.hidden = true;
}

function openDetail(title, html) {
  if (detailTitle) detailTitle.textContent = title;
  if (detailBody) detailBody.innerHTML = html;
  if (detailModal) detailModal.hidden = false;
}

function closeDetailModal() {
  if (detailModal) detailModal.hidden = true;
}

function openClarificationForm() {
  if (clarificationMessage) { clarificationMessage.value = ""; clarificationMessage.setCustomValidity(""); }
  if (clarificationModal) clarificationModal.hidden = false;
  setTimeout(() => clarificationMessage?.focus(), 0);
}

function closeClarificationForm() {
  if (clarificationModal) clarificationModal.hidden = true;
}

function statusChip(label, color) {
  return `<span class="status-chip ${color}">${label}</span>`;
}

function getRowTitle(row) {
  return row?.querySelector(".table-record-name, strong")?.textContent.trim() || row?.children[0]?.childNodes[0]?.textContent.trim() || "Selected record";
}

function rowDetails(row) {
  return [...row.children].slice(0, -1).map((cell, index) => {
    const heading = row.closest("table")?.tHead?.rows[0]?.children[index]?.textContent.trim() || "Field";
    return `<div><small>${heading}</small><strong>${cell.textContent.trim()}</strong></div>`;
  }).join("");
}

function addNotification(title, message, target = "audit") {
  const list = notificationPanel?.querySelector(".notification-list");
  if (!list) return;
  const item = document.createElement("button");
  item.className = "notification-item unread";
  item.type = "button";
  item.dataset.notificationTarget = target === "users" ? "administration" : target;
  item.dataset.defaultUnread = "false";
  item.innerHTML = `<strong>${title}</strong><span>${message}</span><small>Just now</small>`;
  list.prepend(item);
  updateNotificationCount();
}

function updateNotificationCount() {
  const unread = document.querySelectorAll(".notification-item.unread").length;
  if (notificationCount) {
    notificationCount.textContent = String(unread);
    notificationCount.hidden = unread === 0;
  }
  if (notificationSummary) notificationSummary.textContent = unread ? `${unread} unread updates` : "All caught up";
}

function closeNotificationsPanel() {
  if (notificationPanel) notificationPanel.hidden = true;
  if (notificationButton) notificationButton.setAttribute("aria-expanded", "false");
  document.body.classList.remove("notification-open");
}

function toggleNotificationsPanel() {
  if (!notificationPanel || !notificationButton) return;
  const open = notificationPanel.hidden;
  notificationPanel.hidden = !open;
  notificationButton.setAttribute("aria-expanded", String(open));
  document.body.classList.toggle("notification-open", open);
}

function applyTextFilter(tableName, searchSelector, statusSelector, extraSelector) {
  const table = document.querySelector(`[data-table="${tableName}"]`);
  if (!table) return;
  const query = (document.querySelector(searchSelector)?.value || "").trim().toLowerCase();
  const statusValue = (document.querySelector(statusSelector)?.value || "").toLowerCase();
  const extraValue = extraSelector ? (document.querySelector(extraSelector)?.value || "").toLowerCase() : "";
  [...table.tBodies[0].rows].forEach((row) => {
    const textMatch = !query || row.textContent.toLowerCase().includes(query);
    const statusMatch = statusValue.startsWith("all") || statusValue.startsWith("any") || row.dataset.status === statusValue || row.dataset.stage === statusValue;
    const ageThreshold = tableName === "programmes" && /^over (7|14) days$/.test(extraValue) ? Number.parseInt(extraValue.slice(5), 10) : null;
    const extraMatch = ageThreshold !== null ? Number.parseInt(row.children[5]?.textContent, 10) > ageThreshold : !extraSelector || extraValue.startsWith("all") || extraValue.startsWith("any") || row.dataset.compliance === extraValue || row.dataset.nationality === extraValue || row.dataset.type === extraValue || row.dataset.age === extraValue;
    row.hidden = !(textMatch && statusMatch && extraMatch);
  });
}

function applicationAgeValue(row) {
  const value = row?.dataset.actionAge || "";
  const number = Number.parseInt(value, 10);
  return Number.isFinite(number) ? number : null;
}

function filterApplications() {
  const table = document.querySelector('[data-table="applications"]');
  if (!table) return;
  const query = (document.querySelector("#applicationSearch")?.value || "").trim().toLowerCase();
  const stageValue = (document.querySelector("#applicationStageFilter")?.value || "").toLowerCase();
  const nationalityValue = (document.querySelector("#applicationNationalityFilter")?.value || "").toLowerCase();
  const programmeType = document.querySelector("#applicationProgrammeTypeFilter")?.value || "";

  [...table.tBodies[0].rows].forEach((row) => {
    const textMatch = !query || row.textContent.toLowerCase().includes(query);
    const stageMatch = stageValue.startsWith("all") || row.dataset.stage === stageValue;
    const nationalityMatch = nationalityValue.startsWith("any") || row.dataset.nationality === nationalityValue;
    const typeMatch = !programmeType || row.dataset.programmeCategory === programmeType;
    row.hidden = !(textMatch && stageMatch && nationalityMatch && typeMatch);
  });
}

function filterAudit() {
  const query = (document.querySelector("#auditSearch")?.value || "").trim().toLowerCase();
  const entity = document.querySelector("#auditEntityFilter")?.value || "All entities";
  if (!auditBody) return;
  [...auditBody.rows].forEach((row) => {
    const matchesQuery = !query || row.textContent.toLowerCase().includes(query);
    const matchesEntity = entity === "All entities" || row.children[3]?.textContent === entity;
    row.hidden = !(matchesQuery && matchesEntity);
  });
}

function filterCurrentPanel(button) {
  const view = button.closest("[data-view]")?.dataset.view;
  const filters = {
    universities: () => applyTextFilter("universities", "#universitySearch", "#universityStatusFilter"),
    programmes: () => applyTextFilter("programmes", "#programmeSearch", "#programmeStatusFilter", "#programmeAgeFilter"),
    applications: filterApplications,
    audit: filterAudit
  };
  filters[view]?.();
}

function runTopSearch(query) {
  const activePanel = document.querySelector(".view-panel.active");
  const match = [...activePanel.querySelectorAll("tr, article, .activity-list div")].find((item) => item.textContent.toLowerCase().includes(query));
  activePanel.querySelectorAll(".highlight").forEach((item) => item.classList.remove("highlight"));
  if (!query || !match) return;
  match.classList.add("highlight");
  match.scrollIntoView({ behavior: "smooth", block: "center" });
}

function setSelectValue(selector, value) {
  const select = document.querySelector(selector);
  if (!select || !value) return;
  const option = [...select.options].find((item) => item.textContent.trim().toLowerCase() === value.toLowerCase());
  if (option) select.value = option.value;
}

function openQueueTarget(button) {
  const target = button.dataset.queueTarget;
  if (!target) return;
  setActiveView(target);
  history.replaceState(null, "", `#${target}`);
  if (target === "programmes") {
    setSelectValue("#programmeStatusFilter", button.dataset.queueStatus);
    setSelectValue("#programmeAgeFilter", button.dataset.queueAge);
    applyTextFilter("programmes", "#programmeSearch", "#programmeStatusFilter", "#programmeAgeFilter");
  }
  if (target === "applications") {
    filterApplications();
    if (button.dataset.queueAge) {
      const delayed = [...document.querySelectorAll('[data-table="applications"] tbody tr')].find(row => !row.hidden && applicationAgeValue(row) >= 60);
      if (delayed) openApplicationSidePanel(delayed);
    }
  }
  if (target === "universities") {
    setSelectValue("#universityStatusFilter", button.dataset.queueStatus);
    applyTextFilter("universities", "#universitySearch", "#universityStatusFilter");
  }
}

function openUserForm(row = null) {
  editingUserRow = row;
  if (userModalTitle) userModalTitle.textContent = row ? "Edit User" : "Add User";
  if (saveUserModal) saveUserModal.textContent = row ? "Save Changes" : "Add User";
  if (userName) userName.value = row?.children[0]?.textContent.trim() || "";
  if (userEmail) userEmail.value = row?.children[1]?.textContent.trim() || "";
  if (userLogin) userLogin.value = (row?.children[1]?.textContent.trim() || "").split("@")[0] || "";
  if (userPassword) userPassword.value = "";
  if (userRole) userRole.value = row?.children[2]?.textContent.trim() || "KPT Officer";
  if (userStatus) userStatus.value = row?.children[3]?.textContent.trim() || "Active";
  if (userModal) userModal.hidden = false;
}

function closeUserForm() {
  editingUserRow = null;
  if (userModal) userModal.hidden = true;
}

function saveUserForm() {
  const body = document.querySelector('[data-table="users"] tbody');
  if (!body) return;
  const name = userName?.value.trim() || "New Officer";
  const email = userEmail?.value.trim() || "new.officer@kpt.example";
  const role = userRole?.value || "KPT Officer";
  const status = userStatus?.value || "Active";
  const statusHtml = status === "Active" ? statusChip("Active", "green") : statusChip("Inactive", "neutral");
  if (editingUserRow) {
    editingUserRow.innerHTML = `<td><strong>${name}</strong></td><td>${email}</td><td>${role}</td><td>${statusHtml}</td><td>${currentTimestamp()}</td><td><button data-user-edit>Edit</button></td>`;
    addAudit(`Updated user ${name}`, "User");
  } else {
    const row = document.createElement("tr");
    row.innerHTML = `<td><strong>${name}</strong></td><td>${email}</td><td>${role}</td><td>${statusHtml}</td><td>Never</td><td><button data-user-edit>Edit</button></td>`;
    body.prepend(row);
    addAudit(`Added user ${name}`, "User");
  }
  addNotification("User management updated", `${name} was saved in the KPT / EMGS user list.`, "administration");
  closeUserForm();
}

function getProgrammeRowData(row) {
  const status = row.children[3]?.querySelector(".status-chip")?.textContent.trim() || row.children[3]?.textContent.trim() || "Pending KPT Approval";
  return {
    name: getRowTitle(row),
    university: row.children[1]?.textContent.trim() || "University",
    category: row.children[2]?.textContent.trim() || "Category",
    status,
    submitted: row.children[4]?.textContent.trim() || "13 Aug 2026",
    age: row.children[5]?.textContent.trim() || "0 days",
    duration: row.dataset.duration || "30 Days",
    fee: row.dataset.fee || "RM 3,500",
    language: row.dataset.language || "English",
    target: row.dataset.target || "General Public (including student)",
    credit: row.dataset.credit || "Eligible",
    activities: row.dataset.activities || "Activity 1, Activity 2, guided site visit",
    outcome: row.dataset.outcome || "Participants complete guided activities, site visits, and a reflective project assessed by university facilitators.",
    overview: row.dataset.overview || "Programme overview appears here.",
    languageLevel: row.dataset.languageLevel || 'Intermediate',
    applicants: [...document.querySelectorAll('[data-table="applications"] tbody tr')].filter(item => item.children[1]?.textContent.trim() === row.children[1]?.textContent.trim() && item.children[2]?.textContent.trim() === getRowTitle(row)).length,
    travel: row.dataset.travel || 'Borneo Eco Tours Sdn Bhd',
    certificate: row.dataset.certificate || 'Certificate of Completion',
    pic: row.dataset.pic || 'Dr. Aisyah Rahman',
    picPhone: row.dataset.picPhone || '+60 12-345 6789',
    picEmail: row.dataset.picEmail || 'aisyah.rahman@university.example',
    content: row.dataset.programmeContent || (getRowTitle(row) === 'Tropical Biodiversity Programme' ? 'Participants spend 30 days in Malaysian rainforest reserves studying biodiversity through guided treks, species monitoring, and a supervised conservation project.' : row.dataset.overview || 'Programme overview appears here.'),
    learningOutcomes: row.dataset.learningOutcomes ? JSON.parse(row.dataset.learningOutcomes) : getRowTitle(row) === 'Tropical Biodiversity Programme' ? ['Participants can identify key rainforest species', 'Apply basic ecological survey methods', 'Propose a conservation micro-project.'] : [row.dataset.outcome || 'Complete guided activities and a reflective project.'],
    inclusions: row.dataset.inclusions ? JSON.parse(row.dataset.inclusions) : ['Accommodation', 'Meals', 'Local transport', 'Field equipment'],
    activityItems: getRowTitle(row) === 'Tropical Biodiversity Programme' ? ['Guided rainforest trek', 'Species monitoring workshop', 'Conservation talk', 'Reflective report'] : (row.dataset.activities || 'Guided site visit').split(',').map(item => item.trim()),
    conditionalQuestions: row.dataset.conditionalQuestions ? JSON.parse(row.dataset.conditionalQuestions) : []
  };
}

function updateProgrammeApprovalRow(row, status, color) {
  row.dataset.status = status.toLowerCase();
  row.children[3].innerHTML = statusChip(status, color);
  row.children[5].textContent = status === "Approved" || status === "Rejected" ? "-" : row.children[5].textContent;
  row.children[6].innerHTML = '<button data-programme-view>View</button>';
  const owner = [...document.querySelectorAll('[data-table="universities"] tbody tr')].find(item => getRowTitle(item) === row.cells[1].textContent.trim());
  if (owner?.dataset.profileProgrammes) {
    const programmes = JSON.parse(owner.dataset.profileProgrammes);
    const programme = programmes.find(item => item.name === getRowTitle(row));
    if (programme) { programme.status = status; owner.dataset.profileProgrammes = JSON.stringify(programmes); }
  }
  applyTextFilter("programmes", "#programmeSearch", "#programmeStatusFilter", "#programmeAgeFilter");
}

function programmeDrawerRows(current) {
  return [...document.querySelectorAll('[data-table="programmes"] tbody tr')].filter(row => !row.hidden || row === current);
}

function renderProgrammeSidePanel(row) {
  if (!row || !programmeSidePanel) return;
  const opening = programmeSidePanel.hidden;
  const currentTab = activeProgrammeRow === row ? programmeSidePanel.querySelector('[data-programme-tab].active')?.dataset.programmeTab : 'details';
  activeProgrammeRow = row;
  document.querySelectorAll('[data-table="programmes"] tbody tr').forEach(item => item.classList.toggle('selected-row', item === row));
  const data = getProgrammeRowData(row);
  const rows = programmeDrawerRows(row);
  const index = rows.indexOf(row);
  const fields = entries => entries.map(([label, value]) => `<div><small>${label}</small><span class="university-profile-value">${escapeHtml(value)}</span></div>`).join('');
  programmeSidePanel.hidden = false;
  programmeSidePanel.setAttribute('role', 'dialog');
  programmeSidePanel.setAttribute('aria-modal', 'false');
  programmeSidePanel.setAttribute('aria-labelledby', 'programmeProfileTitle');
  if (opening) programmeSidePanel.classList.add('programme-drawer-enter');
  programmesSplitLayout?.classList.add('has-side-panel');
  programmeSidePanel.innerHTML = `
    <header class="university-modal-header">
      <div class="university-profile-heading"><div><span class="registration-eyebrow">PROGRAMME APPROVAL</span><h3 id="programmeProfileTitle">${escapeHtml(data.name)}</h3><div class="university-header-meta"><small>${escapeHtml(data.university)}</small>${statusChip(data.status, universityStatusColor(data.status))}</div></div></div>
      <div class="university-drawer-navigation"><div><button type="button" data-programme-drawer-step="-1" ${index <= 0 ? 'disabled' : ''} aria-label="Previous programme">&larr; Previous</button><button type="button" data-programme-drawer-step="1" ${index >= rows.length - 1 ? 'disabled' : ''} aria-label="Next programme">Next &rarr;</button><button class="university-modal-close" type="button" data-close-programme-side aria-label="Close programme review" title="Close programme review"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div><span>${index + 1} of ${rows.length} programmes</span></div>
    </header>
    <div class="university-modal-body">
      <div class="university-modal-main">
        <nav class="detail-tabs university-profile-tabs" aria-label="Programme review tabs"><button type="button" class="active" data-programme-tab="details">Programme details</button><button type="button" data-programme-tab="content">Submitted content</button></nav>
        <section data-programme-panel="details"><div class="programme-profile-groups">
          <div class="university-profile-group"><h3>Basic information</h3><div class="overview-fields">${fields([['University',data.university],['Category',data.category],['Language',`${data.language}: ${data.languageLevel}`],['Total applicants',String(data.applicants)]])}</div></div>
          <div class="university-profile-group"><h3>Audience, duration &amp; fees</h3><div class="overview-fields">${fields([['Target group',data.target],['Duration',data.duration],['Fee',data.fee],['Credit transfer',data.credit]])}</div></div>
        </div><div class="university-profile-group programme-profile-summary"><h3>Travel, certification &amp; PIC details</h3><div class="overview-fields programme-pic-fields">${fields([['Travel / tour',data.travel],['Certificate',data.certificate],['PIC',data.pic],['Phone',data.picPhone],['Email',data.picEmail]])}</div></div>
        <div class="university-profile-group programme-profile-summary"><h3>Submission details</h3><div class="overview-fields programme-submission-fields">${fields([['Submitted',data.submitted],['Age',data.age]])}</div></div>
        ${row.dataset.kptNote ? `<div class="university-action-guidance programme-profile-note"><span class="university-guidance-title">Latest KPT note</span><p>${escapeHtml(row.dataset.kptNote)}</p></div>` : ''}</section>
        <section data-programme-panel="content" hidden>
          <div class="university-profile-group"><h3>Programme content</h3><p class="university-profile-value programme-content-description">${escapeHtml(data.content)}</p></div>
          <div class="programme-content-sections">${[['Learning outcome',data.learningOutcomes],['What is included',data.inclusions],['Activities',data.activityItems]].map(([title,items]) => `<section class="university-profile-group"><h3>${title}</h3><ul class="programme-content-list">${items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul></section>`).join('')}</div>
          <section class="university-profile-group programme-profile-summary"><h3>Conditional questions</h3>${data.conditionalQuestions.length ? `<ul class="programme-content-list">${data.conditionalQuestions.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : '<p class="programme-content-description university-profile-value">No conditional questions added.</p>'}</section>
          <section class="university-profile-group programme-profile-summary"><h3>Gallery</h3><div class="programme-content-gallery">${['Programme cover image','Activity image','Campus image'].map(label => `<button type="button" data-programme-gallery aria-label="View ${label.toLowerCase()}"><span class="programme-gallery-placeholder" aria-hidden="true"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18"/><circle cx="8" cy="8" r="2"/><path d="m3 17 6-6 4 4 3-3 5 5"/></svg></span><span class="university-profile-value">${label}</span><small>Placeholder image</small></button>`).join('')}</div></section>
        </section>
      </div>
      <aside class="university-action-rail"><div class="university-action-title"><span class="registration-eyebrow">KPT REVIEW</span><h3>Actions</h3></div>
        <div class="university-action-guidance"><span class="university-guidance-title">Review the submission</span><p>Check the programme details and submitted content before recording your decision.</p></div>
        <div class="university-action-block"><small>Approval</small><button class="primary" type="button" data-programme-action="approve">Approve programme <span>&rarr;</span></button><p class="programme-action-description">Approve the programme for KPT to launch when ready.</p></div>
        <div class="university-action-block"><label for="programmeChangeNote">Request changes</label><textarea id="programmeChangeNote" rows="3" data-programme-change-note placeholder="Explain what needs correcting or clarifying">${escapeHtml(row.dataset.changeDraft || '')}</textarea><button type="button" data-programme-action="changes">Send changes request <span>&rarr;</span></button></div>
        <div class="university-action-block"><label for="programmeRejectNote">Rejection reason</label><textarea id="programmeRejectNote" rows="3" data-programme-reject-note placeholder="Explain why the programme cannot proceed">${escapeHtml(row.dataset.rejectDraft || '')}</textarea><button class="danger" type="button" data-programme-action="reject">Reject programme <span>&rarr;</span></button></div>
      </aside>
    </div>`;
  if (currentTab === 'content') setProgrammeDrawerTab('content');
}

function setProgrammeDrawerTab(tab) {
  programmeSidePanel.querySelectorAll('[data-programme-tab]').forEach(button => button.classList.toggle('active', button.dataset.programmeTab === tab));
  programmeSidePanel.querySelectorAll('[data-programme-panel]').forEach(panel => { panel.hidden = panel.dataset.programmePanel !== tab; });
}

function navigateProgrammeDrawer(step) {
  const rows = programmeDrawerRows(activeProgrammeRow);
  const next = rows[rows.indexOf(activeProgrammeRow) + step];
  if (!next) return;
  const tab = programmeSidePanel.querySelector('[data-programme-tab].active')?.dataset.programmeTab || 'details';
  renderProgrammeSidePanel(next);
  setProgrammeDrawerTab(tab);
  const button = programmeSidePanel.querySelector(`[data-programme-drawer-step="${step}"]`);
  if (!button.disabled) button.focus({ preventScroll: true });
}

function closeProgrammeSidePanel() {
  if (programmeSidePanel) {
    programmeSidePanel.hidden = true;
    programmeSidePanel.classList.remove('programme-drawer-enter');
  }
  programmesSplitLayout?.classList.remove('has-side-panel');
  document.querySelectorAll('[data-table="programmes"] tbody tr').forEach(item => item.classList.remove('selected-row'));
  activeProgrammeRow?.querySelector('[data-programme-view]')?.focus({ preventScroll: true });
}

programmeSidePanel.addEventListener('click', event => {
  const tab = event.target.closest('[data-programme-tab]');
  if (tab) setProgrammeDrawerTab(tab.dataset.programmeTab);
  const step = event.target.closest('[data-programme-drawer-step]');
  if (step) navigateProgrammeDrawer(Number(step.dataset.programmeDrawerStep));
});
programmeSidePanel.addEventListener('input', event => {
  if (!activeProgrammeRow) return;
  if (event.target.matches('[data-programme-change-note]')) activeProgrammeRow.dataset.changeDraft = event.target.value;
  if (event.target.matches('[data-programme-reject-note]')) activeProgrammeRow.dataset.rejectDraft = event.target.value;
});
programmeSidePanel.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeProgrammeSidePanel();
  if (!event.target.matches('input, textarea, select') && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
    event.preventDefault();
    navigateProgrammeDrawer(event.key === 'ArrowRight' ? 1 : -1);
  }
});
programmeSidePanel.addEventListener('animationend', event => {
  if (event.target === programmeSidePanel) programmeSidePanel.classList.remove('programme-drawer-enter');
});

function handleProgrammePanelAction(button) {
  const row = activeProgrammeRow;
  if (!row) return;
  const action = button.dataset.programmeAction;
  const programmeName = getRowTitle(row);
  if (action === "approve") {
    openConfirm("Approve programme?", `Approve ${programmeName}? KPT will launch it when ready for applications.`, () => {
      updateProgrammeApprovalRow(row, "Approved", "green");
      addAudit(`Approved ${programmeName}`, "Programme");
      addNotification("Programme approved", `${programmeName} is now approved by KPT.`, "programmes");
      renderProgrammeSidePanel(row);
    }, "Approve");
    return;
  }
  if (action === "changes") {
    const note = programmeSidePanel?.querySelector("[data-programme-change-note]")?.value.trim() || "Please clarify the programme fee, learning scope, and submitted activity details.";
    openConfirm("Request programme changes?", `Send this change request to ${programmeName}?`, () => {
      row.dataset.kptNote = note;
      updateProgrammeApprovalRow(row, "Changes Requested", "purple");
      addAudit(`Requested changes for ${programmeName}: ${note}`, "Programme");
      addNotification("KPT changes requested", `${programmeName} has been returned to the university.`, "programmes");
      renderProgrammeSidePanel(row);
    }, "Send Request");
    return;
  }
  if (action === "reject") {
    const reason = programmeSidePanel?.querySelector("[data-programme-reject-note]")?.value.trim() || "Programme did not meet KPT approval requirements based on the submitted scope and supporting details.";
    openConfirm("Reject programme?", `Reject ${programmeName} with the entered reason?`, () => {
      row.dataset.kptNote = reason;
      updateProgrammeApprovalRow(row, "Rejected", "red");
      addAudit(`Rejected ${programmeName}: ${reason}`, "Programme");
      addNotification("Programme rejected", `${programmeName} was rejected by KPT.`, "programmes");
      renderProgrammeSidePanel(row);
    }, "Reject");
  }
}

function universityStatusColor(status) {
  const normalized = status.toLowerCase();
  if (normalized === "active" || normalized === "approved" || normalized === "live" || normalized === "clear" || normalized === "verified") return "green";
  if (normalized === "pending review" || normalized === "pending kpt approval" || normalized === "action required") return "amber";
  if (normalized === "clarification requested" || normalized === "changes requested") return "purple";
  if (normalized === "account created" || normalized === "resubmitted" || normalized === "watch") return "blue";
  if (normalized === "suspended" || normalized === "rejected" || normalized === "blocked") return "red";
  if (normalized === "archived") return "neutral";
  return "neutral";
}

function syncUniversityCounts(row) {
  ['programmes', 'applicants'].forEach((key, index) => {
    const cell = row.children[index + 2];
    if (row.dataset[key + 'Count'] === undefined) {
      row.dataset[key + 'Count'] = /^\d+$/.test(cell.textContent.trim()) ? cell.textContent.trim() : '0';
    }
    cell.textContent = row.dataset.status === 'active' ? row.dataset[key + 'Count'] : '—';
  });
}

function updateUniversityRow(row, status, compliance) {
  row.dataset.status = status.toLowerCase();
  row.dataset.compliance = compliance.toLowerCase();
  row.dataset.complianceSignal = status === "Clarification Requested" ? "KPT clarification pending from university" : compliance === "Clear" ? "No open KPT credential requests" : row.dataset.complianceSignal || "KPT compliance review required";
  row.children[1].innerHTML = statusChip(status, universityStatusColor(status));
  syncUniversityCounts(row);
  row.children[4].textContent = row.dataset.responseTime || "Pending";
  row.children[5].textContent = currentTimestamp();
  applyTextFilter("universities", "#universitySearch", "#universityStatusFilter");
}

function confirmUniversityDecision(row, status, compliance, label) {
  const name = getRowTitle(row);
  openConfirm(`${label} university?`, `Confirm ${label.toLowerCase()} for ${name}? This will update the university record and audit log.`, () => {
    updateUniversityRow(row, status, compliance);
    addAudit(`${label} ${name}`, "University");
    addNotification(`University ${status.toLowerCase()}`, `${name} is now ${status.toLowerCase()}.`, "universities");
    if (document.querySelector('[data-view="university-detail"]')?.classList.contains("active")) {
      renderUniversityDetail(row);
    } else {
      renderUniversitySidePanel(row);
    }
  }, label);
}

function universityClarifications(row) {
  try {
    return JSON.parse(row?.dataset.clarifications || "[]");
  } catch {
    return [];
  }
}

function clarificationHistoryHtml(row) {
  const messages = universityClarifications(row);
  if (!messages.length) return "";
  return `
    <div class="clarification-history">
      <h4>Clarification History</h4>
      ${messages.map((item) => `
        <div class="clarification-item">
          <span>${escapeHtml(item.title)}</span>
          <span>${escapeHtml(item.message)}</span>
          <small>${escapeHtml(item.time)}</small>
        </div>
      `).join("")}
    </div>
  `;
}

function sendUniversityClarification() {
  const row = activeUniversityRow;
  if (!row) return;
  const message = clarificationMessage?.value.trim() || "";
  if (!message) { clarificationMessage.setCustomValidity("Enter the information you need the university to clarify."); clarificationMessage.reportValidity(); return; }
  const existing = universityClarifications(row);
  existing.unshift({
    title: "KPT requested clarification",
    message,
    time: currentTimestamp()
  });
  row.dataset.clarifications = JSON.stringify(existing);
  row.dataset.openRequests = String(Number(row.dataset.openRequests || 0) + 1);
  row.dataset.responseTime = row.dataset.responseTime || "Pending";
  row.dataset.complianceSignal = "KPT clarification pending from university";
  updateUniversityRow(row, "Clarification Requested", "Action Required");
  addAudit(`Requested clarification from ${getRowTitle(row)}`, "University");
  addNotification("University clarification requested", `${getRowTitle(row)} has been asked to clarify credentials.`, "universities");
  closeClarificationForm();
  if (document.querySelector('[data-view="university-detail"]')?.classList.contains("active")) {
    renderUniversityDetail(row);
    document.querySelector('[data-university-tab="overview"]')?.click();
  } else {
    renderUniversitySidePanel(row);
  }
}

function universityProgrammes(name, status) {
  if (/Cyberjaya/.test(name)) return [
    ["Global Health Innovation Lab", "Health Sciences", "Pending KPT Approval", "0", "17 Aug 2026"],
    ["Tropical Biodiversity Programme", "Nature & Environment", "Live", "24", "16 Aug 2026"],
    ["Digital Entrepreneurship Bootcamp", "Business & Innovation", "Live", "31", "15 Aug 2026"],
    ["Marine Conservation Lab", "Nature & Environment", "Archived", "7", "12 Aug 2026"]
  ];
  if (/Penang/.test(name)) return [
    ["Smart Tourism Analytics", "Technology", "Resubmitted", "0", "17 Aug 2026"],
    ["Malaysian Heritage Experience", "Culture & Heritage", "Live", "16", "14 Aug 2026"],
    ["Applied AI for Tourism", "Technology", "Approved", "9", "13 Aug 2026"]
  ];
  if (/Metro/.test(name)) return [
    ["Fast Track Business Camp", "Business", "Rejected", "0", "10 Aug 2026"],
    ["Urban Mobility Workshop", "Urban Studies", "Archived", "14", "9 Aug 2026"],
    ["Food Culture Field School", "Culinary Culture", "Changes Requested", "0", "8 Aug 2026"]
  ];
  return [
    ["EduTourism Foundation Programme", "Academic Exchange", status === "Rejected" ? "Rejected" : "Pending KPT Approval", "0", "16 Aug 2026"],
    ["Cultural Field Immersion", "Culture & Heritage", status === "Approved" ? "Approved" : "Changes Requested", status === "Approved" ? "18" : "0", "15 Aug 2026"]
  ];
}

function programmeBreakdown(items) {
  const counts = { total: items.length, pending: 0, changes: 0, approved: 0, live: 0, archived: 0, rejected: 0, resubmitted: 0 };
  items.forEach((item) => {
    const status = item[2].toLowerCase();
    if (status.includes("pending")) counts.pending += 1;
    else if (status.includes("changes")) counts.changes += 1;
    else if (status.includes("resubmitted")) counts.resubmitted += 1;
    else if (status.includes("live")) counts.live += 1;
    else if (status.includes("archived")) counts.archived += 1;
    else if (status.includes("rejected")) counts.rejected += 1;
    else if (status.includes("approved")) counts.approved += 1;
  });
  return counts;
}

function universityMonitoringData(row) {
  const data = getUniversityRowData(row);
  const programmes = universityProgrammes(data.name, data.status);
  const breakdown = programmeBreakdown(programmes);
  const responseDays = Number.parseInt(data.responseTime, 10);
  const avgApprovalAge = data.status === "Rejected" ? "-" : `${Math.max(3, responseDays || 4) + breakdown.pending + breakdown.changes} days`;
  const escalated = data.compliance === "Blocked" ? 6 : data.compliance === "Action Required" ? 4 : data.compliance === "Watch" ? 3 : 1;
  const activeApplicants = Math.max(0, Math.round((Number(data.applicants) || 0) * 0.34));
  const awaitingApplicants = Math.max(0, Math.round((Number(data.applicants) || 0) * 0.28));
  const approvedApplicants = Math.max(0, Math.round((Number(data.applicants) || 0) * 0.26));
  const closedApplicants = Math.max(0, (Number(data.applicants) || 0) - activeApplicants - awaitingApplicants - approvedApplicants);
  const riskSignals = [];
  if (data.compliance === "Action Required" || Number(data.openRequests) > 0) riskSignals.push(`${data.openRequests} open KPT request${Number(data.openRequests) === 1 ? "" : "s"}`);
  if (data.compliance === "Watch") riskSignals.push("Repeated late clarification replies");
  if (data.status === "Suspended") riskSignals.push("Participation suspended until KPT clears unresolved issues");
  if (data.status === "Rejected" || data.compliance === "Blocked") riskSignals.push("Eligibility or credential failure recorded");
  if (escalated >= 3) riskSignals.push(`${escalated} escalated applicant records`);
  if (!riskSignals.length) riskSignals.push("No immediate risk signal");
  return {
    ...data,
    programmesList: programmes,
    breakdown,
    avgApprovalAge,
    escalated,
    applicantMix: {
      active: activeApplicants,
      awaiting: awaitingApplicants,
      approved: approvedApplicants,
      closed: closedApplicants
    },
    riskSignals
  };
}

function getUniversityRowData(row) {
  const name = getRowTitle(row);
  const reference = row.children[0]?.querySelector("small")?.textContent.trim() || "EDU-REF";
  const status = row.children[1]?.querySelector(".status-chip")?.textContent.trim() || row.children[1]?.textContent.trim() || "Pending Review";
  const programmes = row.children[2]?.textContent.trim() || "0";
  const applicants = row.children[3]?.textContent.trim() || "0";
  const compliance = { clear: "Clear", watch: "Watch", "action required": "Action Required", blocked: "Blocked" }[row.dataset.compliance] || "Action Required";
  const responseTime = row.children[4]?.textContent.trim() || row.dataset.responseTime || "3 days";
  const lastActivity = row.children[5]?.textContent.trim() || "17 Aug 2026";
  return {
    name,
    reference,
    status,
    programmes,
    applicants,
    compliance,
    lastActivity,
    openRequests: row.dataset.openRequests || "0",
    responseTime,
    complianceSignal: row.dataset.complianceSignal || "No open KPT credential requests"
  };
}

function nextUniversityStep(status, compliance, openRequests) {
  if (status === "Rejected") return "Record closed. View the rejection reason or keep the record for audit.";
  if (status === "Account Created") return "Await university first login and temporary password change to activate the account.";
  if (status === "Active") return "Account activated. Monitor programmes and applications.";
  if (compliance === "Action Required" || Number(openRequests) > 0) return "Wait for university reply or request clarification again.";
  if (compliance === "Watch") return "Monitor response pattern, then clear compliance if resolved.";
  if (status === "Pending Review" || status === "Clarification Requested") return "Review the application and accept, request clarification, or reject.";
  return "No immediate action. Keep monitoring programmes and applications.";
}

function seedUniversityProfile(row, index) {
  if (row.dataset.registrationDetails) return;
  const profiles = [
    ['Private University', '18 Jalan Demo, 63000 Cyberjaya, Selangor', 'Aisha Rahman', 'Director, International Office', 'University Administrator', 'ucm'],
    ['College', '42 Persiaran Contoh, 50000 Kuala Lumpur', 'Daniel Tan', 'Coordinator, Global Engagement', 'University Coordinator', 'klid'],
    ['Private University', '9 Jalan Sampel, 10200 George Town, Penang', 'Priya Kumar', 'Manager, Student Services', 'University Administrator', 'pgu'],
    ['College', '25 Lorong Demo, 40000 Shah Alam, Selangor', 'Amir Hakim', 'Officer, International Relations', 'University Coordinator', 'msc'],
    ['Private University', '63 Jalan Contoh, 88400 Kota Kinabalu, Sabah', 'Mei Ling Wong', 'Administrator, Programme Office', 'University Administrator', 'biu'],
    ['College', '11 Jalan Demo, 05000 Alor Setar, Kedah', 'Farah Abdullah', 'Coordinator, Admissions Office', 'University Coordinator', 'ncsa']
  ];
  const [instituteType, campusAddress, contactName, contactJob, contactRole, slug] = profiles[index % profiles.length];
  row.dataset.registrationDetails = JSON.stringify({
    officialName: getRowTitle(row), registration: `DEMO-MOHE-2026-${String(index + 1).padStart(3, '0')}`,
    instituteType, campusAddress, website: `https://${slug}.example`, contactName, contactJob,
    contactEmail: `contact@${slug}.example`, contactPhone: `+60 3 5550 ${1001 + index}`, contactRole
  });
  row.dataset.logo = row.querySelector('.registry-logo')?.getAttribute('src') || '';
  if (row.dataset.status === 'clarification requested') row.dataset.clarifications = JSON.stringify([{ title: 'KPT requested clarification', message: 'Please confirm the primary contact department and main campus address.', time: '15 Aug 2026, 10:30 AM' }]);
  if (row.dataset.status === 'rejected') { row.dataset.rejectionReason = 'The institution registration details could not be verified. Please provide a valid KPT / MOHE registration number before reconsideration.'; row.dataset.rejectionTime = '11 Aug 2026, 11:00 AM'; }
}

function registrationDetailsHtml(row) {
  const details = JSON.parse(row.dataset.registrationDetails || '{}');
  const institution = [['Official name', details.officialName], ['KPT / MOHE registration number', details.registration], ['Institute type', details.instituteType], ['Main campus address', details.campusAddress], ['Official website', details.website]];
  const contact = [['Full name', details.contactName], ['Job title and department', details.contactJob], ['Primary contact email', details.contactEmail], ['Work phone number', details.contactPhone], ['User role', details.contactRole]];
  const group = (title, fields) => `<section class="overview-group university-profile-group"><h3>${title}</h3><div class="overview-fields">${fields.map(([label, value]) => `<div><small>${label}</small><span class="university-profile-value">${escapeHtml(value || 'Not provided')}</span></div>`).join('')}</div></section>`;
  return group('University details', institution) + group('Primary contact', contact);
}

function universityProfileProgrammes(row) {
  if (row.dataset.status !== 'active') return [];
  if (row.dataset.profileProgrammes) return JSON.parse(row.dataset.profileProgrammes);
  const count = Number(row.dataset.programmesCount) || 0;
  const total = Number(row.dataset.applicantsCount) || 0;
  const base = universityProgrammes(getRowTitle(row), 'Active');
  const extra = [
    ['Sustainable Tourism Field School', 'Nature & Environment'], ['Malaysian Culture Immersion', 'Culture & Heritage'],
    ['Digital Business Summer School', 'Business & Innovation'], ['Community Health Exchange', 'Health Sciences'],
    ['Creative Design Workshop', 'Creative Arts'], ['Hospitality Leadership Camp', 'Hospitality'],
    ['Language and Heritage Experience', 'Languages'], ['Urban Innovation Studio', 'Technology']
  ];
  return Array.from({ length: count }, (_, index) => {
    const programme = base[index] || [...extra[(index - base.length) % extra.length], 'Live'];
    return { name: programme[0], category: programme[1], status: programme[2], applicants: 0 };
  }).map((programme, index, programmes) => {
    const eligible = programmes.filter(item => ['Live', 'Approved', 'Archived'].includes(item.status));
    const eligibleIndex = eligible.indexOf(programme);
    if (eligibleIndex >= 0) programme.applicants = Math.floor(total / eligible.length) + (eligibleIndex < total % eligible.length ? 1 : 0);
    return programme;
  });
}

function universityProgrammesHtml(row) {
  const programmes = universityProfileProgrammes(row);
  if (!programmes.length) return `<div class="university-programmes-empty"><span class="university-empty-title">${row.dataset.status === 'active' ? 'No programmes yet' : 'Programmes available once Active'}</span><p>${row.dataset.status === 'active' ? 'This university has not added any programmes yet.' : 'Programme and applicant information is shown only after the university logs in and changes its temporary password.'}</p></div>`;
  const total = programmes.reduce((sum, programme) => sum + programme.applicants, 0);
  return `<div class="university-programmes-summary"><span>${programmes.length} programmes</span><span>${total} applicants</span></div><div class="recent-table-wrap"><table class="recent-table university-profile-programmes"><thead><tr><th>Programme</th><th>Category</th><th>Status</th><th>Applicants</th></tr></thead><tbody>${programmes.map(programme => `<tr><td>${escapeHtml(programme.name)}</td><td>${escapeHtml(programme.category)}</td><td>${statusChip(programme.status, universityStatusColor(programme.status))}</td><td>${programme.applicants}</td></tr>`).join('')}</tbody></table></div>`;
}

function universityApplicationActionsHtml(row, fullPage = false) {
  const details = JSON.parse(row.dataset.registrationDetails || '{}');
  const status = row.dataset.status;
  const review = ['pending review', 'clarification requested'].includes(status);
  const guidance = {
    'active': ['Account is active', 'This university can manage its programmes and applicants.'],
    'account created': ['Awaiting activation', 'The university needs to log in and change its temporary password.'],
    'pending review': ['Ready for review', 'Check the institution and contact details, then choose a decision.'],
    'clarification requested': ['Waiting for a reply', 'The university must respond to the requested information before you accept its application.'],
    'rejected': ['Application closed', 'This application was rejected. You can contact the university for follow-up.']
  }[status] || ['Review university', 'Review this institution profile.'];
  return `<aside class="university-action-rail"><div class="university-action-title"><span class="registration-eyebrow">KPT WORKSPACE</span><h3>Actions</h3></div><div class="university-action-guidance"><span class="university-guidance-title">${guidance[0]}</span><p>${guidance[1]}</p></div>
    ${status === 'clarification requested' ? `<div class="university-action-block"><small>CLARIFICATION</small><button type="button" data-university-action="history">View clarification history</button><button type="button" data-university-action="reminder">Send reminder</button>${row.dataset.reminderRequested ? '<p class="university-action-feedback">Clarification reminder requested.</p>' : ''}</div>` : ''}
    ${status === 'rejected' ? `<div class="university-action-block"><small>APPLICATION REVIEW</small><button type="button" data-university-action="reason">View rejection reason</button><button class="primary" type="button" data-university-action="reopen">Reopen for review <span aria-hidden="true">&rarr;</span></button></div>` : ''}
    ${review ? `<div class="university-action-block"><small>APPLICATION DECISION</small><button class="primary" type="button" data-university-action="approve">Accept application <span aria-hidden="true">&rarr;</span></button>${status === 'pending review' ? '<button type="button" data-university-action="clarify">Request clarification</button>' : ''}<button class="danger" type="button" data-university-action="reject">Reject application</button></div>` : ''}
    ${status === 'active' ? `<div class="university-action-block"><small>APPLICANTS</small><button type="button" data-profile-applicants>View all applicants <span aria-hidden="true">&rarr;</span></button></div>` : ''}
    ${status === 'account created' ? `<div class="university-action-block"><small>ACCOUNT ACCESS</small><button class="primary" type="button" data-university-action="login-email">${row.dataset.notificationStatus === 'Requested' ? 'Resend login email' : 'Send login email'} <span aria-hidden="true">&rarr;</span></button>${row.dataset.notificationStatus === 'Requested' ? '<p class="university-action-feedback">Login email notification requested.</p>' : ''}</div>` : ''}
    ${['active', 'account created'].includes(status) ? `<div class="university-action-block"><small>PROFILE &amp; ACCESS</small><button type="button" data-university-action="edit">Edit profile</button>${status === 'active' ? '<button type="button" data-university-action="reset-password">Send password reset link</button>' : ''}${row.dataset.passwordResetRequested ? '<p class="university-action-feedback">Password reset link requested.</p>' : ''}</div>` : ''}
    <div class="university-action-contact"><small>PRIMARY CONTACT</small><span class="university-contact-name">${escapeHtml(details.contactName || 'Not provided')}</span><span>${escapeHtml(details.contactJob || '')}</span><a href="mailto:${encodeURIComponent(details.contactEmail || '')}">Email contact <span aria-hidden="true">&#8599;</span></a></div>
    ${fullPage ? '' : '<button class="university-full-view" type="button" data-expand-university-detail>Open full page <span aria-hidden="true">&#8599;</span></button>'}
  </aside>`;
}

function renderUniversitySidePanel(row) {
  if (!row || !universitySidePanel) return;
  activeUniversityRow = row;
  document.querySelectorAll('[data-table="universities"] tbody tr').forEach(item => item.classList.toggle('selected-row', item === row));
  const data = getUniversityRowData(row);
  const openingDrawer = universitySidePanel.hidden;
  universitySidePanel.hidden = false;
  if (openingDrawer) universitySidePanel.classList.add('university-drawer-enter');
  universitiesSplitLayout?.classList.add('has-side-panel');
  universitySidePanel.setAttribute('role', 'dialog');
  universitySidePanel.setAttribute('aria-modal', 'false');
  universitySidePanel.setAttribute('aria-labelledby', 'universityProfileTitle');
  document.querySelector('#universityProfileBackdrop').hidden = true;
  document.body.classList.remove('university-profile-open');
  universitySidePanel.innerHTML = `
    <header class="university-modal-header"><div class="university-profile-heading">${row.dataset.logo ? `<img class="registration-saved-logo" src="${escapeHtml(row.dataset.logo)}" alt="${escapeHtml(data.name)} logo">` : ''}<div><span class="registration-eyebrow">UNIVERSITY PROFILE</span><h3 id="universityProfileTitle">${escapeHtml(data.name)}</h3><div class="university-header-meta"><small>${escapeHtml(data.reference)}</small>${statusChip(data.status, universityStatusColor(data.status))}</div></div></div>${universityDrawerNavigationHtml(row)}</header>
    <div class="university-modal-body"><div class="university-modal-main"><nav class="detail-tabs university-profile-tabs" aria-label="University details tabs"><button class="active" type="button" data-side-university-tab="overview">University details</button><button type="button" data-side-university-tab="programmes">Programmes ${data.status === 'Active' ? `<span>${escapeHtml(data.programmes)}</span>` : ''}</button></nav><div class="university-profile-content"><section class="side-content-section active" data-side-university-panel="overview">${registrationDetailsHtml(row)}</section><section class="side-content-section" data-side-university-panel="programmes" hidden>${universityProgrammesHtml(row)}</section></div></div>${universityApplicationActionsHtml(row)}</div>`;
  universitySidePanel.querySelector('[data-close-side-panel]').focus({ preventScroll: true });
  addAudit(`Viewed university details for ${escapeHtml(data.name)}`, 'University');
}

function closeUniversitySidePanel() {
  if (universitySidePanel) { universitySidePanel.hidden = true; universitySidePanel.classList.remove('university-drawer-enter'); }
  document.querySelector("#universityProfileBackdrop").hidden = true;
  document.body.classList.remove("university-profile-open");
  universitiesSplitLayout?.classList.remove("has-side-panel");
  document.querySelectorAll('[data-table="universities"] tbody tr').forEach((item) => item.classList.remove("selected-row"));
  if (activeUniversityRow?.isConnected && !activeUniversityRow.hidden) activeUniversityRow.querySelector('[data-university-view]')?.focus({ preventScroll: true });
}

function applicationStatusColor(stage) {
  const normalised = String(stage || "").toLowerCase();
  if (normalised.includes("required")) return "amber";
  if (normalised.includes("submitted") || normalised.includes("new")) return "blue";
  if (normalised === "approved") return "green";
  if (normalised.includes("rejected")) return "red";
  return "neutral";
}

function applicationMeta(row) {
  const applicantCell = row.children[0];
  const applicantParts = [...applicantCell.querySelectorAll("small")].map((item) => item.textContent.trim());
  const applicantName = applicantCell.childNodes[0]?.textContent.trim() || "Applicant";
  const programmeName = row.children[2]?.textContent.trim() || 'Programme';
  const universityName = row.children[1]?.textContent.trim() || 'University';
  const programmeRow = [...document.querySelectorAll('[data-table="programmes"] tbody tr')].find(item => getRowTitle(item) === programmeName && item.children[1]?.textContent.trim() === universityName);
  const programme = programmeRow ? getProgrammeRowData(programmeRow) : null;
  const universityRow = [...document.querySelectorAll('[data-table="universities"] tbody tr')].find(item => getRowTitle(item) === universityName);
  const listedProgramme = universityRow ? universityProfileProgrammes(universityRow).find(item => item.name === programmeName) : null;
  const documentsRequired = row.dataset.stage === 'documents required';
  return {
    name: applicantName,
    tracking: applicantParts[0] || "EDT-2026-000000",
    nationality: applicantParts[1] || "Not stated",
    university: row.children[1]?.textContent.trim() || "University",
    programme: row.children[2]?.textContent.trim() || "Programme",
    stage: row.children[3]?.textContent.trim() || "Stage",
    lastUpdated: row.children[4]?.textContent.trim() || "-",
    age: row.dataset.actionAge || "-",
    appliedDate: row.dataset.appliedDate || "12 Aug 2026",
    applicantType: row.dataset.nationality === "malaysia" ? "Malaysian" : "International - Student Pass Required",
    identificationType: row.dataset.identificationType || (row.dataset.nationality === 'malaysia' ? 'MyKad' : 'Passport'),
    category: row.dataset.programmeCategory || programme?.category || listedProgramme?.category || 'Not provided',
    duration: row.dataset.programmeDuration || programme?.duration || '30 Days',
    fee: row.dataset.programmeFee || programme?.fee || 'RM 3,500',
    passportStatus: row.dataset.passportStatus || (documentsRequired ? 'Action needed' : 'Received'),
    correctionStatus: row.dataset.correctionStatus || (documentsRequired ? 'Requested' : row.dataset.stage === 'req. document submitted' ? 'Submitted' : 'Not requested'),
    correctionDescription: row.dataset.correctionDescription || (documentsRequired ? 'University request - applicant response pending' : row.dataset.stage === 'req. document submitted' ? 'Applicant response submitted for university review' : 'No additional documents or correction requested'),
    email: row.dataset.email || `${applicantName.toLowerCase().replaceAll(" ", ".")}@student.example`,
    phone: row.dataset.phone || (row.dataset.nationality === "malaysia" ? "+60 11-555 0188" : "+60 11-555 2148"),
    immigration: row.dataset.nationality === "malaysia" ? "Not required" : "Student pass / visa required"
  };
}

function applicationDrawerRows(current) {
  return [...document.querySelectorAll('[data-table="applications"] tbody tr')].filter(row => !row.hidden || row === current);
}

function openApplicationSidePanel(row) {
  if (!row || !applicationSidePanel) return;
  const opening = applicationSidePanel.hidden;
  activeApplicationRow?.classList.remove('selected-row');
  activeApplicationRow = row;
  row.classList.add('selected-row');
  applicationsSplitLayout?.classList.add('has-side-panel');
  const data = applicationMeta(row);
  const ageNumber = applicationAgeValue(row);
  const showEscalate = ageNumber !== null && ageNumber >= 60;
  const rows = applicationDrawerRows(row);
  const index = rows.indexOf(row);
  const fields = entries => entries.map(([label, value]) => `<div><small>${label}</small><span class="university-profile-value">${escapeHtml(value)}</span></div>`).join('');
  applicationSidePanel.hidden = false;
  applicationSidePanel.setAttribute('role', 'dialog');
  applicationSidePanel.setAttribute('aria-modal', 'false');
  applicationSidePanel.setAttribute('aria-labelledby', 'applicationProfileTitle');
  if (opening) applicationSidePanel.classList.add('application-drawer-enter');
  applicationSidePanel.innerHTML = `
    <header class="university-modal-header"><div class="university-profile-heading"><div><span class="registration-eyebrow">${escapeHtml(data.tracking)}</span><h3 id="applicationProfileTitle">${escapeHtml(data.name)}</h3><div class="university-header-meta">${statusChip(data.stage, applicationStatusColor(data.stage))}</div></div></div>
      <div class="university-drawer-navigation"><div><button type="button" data-application-drawer-step="-1" ${index <= 0 ? 'disabled' : ''} aria-label="Previous application">&larr; Previous</button><button type="button" data-application-drawer-step="1" ${index >= rows.length - 1 ? 'disabled' : ''} aria-label="Next application">Next &rarr;</button><button class="university-modal-close" type="button" data-close-application-side aria-label="Close application review" title="Close application review"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div><span>${index + 1} of ${rows.length} applications</span></div>
    </header>
    <div class="university-modal-body"><div class="university-modal-main">
      <nav class="detail-tabs university-profile-tabs" aria-label="Application review tabs"><button class="active" type="button" data-application-tab="details">Application details</button><button type="button" data-application-tab="documents">Documents &amp; activity</button></nav>
      <section data-application-panel="details"><div class="application-profile-groups">
        <div class="university-profile-group"><h3>Applicant Details</h3><div class="overview-fields">${fields([['Full Name',data.name],['Nationality',data.nationality],['Phone',data.phone],['Applicant Type',data.applicantType],['Email',data.email],['Identification Type',data.identificationType]])}</div></div>
        <div class="university-profile-group"><h3>Programme Details</h3><div class="overview-fields">${fields([['Programme',data.programme],['Category',data.category],['Duration',data.duration],['Fee',data.fee],['University',data.university]])}</div></div>
      </div><div class="university-profile-group application-submission-details"><div class="overview-fields">${fields([['Applied Date',data.appliedDate],['Last Updated',data.lastUpdated],['Age',data.age]])}</div></div></section>
      <section data-application-panel="documents" hidden><div class="university-profile-group application-documents"><h3>Application Documents</h3>
        <div class="application-document-row"><div class="application-document-description"><span>Passport copy</span><small>Applicant - ${escapeHtml(data.tracking)}</small></div><span class="side-doc-actions">${statusChip(data.passportStatus, data.passportStatus === 'Action needed' ? 'amber' : 'green')}<button type="button" data-document-preview="Passport copy">View</button><button type="button" data-document-download="Passport copy">Download</button></span></div>
        <div class="application-document-row"><div class="application-document-description"><span>Additional documents or correction</span><small>${escapeHtml(data.correctionDescription)}</small></div><span class="side-doc-actions">${statusChip(data.correctionStatus, data.correctionStatus === 'Requested' ? 'amber' : data.correctionStatus === 'Submitted' ? 'blue' : 'neutral')}</span></div>
        <div class="application-document-row"><span>University decision record</span><span class="side-doc-actions">${statusChip(data.stage, applicationStatusColor(data.stage))}<button type="button" data-document-preview="University decision record">View</button></span></div>
      </div><section class="university-profile-group application-profile-activity" aria-label="Application activity log"><h3>Activity log</h3>
        <div><span class="university-profile-value">${escapeHtml(data.stage)}</span><p>Current application stage from the university dashboard.</p><small>${escapeHtml(data.lastUpdated)}</small></div>
        <div><span class="university-profile-value">Last action age</span><p>${data.age === '-' ? 'Closed applications are not counted for active age monitoring.' : `${escapeHtml(data.age)} since the last recorded action.`}</p><small>KPT monitoring</small></div>
        <div><span class="university-profile-value">Immigration requirement</span><p>${escapeHtml(data.immigration)}</p><small>EMGS check</small></div>
      </section></section>
    </div><aside class="university-action-rail"><div class="university-action-title"><h3>KPT / EMGS Actions</h3></div><div class="university-action-block"><button class="primary" type="button" data-application-action="Request university update">Request university update</button></div>
      ${showEscalate ? `<div class="university-action-block"><button class="danger" type="button" data-application-action="Escalate delayed case">Escalate delayed case</button></div>` : `<div class="university-action-guidance"><span class="application-escalation-label">Escalation</span><p>Available when age reaches 60 days.</p></div>`}
    </aside></div>`;
  addAudit(`Opened side review for ${data.tracking}`, 'Application');
}

function setApplicationDrawerTab(tab) {
  applicationSidePanel.querySelectorAll('[data-application-tab]').forEach(button => button.classList.toggle('active', button.dataset.applicationTab === tab));
  applicationSidePanel.querySelectorAll('[data-application-panel]').forEach(panel => { panel.hidden = panel.dataset.applicationPanel !== tab; });
}

function navigateApplicationDrawer(step) {
  const rows = applicationDrawerRows(activeApplicationRow);
  const next = rows[rows.indexOf(activeApplicationRow) + step];
  if (!next) return;
  const tab = applicationSidePanel.querySelector('[data-application-tab].active')?.dataset.applicationTab || 'details';
  openApplicationSidePanel(next);
  setApplicationDrawerTab(tab);
  const button = applicationSidePanel.querySelector(`[data-application-drawer-step="${step}"]`);
  (button.disabled ? applicationSidePanel.querySelector('[data-close-application-side]') : button).focus({ preventScroll: true });
}

function closeApplicationSidePanel() {
  if (applicationSidePanel) {
    applicationSidePanel.hidden = true;
    applicationSidePanel.classList.remove('application-drawer-enter');
  }
  applicationsSplitLayout?.classList.remove('has-side-panel');
  activeApplicationRow?.classList.remove('selected-row');
  activeApplicationRow?.querySelector('[data-row-action]')?.focus({ preventScroll: true });
  activeApplicationRow = null;
}

applicationSidePanel.addEventListener('click', event => {
  const tab = event.target.closest('[data-application-tab]');
  if (tab) setApplicationDrawerTab(tab.dataset.applicationTab);
  const step = event.target.closest('[data-application-drawer-step]');
  if (step) navigateApplicationDrawer(Number(step.dataset.applicationDrawerStep));
});
applicationSidePanel.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeApplicationSidePanel();
  if (!event.target.matches('input, textarea, select') && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
    event.preventDefault();
    navigateApplicationDrawer(event.key === 'ArrowRight' ? 1 : -1);
  }
});
applicationSidePanel.addEventListener('animationend', event => {
  if (event.target === applicationSidePanel) applicationSidePanel.classList.remove('application-drawer-enter');
});

function renderUniversityDetail(row) {
  if (!row) return;
  activeUniversityRow = row;
  const data = getUniversityRowData(row);
  universityDetailName.textContent = data.name;
  universityDetailMeta.textContent = data.reference;
  universityDetailStatus.innerHTML = `${row.dataset.logo ? `<img class="registration-saved-logo" src="${escapeHtml(row.dataset.logo)}" alt="${escapeHtml(data.name)} logo">` : ''}${statusChip(data.status, universityStatusColor(data.status))}`;
  universityOverview.innerHTML = registrationDetailsHtml(row);
  document.querySelector("#universityFullActions").innerHTML = universityApplicationActionsHtml(row, true);
  document.querySelector('#universityProgrammesContent').innerHTML = universityProgrammesHtml(row);
  document.querySelector('#universityApplicantsContent').innerHTML = universityApplicantsHtml(row);
  document.querySelectorAll('[data-university-tab]').forEach(button => button.classList.toggle('active', button.dataset.universityTab === 'overview'));
  document.querySelectorAll('[data-university-tab-panel]').forEach(panel => panel.classList.toggle('active', panel.dataset.universityTabPanel === 'overview'));
}

function openUniversityDetail(row) {
  closeUniversitySidePanel();
  renderUniversityDetail(row);
  setActiveView("university-detail");
  history.replaceState(null, "", "#universities/detail");
  addAudit(`Viewed university ${getRowTitle(row)}`, "University");
}

function entityFromTable(tableName) {
  if (tableName === "universities") return "University";
  if (tableName === "programmes") return "Programme";
  if (tableName === "applications") return "Application";
  if (tableName === "users") return "User";
  return "Record";
}

function handleRowAction(button) {
  const row = button.closest("tr");
  const tableName = row?.closest("[data-table]")?.dataset.table || "record";
  const title = getRowTitle(row);
  const action = button.dataset.rowAction;
  const entity = entityFromTable(tableName);

  if (tableName === "applications" && /view/i.test(action)) {
    openApplicationSidePanel(row);
    return;
  }

  if (/view/i.test(action)) {
    openDetail(action, `<div class="detail-summary">${rowDetails(row)}</div><div class="detail-note">This prototype panel represents the full ${entity.toLowerCase()} record. In production this would show documents, notes, decision history, compliance status, and linked university actions.</div>`);
    addAudit(action, entity);
    return;
  }

  openConfirm(`${action}?`, `Confirm ${action.toLowerCase()} for ${title}? This will update the row and audit log for the prototype.`, () => {
    if (/reactivate/i.test(action)) {
      row.dataset.status = "approved";
      row.dataset.compliance = "watch";
      row.children[1].innerHTML = statusChip("Approved", "green");
      row.children[row.children.length - 1].innerHTML = '<button data-row-action="View university">View</button>';
    }
    if (/clarification/i.test(action)) {
      row.dataset.compliance = "action required";
    }
    if (/request/i.test(action)) {
      row.children[row.children.length - 2].textContent = currentTimestamp();
    }
    if (/escalate/i.test(action)) {
      const statusCell = tableName === "applications" ? row.children[3] : row.children[4];
      if (statusCell) statusCell.innerHTML = statusChip("Escalated", "red");
      row.dataset.status = "delayed";
    }
    addAudit(`${action} for ${title}`, entity);
    addNotification(action, `${title} was updated by KPT / EMGS.`, tableName);
  }, /request/i.test(action) ? "Send" : "Confirm");
}

navLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    setActiveView(link.dataset.viewLink);
    history.replaceState(null, "", `#${link.dataset.viewLink}`);
  });
});

document.querySelectorAll("[data-view-link-button]").forEach((button) => {
  button.addEventListener("click", () => {
    setActiveView(button.dataset.viewLinkButton);
    history.replaceState(null, "", `#${button.dataset.viewLinkButton}`);
  });
});

document.querySelectorAll("[data-filter-button]").forEach((button) => {
  button.addEventListener("click", () => filterCurrentPanel(button));
});

[
  ["#universitySearch", "universities", "#universitySearch", "#universityStatusFilter"],
  ["#universityStatusFilter", "universities", "#universitySearch", "#universityStatusFilter"],
  ["#programmeSearch", "programmes", "#programmeSearch", "#programmeStatusFilter", "#programmeAgeFilter"],
  ["#programmeStatusFilter", "programmes", "#programmeSearch", "#programmeStatusFilter", "#programmeAgeFilter"],
  ["#programmeAgeFilter", "programmes", "#programmeSearch", "#programmeStatusFilter", "#programmeAgeFilter"],
  ["#applicationSearch", "applications"],
  ["#applicationStageFilter", "applications"],
  ["#applicationNationalityFilter", "applications"],
  ["#applicationProgrammeTypeFilter", "applications"],
].forEach(([selector, table, search, status, extra]) => {
  const enterSearch = selector.includes("Search") && table !== "applications";
  document.querySelector(selector)?.addEventListener(enterSearch ? "keydown" : selector.includes("Search") ? "input" : "change", event => {
    if (enterSearch && (event.key !== "Enter" || event.isComposing)) return;
    if (enterSearch) event.preventDefault();
    if (table === "applications") filterApplications();
    else applyTextFilter(table, search, status, extra);
  });
});

document.querySelector("#auditSearch")?.addEventListener("input", filterAudit);
document.querySelector("#auditEntityFilter")?.addEventListener("change", filterAudit);

document.addEventListener("click", (event) => {
  const sectionTooltip = event.target.closest(".section-tooltip");
  if (sectionTooltip) {
    event.stopPropagation();
    document.querySelectorAll(".section-tooltip").forEach((tooltip) => {
      if (tooltip !== sectionTooltip) tooltip.classList.remove("tooltip-open");
    });
    sectionTooltip.classList.toggle("tooltip-open");
    return;
  }
  const universityView = event.target.closest("[data-university-view]");
  if (universityView) {
    renderUniversitySidePanel(universityView.closest("tr"));
    return;
  }
  const closeSidePanel = event.target.closest("[data-close-side-panel]");
  if (closeSidePanel) {
    closeUniversitySidePanel();
    return;
  }
  const expandUniversityDetail = event.target.closest("[data-expand-university-detail]");
  if (expandUniversityDetail) {
    openUniversityDetail(activeUniversityRow);
    return;
  }
  const universityAction = event.target.closest("[data-university-action]");
  if (universityAction) {
    const row = activeUniversityRow;
    if (!row) return;
    const action = universityAction.dataset.universityAction;
    handleUniversityProfileAction(row, action);
    return;
  }
  const documentPreview = event.target.closest("[data-document-preview]");
  if (documentPreview) {
    const documentName = documentPreview.dataset.documentPreview;
    openDetail(documentName, `<div class="detail-note">Prototype document preview for ${documentName}. In the full system, KPT officers would see the uploaded file, issuer details, expiry date, and verification notes here.</div>`);
    addAudit(`Viewed ${documentName}`, "University");
    return;
  }
  const documentDownload = event.target.closest("[data-document-download]");
  if (documentDownload) {
    const documentName = documentDownload.dataset.documentDownload;
    openConfirm("Download document?", `Download ${documentName} for review?`, () => {
      addAudit(`Downloaded ${documentName}`, "University");
      addNotification("Document downloaded", `${documentName} was opened for KPT review.`, "universities");
    }, "Download");
    return;
  }
  const backUniversities = event.target.closest("[data-back-universities]");
  if (backUniversities) {
    setActiveView("universities");
    history.replaceState(null, "", "#universities");
    return;
  }
  const universityTab = event.target.closest("[data-university-tab]");
  if (universityTab) {
    const tab = universityTab.dataset.universityTab;
    document.querySelectorAll("[data-university-tab]").forEach((button) => button.classList.toggle("active", button === universityTab));
    document.querySelectorAll("[data-university-tab-panel]").forEach((panel) => panel.classList.toggle("active", panel.dataset.universityTabPanel === tab));
    return;
  }
  const sideUniversityTab = event.target.closest("[data-side-university-tab]");
  if (sideUniversityTab) {
    const tab = sideUniversityTab.dataset.sideUniversityTab;
    universitySidePanel?.querySelectorAll("[data-side-university-tab]").forEach((button) => button.classList.toggle("active", button === sideUniversityTab));
    universitySidePanel?.querySelectorAll("[data-side-university-panel]").forEach((panel) => {
      const active = panel.dataset.sideUniversityPanel === tab;
      panel.hidden = !active;
      panel.classList.toggle("active", active);
    });
    return;
  }
  const helpTab = event.target.closest("[data-help-tab]");
  if (helpTab) {
    const tab = helpTab.dataset.helpTab;
    document.querySelectorAll("[data-help-tab]").forEach((button) => button.classList.toggle("active", button === helpTab));
    document.querySelectorAll("[data-help-tab-panel]").forEach((panel) => panel.classList.toggle("active", panel.dataset.helpTabPanel === tab));
    return;
  }
  const programmeButton = event.target.closest("[data-programme-decision]");
  if (programmeButton) {
    renderProgrammeSidePanel(programmeButton.closest("tr"));
    return;
  }
  const programmeView = event.target.closest("[data-programme-view]");
  if (programmeView) {
    renderProgrammeSidePanel(programmeView.closest("tr"));
    return;
  }
  const closeProgrammeSide = event.target.closest("[data-close-programme-side]");
  if (closeProgrammeSide) {
    closeProgrammeSidePanel();
    return;
  }
  const closeApplicationSide = event.target.closest("[data-close-application-side]");
  if (closeApplicationSide) {
    closeApplicationSidePanel();
    return;
  }
  const applicationAction = event.target.closest("[data-application-action]");
  if (applicationAction) {
    const action = applicationAction.dataset.applicationAction;
    const data = activeApplicationRow ? applicationMeta(activeApplicationRow) : { name: "Selected applicant", tracking: "Application" };
    if (/review/i.test(action)) {
      openDetail("Application documents", `<div class="detail-note">Prototype application document review for ${escapeHtml(data.name)} (${escapeHtml(data.tracking)}). KPT / EMGS would see submitted files, university decisions, and EMGS requirements here.</div>`);
      addAudit(`Reviewed documents for ${data.tracking}`, "Application");
      return;
    }
    openConfirm(`${action}?`, `Confirm ${action.toLowerCase()} for ${data.name}?`, () => {
      addAudit(`${action} for ${data.tracking}`, "Application");
      addNotification(action, `${data.name} was updated in KPT / EMGS monitoring.`, "applications");
    }, /request/i.test(action) ? "Send" : "Confirm");
    return;
  }
  const programmePanelAction = event.target.closest("[data-programme-action]");
  if (programmePanelAction) {
    handleProgrammePanelAction(programmePanelAction);
    return;
  }
  const programmeGallery = event.target.closest("[data-programme-gallery]");
  if (programmeGallery) {
    const name = activeProgrammeRow ? getRowTitle(activeProgrammeRow) : "Programme";
    openDetail("Programme gallery", `
      <div class="detail-note">Prototype gallery preview for ${escapeHtml(name)}. In the full system, KPT officers would review submitted programme images, captions, image quality, and whether the gallery matches the programme description.</div>
      <div class="placeholder-gallery">
        <div><span>Image 1</span></div>
        <div><span>Image 2</span></div>
        <div><span>Image 3</span></div>
      </div>
    `);
    return;
  }
  const rowAction = event.target.closest("[data-row-action]");
  if (rowAction) {
    handleRowAction(rowAction);
    return;
  }
  const userEdit = event.target.closest("[data-user-edit]");
  if (userEdit) openUserForm(userEdit.closest("tr"));
});

document.querySelector("#addUser")?.addEventListener("click", () => openUserForm());

document.querySelectorAll("[data-queue-target]").forEach((button) => {
  button.addEventListener("click", () => openQueueTarget(button));
});

searchForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  runTopSearch((topSearch?.value || "").trim().toLowerCase());
});

topSearch?.addEventListener("input", () => {
  if (!topSearch.value.trim()) document.querySelectorAll(".highlight").forEach((item) => item.classList.remove("highlight"));
});

logoutButton?.addEventListener("click", (event) => {
  event.preventDefault();
  openConfirm("Logout from demo?", "This prototype will stay on the page, but the action will be recorded in the audit log.", () => {
    addAudit("Logged out from KPT / EMGS demo", "User");
    addNotification("Logout recorded", "The demo logout action was recorded in the audit log.", "audit");
  }, "Logout");
});

const hideHelpSupport = document.querySelector('#hideHelpSupport');
const helpVisibilityKey = 'kpt-emgs-hide-help-support';
function applyHelpVisibility() {
  const hidden = hideHelpSupport.checked;
  document.querySelector('[data-view-link="help"]').hidden = hidden;
  const helpPanel = document.querySelector('[data-view="help"]');
  helpPanel.hidden = hidden;
  if (hidden && helpPanel.classList.contains('active')) setActiveView('settings');
  try { localStorage.setItem(helpVisibilityKey, String(hidden)); } catch {}
}
try { hideHelpSupport.checked = localStorage.getItem(helpVisibilityKey) === 'true'; } catch {}
applyHelpVisibility();
hideHelpSupport.addEventListener('change', applyHelpVisibility);

document.querySelectorAll(".settings-list input[type='checkbox']").forEach((toggle) => {
  toggle.addEventListener("change", () => {
    const label = toggle.closest(".settings-toggle-row")?.querySelector("strong, .settings-option-title")?.textContent.trim() || "setting";
    addAudit(`${toggle.checked ? "Enabled" : "Disabled"} ${label}`, "Settings");
    addNotification("Settings updated", `${label} has been ${toggle.checked ? "enabled" : "disabled"}.`, "settings");
  });
});

notificationButton?.addEventListener("click", (event) => {
  event.stopPropagation();
  toggleNotificationsPanel();
});

notificationPanel?.addEventListener("click", (event) => {
  event.stopPropagation();
  const item = event.target.closest(".notification-item");
  if (!item) return;
  item.classList.remove("unread");
  updateNotificationCount();
  closeNotificationsPanel();
  setActiveView(item.dataset.notificationTarget);
  history.replaceState(null, "", `#${item.dataset.notificationTarget}`);
});

markNotificationsRead?.addEventListener("click", (event) => {
  event.stopPropagation();
  document.querySelectorAll(".notification-item.unread").forEach((item) => item.classList.remove("unread"));
  updateNotificationCount();
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".notification-wrap")) closeNotificationsPanel();
  if (event.target.closest(".section-tooltip")) return;
  document.querySelectorAll(".section-tooltip").forEach((tooltip) => tooltip.classList.remove("tooltip-open"));
});

closeConfirm?.addEventListener("click", closeConfirmModal);
cancelConfirm?.addEventListener("click", closeConfirmModal);
applyConfirm?.addEventListener("click", () => {
  const action = pendingAction;
  closeConfirmModal();
  action?.();
});

closeDetail?.addEventListener("click", closeDetailModal);
closeDetailAction?.addEventListener("click", closeDetailModal);
closeClarification?.addEventListener("click", closeClarificationForm);
cancelClarification?.addEventListener("click", closeClarificationForm);
sendClarification?.addEventListener("click", sendUniversityClarification);
closeUserModal?.addEventListener("click", closeUserForm);
cancelUserModal?.addEventListener("click", closeUserForm);
saveUserModal?.addEventListener("click", saveUserForm);

resetDemo?.addEventListener("click", () => {
  initialTables.forEach((html, body) => { body.innerHTML = html; });
  if (auditBody) auditBody.innerHTML = initialAuditHtml;
  const list = notificationPanel?.querySelector(".notification-list");
  if (list) list.innerHTML = initialNotificationHtml;
  document.querySelectorAll("input[type='search']").forEach((input) => { input.value = ""; });
  document.querySelectorAll("select").forEach((select) => { select.selectedIndex = 0; });
  document.querySelectorAll(".settings-list input[type='checkbox']").forEach((toggle) => { toggle.checked = toggle !== hideHelpSupport; });
  applyHelpVisibility();
  closeConfirmModal();
  closeDetailModal();
  closeClarificationForm();
  closeUserForm();
  addUniversityForm.reset();
  clearUniversityLogo();
  currentRegistrationRow = null;
  document.querySelector("#universityDraftStatus").hidden = true;
  closeNotificationsPanel();
  closeUniversitySidePanel();
  activeUniversityRow = null;
  updateNotificationCount();
  setActiveView("dashboard");
  history.replaceState(null, "", "#dashboard");
});

const initialHash = location.hash.replace("#", "");
if (initialHash) setActiveView(initialHash);
updateNotificationCount();

const addUniversityForm = document.querySelector("#addUniversityForm");
const universityLogoInput = document.querySelector("#newUniversityLogo");
const universityDraftKey = "kpt-emgs-university-registration-draft";
let currentRegistrationRow = null;
let universityLogoData = "";
let logoReadVersion = 0;
let logoLoading = false;
function clearUniversityLogo() {
  logoReadVersion++;
  logoLoading = false;
  universityLogoData = "";
  universityLogoInput.value = "";
  document.querySelector("#universityLogoPreview").hidden = true;
  document.querySelector("#universityLogoPreview").removeAttribute("src");
  document.querySelector("#logoPlaceholder").hidden = false;
  document.querySelector("#logoFileActions").hidden = true;
  document.querySelector("#logoError").hidden = true;
  document.querySelector("#logoUploadLabel").textContent = "Click to upload";
}
function loadUniversityLogo(file) {
  clearUniversityLogo();
  if (!file) return;
  const error = document.querySelector("#logoError");
  const showError = (message) => { error.textContent = message; error.hidden = false; };
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024) {
    showError("Choose a PNG, JPG or WebP image under 2 MB.");
    return;
  }
  const version = logoReadVersion;
  logoLoading = true;
  const reader = new FileReader();
  reader.onload = () => {
    const check = new Image();
    check.onload = () => {
      if (version !== logoReadVersion) return;
      logoLoading = false;
      error.hidden = true;
      universityLogoData = reader.result;
      const preview = document.querySelector("#universityLogoPreview");
      preview.src = universityLogoData;
      preview.hidden = false;
      document.querySelector("#logoPlaceholder").hidden = true;
      document.querySelector("#logoFileActions").hidden = false;
      document.querySelector("#logoFileName").textContent = file.name;
      document.querySelector("#logoUploadLabel").textContent = "Change logo";
    };
    check.onerror = () => {
      if (version !== logoReadVersion) return;
      logoLoading = false;
      showError("This image could not be opened. Please choose another file.");
    };
    check.src = reader.result;
  };
  reader.onerror = () => {
    if (version !== logoReadVersion) return;
    logoLoading = false;
    showError("Unable to read this file. Please try again.");
  };
  reader.readAsDataURL(file);
}
universityLogoInput.addEventListener("change", () => loadUniversityLogo(universityLogoInput.files[0]));
document.querySelector("#removeUniversityLogo").addEventListener("click", clearUniversityLogo);
const logoDropzone = document.querySelector("#universityLogoDropzone");
["dragenter", "dragover"].forEach((type) => logoDropzone.addEventListener(type, (event) => {
  event.preventDefault();
  logoDropzone.classList.add("dragging");
}));
["dragleave", "drop"].forEach((type) => logoDropzone.addEventListener(type, (event) => {
  event.preventDefault();
  logoDropzone.classList.remove("dragging");
  if (type === "drop") loadUniversityLogo(event.dataTransfer.files[0]);
}));
function closeAddUniversityForm() {
  setActiveView("universities");
  history.replaceState(null, "", "#universities");
  document.querySelector("#addUniversityButton")?.focus();
}
document.querySelector("#addUniversityButton")?.addEventListener("click", () => {
  currentRegistrationRow = null;
  document.querySelector("#universityDraftStatus").hidden = true;
  addUniversityForm.reset();
  clearUniversityLogo();
  document.querySelector("#newUniversityReference").setCustomValidity("");
  closeUniversitySidePanel();
  setActiveView("university-create");
  history.pushState(null, "", "#university-create");
  restoreUniversityDraft();
  document.querySelector("#newUniversityName").focus({ preventScroll: true });
});
document.querySelectorAll("[data-close-add-university]").forEach((button) => button.addEventListener("click", (event) => {
  event.preventDefault();
  closeAddUniversityForm();
}));
document.querySelector("#newUniversityReference").addEventListener("input", (event) => event.target.setCustomValidity(""));
window.addEventListener("hashchange", () => {
  const view = location.hash.slice(1);
  if ([...viewPanels].some((panel) => panel.dataset.view === view)) setActiveView(view);
});
addUniversityForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (logoLoading) {
    const error = document.querySelector("#logoError");
    error.textContent = "Your logo is still loading. Please try again in a moment.";
    error.hidden = false;
    return;
  }
  addUniversityForm.querySelectorAll('input:not([type="file"]), textarea').forEach((input) => { input.value = input.value.trim(); });
  if (!addUniversityForm.reportValidity()) return;
  const name = document.querySelector("#newUniversityName").value;
  const referenceInput = document.querySelector("#newUniversityReference");
  const reference = referenceInput.value;
  const body = document.querySelector('[data-table="universities"] tbody');
  if ([...body.rows].some((row) => row !== currentRegistrationRow && row.children[0].querySelector("small")?.textContent.trim().toLowerCase() === reference.toLowerCase())) {
    referenceInput.setCustomValidity("This KPT / MOHE registration number already exists.");
    referenceInput.reportValidity();
    return;
  }
  const updating = currentRegistrationRow?.isConnected;
  const row = updating ? currentRegistrationRow : document.createElement("tr");
  Object.assign(row.dataset, { status: "account created", compliance: "clear", openRequests: "0", responseTime: "Pending", complianceSignal: "Account created; awaiting first login and password change" });
  const details = Object.fromEntries(new FormData(addUniversityForm));
  delete details.logo;
  row.dataset.registrationDetails = JSON.stringify(details);
  row.dataset.logo = universityLogoData;
  row.innerHTML = `<td>${universityLogoData ? `<img class="registry-logo" src="${universityLogoData}" alt="${escapeHtml(name)} logo">` : ""}<span class="table-record-name">${escapeHtml(name)}</span><small>${escapeHtml(reference)}</small></td><td>${statusChip("Account Created", "blue")}</td><td>&mdash;</td><td>&mdash;</td><td>Pending</td><td>${currentTimestamp()}</td><td><button type="button" data-university-view>View</button></td>`;
  syncUniversityCounts(row);
  if (!updating) body.prepend(row);
  currentRegistrationRow = row;
  document.querySelector("#universitySearch").value = "";
  document.querySelector("#universityStatusFilter").selectedIndex = 0;
  applyTextFilter("universities", "#universitySearch", "#universityStatusFilter");
  addAudit(`${updating ? "Updated" : "Added"} university ${escapeHtml(name)}`, "University");
  addNotification("University added", `${escapeHtml(name)} has an account awaiting first login and password change.`, "universities");
  showUniversityAddedNotice(details, row);
});

function showUniversityAddedNotice(details, row) {
  row.dataset.notificationStatus = "Not requested";
  openConfirm("University added successfully", `Would you like to notify the primary contact at ${details.contactEmail} by email? The email will include their user login and temporary password.`, () => {
    row.dataset.notificationStatus = "Requested";
    addAudit(`Requested login email notification for ${escapeHtml(details.officialName)} to ${escapeHtml(details.contactEmail)}`, "University");
    try { localStorage.removeItem(universityDraftKey); } catch {}
    closeAddUniversityForm();
    addUniversityForm.reset();
    clearUniversityLogo();
    currentRegistrationRow = null;
  }, "Yes", "No");
}

// Temporary demo content generator for university registration.
let generatedUniversityCount = 0;
const demoUniversityProfiles = [
  { name: 'Meridian International University', type: 'Private University', address: '18 Jalan Demo, 50000 Kuala Lumpur', contact: 'Aisha Rahman', job: 'Director, International Office', role: 'University Administrator', initials: 'MI', color: '#35634f' },
  { name: 'Harbourview University College', type: 'University College', address: '42 Persiaran Contoh, 10200 George Town, Penang', contact: 'Daniel Tan', job: 'Coordinator, Global Engagement', role: 'University Coordinator', initials: 'HU', color: '#485c8a' },
  { name: 'Cedar Valley College', type: 'College', address: '9 Jalan Sampel, 80000 Johor Bahru, Johor', contact: 'Priya Kumar', job: 'Manager, Student Services', role: 'University Administrator', initials: 'CV', color: '#855944' },
  { name: 'Northstar Learning University', type: 'Private University', address: '25 Lorong Demo, 88400 Kota Kinabalu, Sabah', contact: 'Amir Hakim', job: 'Officer, International Relations', role: 'University Coordinator', initials: 'NL', color: '#506f80' },
  { name: 'Summit Coast Polytechnic', type: 'Polytechnic', address: '63 Jalan Contoh, 93000 Kuching, Sarawak', contact: 'Mei Ling Wong', job: 'Administrator, Programme Office', role: 'University Viewer', initials: 'SC', color: '#725585' }
];
document.querySelector('#generateUniversityContent').addEventListener('click', () => {
  currentRegistrationRow = null;
  document.querySelector('#universityDraftStatus').hidden = true;
  const profile = demoUniversityProfiles[generatedUniversityCount % demoUniversityProfiles.length];
  generatedUniversityCount++;
  const uniqueId = crypto.randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase();
  const slug = profile.name.toLowerCase().replaceAll(' ', '-');
  const values = {
    officialName: `${profile.name} (Demo ${generatedUniversityCount})`,
    registration: `DEMO-MOHE-${uniqueId}`,
    instituteType: profile.type,
    campusAddress: profile.address,
    website: `https://${slug}.example`,
    contactName: profile.contact,
    contactJob: profile.job,
    contactEmail: `contact.${generatedUniversityCount}@${slug}.example`,
    contactPhone: `+60 3 5550 ${String(1000 + generatedUniversityCount % 9000)}`,
    contactRole: profile.role
  };
  Object.entries(values).forEach(([name, value]) => {
    const field = addUniversityForm.elements.namedItem(name);
    field.value = value;
    field.setCustomValidity('');
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
  });
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const context = canvas.getContext('2d');
  context.fillStyle = profile.color;
  context.fillRect(0, 0, 256, 256);
  context.strokeStyle = '#ffffff80';
  context.lineWidth = 2;
  context.strokeRect(18, 18, 220, 220);
  context.fillStyle = '#ffffff';
  context.textAlign = 'center';
  context.font = 'bold 76px Arial';
  context.fillText(profile.initials, 128, 142);
  context.font = '14px Arial';
  context.fillText('DEMO UNIVERSITY', 128, 185);
  const pngBytes = Uint8Array.from(atob(canvas.toDataURL('image/png').split(',')[1]), (character) => character.charCodeAt(0));
  loadUniversityLogo(new File([pngBytes], `${slug}-demo-logo.png`, { type: 'image/png' }));
  document.querySelector('#universityGeneratorStatus').textContent = `Demo ${generatedUniversityCount} generated. Click again for different fictional details.`;
});

function showUniversityDraftStatus(message) {
  const status = document.querySelector('#universityDraftStatus');
  status.textContent = message;
  status.hidden = false;
}
function saveUniversityDraft() {
  if (logoLoading) {
    showUniversityDraftStatus('Please wait for the logo to finish loading before saving your draft.');
    return;
  }
  const fields = Object.fromEntries(new FormData(addUniversityForm));
  delete fields.logo;
  try {
    localStorage.setItem(universityDraftKey, JSON.stringify({ fields, logo: universityLogoData, logoName: document.querySelector('#logoFileName').textContent }));
    showUniversityDraftStatus('Draft saved on this browser. It will be restored when you open Add new university.');
  } catch {
    showUniversityDraftStatus('The draft could not be saved. Browser storage may be unavailable or full. Your entries are still in the form.');
  }
}
function restoreUniversityDraft() {
  try {
    const saved = localStorage.getItem(universityDraftKey);
    if (!saved) return;
    const draft = JSON.parse(saved);
    Object.entries(draft.fields).forEach(([name, value]) => {
      const field = addUniversityForm.elements.namedItem(name);
      if (field && name !== 'logo' && typeof value === 'string') {
        field.value = value;
        field.setCustomValidity('');
      }
    });
    if (typeof draft.logo === 'string' && /^data:image\/(png|jpeg|webp);base64,/.test(draft.logo)) {
      const bytes = Uint8Array.from(atob(draft.logo.split(',')[1]), character => character.charCodeAt(0));
      const type = draft.logo.slice(5, draft.logo.indexOf(';'));
      loadUniversityLogo(new File([bytes], draft.logoName || 'saved-logo.png', { type }));
    }
    showUniversityDraftStatus('Saved draft restored. Continue editing or add the university when ready.');
  } catch {
    showUniversityDraftStatus('The saved draft could not be restored. You can still fill in a new registration.');
  }
}
document.querySelector('#saveUniversityDraft').addEventListener('click', saveUniversityDraft);
if (location.hash === '#university-create') restoreUniversityDraft();

const universityStatusFlowModal = document.querySelector('#universityStatusFlowModal');
const universityStatusInfo = document.querySelector('#universityStatusInfo');
function closeUniversityStatusFlow() {
  universityStatusFlowModal.hidden = true;
  universityStatusInfo.focus({ preventScroll: true });
}
universityStatusInfo.addEventListener('click', () => {
  universityStatusFlowModal.hidden = false;
  universityStatusFlowModal.querySelector('[data-close-university-flow]').focus();
});
document.querySelectorAll('[data-close-university-flow]').forEach(button => button.addEventListener('click', closeUniversityStatusFlow));
universityStatusFlowModal.addEventListener('click', event => {
  if (event.target === universityStatusFlowModal) closeUniversityStatusFlow();
});
universityStatusFlowModal.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeUniversityStatusFlow();
  if (event.key === 'Tab') {
    const buttons = [...universityStatusFlowModal.querySelectorAll('button')];
    const first = buttons[0], last = buttons[buttons.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});

document.querySelector('#universityProfileBackdrop').addEventListener('click', closeUniversitySidePanel);
document.addEventListener('click', event => {
  if (event.target.closest('[data-profile-applicants]')) {
    openUniversityDetail(activeUniversityRow);
    document.querySelector('[data-university-tab="applicants"]').click();
  }
});
universitySidePanel.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeUniversitySidePanel();
  if (!event.target.matches('input, textarea, select') && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
    event.preventDefault();
    navigateUniversityDrawer(event.key === 'ArrowRight' ? 1 : -1);
  }
});

function universityApplicantsHtml(universityRow) {
  if (universityRow.dataset.status !== 'active') return '<div class="university-programmes-empty"><span class="university-empty-title">Applicants available once Active</span><p>Applicant records are available after the university activates its account.</p></div>';
  const university = getRowTitle(universityRow);
  const applicants = [...document.querySelectorAll('[data-table="applications"] tbody tr')].filter(row => row.children[1].textContent.trim() === university).map(applicationMeta);
  if (!applicants.length) return '<div class="university-programmes-empty"><span class="university-empty-title">No applicants yet</span><p>This university has no applicant records yet.</p></div>';
  const programmes = universityProfileProgrammes(universityRow).map(programme => programme.name);
  const nationalities = [...new Set(applicants.map(applicant => applicant.nationality))].sort();
  const statuses = APPLICATION_STATUSES;
  const options = values => values.map(value => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join('');
  return `<div class="filters university-applicant-filters"><label for="universityApplicantProgramme"><span>Programme</span><select class="range-select" id="universityApplicantProgramme" data-university-applicant-filter="programme"><option value="">All programmes</option>${options(programmes)}</select></label><label for="universityApplicantNationality"><span>Nationality</span><select class="range-select" id="universityApplicantNationality" data-university-applicant-filter="nationality"><option value="">All nationalities</option>${options(nationalities)}</select></label><label for="universityApplicantStatus"><span>Status</span><select class="range-select" id="universityApplicantStatus" data-university-applicant-filter="status"><option value="">All statuses</option>${options(statuses)}</select></label><button class="apply-btn" type="button" data-reset-university-applicant-filters>Reset</button></div><p class="university-applicant-list-note" id="universityApplicantResults" role="status">Showing ${applicants.length} of ${applicants.length} applicants</p><div class="recent-table-wrap"><table class="recent-table university-applicant-table"><thead><tr><th>Applicant</th><th>Programme</th><th>Status</th><th>Last updated</th><th>Action</th></tr></thead><tbody>${applicants.map(data => `<tr data-programme="${escapeHtml(data.programme)}" data-nationality="${escapeHtml(data.nationality)}" data-status="${escapeHtml(data.stage)}"><td>${escapeHtml(data.name)}<small>${escapeHtml(data.tracking)}</small><small>${escapeHtml(data.nationality)}</small></td><td>${escapeHtml(data.programme)}</td><td>${statusChip(data.stage, applicationStatusColor(data.stage))}</td><td>${escapeHtml(data.lastUpdated)}</td><td><button type="button" data-university-applicant-view="${escapeHtml(data.tracking)}">View</button></td></tr>`).join('')}</tbody></table></div><div id="universityApplicantEmpty" class="university-programmes-empty" hidden><span class="university-empty-title">No matching applicants</span><p>Try another programme, nationality or status, or reset the filters.</p></div>`;
}
function filterUniversityApplicants() {
  const content = document.querySelector('#universityApplicantsContent');
  const filters = [...content.querySelectorAll('[data-university-applicant-filter]')];
  const rows = [...content.querySelectorAll('.university-applicant-table tbody tr')];
  let visible = 0;
  rows.forEach(row => {
    row.hidden = !filters.every(filter => !filter.value || row.dataset[filter.dataset.universityApplicantFilter] === filter.value);
    if (!row.hidden) visible++;
  });
  content.querySelector('#universityApplicantResults').textContent = `Showing ${visible} of ${rows.length} applicants`;
  content.querySelector('#universityApplicantEmpty').hidden = visible !== 0;
  content.querySelector('.recent-table-wrap').hidden = visible === 0;
}
document.addEventListener('change', event => {
  if (event.target.matches('[data-university-applicant-filter]')) filterUniversityApplicants();
});
document.addEventListener('click', event => {
  if (!event.target.closest('[data-reset-university-applicant-filters]')) return;
  document.querySelectorAll('#universityApplicantsContent [data-university-applicant-filter]').forEach(filter => { filter.value = ''; });
  filterUniversityApplicants();
});

document.addEventListener('click', event => {
  const button = event.target.closest('[data-university-applicant-view]');
  if (!button) return;
  const row = [...document.querySelectorAll('[data-table="applications"] tbody tr')].find(row => applicationMeta(row).tracking === button.dataset.universityApplicantView);
  if (!row) return;
  closeApplicationSidePanel();
  document.querySelector('#applicationSearch').value = applicationMeta(row).university;
  ['#applicationStageFilter', '#applicationNationalityFilter', '#applicationProgrammeTypeFilter'].forEach(selector => { document.querySelector(selector).selectedIndex = 0; });
  filterApplications();
  setActiveView('applications');
  history.replaceState(null, '', '#applications');
  openApplicationSidePanel(row);
});

const universityActionModal = document.querySelector('#universityActionModal');
const universityActionBody = document.querySelector('#universityActionModalBody');
let universityActionRow = null;
let universityActionMode = '';
let universityActionReturnFocus = null;
function openUniversityActionModal(title, body, row, mode = '') {
  universityActionRow = row;
  universityActionMode = mode;
  universityActionReturnFocus = document.activeElement;
  document.querySelector('#universityActionModalTitle').textContent = title;
  universityActionBody.innerHTML = body;
  universityActionModal.hidden = false;
  universityActionModal.querySelector('input, textarea, button').focus();
}
function closeUniversityActionModal() {
  universityActionModal.hidden = true;
  universityActionRow = null;
  universityActionMode = '';
  if (universityActionReturnFocus?.isConnected) universityActionReturnFocus.focus({ preventScroll: true });
}
function refreshUniversityProfile(row) {
  const fullPage = document.querySelector('[data-view="university-detail"]').classList.contains('active');
  const tab = fullPage ? document.querySelector('[data-university-tab].active')?.dataset.universityTab : universitySidePanel.querySelector('[data-side-university-tab].active')?.dataset.sideUniversityTab;
  if (fullPage) {
    renderUniversityDetail(row);
    document.querySelector(`[data-university-tab="${tab || 'overview'}"]`)?.click();
  } else {
    renderUniversitySidePanel(row);
    universitySidePanel.querySelector(`[data-side-university-tab="${tab || 'overview'}"]`)?.click();
  }
}
function handleUniversityProfileAction(row, action) {
  const details = JSON.parse(row.dataset.registrationDetails || '{}');
  const status = row.dataset.status;
  const review = ['pending review', 'clarification requested'].includes(status);
  if (action === 'approve' && review) return confirmUniversityDecision(row, 'Account Created', 'Clear', 'Accept');
  if (action === 'clarify' && status === 'pending review') return openClarificationForm();
  if (action === 'reject' && review) return openUniversityActionModal('Reject application', `<p class="university-action-intro">Record why ${escapeHtml(details.officialName)} is being rejected.</p><form id="universityProfileActionForm"><label class="university-action-field"><span>Rejection reason</span><textarea name="rejectionReason" rows="5" required maxlength="1500" placeholder="Explain what prevented acceptance"></textarea></label><div class="modal-actions"><button type="button" data-close-university-action>Cancel</button><button class="danger" type="submit">Reject application</button></div></form>`, row, 'reject');
  if (action === 'history' && status === 'clarification requested') {
    const history = universityClarifications(row);
    const body = history.length ? `<ol class="university-history-list">${history.map(item => `<li><small>${escapeHtml(item.time)}</small><p class="university-history-title">${escapeHtml(item.title)}</p><p>${escapeHtml(item.message)}</p></li>`).join('')}</ol>` : '<p class="university-action-intro">No clarification messages have been recorded yet.</p>';
    return openUniversityActionModal('Clarification history', `${body}<div class="modal-actions"><button type="button" data-close-university-action>Done</button></div>`, row);
  }
  if (action === 'reason' && status === 'rejected') return openUniversityActionModal('Rejection reason', `<p class="university-action-intro">${escapeHtml(details.officialName)}</p><div class="university-rejection-note"><small>${escapeHtml(row.dataset.rejectionTime || '')}</small><p>${escapeHtml(row.dataset.rejectionReason || 'No rejection reason has been recorded.')}</p></div><div class="modal-actions"><button type="button" data-close-university-action>Done</button></div>`, row);
  if (action === 'reopen' && status === 'rejected') return openConfirm('Reopen for review?', `Return ${details.officialName} to Pending Review?`, () => {
    updateUniversityRow(row, 'Pending Review', 'Action Required');
    addAudit(`Reopened application for ${escapeHtml(details.officialName)}`, 'University');
    refreshUniversityProfile(row);
  }, 'Reopen', 'Cancel');
  if (action === 'reminder' && status === 'clarification requested') return openConfirm('Send clarification reminder?', `Request an email reminder to ${details.contactEmail} about the outstanding clarification?`, () => {
    const history = universityClarifications(row);
    history.unshift({ title: 'Clarification reminder requested', message: `Reminder requested for ${details.contactEmail}.`, time: currentTimestamp() });
    row.dataset.clarifications = JSON.stringify(history);
    row.dataset.reminderRequested = currentTimestamp();
    addAudit(`Requested clarification reminder for ${escapeHtml(details.officialName)}`, 'University');
    refreshUniversityProfile(row);
  }, 'Request reminder', 'Cancel');
  if (action === 'login-email' && status === 'account created') return openConfirm(row.dataset.notificationStatus === 'Requested' ? 'Resend login email?' : 'Send login email?', `Request an email to ${details.contactEmail} with the user login and temporary password?`, () => {
    row.dataset.notificationStatus = 'Requested';
    addAudit(`Requested login email for ${escapeHtml(details.officialName)}`, 'University');
    refreshUniversityProfile(row);
  }, 'Yes', 'No');
  if (action === 'reset-password' && status === 'active') return openConfirm('Send password reset link?', `Request a secure, single-use password reset link for ${details.contactEmail}? The university will use the link to create a new password. Its current password remains valid until the reset is completed, and its status stays Active.`, () => {
    row.dataset.passwordResetRequested = currentTimestamp();
    addAudit(`Requested password reset link for ${escapeHtml(details.officialName)}`, 'University');
    refreshUniversityProfile(row);
  }, 'Send reset link', 'Cancel');
  if (action === 'edit' && ['active', 'account created'].includes(status)) {
    const sections = [...addUniversityForm.querySelectorAll('.registration-main .registration-fields')].map((fields, index) => {
      const clone = fields.cloneNode(true);
      clone.querySelectorAll('[id]').forEach(element => element.removeAttribute('id'));
      return `<section class="university-edit-section"><h4>${index === 0 ? 'University details' : 'Primary contact'}</h4>${clone.outerHTML}</section>`;
    }).join('');
    openUniversityActionModal('Edit university profile', `<form id="universityProfileActionForm">${sections}<section class="university-edit-section"><h4>University logo</h4><div class="university-edit-logo">${row.dataset.logo ? `<img src="${escapeHtml(row.dataset.logo)}" alt="Current university logo">` : ''}<label class="university-action-field"><span>Replace logo (optional)</span><input name="profileLogo" type="file" accept="image/png,image/jpeg,image/webp"><small>PNG, JPG or WebP. Maximum 2 MB.</small></label></div></section><p id="universityEditError" class="registration-error" role="alert" hidden></p><div class="modal-actions"><button type="button" data-close-university-action>Cancel</button><button class="primary" type="submit">Save changes</button></div></form>`, row, 'edit');
    const form = universityActionBody.querySelector('form');
    Object.entries(details).forEach(([name, value]) => { const field = form.elements.namedItem(name); if (field) field.value = value; });
  }
}
function readUniversityProfileLogo(file) {
  return new Promise((resolve, reject) => {
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) return reject(new Error('Choose a PNG, JPG or WebP image under 2 MB.'));
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('The logo could not be read. Please choose another file.'));
    reader.onload = () => {
      const check = new Image();
      check.onload = () => resolve(reader.result);
      check.onerror = () => reject(new Error('This image could not be opened. Please choose another file.'));
      check.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
universityActionModal.addEventListener('submit', async event => {
  const form = event.target.closest('#universityProfileActionForm');
  if (!form) return;
  event.preventDefault();
  form.querySelectorAll('input:not([type="file"]), textarea').forEach(field => { field.value = field.value.trim(); });
  if (!form.reportValidity()) return;
  const row = universityActionRow;
  if (!row) return;
  if (universityActionMode === 'reject') {
    row.dataset.rejectionReason = form.elements.rejectionReason.value;
    row.dataset.rejectionTime = currentTimestamp();
    updateUniversityRow(row, 'Rejected', 'Blocked');
    addAudit(`Rejected application for ${escapeHtml(getRowTitle(row))}: ${escapeHtml(row.dataset.rejectionReason)}`, 'University');
    closeUniversityActionModal();
    refreshUniversityProfile(row);
    return;
  }
  if (universityActionMode !== 'edit') return;
  const previous = JSON.parse(row.dataset.registrationDetails);
  const details = Object.fromEntries(new FormData(form));
  const reference = form.elements.registration;
  const duplicate = [...document.querySelectorAll('[data-table="universities"] tbody tr')].some(other => other !== row && [JSON.parse(other.dataset.registrationDetails || '{}').registration, other.children[0].querySelector('small')?.textContent].some(value => value?.trim().toLowerCase() === details.registration.toLowerCase()));
  if (duplicate) { reference.setCustomValidity('This registration number already exists.'); reference.reportValidity(); return; }
  const submit = form.querySelector('[type="submit"]');
  submit.disabled = true;
  let logo = row.dataset.logo;
  try {
    if (details.profileLogo.size) logo = await readUniversityProfileLogo(details.profileLogo);
    if (universityActionRow !== row || universityActionModal.hidden || !universityActionBody.contains(form)) return;
    delete details.profileLogo;
    row.dataset.profileProgrammes = JSON.stringify(universityProfileProgrammes(row));
    row.dataset.registrationDetails = JSON.stringify(details);
    row.dataset.logo = logo;
    row.children[0].innerHTML = `${logo ? `<img class="registry-logo" src="${escapeHtml(logo)}" alt="${escapeHtml(details.officialName)} logo">` : ''}<span class="table-record-name">${escapeHtml(details.officialName)}</span><small>${escapeHtml(details.registration)}</small>`;
    if (previous.officialName !== details.officialName) {
      document.querySelectorAll('[data-table="applications"] tbody tr, [data-table="programmes"] tbody tr').forEach(record => {
        if (record.children[1].textContent.trim() === previous.officialName) record.children[1].textContent = details.officialName;
      });
    }
    row.children[5].textContent = currentTimestamp();
    addAudit(`Updated university profile ${escapeHtml(details.officialName)}`, 'University');
    closeUniversityActionModal();
    refreshUniversityProfile(row);
  } catch (error) {
    const output = form.querySelector('#universityEditError');
    output.textContent = error.message;
    output.hidden = false;
  } finally { submit.disabled = false; }
});
universityActionModal.addEventListener('input', event => event.target.setCustomValidity?.(''));
universityActionModal.addEventListener('click', event => { if (event.target === universityActionModal || event.target.closest('[data-close-university-action]')) closeUniversityActionModal(); });
universityActionModal.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeUniversityActionModal();
  if (event.key !== 'Tab') return;
  const elements = [...universityActionModal.querySelectorAll('button, input, textarea, select, a[href]')].filter(element => !element.disabled && element.getClientRects().length);
  const first = elements[0], last = elements[elements.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});

clarificationMessage?.addEventListener("input", () => clarificationMessage.setCustomValidity(""));

// Fictional applicant records matched to the demo university and programme totals.
function seedUniversityApplicants() {
  const body = document.querySelector('[data-table="applications"] tbody');
  if (!body) return;
  const names = {
    India: [['Aarav', 'Priya', 'Arjun', 'Ananya', 'Rohan', 'Neha', 'Vikram', 'Diya'], ['Sharma', 'Menon', 'Patel', 'Nair', 'Kumar', 'Rao']],
    China: [['Wei', 'Mei', 'Jun', 'Lin', 'Yan', 'Hao', 'Jia', 'Xin'], ['Chen', 'Wang', 'Zhang', 'Liu', 'Li', 'Zhou']],
    Australia: [['Oliver', 'Charlotte', 'Noah', 'Amelia', 'Jack', 'Isla', 'Henry', 'Mia'], ['Taylor', 'Brown', 'Wilson', 'Martin', 'Anderson', 'Walker']],
    Japan: [['Haruto', 'Yui', 'Ren', 'Aoi', 'Sota', 'Hina', 'Yuto', 'Sakura'], ['Tanaka', 'Sato', 'Suzuki', 'Takahashi', 'Watanabe', 'Ito']],
    Malaysia: [['Aiman', 'Nur Aisha', 'Daniel', 'Mei Ling', 'Amir', 'Farah', 'Ravi', 'Priya'], ['Rahman', 'Abdullah', 'Tan', 'Wong', 'Hassan', 'Lim']],
    Nigeria: [['Chidi', 'Ada', 'Tunde', 'Amina', 'Emeka', 'Zainab', 'Ife', 'Ngozi'], ['Okafor', 'Adeyemi', 'Bello', 'Nwosu', 'Balogun', 'Ibrahim']],
    Spain: [['Mateo', 'Lucia', 'Hugo', 'Sofia', 'Pablo', 'Elena', 'Diego', 'Alba'], ['Garcia', 'Martinez', 'Lopez', 'Sanchez', 'Romero', 'Torres']]
  };
  const countries = Object.keys(names);
  const stages = APPLICATION_STATUSES;
  const snapshot = new Date('2026-10-09T04:00:00Z');
  const dateBefore = days => new Date(snapshot.getTime() - days * 86400000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kuala_Lumpur' });
  const fragment = document.createDocumentFragment();
  let serial = 0;
  document.querySelectorAll('[data-table="universities"] tbody tr').forEach(universityRow => {
    const university = getRowTitle(universityRow);
    universityProfileProgrammes(universityRow).forEach(programme => {
      for (let index = 0; index < programme.applicants; index++) {
        const country = countries[serial % countries.length];
        const [first, last] = names[country];
        const round = Math.floor(serial / countries.length);
        const middleNames = ['Idris', 'Devi', 'Alex', 'Hana', 'Reza', 'Maya', 'Sam', 'Noor'];
        const cycle = Math.floor(round / (first.length * last.length));
        const name = `${first[round % first.length]}${cycle ? ' ' + middleNames[(cycle - 1) % middleNames.length] : ''} ${last[Math.floor(round / first.length) % last.length]}`;
        const tracking = `EDT-2026-${String(100001 + serial)}`;
        const stage = programme.status === 'Archived' ? ['Approved', 'Withdrawn', 'Rejected'][index % 3] : stages[serial % stages.length];
        const closed = ['Approved', 'Rejected', 'Withdrawn'].includes(stage);
        // Mix recent intake with older cases so the dashboard shows daily activity.
        const recent = serial % 10 < 6;
        const appliedDaysAgo = recent ? (serial * 5 + Math.floor(serial / 10)) % 14 : 1 + (serial * 7) % 90 + 3 + serial % 12;
        const days = recent ? Math.max(0, appliedDaysAgo - 1 - serial % 3) : 1 + (serial * 7) % 90;
        const updated = dateBefore(days);
        const row = document.createElement('tr');
        Object.assign(row.dataset, { stage: stage.toLowerCase(), nationality: country.toLowerCase(), demoApplicant: 'true', programmeCategory: programme.category, actionAge: closed ? '-' : `${days} days`, appliedDate: dateBefore(appliedDaysAgo), email: `applicant.${100001 + serial}@student.example`, phone: `+60 11 555 ${String(1000 + serial)}` });
        row.innerHTML = `<td>${escapeHtml(name)}<small>${tracking}</small><small>${country}</small></td><td>${escapeHtml(university)}</td><td>${escapeHtml(programme.name)}</td><td>${statusChip(stage, applicationStatusColor(stage))}</td><td>${updated}</td><td>${escapeHtml(row.dataset.appliedDate)}</td><td><span class="table-actions"><button type="button" data-row-action="View application">View</button>${!closed && days >= 60 ? '<button type="button" data-row-action="Escalate case">Escalate</button>' : ''}</span></td>`;
        fragment.append(row);
        serial++;
      }
    });
  });
  body.replaceChildren(fragment);
  const typeFilter = document.querySelector('#applicationProgrammeTypeFilter');
  if (typeFilter) {
    const categories = [...new Set([...body.rows].map(row => row.dataset.programmeCategory))].sort();
    typeFilter.innerHTML = '<option value="">All programme types</option>' + categories.map(category => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join('');
  }
}

document.querySelector('#universityActionsInfo').addEventListener('click', () => {
  const stages = [
    ['Pending Review', 'amber', [
      ['Accept application', 'Accept the application and create the university account. Its status becomes Account Created.'],
      ['Request clarification', 'Ask the university to explain or correct its registration details. Its status becomes Clarification Requested.'],
      ['Reject application', 'Record a rejection reason and change the status to Rejected.']
    ]],
    ['Clarification Requested', 'purple', [
      ['View clarification history', 'Read previous requests and recorded reminders.'],
      ['Send reminder', 'Request an email reminder asking the university to respond.'],
      ['Accept application', 'Accept the application once the information is satisfactory and create its account.'],
      ['Reject application', 'Record why the application cannot be accepted and close it as Rejected.']
    ]],
    ['Rejected', 'red', [
      ['View rejection reason', 'Read the recorded reason and the date of the decision.'],
      ['Reopen for review', 'Return the application to Pending Review so KPT can reconsider it.']
    ]],
    ['Account Created', 'blue', [
      ['Send / resend login email', 'Request an email containing the user login and temporary password. The status stays Account Created until first login and password change.'],
      ['Edit profile', 'Update university details, primary contact information or the logo.']
    ]],
    ['Active', 'green', [
      ['View all applicants', 'Open the university detail page with its Applicants tab selected.'],
      ['Edit profile', 'Update the profile while keeping the account Active.'],
      ['Send password reset link', 'Request an email to the primary contact with a secure link to create a new password. The link expires and can be used only once. The current password stays valid until the reset is completed, and the university remains Active. KPT does not see either password.']
    ]]
  ];
  const body = `<p class="university-action-intro">View opens the university profile. The right-hand Actions panel offers the buttons below according to its status.</p><div class="university-action-guide">${stages.map(([stage, color, actions]) => `<section>${statusChip(stage, color)}<dl>${actions.map(([label, description]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(description)}</dd></div>`).join('')}</dl></section>`).join('')}</div><p class="university-actions-common">Email contact is available at every status and opens your email application. Programmes are available in the Programmes tab.</p><div class="modal-actions"><button class="primary" type="button" data-close-university-action>Got it</button></div>`;
  openUniversityActionModal('University actions by status', body, null);
});

function universityDrawerRows(current) {
  return [...document.querySelectorAll('[data-table="universities"] tbody tr')].filter(row => !row.hidden || row === current);
}
function universityDrawerNavigationHtml(row) {
  const rows = universityDrawerRows(row);
  const index = rows.indexOf(row);
  return `<div class="university-drawer-navigation"><div><button type="button" data-university-drawer-step="-1" ${index <= 0 ? 'disabled' : ''} aria-label="Previous university">&larr; Previous</button><button type="button" data-university-drawer-step="1" ${index >= rows.length - 1 ? 'disabled' : ''} aria-label="Next university">Next &rarr;</button><button class="university-modal-close" type="button" data-close-side-panel aria-label="Close university details" title="Close university details"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div><span>${index + 1} of ${rows.length} universities</span></div>`;
}
function navigateUniversityDrawer(step) {
  const rows = universityDrawerRows(activeUniversityRow);
  const index = rows.indexOf(activeUniversityRow);
  const next = rows[index + step];
  if (!next) return;
  const tab = universitySidePanel.querySelector('[data-side-university-tab].active')?.dataset.sideUniversityTab || 'overview';
  renderUniversitySidePanel(next);
  universitySidePanel.querySelector(`[data-side-university-tab="${tab}"]`)?.click();
  const button = universitySidePanel.querySelector(`[data-university-drawer-step="${step}"]`);
  if (!button.disabled) button.focus({ preventScroll: true });
}
document.addEventListener('click', event => {
  const button = event.target.closest('[data-university-drawer-step]');
  if (button) navigateUniversityDrawer(Number(button.dataset.universityDrawerStep));
});
universitySidePanel.addEventListener('animationend', event => {
  if (event.target === universitySidePanel) universitySidePanel.classList.remove('university-drawer-enter');
});

initializeDashboardData();
