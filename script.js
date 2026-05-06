document.addEventListener('DOMContentLoaded', () => {
    // Global rotation angles (shared between canvas and scroll engine)
    let angleX = 0;
    let angleY = 0;

    // 1. 3D Topographic Data Grid Canvas
    const canvas = document.getElementById('hero-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        const cols = 40;
        const rows = 30;
        const spacing = 45;
        let points = [];
        let time = 0;

        function initPoints() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            points = [];
            for (let z = 0; z < rows; z++) {
                for (let x = 0; x < cols; x++) {
                    points.push({
                        ox: (x - cols / 2) * spacing,
                        oz: (z - rows / 2) * spacing,
                        x: 0, y: 0, z: 0
                    });
                }
            }
        }

        function project(x, y, z) {
            const camZ = 800;
            const perspective = camZ / (camZ + z + 400); // Push back
            return {
                x: x * perspective + canvas.width / 2,
                y: y * perspective + canvas.height * 0.6, // Shift down slightly
                scale: perspective
            };
        }

        function rotate(x, y, z, ax, ay) {
            // Rotate around X (tilt)
            let y1 = y * Math.cos(ax) - z * Math.sin(ax);
            let z1 = y * Math.sin(ax) + z * Math.cos(ax);
            // Rotate around Y (spin)
            let x2 = x * Math.cos(ay) + z1 * Math.sin(ay);
            let z2 = -x * Math.sin(ay) + z1 * Math.cos(ay);
            return { x: x2, y: y1, z: z2 };
        }

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            time += 0.015;
            
            // Mouse interaction offsets
            const mouseTargetX = (mouseX / window.innerWidth - 0.5) * Math.PI;
            const mouseTargetY = (mouseY / window.innerHeight - 0.5) * Math.PI;
            
            // Smoothly interpolate angles
            angleY += 0.002; // Continuous slow spin
            
            // Base tilt for isometric view
            const baseAngleX = 1.1; 

            // Calculate current positions with wave logic
            for (let i = 0; i < points.length; i++) {
                const p = points[i];
                // Complex wave function for organic tech feel
                const distance = Math.sqrt(p.ox * p.ox + p.oz * p.oz);
                p.y = Math.sin(distance * 0.01 - time) * 80 + Math.cos(p.ox * 0.02 + time) * 40;
                
                // Apply 3D rotation
                const rotated = rotate(p.ox, p.y, p.oz, baseAngleX, angleY + mouseTargetX * 0.2);
                p.rx = rotated.x;
                p.ry = rotated.y;
                p.rz = rotated.z;
            }

            // Sort points back to front for proper rendering depth
            const sortedIndices = points.map((p, i) => i).sort((a, b) => points[b].rz - points[a].rz);

            // Draw grid points and connections
            ctx.lineWidth = 1;
            
            sortedIndices.forEach(idx => {
                const p = points[idx];
                const proj = project(p.rx, p.ry, p.rz);
                
                // Fade out distant points
                const depth = Math.max(0, Math.min(1, (p.rz + 1000) / 2000));
                // Cyan to deep blue based on height
                const heightColor = Math.min(1, Math.max(0, (p.y + 120) / 240)); 
                
                const r = Math.floor(6 + heightColor * 90);
                const g = Math.floor(182 - heightColor * 80);
                const b = 212 + heightColor * 43;
                const alpha = Math.max(0.05, 1 - depth) * 0.6;
                
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha + 0.2})`;
                ctx.beginPath();
                ctx.arc(proj.x, proj.y, Math.max(0.5, proj.scale * 2), 0, Math.PI * 2);
                ctx.fill();

                // Draw connecting lines (right and down)
                const col = idx % cols;
                const row = Math.floor(idx / cols);
                
                ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.3})`;
                ctx.beginPath();
                
                // Connect to right neighbor
                if (col < cols - 1) {
                    const right = points[idx + 1];
                    const rightProj = project(right.rx, right.ry, right.rz);
                    ctx.moveTo(proj.x, proj.y);
                    ctx.lineTo(rightProj.x, rightProj.y);
                }
                
                // Connect to bottom neighbor
                if (row < rows - 1) {
                    const bottom = points[idx + cols];
                    const bottomProj = project(bottom.rx, bottom.ry, bottom.rz);
                    ctx.moveTo(proj.x, proj.y);
                    ctx.lineTo(bottomProj.x, bottomProj.y);
                }
                ctx.stroke();
            });
            
            requestAnimationFrame(draw);
        }

        let mouseX = 0;
        let mouseY = 0;
        let targetAngleX = 0;
        let targetAngleY = 0;

        const handleInteraction = (clientX, clientY) => {
            mouseX = (clientX - canvas.width / 2) / canvas.width;
            mouseY = (clientY - canvas.height / 2) / canvas.height;
            // Interaction drives the rotation slightly
            angleY += mouseX * 0.02;
            angleX -= mouseY * 0.02;
        };

        window.addEventListener('mousemove', (e) => handleInteraction(e.clientX, e.clientY));
        
        window.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                handleInteraction(e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: true });

        initPoints();
        draw();
        window.addEventListener('resize', initPoints);
    }

    // Custom Fluid Cursor
    const cursorDot = document.getElementById('cursor-dot');
    const cursorOutline = document.getElementById('cursor-outline');
    let cursorX = window.innerWidth / 2;
    let cursorY = window.innerHeight / 2;
    let outlineX = cursorX;
    let outlineY = cursorY;

    if (cursorDot && cursorOutline) {
        window.addEventListener('mousemove', (e) => {
            cursorX = e.clientX;
            cursorY = e.clientY;
            cursorDot.style.transform = `translate(${cursorX}px, ${cursorY}px) translate(-50%, -50%)`;
        });

        function animateCursor() {
            outlineX += (cursorX - outlineX) * 0.15;
            outlineY += (cursorY - outlineY) * 0.15;
            cursorOutline.style.transform = `translate(${outlineX}px, ${outlineY}px) translate(-50%, -50%)`;
            requestAnimationFrame(animateCursor);
        }
        animateCursor();

        const bindHoverEffects = () => {
            document.querySelectorAll('a, button, .glass-card, .scramble-text').forEach(el => {
                if (el.dataset.cursorBound) return;
                el.dataset.cursorBound = 'true';
                el.addEventListener('mouseenter', () => {
                    cursorOutline.style.width = '60px';
                    cursorOutline.style.height = '60px';
                    cursorOutline.style.background = 'rgba(99, 102, 241, 0.1)';
                });
                el.addEventListener('mouseleave', () => {
                    cursorOutline.style.width = '40px';
                    cursorOutline.style.height = '40px';
                    cursorOutline.style.background = 'transparent';
                });
            });
        };
        bindHoverEffects();
        // Expose to global so we can re-bind on dynamic load
        window.bindCursorEffects = bindHoverEffects;
    }

    // Scroll Progress & Cinematic Parallax Engine
    const progressBar = document.getElementById('scroll-progress');
    const auraContainer = document.querySelector('.aura-container');
    const heroContent = document.getElementById('hero-content');
    const heroSection = document.getElementById('hero');
    let lastScroll = 0;

    function cinematicScroll() {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrollDelta = winScroll - lastScroll;
        lastScroll = winScroll;

        // 1. Progress Bar
        if (progressBar) {
            const scrolled = (winScroll / height) * 100;
            progressBar.style.width = scrolled + "%";
        }

        // 2. Aura parallax
        if (auraContainer) {
            auraContainer.style.setProperty('--py', `${winScroll * -0.3}px`);
        }

        // 3. Hero cinematic dissolve: translate, scale, blur, opacity
        if (heroContent && heroSection) {
            const heroH = heroSection.offsetHeight;
            const progress = Math.min(winScroll / heroH, 1); // 0 at top, 1 at end of hero
            heroContent.style.transform = `translateY(${progress * 200}px) scale(${1 - progress * 0.15})`;
            heroContent.style.opacity = Math.max(0, 1 - progress * 2);
            heroContent.style.filter = `blur(${progress * 8}px)`;
        }

        // 4. Globe scroll spin
        angleY += scrollDelta * 0.003;
        angleX -= scrollDelta * 0.001;

        // 5. Nav auto-hide on scroll direction
        const nav = document.querySelector('.floating-nav');
        if (nav) {
            if (winScroll > 100) {
                nav.classList.add('nav-solid');
                if (scrollDelta > 3) {
                    nav.classList.add('nav-hidden');
                } else if (scrollDelta < -3) {
                    nav.classList.remove('nav-hidden');
                }
            } else {
                nav.classList.remove('nav-solid', 'nav-hidden');
            }
        }
    }

    window.addEventListener('scroll', cinematicScroll, { passive: true });

    // Ambient Floating Particles
    const ambientCanvas = document.getElementById('ambient-particles');
    if (ambientCanvas) {
        const actx = ambientCanvas.getContext('2d');
        let particles = [];
        const PARTICLE_COUNT = 60;

        function initAmbient() {
            ambientCanvas.width = window.innerWidth;
            ambientCanvas.height = window.innerHeight;
            particles = [];
            for (let i = 0; i < PARTICLE_COUNT; i++) {
                particles.push({
                    x: Math.random() * ambientCanvas.width,
                    y: Math.random() * ambientCanvas.height,
                    size: Math.random() * 2 + 0.5,
                    speedX: (Math.random() - 0.5) * 0.3,
                    speedY: (Math.random() - 0.5) * 0.2 - 0.1,
                    opacity: Math.random() * 0.5 + 0.1,
                    pulse: Math.random() * Math.PI * 2,
                });
            }
        }

        function drawAmbient() {
            actx.clearRect(0, 0, ambientCanvas.width, ambientCanvas.height);
            particles.forEach(p => {
                p.x += p.speedX;
                p.y += p.speedY;
                p.pulse += 0.01;

                // Wrap around
                if (p.x < 0) p.x = ambientCanvas.width;
                if (p.x > ambientCanvas.width) p.x = 0;
                if (p.y < 0) p.y = ambientCanvas.height;
                if (p.y > ambientCanvas.height) p.y = 0;

                const alpha = p.opacity * (0.5 + Math.sin(p.pulse) * 0.5);
                actx.beginPath();
                actx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                actx.fillStyle = `rgba(99, 102, 241, ${alpha})`;
                actx.fill();
            });

            // Draw connections between close particles
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 120) {
                        actx.beginPath();
                        actx.moveTo(particles[i].x, particles[i].y);
                        actx.lineTo(particles[j].x, particles[j].y);
                        actx.strokeStyle = `rgba(99, 102, 241, ${0.08 * (1 - dist / 120)})`;
                        actx.lineWidth = 0.5;
                        actx.stroke();
                    }
                }
            }
            requestAnimationFrame(drawAmbient);
        }

        initAmbient();
        drawAmbient();
        window.addEventListener('resize', initAmbient);
    }

    // Magnetic Button Effect
    document.querySelectorAll('.magnetic-btn').forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'translate(0, 0)';
        });
    });

    // Footer Observer
    const footer = document.querySelector('footer');
    if (footer) {
        const footerObs = new IntersectionObserver(entries => {
            entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in-view'); });
        }, { threshold: 0.1 });
        footerObs.observe(footer);
    }

    // Scramble Text Hacker Effect
    class TextScramble {
        constructor(el) {
            this.el = el;
            this.chars = '!<>-_\\\\/[]{}—=+*^?#________';
            this.update = this.update.bind(this);
            this.originalText = el.innerText;
        }
        setText(newText) {
            const oldText = this.el.innerText;
            const length = Math.max(oldText.length, newText.length);
            const promise = new Promise((resolve) => this.resolve = resolve);
            this.queue = [];
            for (let i = 0; i < length; i++) {
                const from = oldText[i] || '';
                const to = newText[i] || '';
                const start = Math.floor(Math.random() * 40);
                const end = start + Math.floor(Math.random() * 40);
                this.queue.push({ from, to, start, end });
            }
            cancelAnimationFrame(this.frameRequest);
            this.frame = 0;
            this.update();
            return promise;
        }
        update() {
            let output = '';
            let complete = 0;
            for (let i = 0, n = this.queue.length; i < n; i++) {
                let { from, to, start, end, char } = this.queue[i];
                if (this.frame >= end) {
                    complete++;
                    output += to;
                } else if (this.frame >= start) {
                    if (!char || Math.random() < 0.28) {
                        char = this.randomChar();
                        this.queue[i].char = char;
                    }
                    output += `<span class="text-indigo-400 font-mono opacity-80">${char}</span>`;
                } else {
                    output += from;
                }
            }
            this.el.innerHTML = output;
            if (complete === this.queue.length) {
                this.resolve();
            } else {
                this.frameRequest = requestAnimationFrame(this.update);
                this.frame++;
            }
        }
        randomChar() {
            return this.chars[Math.floor(Math.random() * this.chars.length)];
        }
    }

    const scramblers = [];
    document.querySelectorAll('.scramble-text').forEach(el => {
        const fx = new TextScramble(el);
        scramblers.push({ el, fx, originalText: el.innerText });
        el.innerHTML = '&nbsp;';
    });

    // Cinematic Scroll Observer (replaces old .reveal observer)
    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const delay = parseInt(el.dataset.scrollDelay || '0');
                
                setTimeout(() => {
                    el.classList.add('in-view');
                    
                    // Also trigger legacy .reveal.active
                    if (el.classList.contains('reveal')) {
                        el.classList.add('active');
                    }
                    
                    // Trigger scramble text
                    const triggerScramble = (target) => {
                        const scrambler = scramblers.find(s => s.el === target);
                        if (scrambler && !scrambler.done) {
                            scrambler.fx.setText(scrambler.originalText);
                            scrambler.done = true;
                        }
                    };
                    if (el.classList.contains('scramble-text')) triggerScramble(el);
                    el.querySelectorAll('.scramble-text').forEach(child => triggerScramble(child));
                }, delay);
            }
        });
    }, { threshold: 0.05, rootMargin: '0px 0px 50px 0px' });

    // Observe all scroll-animated elements
    document.querySelectorAll('[data-scroll], [data-scroll-stagger], .scroll-line, .reveal').forEach(el => {
        scrollObserver.observe(el);
    });

    // 3D Tilt Engine
    function bind3DTilt() {
        const cards = document.querySelectorAll('.glass-card');
        cards.forEach(card => {
            if (card.dataset.tiltBound) return;
            card.dataset.tiltBound = 'true';

            // Set perspective on parent to enable true 3D depth
            card.parentElement.style.perspective = '1500px';
            
            const handleMove = (clientX, clientY) => {
                const rect = card.getBoundingClientRect();
                const x = clientX - rect.left;
                const y = clientY - rect.top;
                
                // If touch moves outside the physical card bounds, reset it
                if (x < 0 || x > rect.width || y < 0 || y > rect.height) {
                    resetTilt();
                    return;
                }
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                // Calculate rotation (max 12 degrees)
                const rotateX = ((y - centerY) / centerY) * -12; 
                const rotateY = ((x - centerX) / centerX) * 12;
                
                card.style.setProperty('--rx', `${rotateX}deg`);
                card.style.setProperty('--ry', `${rotateY}deg`);
                card.style.setProperty('--s', `1.02`);
                
                // Dynamic glare
                const glareX = (x / rect.width) * 100;
                const glareY = (y / rect.height) * 100;
                card.style.background = `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 50%)`;
            };

            const resetTilt = () => {
                card.style.setProperty('--rx', `0deg`);
                card.style.setProperty('--ry', `0deg`);
                card.style.setProperty('--s', `1`);
                card.style.transition = 'background 0.5s';
                card.style.background = `rgba(255, 255, 255, 0.03)`;
            };

            const startTilt = () => {
                card.style.transition = 'transform 0.1s ease-out';
            };

            // Mouse Events
            card.addEventListener('mousemove', (e) => handleMove(e.clientX, e.clientY));
            card.addEventListener('mouseleave', resetTilt);
            card.addEventListener('mouseenter', startTilt);

            // Touch Events (Mobile/Tablet)
            card.addEventListener('touchmove', (e) => {
                if (e.touches.length > 0) handleMove(e.touches[0].clientX, e.touches[0].clientY);
            }, { passive: true });
            card.addEventListener('touchend', resetTilt);
            card.addEventListener('touchstart', startTilt, { passive: true });
        });
    }

    // Initialize tilt on static cards
    bind3DTilt();

    // 3. Shop Logic (Firestore Only)
    const publicWorksGrid = document.getElementById('public-works-grid');

    const renderWorks = (works) => {
        publicWorksGrid.innerHTML = '';
        if (works.length === 0) {
            publicWorksGrid.innerHTML = '<p class="col-span-full text-center py-20 text-slate-500 font-medium">No items found in database.</p>';
            return;
        }
        works.forEach(data => {
            const card = document.createElement('div');
            card.className = 'glass-card p-10 flex flex-col gap-6 reveal';
            card.innerHTML = `
                <div class="flex justify-between items-start float-3d">
                    <span class="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Asset v1.0</span>
                    <i data-lucide="package" class="w-5 h-5 text-slate-600"></i>
                </div>
                <div class="float-3d">
                    <h3 class="text-2xl font-display font-bold mb-3">${data.title}</h3>
                    <p class="text-slate-500 text-sm font-medium leading-relaxed mb-8">${data.description}</p>
                    <div class="flex items-center justify-between mt-auto">
                        <span class="text-xl font-bold">₹${data.price}</span>
                        <button class="buy-btn border border-white/10 px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all" 
                                data-id="${data.id}" data-title="${data.title}" data-price="${data.price}">
                            Acquire
                        </button>
                    </div>
                </div>
            `;
            publicWorksGrid.appendChild(card);
            revealObserver.observe(card);
        });
        lucide.createIcons();
        bindBuyEvents();
        bind3DTilt(); // Re-bind for dynamic elements
    };

    async function loadShopWorks() {
        if (!publicWorksGrid) return;

        const defaultArtifacts = [
            { id: 'mock-1', title: 'Aether UI Kit', description: 'A futuristic design system for next-gen web applications.', price: '1200' },
            { id: 'mock-2', title: 'Hyper-Fluid Pack', description: 'Interactive canvas animations and fluid shaders for high-end portfolios.', price: '800' },
            { id: 'mock-3', title: 'Neural Admin', description: 'Advanced dashboard architecture with real-time data visualization.', price: '1500' }
        ];

        const render = (works, isLive = false) => {
            publicWorksGrid.innerHTML = '';
            const items = works.length > 0 ? works : defaultArtifacts;
            items.forEach(data => {
                const card = document.createElement('div');
                card.className = 'glass-card p-10 flex flex-col gap-6 reveal';
                if (isLive) card.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                card.innerHTML = `
                    <div class="flex justify-between items-start">
                        <span class="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">${isLive ? 'Live Sync' : 'Asset v1.0'}</span>
                        <i data-lucide="${isLive ? 'database' : 'package'}" class="w-5 h-5 text-slate-600"></i>
                    </div>
                    <div>
                        <h3 class="text-2xl font-display font-bold mb-3">${data.title}</h3>
                        <p class="text-slate-500 text-sm font-medium leading-relaxed mb-8">${data.description}</p>
                        <div class="flex items-center justify-between mt-auto">
                            <span class="text-xl font-bold">₹${data.price}</span>
                            <button class="buy-btn border border-white/10 px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all" 
                                    data-id="${data.id}" data-title="${data.title}" data-price="${data.price}">
                                Acquire
                            </button>
                        </div>
                    </div>
                `;
                publicWorksGrid.appendChild(card);
                setTimeout(() => card.classList.add('active'), 100);
            });
            lucide.createIcons();
            bindBuyEvents();
        };

        // 1. Show mocks immediately
        render([]);

        // 2. Direct Firestore Sync
        try {
            const firestore = firebase.firestore();
            firestore.collection('works').onSnapshot((snapshot) => {
                if (!snapshot.empty) {
                    const works = [];
                    snapshot.forEach(doc => works.push({ id: doc.id, ...doc.data() }));
                    console.log("Firebase Sync: Found " + works.length + " items");
                    render(works, true);
                } else {
                    console.log("Firebase Sync: Collection is empty, using mocks");
                }
            }, (err) => {
                console.error("Firebase Sync Error:", err);
            });
        } catch (e) {
            console.error("Firebase Initialization Error:", e);
        }
    }

    function bindBuyEvents() {
        document.querySelectorAll('.buy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const { id, title, price } = e.currentTarget.dataset;
                if (!firebase.auth().currentUser) {
                    localStorage.setItem('pendingPurchase', JSON.stringify({ id, title, price }));
                    window.location.href = 'login.html';
                    return;
                }
                openPaymentModal(title, price, id);
            });
        });
    }

    // 4. Payment Modal Logic
    const paymentModal = document.getElementById('payment-modal');
    const closeModal = document.getElementById('close-modal');
    let currentProductId = null;

    function openPaymentModal(title, price, id) {
        currentProductId = id;
        document.querySelector('.modal-title').textContent = title;
        document.getElementById('pay-amount').value = price || '100';
        document.getElementById('pay-amount').readOnly = !!price;
        
        updateUPI();
        paymentModal.classList.add('active');
    }

    function updateUPI() {
        const amount = document.getElementById('pay-amount').value;
        const upi = `upi://pay?pa=rajsimariaa-2@okaxis&pn=Raj%20Simaria&cu=INR&am=${amount}`;
        document.getElementById('upi-qr').src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upi)}&color=6366f1&bgcolor=030014`;
        document.getElementById('upi-link').href = upi;
    }

    document.getElementById('pay-amount').addEventListener('input', updateUPI);

    if (closeModal) closeModal.addEventListener('click', () => paymentModal.classList.remove('active'));

    document.getElementById('payment-done-btn').addEventListener('click', async () => {
        const btn = document.getElementById('payment-done-btn');
        const name = document.getElementById('pay-name').value;
        const email = document.getElementById('pay-email').value;
        const amount = document.getElementById('pay-amount').value;
        
        if (!name || !email || !amount) return alert('Fill all fields.');

        btn.disabled = true;
        btn.textContent = 'Processing...';

        try {
            await db.collection('payments').add({
                name, email, amount: Number(amount),
                productId: currentProductId,
                status: 'pending',
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            document.getElementById('payment-form').style.display = 'none';
            document.getElementById('payment-success').style.display = 'block';
        } catch (e) {
            alert('Error: ' + e.message);
        } finally {
            btn.disabled = false;
            btn.textContent = 'Confirm Payment';
        }
    });

    // Auth State & Pending Purchase
    firebase.auth().onAuthStateChanged((user) => {
        const pending = localStorage.getItem('pendingPurchase');
        if (user && pending) {
            try {
                const { id, title, price } = JSON.parse(pending);
                localStorage.removeItem('pendingPurchase');
                setTimeout(() => openPaymentModal(title, price, id), 1000);
            } catch (e) {
                console.error("Pending purchase parse error", e);
            }
        }
    });

    // Mobile Menu Logic
    const menuBtn = document.getElementById('menu-btn');
    const mobCloseBtn = document.getElementById('close-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (menuBtn && mobileMenu) {
        menuBtn.addEventListener('click', () => mobileMenu.classList.add('active'));
    }

    if (mobCloseBtn && mobileMenu) {
        mobCloseBtn.addEventListener('click', () => mobileMenu.classList.remove('active'));
    }

    document.querySelectorAll('.mobile-link').forEach(link => {
        link.addEventListener('click', () => mobileMenu.classList.remove('active'));
    });

    // Handle Year
    const yearSpan = document.getElementById('year');
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();

    loadShopWorks();
});
