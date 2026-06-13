// Simulated migration state
let isRunning = false;
let currentPhase = 0; // 0: schema, 1: data, 2: validation
let totalRows = 245000;
let rowsTransferred = 0;
let startTime = 0;
let timerInterval = null;
let timeoutIds = [];

// DOM elements
const sourceSelect = document.getElementById('sourceDb');
const targetSelect = document.getElementById('targetDb');
const migrationTypeSelect = document.getElementById('migrationType');
const speedSlider = document.getElementById('speedSlider');
const speedLabel = document.getElementById('speedLabel');
const startBtn = document.getElementById('startMigrationBtn');
const resetBtn = document.getElementById('resetBtn');
const progressFill = document.getElementById('progressFill');
const progressStatus = document.getElementById('progressStatus');
const schemaStatusSpan = document.getElementById('schemaStatus');
const dataStatusSpan = document.getElementById('dataStatus');
const validateStatusSpan = document.getElementById('validateStatus');
const timeElapsedSpan = document.getElementById('timeElapsed');
const logContainer = document.getElementById('logContainer');
const clearLogsBtn = document.getElementById('clearLogsBtn');

function addLog(message, type = 'info') {
  const logDiv = document.createElement('div');
  logDiv.className = `log-entry ${type}`;
  logDiv.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  logContainer.appendChild(logDiv);
  logContainer.scrollTop = logContainer.scrollHeight;
}

function clearLogs() {
  logContainer.innerHTML = '';
  addLog('Logs cleared', 'info');
}

function updateSpeedLabel() {
  const speed = parseInt(speedSlider.value);
  const speedText = speed === 1 ? 'Slow (6s/phase)' : speed === 5 ? 'Fast (1s/phase)' : `Normal (${7-speed}s/phase)`;
  speedLabel.textContent = speedText;
}

function resetUI() {
  if (isRunning) return;
  currentPhase = 0;
  rowsTransferred = 0;
  if (timerInterval) clearInterval(timerInterval);
  progressFill.style.width = '0%';
  progressStatus.textContent = 'Ready';
  schemaStatusSpan.innerHTML = '⏳ Pending';
  dataStatusSpan.innerHTML = `0 / ${totalRows} rows`;
  validateStatusSpan.innerHTML = '⏳ Not started';
  timeElapsedSpan.textContent = '0s';
  addLog('Reset migration state', 'info');
}

function stopMigration() {
  if (!isRunning) return;
  isRunning = false;
  if (timerInterval) clearInterval(timerInterval);
  for (let id of timeoutIds) clearTimeout(id);
  timeoutIds = [];
  addLog('❌ Migration stopped (reset or interrupted)', 'error');
  progressStatus.textContent = 'Stopped';
}

async function startMigration() {
  if (isRunning) {
    addLog('Migration already in progress', 'error');
    return;
  }
  resetUI();
  isRunning = true;
  startTime = Date.now();
  timerInterval = setInterval(() => {
    if (isRunning) {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      timeElapsedSpan.textContent = `${elapsed}s`;
    }
  }, 1000);
  
  const source = sourceSelect.value;
  const target = targetSelect.value;
  const migrationType = migrationTypeSelect.value;
  const speed = parseInt(speedSlider.value);
  const phaseDelay = (7 - speed) * 1000; // 6s to 1s
  
  addLog(`🚀 Starting ${migrationType === 'full' ? 'full' : 'incremental'} migration from ${source} to ${target}`, 'info');
  
  // Phase 1: Schema export & conversion
  progressStatus.textContent = 'Phase 1/3: Exporting schema...';
  schemaStatusSpan.innerHTML = '⏳ In progress...';
  await delay(phaseDelay);
  schemaStatusSpan.innerHTML = '✅ Completed';
  addLog(`✅ Schema exported & converted (12 tables) to ${target} format`, 'success');
  updateProgress(33);
  
  // Phase 2: Data transfer (simulated with chunks)
  progressStatus.textContent = 'Phase 2/3: Transferring data...';
  const chunkSize = 50000;
  let chunks = Math.ceil(totalRows / chunkSize);
  for (let i = 0; i < chunks; i++) {
    if (!isRunning) return;
    const rowsThisChunk = Math.min(chunkSize, totalRows - rowsTransferred);
    await delay(phaseDelay / 2);
    rowsTransferred += rowsThisChunk;
    dataStatusSpan.innerHTML = `${rowsTransferred.toLocaleString()} / ${totalRows.toLocaleString()} rows`;
    const dataProgress = 33 + (rowsTransferred / totalRows) * 34;
    updateProgress(dataProgress);
    addLog(`📦 Transferred ${rowsThisChunk.toLocaleString()} rows (total ${rowsTransferred.toLocaleString()})`, 'info');
  }
  dataStatusSpan.innerHTML = `✅ ${totalRows.toLocaleString()} rows`;
  addLog(`✅ Data transfer completed. Rows migrated: ${totalRows.toLocaleString()}`, 'success');
  updateProgress(67);
  
  // Phase 3: Validation & cutover
  progressStatus.textContent = 'Phase 3/3: Validating integrity...';
  validateStatusSpan.innerHTML = '⏳ Running checksums...';
  await delay(phaseDelay);
  validateStatusSpan.innerHTML = '✅ Passed (row count match, checksum OK)';
  addLog(`✅ Validation successful. Source & target are consistent.`, 'success');
  updateProgress(100);
  
  if (migrationType === 'incremental') {
    addLog(`🔄 Incremental mode: CDC simulation active (changes will sync every 30s)`, 'info');
  }
  progressStatus.textContent = 'Migration completed successfully 🎉';
  addLog(`🏁 Migration finished in ${Math.floor((Date.now() - startTime) / 1000)} seconds. Cutover ready.`, 'success');
  isRunning = false;
  if (timerInterval) clearInterval(timerInterval);
}

function updateProgress(percent) {
  progressFill.style.width = `${percent}%`;
}

function delay(ms) {
  return new Promise(resolve => {
    const id = setTimeout(resolve, ms);
    timeoutIds.push(id);
  });
}

// Event listeners
startBtn.addEventListener('click', startMigration);
resetBtn.addEventListener('click', () => {
  if (isRunning) stopMigration();
  resetUI();
});
clearLogsBtn.addEventListener('click', clearLogs);
speedSlider.addEventListener('input', updateSpeedLabel);
updateSpeedLabel();

// Initial log
addLog('Simulator ready. Configure source/target and press Start Migration.', 'info');