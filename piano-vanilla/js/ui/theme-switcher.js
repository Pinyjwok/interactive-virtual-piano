/**
 * Theme Switcher - Handles dark/light mode functionality
 */

// Self-invoking function to avoid polluting global namespace
(function() {
    // Check for saved theme preference or default to 'light'
    const currentTheme = localStorage.getItem('theme') || 'light';
    
    // Apply the saved theme on load
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    // Function to toggle between light and dark themes
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        // Set the theme attribute on the html element
        document.documentElement.setAttribute('data-theme', newTheme);
        
        // Save the preference to localStorage
        localStorage.setItem('theme', newTheme);
    }
    
    // Add theme switcher HTML once the DOM is fully loaded
    document.addEventListener('DOMContentLoaded', function() {
        // Create the theme switcher elements
        const themeSwitcher = document.createElement('div');
        themeSwitcher.className = 'theme-switcher';
        
        const themeToggle = document.createElement('div');
        themeToggle.className = 'theme-toggle';
        
        // Add sun and moon icons with modern emojis
        const sunIcon = document.createElement('div');
        sunIcon.className = 'sun-icon';
        sunIcon.innerHTML = '🌞'; // Changed to sun with rays
        
        const moonIcon = document.createElement('div');
        moonIcon.className = 'moon-icon';
        moonIcon.innerHTML = '🌜'; // Changed to crescent moon face
        
        // Add toggle ball
        const toggleBall = document.createElement('div');
        toggleBall.className = 'toggle-ball';
        
        // Assemble the theme switcher
        themeToggle.appendChild(sunIcon);
        themeToggle.appendChild(moonIcon);
        themeToggle.appendChild(toggleBall);
        themeSwitcher.appendChild(themeToggle);
        
        // Add to the DOM
        document.body.appendChild(themeSwitcher);
        
        // Add click event listener to toggle theme
        themeToggle.addEventListener('click', toggleTheme);
    });
})();
