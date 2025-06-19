document.addEventListener('DOMContentLoaded', function() {
    // Tab Switching
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Show corresponding content
            const tabId = button.getAttribute('data-tab') + '-tab';
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Contribute Button
    const contributeBtn = document.querySelector('.contribute-btn');
    const contributeModal = document.getElementById('contribute-modal');
    const closeContributeModal = document.getElementById('close-contribute-modal');
    
    if (contributeBtn) {
        contributeBtn.addEventListener('click', () => {
            contributeModal.classList.add('active');
        });
    }
    
    closeContributeModal.addEventListener('click', () => {
        contributeModal.classList.remove('active');
    });
    
    // Invite Members Button
    const inviteMembersBtn = document.getElementById('invite-members-btn');
    const inviteMembersModal = document.getElementById('invite-members-modal');
    const closeInviteModal = document.getElementById('close-invite-modal');
    
    if (inviteMembersBtn) {
        inviteMembersBtn.addEventListener('click', () => {
            inviteMembersModal.classList.add('active');
        });
    }
    
    closeInviteModal.addEventListener('click', () => {
        inviteMembersModal.classList.remove('active');
    });
    
    // Delete Group Confirmation
    const deleteGroupBtn = document.getElementById('delete-group-btn');
    const deleteGroupModal = document.getElementById('delete-group-modal');
    const closeDeleteModal = document.getElementById('close-delete-modal');
    const cancelDeleteBtn = document.getElementById('cancel-delete');
    
    if (deleteGroupBtn) {
        deleteGroupBtn.addEventListener('click', () => {
            deleteGroupModal.classList.add('active');
        });
    }
    
    closeDeleteModal.addEventListener('click', () => {
        deleteGroupModal.classList.remove('active');
    });
    
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', () => {
            deleteGroupModal.classList.remove('active');
        });
    }
    
    // Form Submissions
    const contributeForm = document.getElementById('contribute-form');
    if (contributeForm) {
        contributeForm.addEventListener('submit', function(e) {
            e.preventDefault();
            // Here you would typically handle the form submission with AJAX
            alert('Contribution submitted! This would be handled with AJAX in a real implementation.');
            contributeModal.classList.remove('active');
        });
    }
    
    const inviteMembersForm = document.getElementById('invite-members-form');
    if (inviteMembersForm) {
        inviteMembersForm.addEventListener('submit', function(e) {
            e.preventDefault();
            // Handle invitation submission
            alert('Invitations sent! This would be handled with AJAX in a real implementation.');
            inviteMembersModal.classList.remove('active');
        });
    }
    
    // Discussion Chat
    const messageInput = document.getElementById('message-input');
    const sendMessageBtn = document.getElementById('send-message-btn');
    const discussionMessages = document.querySelector('.discussion-messages');
    
    if (sendMessageBtn && messageInput) {
        sendMessageBtn.addEventListener('click', sendMessage);
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
    
    function sendMessage() {
        const messageText = messageInput.value.trim();
        if (messageText) {
            // In a real app, this would be an AJAX call to the server
            const newMessage = document.createElement('div');
            newMessage.className = 'message sent';
            newMessage.innerHTML = `
                <div class="message-user">
                    <img src="${staticUrl}images/default-avatar.png" alt="You">
                </div>
                <div class="message-content">
                    <div class="message-header">
                        <span class="message-sender">You</span>
                        <span class="message-time">just now</span>
                    </div>
                    <div class="message-text">${messageText}</div>
                </div>
            `;
            
            discussionMessages.appendChild(newMessage);
            messageInput.value = '';
            discussionMessages.scrollTop = discussionMessages.scrollHeight;
        }
    }
    
    // Admin Cards
    const adminCards = document.querySelectorAll('.admin-card');
    adminCards.forEach(card => {
        card.addEventListener('click', function() {
            const id = this.id;
            
            switch(id) {
                case 'edit-group-card':
                    alert('Edit group functionality would go here');
                    break;
                case 'invite-members-card':
                    inviteMembersModal.classList.add('active');
                    break;
                case 'group-reports-card':
                    alert('Reports functionality would go here');
                    break;
                case 'end-group-card':
                    alert('End group functionality would go here');
                    break;
            }
        });
    });
    
    // View All Contributions
    const viewAllContributions = document.getElementById('view-all-contributions');
    if (viewAllContributions) {
        viewAllContributions.addEventListener('click', function(e) {
            e.preventDefault();
            alert('This would load all contributions via AJAX or redirect to a full contributions page');
        });
    }
    
    // Close modals when clicking outside
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    });
    
    // Initialize any other necessary functionality
    initializeGroupDetail();
});

function initializeGroupDetail() {
    // Any initialization code for the group detail page
    console.log('Group detail page initialized');
    
    // Example: Load more contributions when scrolling to bottom
    const contributionsList = document.querySelector('.contributions-list');
    if (contributionsList) {
        contributionsList.addEventListener('scroll', function() {
            if (this.scrollTop + this.clientHeight >= this.scrollHeight - 10) {
                // Load more contributions
                console.log('Load more contributions...');
            }
        });
    }
}