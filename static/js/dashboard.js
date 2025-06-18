
function initSavingsChart() {
    const ctx = document.getElementById('savingsChart').getContext('2d');
    const savingsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
            datasets: [{
                label: 'Total Savings',
                data: [50000, 75000, 60000, 90000, 120000, 150000, 180000],
                backgroundColor: 'rgba(74, 107, 255, 0.1)',
                borderColor: 'rgba(74, 107, 255, 1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: 'white',
                pointBorderColor: 'rgba(74, 107, 255, 1)',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: {
                        family: 'Poppins',
                        size: 14
                    },
                    bodyFont: {
                        family: 'Poppins',
                        size: 12
                    },
                    callbacks: {
                        label: function(context) {
                            return '₦' + context.parsed.y.toLocaleString();
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '₦' + value.toLocaleString();
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function initGroupsChart() {
    const ctx = document.getElementById('groupsChart').getContext('2d');
    const groupsChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Market Women', 'Family Savings', 'Business Partners', 'Friends Circle'],
            datasets: [{
                data: [75000, 30000, 120000, 20000],
                backgroundColor: [
                    'rgba(74, 107, 255, 0.8)',
                    'rgba(40, 167, 69, 0.8)',
                    'rgba(255, 193, 7, 0.8)',
                    'rgba(220, 53, 69, 0.8)'
                ],
                borderColor: [
                    'rgba(74, 107, 255, 1)',
                    'rgba(40, 167, 69, 1)',
                    'rgba(255, 193, 7, 1)',
                    'rgba(220, 53, 69, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: {
                            family: 'Poppins',
                            size: 12
                        },
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: {
                        family: 'Poppins',
                        size: 14
                    },
                    bodyFont: {
                        family: 'Poppins',
                        size: 12
                    },
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ₦${value.toLocaleString()} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function showToast(message, icon) {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'custom-toast';
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="${icon}"></i>
        </div>
        <div class="toast-message">${message}</div>
        <div class="toast-close">
            <i class="fas fa-times"></i>
        </div>
    `;
    
    // Add to container
    const container = document.createElement('div');
    container.className = 'toast-container';
    container.appendChild(toast);
    document.body.appendChild(container);
    
    // Show toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            container.remove();
        }, 300);
    }, 3000);
    
    // Close button
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.classList.remove('show');
        setTimeout(() => {
            container.remove();
        }, 300);
    });
}

// Add toast styles if not already added
if (!$('#toast-css').length) {
    const style = document.createElement('style');
    style.id = 'toast-css';
    style.textContent = `
        .toast-container {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1100;
            max-width: 350px;
            width: 100%;
        }
        
        .custom-toast {
            background: white;
            border-radius: 8px;
            padding: 15px 20px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 10px;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        }
        
        .custom-toast.show {
            opacity: 1;
            transform: translateX(0);
        }
        
        .toast-icon {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            background: var(--primary-light);
            color: var(--primary);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
        }
        
        .toast-message {
            flex: 1;
            font-size: 14px;
        }
        
        .toast-close {
            color: var(--text-light);
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .toast-close:hover {
            color: var(--text);
        }
        
        body.dark-theme .custom-toast {
            background: var(--dark-light);
            color: white;
        }
    `;
    document.head.appendChild(style);
}