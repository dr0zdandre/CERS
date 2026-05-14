(function() {
    const container = document.getElementById('particles-container');
    if (!container) return;

    const MAX_PARTICLES = 80;

    function spawnPlus() {
        if (container.children.length >= MAX_PARTICLES) {
            container.firstChild?.remove();
        }

        const el = document.createElement('span');
        el.textContent = '+';
        
        el.style.position = 'absolute';
        el.style.fontFamily = "'Segoe UI', 'Arial', sans-serif";
        el.style.fontWeight = '300';
        el.style.fontSize = (12 + Math.random() * 24) + 'px';
        el.style.color = `rgba(255, 255, 255, ${0.2 + Math.random() * 0.5})`;
        el.style.pointerEvents = 'none';
        el.style.userSelect = 'none';
        el.style.willChange = 'transform, opacity';
        
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        const angle = Math.random() * 2 * Math.PI;
        const speed = 2 + Math.random() * 8;

        let x = centerX;
        let y = centerY;
        let vx = Math.cos(angle) * speed;
        let vy = Math.sin(angle) * speed;

        el.style.transform = `translate(${x}px, ${y}px)`;
        container.appendChild(el);

        function animate() {
            x += vx;
            y += vy;

            vx *= 0.995;
            vy *= 0.995;

            const dist = Math.hypot(x - centerX, y - centerY);
            const maxDist = Math.max(window.innerWidth, window.innerHeight) * 0.7;
            const opacity = Math.max(0, 1 - dist / maxDist);
            el.style.opacity = opacity;

            el.style.transform = `translate(${x}px, ${y}px)`;

            if (
                x < -100 || x > window.innerWidth + 100 ||
                y < -100 || y > window.innerHeight + 100 ||
                opacity <= 0
            ) {
                el.remove();
                return;
            }

            requestAnimationFrame(animate);
        }

        requestAnimationFrame(animate);
    }

    for (let i = 0; i < 20; i++) {
        setTimeout(spawnPlus, i * 25);
    }

    setInterval(spawnPlus, 150);
})();


