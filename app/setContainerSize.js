// File: app/setContainerSize.js
window.addEventListener('load', () => {
    function adjustContainerSize() {
      const container = document.querySelector('.container');
      if (container) {
        const reservedHeight = window.innerHeight * 0.02; // Reserve 2% for browser UI, search bars, etc.
        const reservedWidth = window.innerWidth * 0.01; // Reserve 1% for vertical scrollbars, etc.
        container.style.width = `calc(100vw - ${reservedWidth}px)`;
        container.style.height = `calc(100vh - ${reservedHeight}px)`;
      }
    }
  
    adjustContainerSize(); // Set on load
    window.addEventListener('resize', adjustContainerSize); // Recalculate on resize
  });
  