document.addEventListener('DOMContentLoaded', function() {
    // --- State Management ---
    let eventListeners = [];
    
    // Cleanup function to remove all event listeners
    function cleanup() {
        eventListeners.forEach(({element, type, handler}) => {
            element.removeEventListener(type, handler);
        });
        eventListeners = [];
    }

    // Helper to track event listeners for cleanup
    function addListener(element, type, handler) {
        element.addEventListener(type, handler);
        eventListeners.push({element, type, handler});
        return handler;
    }

    // --- Modal Elements ---
    const fundWalletModal = document.getElementById('fund-wallet-modal');
    const withdrawWalletModal = document.getElementById('withdraw-wallet-modal');
    const transferWalletModal = document.getElementById('transfer-wallet-modal');

    // --- Modal Management ---
    function setupModalToggle(openBtnId, modal) {
        const openBtn = document.getElementById(openBtnId);
        if (!openBtn) return;

        const handler = () => {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        };
        addListener(openBtn, 'click', handler);
    }

    // Initialize all modals
    setupModalToggle('fund-wallet-btn', fundWalletModal);
    setupModalToggle('fund-wallet-btn-2', fundWalletModal);
    setupModalToggle('withdraw-wallet-btn', withdrawWalletModal);
    setupModalToggle('transfer-wallet-btn', transferWalletModal);

    // Close modal handlers
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        // Close button
        const closeBtn = modal.querySelector('.close-modal');
        if (closeBtn) {
            addListener(closeBtn, 'click', () => {
                modal.classList.remove('active');
                document.body.style.overflow = 'auto';
            });
        }

        // Close when clicking outside
        addListener(modal, 'click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        });
    });

    // --- Recipient Search and Selection ---
    const recipientIdentifier = document.getElementById('recipient-identifier');
    const recipientSearch = document.getElementById('recipient-search');
    const recipientOptionsContainer = document.querySelector('.recipient-options');

    if (recipientSearch && recipientOptionsContainer) {
        // Store initial options
        const initialRecipientOptions = Array.from(recipientOptionsContainer.querySelectorAll('.recipient-option'));

        // Click handler for recipient options
        function handleRecipientClick(e) {
            const option = e.currentTarget;
            const value = option.getAttribute('data-recipient-value');
            const fullName = option.querySelector('span').textContent;
            
            recipientIdentifier.value = value;
            recipientSearch.value = fullName;
            
            // Update UI
            initialRecipientOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            recipientOptionsContainer.style.display = 'none';
        }

        // Initialize options
        initialRecipientOptions.forEach(option => {
            addListener(option, 'click', handleRecipientClick);
        });

        // Search functionality
        addListener(recipientSearch, 'input', function() {
            const query = this.value.toLowerCase().trim();
            
            if (query.length > 2) {
                // Client-side filtering
                initialRecipientOptions.forEach(option => {
                    const name = option.querySelector('span').textContent.toLowerCase();
                    option.style.display = name.includes(query) ? 'flex' : 'none';
                });
                recipientOptionsContainer.style.display = 'block';
            } else {
                // Reset to initial state
                initialRecipientOptions.forEach(option => {
                    option.style.display = 'flex';
                });
            }
        });

        // Show options on focus
        addListener(recipientSearch, 'focus', () => {
            recipientOptionsContainer.style.display = 'block';
        });

        // Hide options when clicking outside
        addListener(document, 'click', (e) => {
            if (!e.target.closest('.recipient-selector')) {
                recipientOptionsContainer.style.display = 'none';
            }
        });
    }

    // --- Form Handling ---
    function handleWalletForm(formId, successMessage) {
        const form = document.getElementById(formId);
        if (!form) return;

        addListener(form, 'submit', async function(e) {
            e.preventDefault();

            // Validate form
            const amountInput = form.querySelector('input[name="amount"]');
            if (amountInput) {
                const amount = parseFloat(amountInput.value);
                const minAmount = parseFloat(amountInput.min);
                const maxAmount = parseFloat(amountInput.max);

                if (isNaN(amount) {
                    alert('Please enter a valid amount');
                    return;
                }

                if (amount < minAmount) {
                    alert(`Minimum amount is ₦${minAmount}`);
                    return;
                }

                if (formId !== 'fund-wallet-form' && amount > maxAmount) {
                    alert(`Amount cannot exceed ₦${maxAmount}`);
                    return;
                }
            }

            if (formId === 'transfer-wallet-form' && !recipientIdentifier.value) {
                alert('Please select a recipient');
                return;
            }

            // Disable button during submission
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

            try {
                const formData = new FormData(form);
                const response = await fetch(form.action, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });

                const data = await response.json();

                if (data.success) {
                    alert(successMessage);
                    document.getElementById(formId.replace('-form', '-modal')).classList.remove('active');
                    document.body.style.overflow = 'auto';
                    window.location.reload();
                } else {
                    throw new Error(data.message || 'Transaction failed');
                }
            } catch (error) {
                console.error('Error:', error);
                alert(error.message || 'An error occurred. Please try again.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }

    // Initialize form handlers
    handleWalletForm('fund-wallet-form', 'Wallet funded successfully!');
    handleWalletForm('withdraw-wallet-form', 'Withdrawal request submitted!');
    handleWalletForm('transfer-wallet-form', 'Transfer completed successfully!');

    // --- Transaction Filtering ---
    const transactionTypeFilter = document.getElementById('transaction-type');
    const transactionPeriodFilter = document.getElementById('transaction-period');
    const transactionItems = document.querySelectorAll('.transaction-item');

    function filterTransactions() {
        const typeValue = transactionTypeFilter.value;
        const periodValue = transactionPeriodFilter.value;
        const now = new Date();

        transactionItems.forEach(item => {
            const itemType = item.getAttribute('data-type');
            const itemDate = new Date(item.getAttribute('data-date'));
            
            // Type filter
            const typeMatch = typeValue === 'all' || itemType === typeValue;
            
            // Period filter
            let periodMatch = true;
            if (periodValue !== 'all') {
                const days = parseInt(periodValue.replace('days', ''));
                const cutoffDate = new Date(now);
                cutoffDate.setDate(now.getDate() - days);
                periodMatch = itemDate >= cutoffDate;
            }

            item.style.display = typeMatch && periodMatch ? 'flex' : 'none';
        });
    }

    if (transactionTypeFilter && transactionPeriodFilter) {
        addListener(transactionTypeFilter, 'change', filterTransactions);
        addListener(transactionPeriodFilter, 'change', filterTransactions);
    }

    // Initial filter
    filterTransactions();

    // --- Cleanup on page unload ---
    window.addEventListener('beforeunload', cleanup);
});