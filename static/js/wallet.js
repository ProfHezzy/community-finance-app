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

    // Function to get CSRF token (essential for Django POST requests)
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    // --- Modal Elements ---
    const fundWalletModal = document.getElementById('fund-wallet-modal');
    const withdrawWalletModal = document.getElementById('withdraw-wallet-modal');
    const transferWalletModal = document.getElementById('transfer-wallet-modal');
    const addBankAccountModal = document.getElementById('add-bank-account-modal');

    // --- Modal Management ---
    function openModal(modal) {
        if (!modal) return;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeModal(modal) {
        if (!modal) return;
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    function setupModalToggle(buttonId, modalElement) {
        const button = document.getElementById(buttonId);
        if (button && modalElement) {
            addListener(button, 'click', function() {
                openModal(modalElement);
            });
        }
    }

    // Setup toggles for main wallet modals
    setupModalToggle('fund-wallet-btn', fundWalletModal);
    setupModalToggle('fund-wallet-btn-2', fundWalletModal);
    setupModalToggle('withdraw-wallet-btn', withdrawWalletModal);
    setupModalToggle('transfer-wallet-btn', transferWalletModal);

    // Setup for "Add New Bank Account" link to open its dedicated modal
    const openAddBankAccountModalBtn = document.getElementById('open-add-bank-account-modal');
    if (openAddBankAccountModalBtn && addBankAccountModal) {
        addListener(openAddBankAccountModalBtn, 'click', function(e) {
            e.preventDefault();
            openModal(addBankAccountModal);
        });
    }

    // Close modal handlers
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        const closeBtn = modal.querySelector('.close-modal');
        if (closeBtn) {
            addListener(closeBtn, 'click', () => {
                closeModal(modal);
            });
        }
        addListener(modal, 'click', function(e) {
            if (e.target === this) {
                closeModal(this);
            }
        });
    });

    // --- Recipient Search and Selection ---
    const recipientIdentifier = document.getElementById('recipient-identifier');
    const recipientSearch = document.getElementById('recipient-search');
    const recipientOptionsContainer = document.querySelector('.recipient-options');

    if (recipientSearch && recipientOptionsContainer) {
        const initialRecipientOptions = Array.from(recipientOptionsContainer.querySelectorAll('.recipient-option'));

        function handleRecipientClick(e) {
            const option = e.currentTarget;
            const value = option.getAttribute('data-recipient-value');
            const fullName = option.querySelector('span').textContent;
            recipientIdentifier.value = value;
            recipientSearch.value = fullName;
            initialRecipientOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            recipientOptionsContainer.style.display = 'none';
        }

        initialRecipientOptions.forEach(option => {
            addListener(option, 'click', handleRecipientClick);
        });

        addListener(recipientSearch, 'input', function() {
            const query = this.value.toLowerCase().trim();
            if (query.length > 2) {
                initialRecipientOptions.forEach(option => {
                    const name = option.querySelector('span').textContent.toLowerCase();
                    option.style.display = name.includes(query) ? 'flex' : 'none';
                });
                recipientOptionsContainer.style.display = 'block';
            } else {
                initialRecipientOptions.forEach(option => {
                    option.style.display = 'flex';
                });
            }
        });

        addListener(recipientSearch, 'focus', () => {
            recipientOptionsContainer.style.display = 'block';
        });

        addListener(document, 'click', (e) => {
            if (!e.target.closest('.recipient-selector')) {
                recipientOptionsContainer.style.display = 'none';
            }
        });
    }

    // --- AJAX Function to fetch and update bank accounts ---
    async function updateBankAccountsDropdown(selectedAccountId = null) {
        const bankAccountSelect = document.getElementById('id_bank_account');
        if (!bankAccountSelect) return;

        try {
            // **IMPORTANT:** Ensure this URL is correct based on your Django urls.py
            // If your main urls.py includes 'wallet/' then it should be '/wallet/get-bank-accounts/'
            // If your get_bank_accounts view is directly at the root, then '/get-bank-accounts/' is fine.
            // I'm assuming '/wallet/' prefix based on previous conversations.
            const response = await fetch('/get-bank-accounts/');

            // Check if the response indicates a redirect (e.g., to login page)
            if (response.redirected) {
                console.warn('Redirect detected for bank accounts. User might not be authenticated.');
                alert('Your session may have expired. Please log in again.');
                window.location.reload(); // Force reload to trigger login
                return; // Stop further processing
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                // If it's not JSON, it's likely an HTML error page or login page
                console.error('Expected JSON, but received:', contentType);
                const errorText = await response.text(); // Read the response as text
                console.error('Response content:', errorText.substring(0, 500)); // Log first 500 chars
                alert('Failed to load bank accounts due to an unexpected server response. Please refresh and try again. You might need to log in.');
                return; // Stop processing
            }

            const data = await response.json();

            bankAccountSelect.innerHTML = '<option value="">Select Bank Account</option>'; // Clear existing options
            if (data.bank_accounts && data.bank_accounts.length > 0) {
                data.bank_accounts.forEach(account => {
                    const option = document.createElement('option');
                    option.value = account.id;
                    option.textContent = `${account.bank_name} - ${account.account_number}`;
                    if (selectedAccountId && account.id === selectedAccountId) {
                        option.selected = true;
                    }
                    bankAccountSelect.appendChild(option);
                });
            } else {
                const option = document.createElement('option');
                option.value = '';
                option.disabled = true;
                option.textContent = 'No bank accounts added';
                bankAccountSelect.appendChild(option);
            }
        } catch (error) {
            console.error('Error fetching bank accounts:', error);
            alert('Failed to load bank accounts. Please refresh the page. (Network Error)');
        }
    }


    // --- Form Handling ---
    async function handleWalletFormSubmission(formId, successMessage) {
        const form = document.getElementById(formId);
        if (!form) return;

        addListener(form, 'submit', async function(e) {
            e.preventDefault();

            // Validate form based on formId
            const amountInput = form.querySelector('input[name="amount"]');
            if (amountInput) {
                const amount = parseFloat(amountInput.value);
                const minAmount = parseFloat(amountInput.min);
                const maxAmount = parseFloat(amountInput.max);

                if (isNaN(amount)) {
                    alert('Please enter a valid amount');
                    return;
                }
                if (amount < minAmount) {
                    alert(`Minimum amount is ₦${minAmount}`);
                    return;
                }
                if ((formId === 'withdraw-wallet-form' || formId === 'transfer-wallet-form') && amount > maxAmount) {
                    alert(`Amount cannot exceed ₦${maxAmount}`);
                    return;
                }
            }

            if (formId === 'transfer-wallet-form' && (!recipientIdentifier || !recipientIdentifier.value)) {
                alert('Please select a recipient');
                return;
            }

            if (formId === 'withdraw-wallet-form') {
                const selectedBankAccount = document.getElementById('id_bank_account');
                if (!selectedBankAccount || !selectedBankAccount.value) {
                    alert('Please select a bank account.');
                    return;
                }
            }

            // Disable button during submission
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

            try {
                const formData = new FormData(form);
                const headers = {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRFToken': getCookie('csrftoken')
                };

                let requestBody = formData;
                if (formId === 'add-bank-account-form') {
                    const data = {};
                    formData.forEach((value, key) => (data[key] = value));
                    requestBody = JSON.stringify(data);
                    headers['Content-Type'] = 'application/json';
                }

                const response = await fetch(form.action, {
                    method: 'POST',
                    body: requestBody,
                    headers: headers
                });

                // --- CRITICAL ERROR HANDLING ADDED HERE ---
                if (response.redirected) {
                    console.warn('Form submission redirected. User might not be authenticated.');
                    alert('Your session may have expired. Please log in again.');
                    window.location.reload(); // Force reload to trigger Django's login flow
                    return; // Exit function
                }

                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    // This means the server returned something other than JSON, likely an HTML error page.
                    console.error('Expected JSON, but received:', contentType);
                    const errorText = await response.text(); // Read the response as text
                    console.error('Server response content:', errorText.substring(0, 500)); // Log first 500 chars
                    alert('An unexpected server response was received. Please refresh and try again. You might need to log in.');
                    return; // Exit function
                }

                const data = await response.json(); // Now this line is safer

                if (data.success) {
                    alert(successMessage);
                    const modalToClose = document.getElementById(formId.replace('-form', '-modal'));
                    if (modalToClose) {
                        closeModal(modalToClose);
                    }

                    if (formId === 'add-bank-account-form') {
                        await updateBankAccountsDropdown(data.new_account_id);
                    } else {
                        // Reload for fund, withdraw, transfer to update balance/history
                        window.location.reload();
                    }
                } else {
                    // Server responded with JSON, but indicated failure
                    throw new Error(data.message || 'Transaction failed');
                }
            } catch (error) {
                console.error('Error during form submission:', error);
                alert(error.message || 'An error occurred. Please try again.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }

    // Initialize form handlers
    handleWalletFormSubmission('fund-wallet-form', 'Wallet funded successfully!');
    handleWalletFormSubmission('withdraw-wallet-form', 'Withdrawal request submitted!');
    handleWalletFormSubmission('transfer-wallet-form', 'Transfer completed successfully!');
    handleWalletFormSubmission('add-bank-account-form', 'Bank account added successfully!');

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

            const typeMatch = typeValue === 'all' || itemType === typeValue;

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
    filterTransactions();

    // --- Cleanup on page unload ---
    window.addEventListener('beforeunload', cleanup);

    // Initial load of bank accounts for the withdrawal modal
    // It's good practice to call this when the DOM is ready to populate the dropdown
    updateBankAccountsDropdown();
});