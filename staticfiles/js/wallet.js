document.addEventListener('DOMContentLoaded', function() {
    // Transaction Action Buttons
    const actionButtons = document.querySelectorAll('[data-action]');
    const transactionModal = document.getElementById('transaction-modal');
    const closeModal = document.getElementById('close-modal');
    const modalTitle = document.getElementById('modal-title');
    const transactionForm = document.getElementById('transaction-form');
    const transactionTypeInput = document.getElementById('transaction-type-input');
    const recipientGroup = document.getElementById('recipient-group');
    const submitText = document.getElementById('submit-text');
    
    // Filter Elements
    const typeFilter = document.getElementById('transaction-type');
    const periodFilter = document.getElementById('transaction-period');
    const transactionItems = document.querySelectorAll('.transaction-item');
    
    // Open modal with appropriate form based on action
    actionButtons.forEach(button => {
        button.addEventListener('click', function() {
            const action = this.getAttribute('data-action');
            
            switch(action) {
                case 'fund':
                    modalTitle.textContent = 'Fund Wallet';
                    transactionTypeInput.value = 'deposit';
                    recipientGroup.style.display = 'none';
                    submitText.textContent = 'Proceed to Payment';
                    break;
                case 'withdraw':
                    modalTitle.textContent = 'Withdraw Funds';
                    transactionTypeInput.value = 'withdrawal';
                    recipientGroup.style.display = 'none';
                    submitText.textContent = 'Request Withdrawal';
                    break;
                case 'transfer':
                    modalTitle.textContent = 'Transfer Funds';
                    transactionTypeInput.value = 'transfer';
                    recipientGroup.style.display = 'block';
                    submitText.textContent = 'Send Money';
                    break;
            }
            
            transactionModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });
    
    // Close modal
    closeModal.addEventListener('click', function() {
        transactionModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    });
    
    // Close modal when clicking outside
    transactionModal.addEventListener('click', function(e) {
        if (e.target === transactionModal) {
            transactionModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });
    
    // Filter transactions
    function filterTransactions() {
        const typeValue = typeFilter.value;
        const periodValue = periodFilter.value;
        const now = new Date();
        let periodDate = new Date();
        
        // Calculate period date
        switch(periodValue) {
            case '7days':
                periodDate.setDate(now.getDate() - 7);
                break;
            case '30days':
                periodDate.setDate(now.getDate() - 30);
                break;
            case '90days':
                periodDate.setDate(now.getDate() - 90);
                break;
            case 'all':
                periodDate = null;
                break;
        }
        
        transactionItems.forEach(item => {
            const itemType = item.getAttribute('data-type');
            const itemDate = new Date(item.getAttribute('data-date'));
            let showItem = true;
            
            // Filter by type
            if (typeValue !== 'all' && itemType !== typeValue) {
                showItem = false;
            }
            
            // Filter by period
            if (periodDate && itemDate < periodDate) {
                showItem = false;
            }
            
            // Show/hide item
            if (showItem) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }
    
    // Apply filters when changed
    typeFilter.addEventListener('change', filterTransactions);
    periodFilter.addEventListener('change', filterTransactions);
    
    // Form submission
    transactionForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(this);
        const transactionType = formData.get('transaction_type');
        const amount = parseFloat(formData.get('amount'));
        
        // Validate amount
        if (isNaN(amount) {
            alert('Please enter a valid amount');
            return;
        }
        
        if (amount < 100) {
            alert('Minimum amount is ₦100');
            return;
        }
        
        // Simulate form submission (in a real app, this would be an AJAX call)
        const submitBtn = this.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        
        setTimeout(() => {
            alert(`${transactionType.charAt(0).toUpperCase() + transactionType.slice(1)} of ₦${amount.toLocaleString()} initiated successfully!`);
            transactionModal.classList.remove('active');
            document.body.style.overflow = 'auto';
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<span id="submit-text">${submitText.textContent}</span> <i class="fas fa-arrow-right"></i>`;
            
            // In a real app, you would refresh the transaction list here
        }, 1500);
    });
    
    // Initialize filters
    filterTransactions();
});

// static/js/wallet.js

$(document).ready(function() {
    const modalOverlay = $('#transaction-modal');
    const modalTitle = $('#modal-title');
    const transactionForm = $('#transaction-form');
    const transactionTypeInput = $('#transaction-type-input');
    const amountGroup = $('#amount-group');
    const recipientGroup = $('#recipient-group');
    const submitText = $('#submit-text');
    const paymentMethodGroup = $('#payment-method-group');

    // Function to open the modal
    function openModal(action) {
        modalOverlay.addClass('active');
        transactionTypeInput.val(action); // Set hidden input for form submission

        // Reset form fields
        transactionForm[0].reset();
        recipientGroup.hide(); // Hide recipient by default
        paymentMethodGroup.show(); // Show payment method by default
        amountGroup.find('label').text('Amount (₦)'); // Reset label

        if (action === 'fund') {
            modalTitle.text('Fund Wallet');
            submitText.text('Proceed to Payment');
            // Ensure payment method radios are visible for funding
            paymentMethodGroup.show();
        } else if (action === 'withdraw') {
            modalTitle.text('Withdraw Funds');
            submitText.text('Initiate Withdrawal');
            paymentMethodGroup.hide(); // Hide payment method for withdrawals (assuming pre-linked bank)
        } else if (action === 'transfer') {
            modalTitle.text('Transfer Funds');
            submitText.text('Confirm Transfer');
            recipientGroup.show(); // Show recipient field for transfers
            paymentMethodGroup.hide(); // Transfers are internal, no external payment method
        }
    }

    // Event listeners for action buttons
    $('[data-action]').click(function() {
        const action = $(this).data('action');
        openModal(action);
    });

    // Close modal
    $('#close-modal, .modal-overlay').click(function(e) {
        // Only close if clicking on the overlay itself, not inside the modal-content
        if (e.target.id === 'transaction-modal' || e.target.id === 'close-modal') {
            modalOverlay.removeClass('active');
        }
    });

    // Prevent modal from closing when clicking inside its content
    $('.modal-content').click(function(e) {
        e.stopPropagation();
    });

    // Handle form submission (this will submit to Django view)
    transactionForm.submit(function(e) {
        // You might add client-side validation here before submitting
        // Or integrate with a payment gateway for 'fund' action
        // For now, let Django handle validation.
        // The form action will be handled by the 'process_wallet_action' URL
    });


    // --- Transaction History Filtering (Client-side) ---
    const transactionTypeFilter = $('#transaction-type');
    const transactionPeriodFilter = $('#transaction-period');
    const transactionItems = $('.transaction-item'); // Get all transaction items

    function applyFilters() {
        const selectedType = transactionTypeFilter.val();
        const selectedPeriod = transactionPeriodFilter.val();
        const now = new Date();

        transactionItems.each(function() {
            const item = $(this);
            const itemType = item.data('type');
            const itemDateStr = item.data('date');
            const itemDate = new Date(itemDateStr); // Convert date string to Date object

            let typeMatch = (selectedType === 'all' || itemType === selectedType);
            let periodMatch = true;

            if (selectedPeriod === '7days') {
                periodMatch = (now - itemDate) / (1000 * 60 * 60 * 24) <= 7;
            } else if (selectedPeriod === '30days') {
                periodMatch = (now - itemDate) / (1000 * 60 * 60 * 24) <= 30;
            } else if (selectedPeriod === '90days') {
                periodMatch = (now - itemDate) / (1000 * 60 * 60 * 24) <= 90;
            }
            // 'all' periodMatch is always true by default

            if (typeMatch && periodMatch) {
                item.show();
            } else {
                item.hide();
            }
        });
    }

    // Attach change listeners to filters
    transactionTypeFilter.on('change', applyFilters);
    transactionPeriodFilter.on('change', applyFilters);

    // Initial filter application on page load (important if you want client-side filtering after initial server render)
    // Note: If you want server-side filtering, you would submit the form/make AJAX requests on filter change.
    // For now, this is a client-side filter for the currently loaded transactions.
    applyFilters();

    // Set the selected options based on Django context (if page reloads with filters)
    // You already pass selected_type and selected_period from view context
    transactionTypeFilter.val("{{ selected_type }}");
    transactionPeriodFilter.val("{{ selected_period }}");
});