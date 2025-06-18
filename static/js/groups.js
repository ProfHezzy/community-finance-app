document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const createGroupBtn = document.getElementById('create-group-btn');
    const createGroupBtn2 = document.getElementById('create-group-btn-2');
    const createGroupModal = document.getElementById('create-group-modal');
    const closeCreateModal = document.getElementById('close-create-modal');
    const contributeBtns = document.querySelectorAll('.contribute-btn');
    const contributeModal = document.getElementById('contribute-modal');
    const closeContributeModal = document.getElementById('close-contribute-modal');
    const groupSearch = document.getElementById('group-search');
    const groupFilter = document.getElementById('group-filter');
    const tabBtns = document.querySelectorAll('.groups-tabs .tab-btn');
    const groupCards = document.querySelectorAll('.group-card');
    const acceptBtns = document.querySelectorAll('.accept-btn');
    const declineBtns = document.querySelectorAll('.decline-btn');
    
    // Open Create Group Modal
    function openCreateGroupModal() {
        createGroupModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    createGroupBtn.addEventListener('click', openCreateGroupModal);
    createGroupBtn2.addEventListener('click', openCreateGroupModal);
    
    // Close Create Group Modal
    closeCreateModal.addEventListener('click', function() {
        createGroupModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    });
    
    // Open Contribute Modal
    contributeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const groupId = this.getAttribute('data-group-id');
            document.getElementById('contribute-group-id').value = groupId;
            contributeModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });
    
    // Close Contribute Modal
    closeContributeModal.addEventListener('click', function() {
        contributeModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    });
    
    // Close modals when clicking outside
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        });
    });
    
    // Filter and Search Groups
    function filterGroups() {
        const searchTerm = groupSearch.value.toLowerCase();
        const filterValue = groupFilter.value;
        
        groupCards.forEach(card => {
            const matchesSearch = card.getAttribute('data-search').includes(searchTerm);
            const matchesFilter = filterValue === 'all' || card.getAttribute('data-status') === filterValue;
            
            if (matchesSearch && matchesFilter) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }
    
    groupSearch.addEventListener('input', filterGroups);
    groupFilter.addEventListener('change', filterGroups);
    
    // Tab Switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Update active tab
            tabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Filter groups by tab
            const tab = this.getAttribute('data-tab');
            groupCards.forEach(card => {
                if (tab === 'all' || card.getAttribute('data-status') === tab) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
            
            // Reset search and filter
            groupSearch.value = '';
            groupFilter.value = 'all';
        });
    });
    
    // Handle Invitation Actions
    acceptBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const invitationId = this.getAttribute('data-invitation-id');
            // In a real app, this would be an AJAX call
            console.log(`Accepting invitation ${invitationId}`);
            this.closest('.invitation-card').style.opacity = '0.5';
            this.disabled = true;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Accepting...';
            
            // Simulate API call
            setTimeout(() => {
                this.closest('.invitation-card').remove();
                showToast('Invitation accepted successfully!', 'success');
            }, 1500);
        });
    });
    
    declineBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const invitationId = this.getAttribute('data-invitation-id');
            // In a real app, this would be an AJAX call
            console.log(`Declining invitation ${invitationId}`);
            this.closest('.invitation-card').style.opacity = '0.5';
            this.disabled = true;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Declining...';
            
            // Simulate API call
            setTimeout(() => {
                this.closest('.invitation-card').remove();
                showToast('Invitation declined', 'info');
            }, 1500);
        });
    });
    
    // Form Submission
    document.getElementById('create-group-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const submitBtn = this.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Group...';
        
        // Simulate form submission
        setTimeout(() => {
            createGroupModal.classList.remove('active');
            document.body.style.overflow = 'auto';
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Create Group';
            
            // Show success message
            showToast('Group created successfully!', 'success');
            
            // In a real app, you would redirect or refresh the group list
        }, 2000);
    });
    
    document.getElementById('contribute-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const amount = parseFloat(document.getElementById('contribute-amount').value);
        if (isNaN(amount) || amount < 100) {
            showToast('Please enter a valid amount (minimum ₦100)', 'error');
            return;
        }
        
        const submitBtn = this.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        
        // Simulate form submission
        setTimeout(() => {
            contributeModal.classList.remove('active');
            document.body.style.overflow = 'auto';
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Confirm Payment';
            
            // Show success message
            showToast(`Contribution of ₦${amount.toLocaleString()} successful!`, 'success');
            
            // In a real app, you would refresh the transaction list
        }, 2000);
    });
    
    // Helper function to show toast messages
    function showToast(message, type) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            </div>
            <div class="toast-message">${message}</div>
            <button class="toast-close">&times;</button>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
        
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        });
    }
    
    // Initialize filters
    filterGroups();
});