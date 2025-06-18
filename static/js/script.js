$(document).ready(function() {
    // Side Navigation Toggle
    $('.menu-toggle').click(function(e) { // Pass the event object 'e'
        e.stopPropagation(); // Prevent this click from bubbling up to document and closing immediately
        $('.sidenav').addClass('active');
        $('.sidenav-overlay').addClass('active');
        $('body').css('overflow', 'hidden');
    });

    // Close sidenav by clicking the close button or the overlay
    $('.close-sidenav, .sidenav-overlay').click(function() {
        $('.sidenav').removeClass('active');
        $('.sidenav-overlay').removeClass('active');
        $('body').css('overflow', 'auto');
    });

    // NEW: Close sidenav when clicking anywhere *outside* the sidenav and menu toggle
    $(document).click(function(e) {
        // Check if the click target is NOT the sidenav itself,
        // and NOT a descendant of the sidenav,
        // and NOT the menu toggle button,
        // and NOT a descendant of the menu toggle button.
        if (!$('.sidenav').is(e.target) && !$('.sidenav').has(e.target).length &&
            !$('.menu-toggle').is(e.target) && !$('.menu-toggle').has(e.target).length) {
            
            // Only close if the sidenav is actually active
            if ($('.sidenav').hasClass('active')) {
                $('.sidenav').removeClass('active');
                $('.sidenav-overlay').removeClass('active');
                $('body').css('overflow', 'auto');
            }
        }
    });

    // Tab switching
    $('.tab-btn').click(function() {
        $('.tab-btn').removeClass('active');
        $(this).addClass('active');
        
        const tabId = $(this).data('tab') + '-tab';
        $('.tab-content').removeClass('active');
        $('#' + tabId).addClass('active');
    });

    // Theme Toggle
    $('.theme-toggle').click(function() {
        $('body').toggleClass('dark-theme');
        localStorage.setItem('theme', $('body').hasClass('dark-theme') ? 'dark' : 'light');

        // Show theme change notification
        showToast(
            $('body').hasClass('dark-theme') ? 'Dark mode enabled' : 'Light mode enabled',
            $('body').hasClass('dark-theme') ? 'fas fa-moon' : 'fas fa-sun'
        );
    });

    // Check for saved theme preference
    if (localStorage.getItem('theme') === 'dark' ||
        (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches && !localStorage.getItem('theme'))) {
        $('body').addClass('dark-theme');
    }

    // Notification Bell
    $('.notification-bell').click(function(e) {
        e.stopPropagation(); // Prevent this click from closing other dropdowns/sidenavs
        $(this).find('.notification-dropdown').toggleClass('active');
        $(this).find('i').addClass('shake');
        setTimeout(() => {
            $(this).find('i').removeClass('shake');
        }, 500);
    });

    // Existing: Close notification dropdown when clicking outside
    // This handler will now fire BEFORE the new sidenav close handler if clicked outside dropdowns.
    // It's good to keep them separate, but ensure the logic doesn't clash.
    $(document).click(function(e) {
        // Only close notification dropdown if the click wasn't inside the bell or dropdown itself
        if (!$('.notification-bell').is(e.target) && !$('.notification-bell').has(e.target).length) {
             $('.notification-dropdown').removeClass('active');
        }
    });


    // Initialize Charts
    // Make sure these functions are defined in dashboard.js or elsewhere
    if (typeof initSavingsChart === 'function') {
        initSavingsChart();
    }
    if (typeof initGroupsChart === 'function') {
        initGroupsChart();
    }


    // Mark notifications as read
    $('.notification-item').click(function(e) {
        e.stopPropagation(); // Prevent document click from immediately closing the dropdown when clicking an item
        $(this).removeClass('unread');
        // You might want to add logic here to actually mark it as read in backend
    });

    // Show welcome toast
    setTimeout(() => {
        // Ensure .user-info h4 exists and has text before calling showToast
        const userNameElement = $('.user-info h4');
        if (userNameElement.length) {
             showToast(`Welcome back, ${userNameElement.text()}!`, 'fas fa-hand-wave');
        } else {
            showToast('Welcome back!', 'fas fa-hand-wave');
        }

    }, 1000);
});

// Assuming showToast is defined elsewhere, for completeness here's a basic version:
function showToast(message, iconClass) {
    // Basic toast implementation (you'll need corresponding CSS)
    const toast = $('<div>').addClass('toast-notification animate__fadeIn');
    toast.html(`<i class="${iconClass}"></i> ${message}`);
    $('body').append(toast);

    setTimeout(() => {
        toast.removeClass('animate__fadeIn').addClass('animate__fadeOut');
        toast.on('animationend', function() {
            $(this).remove();
        });
    }, 3000); // Hide after 3 seconds
}