// Side Navigation Toggle
$(document).ready(function() {
    // Open side navigation
    $('.menu-toggle').click(function() {
        $('.sidenav').addClass('active');
        $('.sidenav-overlay').addClass('active');
        $('body').css('overflow', 'hidden');
    });

    // Close side navigation
    $('.close-sidenav, .sidenav-overlay').click(function() {
        $('.sidenav').removeClass('active');
        $('.sidenav-overlay').removeClass('active');
        $('body').css('overflow', 'auto');
    });

    // Tab switching
    $('.tab-btn').click(function() {
        $('.tab-btn').removeClass('active');
        $(this).addClass('active');
        
        const tabId = $(this).data('tab') + '-tab';
        $('.tab-content').removeClass('active');
        $('#' + tabId).addClass('active');
    });

    // Toggle password visibility
    $('.toggle-password').click(function() {
        const target = $(this).data('target');
        const input = $('#' + target);
        const icon = $(this);
        
        if (input.attr('type') === 'password') {
            input.attr('type', 'text');
            icon.removeClass('fa-eye').addClass('fa-eye-slash');
        } else {
            input.attr('type', 'password');
            icon.removeClass('fa-eye-slash').addClass('fa-eye');
        }
    });

    // Password strength indicator
    $('#new-password').on('input', function() {
        const password = $(this).val();
        const strengthBars = $('.strength-bar');
        const strengthText = $('.strength-text');
        
        // Reset
        strengthBars.css('background', 'var(--gray)');
        strengthText.text('Weak');
        
        if (password.length === 0) {
            return;
        }
        
        // Calculate strength
        let strength = 0;
        if (password.length > 7) strength += 1;
        if (password.match(/[a-z]/)) strength += 1;
        if (password.match(/[A-Z]/)) strength += 1;
        if (password.match(/[0-9]/)) strength += 1;
        if (password.match(/[^a-zA-Z0-9]/)) strength += 1;
        
        // Update UI
        if (strength > 0) {
            strengthBars.slice(0, strength).css('background', 'var(--success)');
        }
        
        if (strength > 3) {
            strengthText.text('Strong').css('color', 'var(--success)');
        } else if (strength > 1) {
            strengthText.text('Medium').css('color', 'var(--warning)');
        } else {
            strengthText.text('Weak').css('color', 'var(--danger)');
        }
    });

    // Profile picture upload preview
    $('#upload-photo').change(function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                $('#profile-picture').attr('src', event.target.result);
                $('.user-avatar img').attr('src', event.target.result);
                $('.profile-img').attr('src', event.target.result);
                
                // Show success message
                Toastify({
                    text: "Profile picture updated successfully!",
                    duration: 3000,
                    close: true,
                    gravity: "top",
                    position: "right",
                    backgroundColor: "var(--success)",
                }).showToast();
            };
            reader.readAsDataURL(file);
        }
    });

    // Theme selection
    $('.theme-option').click(function() {
        const theme = $(this).data('theme');
        $('body').removeClass('dark-theme light-theme');
        
        if (theme === 'dark') {
            $('body').addClass('dark-theme');
            localStorage.setItem('theme', 'dark');
        } else if (theme === 'light') {
            $('body').addClass('light-theme');
            localStorage.setItem('theme', 'light');
        } else {
            localStorage.removeItem('theme');
            // Check system preference
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                $('body').addClass('dark-theme');
            }
        }
        
        // Show success message
        Toastify({
            text: "Theme updated successfully!",
            duration: 3000,
            close: true,
            gravity: "top",
            position: "right",
            backgroundColor: "var(--primary)",
        }).showToast();
    });

    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        $('body').addClass('dark-theme');
    } else if (savedTheme === 'light') {
        $('body').addClass('light-theme');
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        $('body').addClass('dark-theme');
    }

    // Form submission handling
    $('.profile-form').submit(function(e) {
        e.preventDefault();
        // Simulate form submission
        setTimeout(() => {
            Toastify({
                text: "Profile updated successfully!",
                duration: 3000,
                close: true,
                gravity: "top",
                position: "right",
                backgroundColor: "var(--success)",
            }).showToast();
        }, 1000);
    });

    $('.password-form').submit(function(e) {
        e.preventDefault();
        // Simulate form submission
        setTimeout(() => {
            Toastify({
                text: "Password updated successfully!",
                duration: 3000,
                close: true,
                gravity: "top",
                position: "right",
                backgroundColor: "var(--success)",
            }).showToast();
            $(this).trigger("reset");
            $('.strength-bar').css('background', 'var(--gray)');
            $('.strength-text').text('Weak').css('color', 'var(--text-light)');
        }, 1000);
    });

    $('.preferences-form').submit(function(e) {
        e.preventDefault();
        // Simulate form submission
        setTimeout(() => {
            Toastify({
                text: "Preferences saved successfully!",
                duration: 3000,
                close: true,
                gravity: "top",
                position: "right",
                backgroundColor: "var(--primary)",
            }).showToast();
        }, 1000);
    });

    // Notification bell animation
    $('.notification-bell').click(function() {
        $(this).find('i').addClass('shake');
        setTimeout(() => {
            $(this).find('i').removeClass('shake');
        }, 500);
    });
});

// Add Toastify CSS if not already loaded
if (!$('#toastify-css').length) {
    $('head').append('<link id="toastify-css" rel="stylesheet" href="https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css">');
}