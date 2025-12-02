<template>
  <div class="honeypot-alert-history-view">
    <div class="page-header">
      <h1>Honeypot Alert History</h1>
      <button @click="handleRefresh" class="refresh-btn" :disabled="loading">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="23 4 23 10 17 10"></polyline>
          <polyline points="1 20 1 14 7 14"></polyline>
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
        </svg>
        <span>새로고침</span>
      </button>
    </div>

    <!-- Filters Section -->
    <div class="filters-section">
      <!-- Period Filter Row -->
      <div class="filter-row period-row">
        <div class="filter-group filter-group-period">
          <label for="startDate">시작 시간:</label>
          <input
            type="datetime-local"
            id="startDate"
            v-model="filters.startDate"
            step="1"
            @change="handleFilterChange"
          />
        </div>

        <div class="filter-group filter-group-period">
          <label for="endDate">종료 시간:</label>
          <input
            type="datetime-local"
            id="endDate"
            v-model="filters.endDate"
            step="1"
            @change="handleFilterChange"
          />
        </div>
      </div>

      <!-- Other Filters Row -->
      <div class="filter-row other-filters-row">
        <div class="filter-group">
          <label for="honeypotId">Honeypot:</label>
          <select
            id="honeypotId"
            v-model="filters.honeypotId"
            @focus="loadFilterOptions('honeypotId')"
            @change="handleFilterChange"
          >
            <option value="">전체</option>
            <option v-for="option in filterOptions.honeypotId" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label for="severity">심각도:</label>
          <select
            id="severity"
            v-model="filters.severity"
            @focus="loadFilterOptions('severity')"
            @change="handleFilterChange"
          >
            <option value="">전체</option>
            <option v-for="option in filterOptions.severity" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label for="cloudAccountId">Cloud Account:</label>
          <select
            id="cloudAccountId"
            v-model="filters.cloudAccountId"
            @focus="loadFilterOptions('cloudAccountId')"
            @change="handleFilterChange"
          >
            <option value="">전체</option>
            <option v-for="option in filterOptions.cloudAccountId" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label for="pageSize">페이지 크기:</label>
          <select id="pageSize" v-model="pageLimit" @change="handlePageSizeChange">
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading">로딩 중...</div>

    <div v-else-if="error" class="error-card">
      <h3>오류 발생</h3>
      <p>{{ error }}</p>
      <button @click="handleRefresh" class="retry-button">다시 시도</button>
    </div>

    <div v-else class="alerts-container">
      <table class="alerts-table">
        <thead>
          <tr>
            <th>메시지</th>
            <th>발생 시간</th>
            <th>소스 IP</th>
            <th>목적지 IP</th>
            <th>포트</th>
            <th>프로토콜</th>
            <th>심각도</th>
            <th>작업</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="alert in alerts" :key="alert.id">
            <td class="alert-message">{{ formatAlertMessage(alert) }}</td>
            <td>{{ formatDate(alert.timestamp || alert.created) }}</td>
            <td>{{ alert.sourceIp || '-' }}</td>
            <td>{{ alert.destinationIp || '-' }}</td>
            <td>{{ alert.port || '-' }}</td>
            <td>{{ alert.protocol || '-' }}</td>
            <td>
              <span class="severity-badge" :class="`severity-${alert.severity?.toLowerCase()}`">
                {{ alert.severity || '-' }}
              </span>
            </td>
            <td class="actions">
              <button @click="viewAlertDetail(alert)" class="action-btn view-btn" title="상세보기">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="alerts.length === 0" class="no-data">
        알림 이력이 없습니다.
      </div>

      <!-- Pagination -->
      <div class="pagination">
        <button @click="goToFirstPage" :disabled="currentOffset === 0" class="page-btn">
          처음
        </button>
        <button @click="goToPreviousPage" :disabled="currentOffset === 0" class="page-btn">
          이전
        </button>
        <span class="page-info">
          페이지 {{ currentPageNumber }} ({{ alerts.length }}개 항목 표시)
          <span v-if="hasMorePages" class="more-indicator">• 다음 페이지 있음</span>
        </span>
        <button @click="goToNextPage" :disabled="!hasMorePages" class="page-btn">
          다음
        </button>
      </div>
    </div>

    <!-- Detail Modal -->
    <div v-if="showDetailModal" class="modal-overlay" @click="closeDetailModal">
      <div class="modal-content modal-content-wide" @click.stop>
        <div class="modal-header">
          <h2>Alert 상세 정보</h2>
          <button @click="closeDetailModal" class="close-btn" title="닫기">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="modal-body">
          <div v-if="loadingDetail" class="loading">로딩 중...</div>
          <div v-else-if="selectedAlert" class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Alert ID:</span>
              <span class="detail-value">{{ selectedAlert.id }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">발생 시간:</span>
              <span class="detail-value">{{ formatDate(selectedAlert.timestamp || selectedAlert.created) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">소스 IP:</span>
              <span class="detail-value">{{ selectedAlert.sourceIp || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">목적지 IP:</span>
              <span class="detail-value">{{ selectedAlert.destinationIp || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">포트:</span>
              <span class="detail-value">{{ selectedAlert.port || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">프로토콜:</span>
              <span class="detail-value">{{ selectedAlert.protocol || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">심각도:</span>
              <span class="detail-value">
                <span class="severity-badge" :class="`severity-${selectedAlert.severity?.toLowerCase()}`">
                  {{ selectedAlert.severity || '-' }}
                </span>
              </span>
            </div>
            <div v-if="selectedAlert.message" class="detail-item full-width">
              <span class="detail-label">메시지:</span>
              <div class="detail-value message-content">{{ selectedAlert.message }}</div>
            </div>
            <div class="detail-item full-width">
              <span class="detail-label">상세 내용 (JSON):</span>
              <pre class="detail-value">{{ JSON.stringify(selectedAlert, null, 2) }}</pre>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button @click="closeDetailModal" class="secondary-button">
            닫기
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue';
import apiService from '../services/api';

const loading = ref(false);
const loadingDetail = ref(false);
const error = ref<string | null>(null);
const alerts = ref<any[]>([]);
const selectedAlert = ref<any>(null);
const showDetailModal = ref(false);

// Pagination (offset-based)
const currentOffset = ref(0);
const pageLimit = ref(25);
const hasMorePages = ref(false);

// Computed current page number
const currentPageNumber = computed(() => {
  return Math.floor(currentOffset.value / pageLimit.value) + 1;
});

// Initialize default date range (last 24 hours)
function getDefaultDateRange() {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const formatDateTime = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  };

  return {
    startDate: formatDateTime(yesterday),
    endDate: formatDateTime(now)
  };
}

const defaultDates = getDefaultDateRange();

// Filters
const filters = reactive({
  startDate: defaultDates.startDate,
  endDate: defaultDates.endDate,
  honeypotId: '',
  severity: '',
  cloudAccountId: ''
});

// Filter options (dynamically loaded)
const filterOptions = reactive({
  honeypotId: [] as Array<{ value: string; label: string }>,
  severity: [] as Array<{ value: string; label: string }>,
  cloudAccountId: [] as Array<{ value: string; label: string }>
});

// Track which filters have been loaded
const filterLoaded = reactive({
  honeypotId: false,
  severity: false,
  cloudAccountId: false
});

// Build conditions array from filters
function buildConditions() {
  const conditions: any[] = [];

  if (filters.honeypotId) {
    conditions.push({
      key: 'honeypotId',
      operator: '==',
      value: [filters.honeypotId]
    });
  }
  if (filters.severity) {
    conditions.push({
      key: 'severity',
      operator: '==',
      value: [filters.severity]
    });
  }
  if (filters.cloudAccountId) {
    conditions.push({
      key: 'cloudAccountId',
      operator: '==',
      value: [filters.cloudAccountId]
    });
  }

  return conditions;
}

// Build period object from datetime filters
function buildPeriod() {
  if (!filters.startDate && !filters.endDate) {
    return undefined;
  }

  const period: any = {};
  if (filters.startDate) {
    period.startDate = new Date(filters.startDate).toISOString();
  }
  if (filters.endDate) {
    period.endDate = new Date(filters.endDate).toISOString();
  }

  return period;
}

async function fetchAlerts() {
  loading.value = true;
  error.value = null;

  try {
    const period = buildPeriod();
    const conditions = buildConditions();

    const result = await apiService.searchHoneypotAlertHistory({
      period,
      conditions,
      orderBy: 'created',
      sort: 'desc',
      offset: currentOffset.value,
      limit: pageLimit.value
    });

    alerts.value = result.alerts || [];
    hasMorePages.value = result.exceedLimit || false;

    console.log('Honeypot alerts fetched:', alerts.value.length, 'items');
    console.log('Page limit:', pageLimit.value);
    console.log('Current offset:', currentOffset.value);
    console.log('Has more pages:', hasMorePages.value);
  } catch (err: any) {
    error.value = err.response?.data?.message || err.message || 'Failed to fetch honeypot alert history';
    console.error('Error fetching honeypot alerts:', err);
  } finally {
    loading.value = false;
  }
}

async function loadFilterOptions(filterKey: string) {
  const key = filterKey as keyof typeof filterOptions;

  // Skip if already loaded
  if (filterLoaded[key]) {
    console.log(`Filter ${filterKey} already loaded, skipping...`);
    return;
  }

  console.log(`Loading filter options for ${filterKey}...`);

  try {
    const period = buildPeriod();
    const conditions = buildConditions();

    console.log(`Request payload for ${filterKey}:`, {
      filterKey,
      conditions,
      period
    });

    const options = await apiService.getHoneypotAlertHistoryFilters({
      filterKey,
      conditions,
      period
    });

    console.log(`Raw API response for ${filterKey}:`, options);

    // Transform the response to { value: id, label: name } format
    if (Array.isArray(options)) {
      const mappedOptions = options.map((item: any) => ({
        value: item.id || item.value || item,
        label: item.name || item.label || item.id || item.value || item
      }));

      console.log(`Mapped options for ${filterKey}:`, mappedOptions);

      // Clear existing options and add new ones to ensure reactivity
      filterOptions[key].length = 0;
      filterOptions[key].push(...mappedOptions);

      // Mark as loaded
      filterLoaded[key] = true;

      console.log(`Filter options successfully loaded for ${filterKey}. Total: ${filterOptions[key].length}`);
    } else {
      console.warn(`API response for ${filterKey} is not an array:`, options);
    }
  } catch (err: any) {
    console.error(`Error loading filter options for ${filterKey}:`, err);
    console.error('Error details:', err.response?.data || err.message);
  }
}

async function handleFilterChange() {
  // Reset to first page when filters change
  currentOffset.value = 0;

  // Reset filter loaded flags to reload options with new filter combination
  filterLoaded.honeypotId = false;
  filterLoaded.severity = false;
  filterLoaded.cloudAccountId = false;

  // Fetch alerts with new filters
  await fetchAlerts();
}

async function handleRefresh() {
  currentOffset.value = 0;

  // Reset filter loaded flags
  filterLoaded.honeypotId = false;
  filterLoaded.severity = false;
  filterLoaded.cloudAccountId = false;

  await fetchAlerts();
}

function handlePageSizeChange() {
  currentOffset.value = 0;
  fetchAlerts();
}

function goToFirstPage() {
  currentOffset.value = 0;
  fetchAlerts();
}

function goToPreviousPage() {
  if (currentOffset.value >= pageLimit.value) {
    currentOffset.value -= pageLimit.value;
    fetchAlerts();
  }
}

function goToNextPage() {
  if (hasMorePages.value) {
    currentOffset.value += pageLimit.value;
    fetchAlerts();
  }
}

async function viewAlertDetail(alert: any) {
  selectedAlert.value = alert;
  showDetailModal.value = true;

  // Fetch full details if needed
  if (alert.id) {
    loadingDetail.value = true;
    try {
      const detailData = await apiService.getHoneypotAlertHistoryById(alert.id);
      selectedAlert.value = detailData;
    } catch (err: any) {
      console.error('Error fetching alert details:', err);
      // Keep showing basic info from the list
    } finally {
      loadingDetail.value = false;
    }
  }
}

function closeDetailModal() {
  showDetailModal.value = false;
  selectedAlert.value = null;
}

function formatDate(dateString: string) {
  if (!dateString) return '-';
  const date = new Date(dateString);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function formatAlertMessage(alert: any): string {
  if (!alert.message) return '-';

  try {
    // Try to parse message as JSON
    const parsedMessage = JSON.parse(alert.message);

    // Check for properties in order: alert, message, rule, output
    const properties = ['alert', 'message', 'rule', 'output'];

    for (const prop of properties) {
      if (parsedMessage[prop]) {
        const value = parsedMessage[prop];
        // If the property value is an object, stringify it
        if (typeof value === 'object') {
          return JSON.stringify(value);
        }
        return String(value);
      }
    }

    // If none of the properties exist, return the stringified JSON
    return JSON.stringify(parsedMessage);
  } catch (err) {
    // If not JSON, return the message as is
    return alert.message;
  }
}

onMounted(async () => {
  // Fetch alerts on initial load
  // Filter options will be loaded when user clicks on the combo boxes
  await fetchAlerts();
});
</script>

<style scoped>
.honeypot-alert-history-view {
  padding: 0;
  margin: -1.5rem;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 0;
}

.page-header h1 {
  color: #2d3748;
  margin: 0;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: #5568d3;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.filters-section {
  background: white;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 0;
}

.filter-row {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
}

.period-row {
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.other-filters-row {
  flex-wrap: nowrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.filter-group-period {
  max-width: 280px;
  flex: 0 0 auto;
}

.filter-group label {
  font-weight: 600;
  color: #4a5568;
  font-size: 0.9rem;
}

.filter-group select,
.filter-group input[type="datetime-local"] {
  padding: 0.5rem 0.75rem;
  border: 1px solid #cbd5e0;
  border-radius: 5px;
  font-size: 0.95rem;
  background: white;
  cursor: pointer;
}

.filter-group input[type="datetime-local"] {
  cursor: text;
}

.filter-group select:focus,
.filter-group input[type="datetime-local"]:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.loading {
  text-align: center;
  padding: 3rem 2rem;
  font-size: 1.1rem;
  color: #718096;
  background: white;
}

.error-card {
  background: #fff5f5;
  border: 1px solid #feb2b2;
  padding: 2rem;
  margin: 2rem;
  border-radius: 8px;
  text-align: center;
}

.error-card h3 {
  color: #e53e3e;
  margin-top: 0;
}

.error-card p {
  color: #742a2a;
  margin-bottom: 1.5rem;
}

.retry-button {
  padding: 0.75rem 1.5rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 5px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
}

.retry-button:hover {
  background: #5568d3;
}

.alerts-container {
  background: white;
  overflow: hidden;
}

.alerts-table {
  width: 100%;
  border-collapse: collapse;
}

.alerts-table thead {
  background: #f7fafc;
}

.alerts-table th {
  padding: 1rem 2rem;
  text-align: left;
  font-weight: 600;
  color: #4a5568;
  border-bottom: 2px solid #e2e8f0;
  font-size: 0.9rem;
}

.alerts-table td {
  padding: 1rem 2rem;
  border-bottom: 1px solid #e2e8f0;
  color: #2d3748;
  font-size: 0.9rem;
}

.alerts-table tbody tr:hover {
  background: #f7fafc;
}

.alert-message {
  font-size: 0.9rem;
  color: #2d3748;
  max-width: 400px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.severity-badge {
  display: inline-block;
  padding: 0.35rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
}

.severity-badge.severity-critical,
.severity-badge.severity-high {
  background: #fed7d7;
  color: #c53030;
}

.severity-badge.severity-medium {
  background: #feebc8;
  color: #c05621;
}

.severity-badge.severity-low {
  background: #fef3c7;
  color: #92400e;
}

.severity-badge.severity-info {
  background: #dbeafe;
  color: #1e40af;
}

.actions {
  text-align: center;
}

.action-btn {
  padding: 0.5rem;
  background: transparent;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.view-btn {
  color: #48bb78;
}

.view-btn:hover {
  background: #f0fff4;
  border-color: #48bb78;
}

.no-data {
  padding: 3rem;
  text-align: center;
  color: #718096;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  padding: 1.5rem;
  border-top: 1px solid #e2e8f0;
}

.page-btn {
  padding: 0.5rem 1rem;
  background: white;
  color: #667eea;
  border: 1px solid #e2e8f0;
  border-radius: 5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: #f7fafc;
  border-color: #667eea;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  padding: 0 1rem;
  color: #4a5568;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.more-indicator {
  color: #667eea;
  font-size: 0.85rem;
  font-weight: 500;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 1.5rem;
  border-radius: 10px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content-wide {
  max-width: 900px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e2e8f0;
}

.modal-header h2 {
  margin: 0;
  color: #2d3748;
}

.close-btn {
  padding: 0.5rem;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #718096;
  transition: color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #e53e3e;
}

.modal-body {
  margin-bottom: 1.5rem;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  padding: 0.75rem;
  background: #f7fafc;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.detail-item.full-width {
  grid-column: 1 / -1;
}

.detail-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #718096;
  margin-bottom: 0.5rem;
}

.detail-value {
  font-size: 0.95rem;
  color: #2d3748;
  word-break: break-word;
}

.detail-value.message-content {
  background: #f7fafc;
  padding: 1rem;
  border-radius: 5px;
  border: 1px solid #e2e8f0;
  white-space: pre-wrap;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  line-height: 1.6;
  color: #2d3748;
  max-height: 300px;
  overflow-y: auto;
}

.detail-value pre {
  background: #2d3748;
  color: #e2e8f0;
  padding: 1rem;
  border-radius: 5px;
  overflow-x: auto;
  font-size: 0.85rem;
  line-height: 1.5;
  margin: 0;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.secondary-button {
  padding: 0.75rem 1.5rem;
  background: #e2e8f0;
  color: #4a5568;
  border: none;
  border-radius: 5px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
}

.secondary-button:hover {
  background: #cbd5e0;
}

@media (max-width: 1200px) {
  .other-filters-row {
    flex-wrap: wrap;
  }
}

@media (max-width: 768px) {
  .filter-row {
    flex-direction: column;
  }

  .filter-group,
  .filter-group-period {
    width: 100%;
    max-width: 100%;
  }

  .period-row {
    border-bottom: none;
    padding-bottom: 0;
    margin-bottom: 0;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
