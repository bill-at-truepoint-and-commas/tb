// TimeBlocker AI API - REBUILT with working editing
// Main interface for AI agent interaction

(function() {
    'use strict';

    // ========================================
    // STATE MANAGEMENT
    // ========================================
    
    const state = {
        selectedDay: new Date(),
        currentWeek: null
    };

    // ========================================
    // UTILITY FUNCTIONS
    // ========================================
    
    function getCurrentWeek() {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const monday = new Date(today);
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        monday.setDate(today.getDate() + diff);
        
        const friday = new Date(monday);
        friday.setDate(monday.getDate() + 4);
        
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                           'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = monthNames[monday.getMonth()];
        const mondayDate = monday.getDate();
        const fridayDate = friday.getDate();
        
        return `${month}${mondayDate}-${fridayDate}`;
    }

    function getDayOfWeek(date) {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        return days[date.getDay()];
    }

    function getStorageKey(date) {
        const dayName = getDayOfWeek(date);
        const week = getCurrentWeek();
        return `dayplanner_${dayName}_weekof_${week}`;
    }

    function getCurrentTimeSlot() {
        const now = new Date();
        const hour = now.getHours();
        
        const slots = ['09:00am', '10:00am', '11:00am', '12:00pm', 
                      '01:00pm', '02:00pm', '03:00pm', '04:00pm'];
        
        if (hour < 9) return slots[0];
        if (hour >= 16) return slots[slots.length - 1];
        
        const index = hour - 9;
        return slots[index];
    }

    // ========================================
    // DOM HELPERS
    // ========================================
    
    function getTableRows() {
        return document.querySelectorAll('#daily-table tbody tr');
    }

    function findRowByTime(time) {
        const rows = getTableRows();
        for (let row of rows) {
            if (row.dataset.time === time) {
                return row;
            }
        }
        return null;
    }

    function getCellContent(cell) {
        const taskList = cell.querySelector('.task-list');
        if (!taskList) return [];
        
        const tasks = [];
        const items = taskList.querySelectorAll('li');
        items.forEach(li => {
            const checkbox = li.querySelector('.task-checkbox');
            const textSpan = li.querySelector('.task-text');
            if (textSpan) {
                tasks.push({
                    text: textSpan.textContent.trim(),
                    completed: checkbox ? checkbox.checked : false
                });
            }
        });
        
        return tasks;
    }

    function createTaskItem(text = '', completed = false) {
        const li = document.createElement('li');
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'task-checkbox';
        checkbox.checked = completed;
        
        const textSpan = document.createElement('span');
        textSpan.className = 'task-text';
        textSpan.contentEditable = 'true';
        textSpan.textContent = text;
        if (completed) textSpan.classList.add('completed');
        
        checkbox.addEventListener('change', function() {
            textSpan.classList.toggle('completed', this.checked);
            saveData();
        });
        
        li.appendChild(checkbox);
        li.appendChild(textSpan);
        return li;
    }

    function setCellContent(cell, tasks) {
        let ul = cell.querySelector('.task-list');
        if (!ul) {
            ul = document.createElement('ul');
            ul.className = 'task-list';
            cell.appendChild(ul);
        } else {
            ul.innerHTML = '';
        }
        
        tasks.forEach(task => {
            ul.appendChild(createTaskItem(task.text, task.completed));
        });
    }

    // ========================================
    // STORAGE
    // ========================================
    
    function saveData() {
        const tableData = [];
        const rows = getTableRows();
        
        rows.forEach(row => {
            const time = row.dataset.time;
            const cells = row.querySelectorAll('.editable-cell');
            const rowData = { time, cells: [] };
            
            cells.forEach(cell => {
                const col = cell.dataset.col;
                const content = getCellContent(cell);
                rowData.cells.push({ col, content });
            });
            
            tableData.push(rowData);
        });
        
        const storageKey = getStorageKey(state.selectedDay);
        localStorage.setItem(storageKey, JSON.stringify(tableData));
        
        showSaveIndicator();
    }

    function loadData(date) {
        const storageKey = getStorageKey(date);
        const savedData = localStorage.getItem(storageKey);
        
        if (!savedData) return false;
        
        try {
            const tableData = JSON.parse(savedData);
            
            tableData.forEach(rowData => {
                const row = findRowByTime(rowData.time);
                if (!row) return;
                
                rowData.cells.forEach(cellData => {
                    const cell = row.querySelector(`[data-col="${cellData.col}"]`);
                    if (cell && cellData.content) {
                        setCellContent(cell, cellData.content);
                    }
                });
            });
            
            return true;
        } catch (e) {
            console.error('Error loading data:', e);
            return false;
        }
    }

    function showSaveIndicator() {
        const indicator = document.getElementById('save-indicator');
        if (indicator) {
            indicator.classList.add('show');
            setTimeout(() => {
                indicator.classList.remove('show');
            }, 2000);
        }
    }

    // ========================================
    // API: STATE QUERIES
    // ========================================
    
    function getCurrentTimeBlock() {
        const time = getCurrentTimeSlot();
        const row = findRowByTime(time);
        
        if (!row) {
            return {
                time,
                content: [],
                cell: null,
                isEmpty: true,
                index: -1
            };
        }
        
        const cells = row.querySelectorAll('.editable-cell');
        const allContent = [];
        
        cells.forEach(cell => {
            const content = getCellContent(cell);
            if (content.length > 0) {
                allContent.push(...content);
            }
        });
        
        const rows = Array.from(getTableRows());
        const index = rows.indexOf(row);
        
        return {
            time,
            content: allContent,
            cell: row,
            isEmpty: allContent.length === 0,
            index
        };
    }

    function getDayState() {
        const rows = getTableRows();
        const blocks = [];
        let totalTasks = 0;
        let completedTasks = 0;
        
        rows.forEach(row => {
            const time = row.dataset.time;
            const cells = row.querySelectorAll('.editable-cell');
            const blockContent = [];
            
            cells.forEach(cell => {
                const content = getCellContent(cell);
                if (content.length > 0) {
                    blockContent.push(...content);
                    totalTasks += content.length;
                    completedTasks += content.filter(t => t.completed).length;
                }
            });
            
            blocks.push({
                time,
                content: blockContent,
                isEmpty: blockContent.length === 0
            });
        });
        
        return {
            day: getDayOfWeek(state.selectedDay),
            week: getCurrentWeek(),
            blocks,
            completionRate: totalTasks > 0 ? completedTasks / totalTasks : 0,
            totalBlocks: blocks.length,
            totalTasks,
            completedTasks
        };
    }

    // ========================================
    // API: COMMANDS
    // ========================================

    function pivot() {
        const currentTime = getCurrentTimeSlot();
        const currentBlock = getCurrentTimeBlock();
        
        if (!currentBlock.cell) {
            return {
                success: false,
                message: 'Could not find current time block',
                time: currentTime
            };
        }
        
        const row = currentBlock.cell;
        const revisionCells = row.querySelectorAll('[data-col="1"], [data-col="2"], [data-col="3"]');
        
        let currentCol = null;
        let nextCol = null;
        
        for (let i = 0; i < revisionCells.length; i++) {
            const cell = revisionCells[i];
            const content = getCellContent(cell);
            
            if (content.length > 0 && !cell.classList.contains('revised')) {
                currentCol = cell;
                if (i < revisionCells.length - 1) {
                    nextCol = revisionCells[i + 1];
                }
                break;
            }
        }
        
        if (!currentCol) {
            return {
                success: false,
                message: 'No active tasks to pivot',
                time: currentTime
            };
        }
        
        if (!nextCol) {
            return {
                success: false,
                message: 'No more revision columns available (at 🔁3)',
                time: currentTime
            };
        }
        
        const tasks = getCellContent(currentCol);
        const incompleteTasks = tasks.filter(t => !t.completed);
        
        if (incompleteTasks.length === 0) {
            return {
                success: false,
                message: 'All tasks complete, nothing to pivot',
                time: currentTime
            };
        }
        
        currentCol.classList.add('revised');
        
        const nextColTasks = getCellContent(nextCol);
        setCellContent(nextCol, [...incompleteTasks, ...nextColTasks]);
        
        saveData();
        
        return {
            success: true,
            time: currentTime,
            revisedFrom: currentCol.dataset.col,
            revisedTo: nextCol.dataset.col,
            tasksMoved: incompleteTasks.length,
            tasks: incompleteTasks.map(t => t.text)
        };
    }

    function carve(params) {
        if (!params || params.trim() === '') {
            return {
                success: false,
                message: 'No name provided. Usage: carve <name> or carve <time-range> <name>'
            };
        }

        const parts = params.trim().split(/\s+/);
        let timeRange = null;
        let blockName = '';

        if (parts[0].match(/^\d{1,2}(am|pm)-\d{1,2}(am|pm)$/)) {
            timeRange = parts[0];
            blockName = parts.slice(1).join(' ');
        } else {
            blockName = params.trim();
        }

        if (!blockName) {
            return {
                success: false,
                message: 'Block name required'
            };
        }

        if (!timeRange) {
            const currentBlock = getCurrentTimeBlock();
            if (!currentBlock.cell) {
                return {
                    success: false,
                    message: 'Could not determine current time block'
                };
            }

            const row = currentBlock.cell;
            row.dataset.blockName = blockName;
            
            const timeCell = row.querySelector('.time-cell');
            if (timeCell) {
                const nameSpan = document.createElement('span');
                nameSpan.className = 'block-name';
                nameSpan.textContent = ` [${blockName}]`;
                timeCell.appendChild(nameSpan);
            }

            saveData();

            return {
                success: true,
                time: currentBlock.time,
                blockName,
                message: `Block "${blockName}" carved at ${currentBlock.time}`
            };
        }

        const [startTime, endTime] = timeRange.split('-');
        const affectedRows = [];
        
        const rows = getTableRows();
        let inRange = false;
        
        rows.forEach(row => {
            const time = row.dataset.time;
            
            if (time === startTime) {
                inRange = true;
            }
            
            if (inRange) {
                affectedRows.push(row);
                row.dataset.blockName = blockName;
                
                const timeCell = row.querySelector('.time-cell');
                if (timeCell) {
                    const nameSpan = document.createElement('span');
                    nameSpan.className = 'block-name';
                    nameSpan.textContent = ` [${blockName}]`;
                    timeCell.appendChild(nameSpan);
                }
            }
            
            if (time === endTime) {
                inRange = false;
            }
        });

        saveData();

        return {
            success: true,
            timeRange,
            blockName,
            affectedBlocks: affectedRows.length,
            message: `Block "${blockName}" carved from ${timeRange} (${affectedRows.length} hours)`
        };
    }
    
    function expandNow() {
        const currentBlock = getCurrentTimeBlock();
        
        if (currentBlock.cell) {
            const cells = currentBlock.cell.querySelectorAll('.editable-cell');
            cells.forEach(cell => {
                cell.classList.add('current-time');
            });
        }
        
        const actions = generateActions(currentBlock);
        showActionPanel(currentBlock, actions);
        
        return {
            block: currentBlock,
            actions,
            expanded: true
        };
    }

    function generateActions(block) {
        const actions = {
            getStarted: [],
            makeProgress: [],
            finish: []
        };
        
        if (block.isEmpty) {
            actions.getStarted = [
                'Define primary objective for this block',
                'List key deliverables',
                'Set up work environment'
            ];
            return actions;
        }
        
        const incompleteTasks = block.content.filter(t => !t.completed);
        const completedTasks = block.content.filter(t => t.completed);
        
        if (incompleteTasks.length === 0) {
            actions.finish = [
                'Document what was accomplished',
                'Update stakeholders',
                'Plan next steps'
            ];
        } else if (completedTasks.length === 0) {
            actions.getStarted = incompleteTasks.map(t => `Start: ${t.text}`);
            actions.makeProgress = [
                'Break down first task into smaller steps',
                'Identify any blockers',
                'Set a 25-minute timer for focused work'
            ];
        } else {
            actions.makeProgress = incompleteTasks.map(t => `Continue: ${t.text}`);
            actions.finish = [
                'Complete remaining tasks',
                'Review quality of completed work',
                'Document outcomes'
            ];
        }
        
        return actions;
    }

    function showActionPanel(block, actions) {
        const panel = document.getElementById('action-panel');
        const title = document.getElementById('panel-title');
        const content = document.getElementById('panel-content');
        
        if (!panel || !title || !content) return;
        
        title.textContent = `Current Block: ${block.time}`;
        
        let html = '';
        
        if (block.isEmpty) {
            html += '<p style="margin-bottom: 16px; color: #666;">This time block is empty.</p>';
        } else {
            html += '<div class="action-section"><h4>Current Tasks:</h4><ul class="action-list">';
            block.content.forEach(task => {
                const status = task.completed ? '✓' : '○';
                html += `<li>${status} ${task.text}</li>`;
            });
            html += '</ul></div>';
        }
        
        ['getStarted', 'makeProgress', 'finish'].forEach(key => {
            if (actions[key].length > 0) {
                const label = key === 'getStarted' ? 'Get Started' : 
                             key === 'makeProgress' ? 'Make Progress' : 'Finish & Document';
                html += `<div class="action-section"><h4>${label}:</h4><ul class="action-list">`;
                actions[key].forEach(action => {
                    html += `<li>${action}</li>`;
                });
                html += '</ul></div>';
            }
        });
        
        content.innerHTML = html;
        panel.classList.remove('hidden');
    }

    function closeActionPanel() {
        const panel = document.getElementById('action-panel');
        if (panel) {
            panel.classList.add('hidden');
        }
        
        document.querySelectorAll('.current-time').forEach(cell => {
            cell.classList.remove('current-time');
        });
    }

    function shutdown() {
        const dayState = getDayState();
        const completed = [];
        const incomplete = [];
        const movedToTomorrow = [];
        
        dayState.blocks.forEach(block => {
            const incompleteTasks = block.content.filter(t => !t.completed);
            const completedTasks = block.content.filter(t => t.completed);
            
            if (completedTasks.length > 0) {
                completed.push({
                    time: block.time,
                    tasks: completedTasks
                });
            }
            
            if (incompleteTasks.length > 0) {
                incomplete.push({
                    time: block.time,
                    tasks: incompleteTasks
                });
                
                incompleteTasks.forEach(task => {
                    movedToTomorrow.push({
                        task: task.text,
                        originalTime: block.time,
                        newTime: '09:00am'
                    });
                });
            }
        });
        
        if (movedToTomorrow.length > 0) {
            const tomorrow = new Date(state.selectedDay);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            const tomorrowKey = getStorageKey(tomorrow);
            const movedTasks = movedToTomorrow.map(m => ({
                text: m.task,
                completed: false,
                movedFrom: `${getDayOfWeek(state.selectedDay)}-${m.originalTime}`
            }));
            
            localStorage.setItem(tomorrowKey + '_moved', JSON.stringify(movedTasks));
        }
        
        const result = {
            completed,
            incomplete,
            movedToTomorrow,
            summary: {
                totalBlocks: dayState.totalBlocks,
                completed: completed.length,
                incomplete: incomplete.length,
                moved: movedToTomorrow.length
            }
        };
        
        console.log('Shutdown complete:', result);
        alert(`Day complete!\n\nCompleted: ${result.summary.completed} blocks\nIncomplete: ${result.summary.incomplete} blocks\nMoved to tomorrow: ${result.summary.moved} tasks`);
        
        return result;
    }

    // ========================================
    // INITIALIZATION
    // ========================================
    
    function initializeCells() {
        const cells = document.querySelectorAll('.editable-cell');
        
        cells.forEach(cell => {
            const ul = document.createElement('ul');
            ul.className = 'task-list';
            cell.appendChild(ul);
            
            // Click on cell = create/focus first task
            cell.addEventListener('click', function(e) {
                if (e.target === this || e.target === ul) {
                    let firstTask = ul.querySelector('.task-text');
                    if (!firstTask) {
                        ul.appendChild(createTaskItem());
                        firstTask = ul.querySelector('.task-text');
                    }
                    firstTask.focus();
                }
            });
            
            // Enter key = new task
            cell.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' && e.target.classList.contains('task-text')) {
                    e.preventDefault();
                    const newTask = createTaskItem();
                    ul.appendChild(newTask);
                    newTask.querySelector('.task-text').focus();
                }
            });
            
            // Auto-save on input
            let saveTimeout;
            cell.addEventListener('input', function() {
                clearTimeout(saveTimeout);
                saveTimeout = setTimeout(() => {
                    saveData();
                }, 1000);
            });
            
            // Cleanup empty tasks on blur
            cell.addEventListener('blur', function(e) {
                // Only cleanup if we're leaving the cell entirely
                setTimeout(() => {
                    if (!this.contains(document.activeElement)) {
                        const items = ul.querySelectorAll('li');
                        items.forEach(li => {
                            const textSpan = li.querySelector('.task-text');
                            if (textSpan && textSpan.textContent.trim() === '') {
                                li.remove();
                            }
                        });
                        saveData();
                    }
                }, 100);
            }, true);
        });
    }

    function initializeDayDropdown() {
        const dropdown = document.getElementById('day-dropdown');
        if (!dropdown) return;
        
        const days = getDaysOfWeek();
        const today = new Date().toDateString();
        const currentWeek = getCurrentWeek();
        
        dropdown.innerHTML = '';
        days.forEach(day => {
            const option = document.createElement('option');
            const dayName = getDayOfWeek(day);
            option.value = day.toDateString();
            option.textContent = `${dayName}-weekof-${currentWeek}`;
            if (day.toDateString() === today) {
                option.selected = true;
            }
            dropdown.appendChild(option);
        });
        
        dropdown.addEventListener('change', function() {
            switchDay(new Date(this.value));
        });
    }

    function getDaysOfWeek() {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const monday = new Date(today);
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        monday.setDate(today.getDate() + diff);
        
        const days = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(monday);
            day.setDate(monday.getDate() + i);
            days.push(day);
        }
        
        return days;
    }

    function switchDay(date) {
        state.selectedDay = date;
        clearAllCells();
        loadData(date);
    }

    function clearAllCells() {
        const cells = document.querySelectorAll('.editable-cell');
        cells.forEach(cell => {
            const ul = cell.querySelector('.task-list');
            if (ul) {
                ul.innerHTML = '';
            }
        });
    }

    function init() {
        state.currentWeek = getCurrentWeek();
        
        initializeCells();
        initializeDayDropdown();
        loadData(state.selectedDay);
        
        const closeBtn = document.getElementById('close-panel');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeActionPanel);
        }
        
        console.log('TimeBlocker initialized');
    }

    // ========================================
    // NAMESPACE IMPLEMENTATIONS
    // ========================================
    
    const blockNamespace = {
        expandNow: () => expandNow(),
        getState: () => getCurrentTimeBlock(),
        carve: (params) => carve(params),
        patch: (data) => ({ status: 'pending', data }),
        post: (data) => ({ status: 'pending', data }),
        delete: () => ({ status: 'pending' })
    };
    
    const quarterNamespace = {
        expandNow: () => ({ status: 'pending', message: 'Quarterly context coming soon' }),
        shutdown: () => ({ status: 'pending', message: 'Quarterly review coming soon' }),
        openDay: () => ({ status: 'pending', message: 'Quarterly planning coming soon' }),
        getQuarterState: () => ({ status: 'pending', message: 'Quarterly state query coming soon' })
    };
    
    const yearNamespace = {
        expandNow: () => ({ status: 'pending', message: 'Yearly context coming soon' }),
        shutdown: () => ({ status: 'pending', message: 'Yearly review coming soon' }),
        openDay: () => ({ status: 'pending', message: 'Yearly planning coming soon' }),
        getYearState: () => ({ status: 'pending', message: 'Yearly state query coming soon' })
    };

    // ========================================
    // EXPOSE PUBLIC API
    // ========================================
    
    window.timeBlocker = {
        // Daily (default namespace)
        getCurrentTimeBlock,
        getDayState,
        getState: getDayState,
        expandNow,
        pivot,
        shutdown,
        carve,
        
        // Namespace hierarchy
        block: blockNamespace,
        week: {},  // Populated by week.js
        quarter: quarterNamespace,
        year: yearNamespace,
        
        // Utilities
        _state: state,
        _saveData: saveData,
        _loadData: loadData
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
