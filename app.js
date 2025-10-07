let tasks = [];
let currentFilter = 'all';

// Load tasks from memory on page load
function loadTasks() {
    const saved = sessionStorage.getItem('studyTasks');
    if (saved) {
        tasks = JSON.parse(saved);
        renderTasks();
        updateStats();
        renderTimeline();
    }
}

// Save tasks to memory
function saveTasks() {
    sessionStorage.setItem('studyTasks', JSON.stringify(tasks));
}

// Add new task
document.getElementById('taskForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const task = {
        id: Date.now(),
        title: document.getElementById('taskTitle').value,
        subject: document.getElementById('taskSubject').value,
        description: document.getElementById('taskDescription').value,
        dueDate: document.getElementById('taskDate').value,
        priority: document.getElementById('taskPriority').value,
        completed: false,
        createdAt: new Date().toISOString()
    };

    tasks.push(task);
    saveTasks();
    renderTasks();
    updateStats();
    renderTimeline();
    this.reset();
    
    // Show notification
    alert('Task added successfully! 🎉');
});

// Render tasks
function renderTasks() {
    const taskList = document.getElementById('taskList');
    let filteredTasks = tasks;

    if (currentFilter === 'pending') {
        filteredTasks = tasks.filter(t => !t.completed);
    } else if (currentFilter === 'completed') {
        filteredTasks = tasks.filter(t => t.completed);
    } else if (currentFilter === 'high') {
        filteredTasks = tasks.filter(t => t.priority === 'high');
    }

    if (filteredTasks.length === 0) {
        taskList.innerHTML = '<p style="text-align: center; color: #999;">No tasks found for this filter.</p>';
        return;
    }

    taskList.innerHTML = filteredTasks.map(task => `
        <div class="task-item ${task.completed ? 'completed' : ''}">
            <div class="task-header">
                <span class="task-title">${task.title}</span>
                <span class="task-priority priority-${task.priority}">${task.priority}</span>
            </div>
            <div class="task-details">
                <strong>Subject:</strong> ${task.subject}<br>
                <strong>Due:</strong> ${new Date(task.dueDate).toLocaleString()}<br>
                ${task.description ? `<strong>Details:</strong> ${task.description}` : ''}
            </div>
            <div class="task-actions">
                ${!task.completed ? 
                    `<button class="btn-complete" onclick="completeTask(${task.id})">✓ Complete</button>` : 
                    `<button class="btn-complete" onclick="uncompleteTask(${task.id})">↺ Undo</button>`
                }
                <button class="btn-delete" onclick="deleteTask(${task.id})">✕ Delete</button>
            </div>
        </div>
    `).join('');
}

// Complete task
function completeTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = true;
        saveTasks();
        renderTasks();
        updateStats();
        renderTimeline();
    }
}

// Uncomplete task
function uncompleteTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = false;
        saveTasks();
        renderTasks();
        updateStats();
        renderTimeline();
    }
}

// Delete task
function deleteTask(id) {
    if (confirm('Are you sure you want to delete this task?')) {
        tasks = tasks.filter(t => t.id !== id);
        saveTasks();
        renderTasks();
        updateStats();
        renderTimeline();
    }
}

// Update statistics
function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    document.getElementById('totalTasks').textContent = total;
    document.getElementById('completedTasks').textContent = completed;
    document.getElementById('pendingTasks').textContent = pending;
    
    const progressBar = document.getElementById('progressBar');
    progressBar.style.width = progress + '%';
    progressBar.textContent = progress + '%';
}

// Render timeline
function renderTimeline() {
    const timeline = document.getElementById('timeline');
    const sortedTasks = [...tasks].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    const now = new Date();

    if (sortedTasks.length === 0) {
        timeline.innerHTML = '<p style="text-align: center; color: #999;">Your upcoming tasks will appear here</p>';
        return;
    }

    timeline.innerHTML = sortedTasks.map(task => {
        const dueDate = new Date(task.dueDate);
        const isPast = dueDate < now;
        const status = task.completed ? 'completed' : (isPast ? 'overdue' : 'upcoming');
        
        return `
            <div class="timeline-item ${status}">
                <div class="timeline-date">${dueDate.toLocaleDateString()} - ${dueDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                <div class="timeline-content">
                    <strong>${task.title}</strong> - ${task.subject}
                    ${task.completed ? ' ✓' : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentFilter = this.dataset.filter;
        renderTasks();
    });
});

// Check for upcoming deadlines
function checkDeadlines() {
    const now = new Date();
    tasks.forEach(task => {
        if (!task.completed) {
            const dueDate = new Date(task.dueDate);
            const hoursUntilDue = (dueDate - now) / (1000 * 60 * 60);
            
            if (hoursUntilDue > 0 && hoursUntilDue < 24 && !task.notified) {
                console.log(`Reminder: "${task.title}" is due in ${Math.round(hoursUntilDue)} hours!`);
                task.notified = true;
                saveTasks();
            }
        }
    });
}

// Check deadlines every 30 minutes
setInterval(checkDeadlines, 30 * 60 * 1000);

// Initialize
loadTasks();
checkDeadlines();