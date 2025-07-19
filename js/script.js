// script.js

// Menunggu hingga seluruh konten HTML dimuat sebelum menjalankan script
document.addEventListener('DOMContentLoaded', () => {
    // Mendaftarkan plugin GSAP yang akan digunakan
    gsap.registerPlugin(ScrollTrigger, gsap.plugins.TextPlugin);

    // Dapatkan referensi ke elemen-elemen utama
    const loadingOverlay = document.querySelector('.loading-overlay');
    const loadingCounter = document.querySelector('.loading-counter');
    const loadingBar = document.querySelector('.loading-bar');
    const mainContent = document.getElementById('smooth-wrapper'); // Ini adalah elemen yang akan discroll oleh Locomotive Scroll

    // Dapatkan referensi untuk blur overlay
    const blurOverlay = document.getElementById('blur-overlay');

    // Dapatkan semua elemen yang ingin diberi efek blur saat scroll
    const blurOnScrollElements = document.querySelectorAll('.active-scroll-down');
    let blurTimeout; // Untuk mengelola efek blur

    // Loading Words (sesuaikan sesuai keinginan Anda)
    const loadingWords = ['Yuda Design', 'CREATIVE', 'INNOVATIVE', 'PORTFOLIO', 'LOADING'];
    let index = 0;

    // Fungsi untuk mengupdate teks counter dan bar
    function updateLoadingStatus() {
        if (index < loadingWords.length) {
            if (loadingCounter) {
                loadingCounter.textContent = loadingWords[index];
            }
            if (loadingBar) {
                loadingBar.style.width = ((index + 1) / loadingWords.length) * 100 + '%';
            }
            index++;
            if (index <= loadingWords.length) {
                setTimeout(updateLoadingStatus, 250); // Delay antar kata
            }
        } else {
            // Semua kata sudah ditampilkan, sembunyikan loading overlay
            gsap.to(loadingOverlay, {
                opacity: 0,
                duration: 0.8,
                ease: "power2.out",
                onComplete: () => {
                    if (loadingOverlay) {
                        loadingOverlay.style.display = 'none';
                    }
                    // Inisialisasi Locomotive Scroll dan GSAP setelah loading selesai
                    setTimeout(() => {
                        initLocomotiveScrollAndGSAP();
                    }, 100); // Sedikit delay untuk memastikan DOM stabil
                }
            });
        }
    }

    // Animasi awal munculnya elemen loading
    if (loadingCounter && loadingBar && loadingBar.parentElement) {
        gsap.timeline()
            .fromTo(loadingCounter, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" })
            .fromTo(loadingBar.parentElement, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }, "<0.2")
            .fromTo(document.querySelectorAll('.loading-extra-text'), { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.6, ease: "power2.out", stagger: 0.1 }, "<0.4")
            .add(updateLoadingStatus); // Mulai update teks setelah animasi awal
    } else {
        // Fallback jika elemen loading tidak ditemukan, langsung init scroll
        initLocomotiveScrollAndGSAP();
    }


    // FUNGSI UTAMA UNTUK INISIALISASI SCROLL DAN ANIMASI LAINNYA
    let scroll; // Deklarasikan di luar agar bisa diakses

    function initLocomotiveScrollAndGSAP() {
        if (!mainContent) {
            console.error("Elemen #smooth-wrapper tidak ditemukan. Locomotive Scroll tidak dapat diinisialisasi.");
            return;
        }

        // Inisialisasi Locomotive Scroll
        scroll = new LocomotiveScroll({
            el: mainContent,
            smooth: true,
            lerp: 0.08,
            multiplier: 1.2,
            getDirection: true,
            init: false // Jangan langsung init, kita akan init manual
        });

        // Update ScrollTrigger saat Locomotive Scroll bergerak
        scroll.on('scroll', ScrollTrigger.update);

        // Setup ScrollerProxy untuk integrasi GSAP ScrollTrigger
        ScrollTrigger.scrollerProxy(mainContent, {
            scrollTop(value) {
                return arguments.length ? scroll.scrollTo(value, 0, 0) : scroll.scroll.instance.scroll.y;
            },
            getBoundingClientRect() {
                return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
            },
            pinType: mainContent.style.transform ? "transform" : "fixed"
        });

        // Refresh ScrollTrigger ketika Locomotive Scroll diperbarui
        ScrollTrigger.addEventListener("refresh", () => scroll.update());

        // PENTING: Perbarui Locomotive Scroll dan ScrollTrigger setelah semua gambar dimuat
        window.addEventListener('load', () => {
            console.log("Window fully loaded. Updating Locomotive Scroll and ScrollTrigger.");
            if (scroll) {
                scroll.update();
                ScrollTrigger.refresh(true);
            }
        });

        // Panggil scroll.init() setelah semua setup selesai dan DOM stabil
        scroll.init();
        ScrollTrigger.refresh(true); // Pastikan refresh awal setelah init

        // --- BLUR ON SCROLL LOGIC (Adapted for Locomotive Scroll) ---
        scroll.on('scroll', (instance) => {
            // Tentukan apakah kita menggulir ke bawah atau ke atas
            // instance.direction: 1 = down, -1 = up
            const isScrollingDown = instance.direction === 1;

            // Logika untuk blur overlay penuh (#blur-overlay)
            if (blurOverlay) {
                if (isScrollingDown && instance.scroll.y > 100) { // Aktifkan setelah scroll 100px ke bawah
                    blurOverlay.classList.add('active-scroll-down');
                } else if (!isScrollingDown && instance.scroll.y < 100) { // Hapus saat scroll ke atas dan mendekati top
                    blurOverlay.classList.remove('active-scroll-down');
                }
                 // Selalu pastikan blurOverlay tidak memiliki kelas 'hide' saat dibutuhkan
                if (blurOverlay.classList.contains('hide')) {
                    blurOverlay.classList.remove('hide');
                }
            }

            // Logika untuk blur elemen individual dengan kelas .blur-on-scroll
            clearTimeout(blurTimeout); // Hapus timeout sebelumnya
            blurOnScrollElements.forEach(el => {
                el.classList.add('is-blur'); // Terapkan blur segera saat scroll
            });

            blurTimeout = setTimeout(() => {
                blurOnScrollElements.forEach(el => {
                    el.classList.remove('is-blur'); // Hapus blur setelah berhenti scroll
                });
            }, 1200); // Blur fades out 1.2 seconds after scroll stops
        });
        // --- END BLUR ON SCROLL LOGIC ---


        // NAVIGASI SMOOTH SCROLL (dengan data-scroll-to)
        document.querySelectorAll('[data-scroll-to]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                if (targetId && targetId.startsWith('#')) {
                    scroll.scrollTo(targetId, {
                        duration: 1200,
                        easing: [0.76, 0, 0.24, 1], // Custom ease
                        offset: -document.querySelector('.navbar').offsetHeight // Offset untuk sticky navbar
                    });
                }
            });
        });

        // ANIMASI SWAP TEXT (untuk semua elemen dengan kelas ini)
        document.querySelectorAll('.nav-item, .swap-effect').forEach(item => {
            const mainText = item.querySelector('.nav-text-main') || item.querySelector('.text-swap-main');
            const hoverText = item.querySelector('.nav-text-hover') || item.querySelector('.text-swap-hover');
            if (!mainText || !hoverText) return;

            // Set initial state for hoverText
            gsap.set(hoverText, { y: '100%', autoAlpha: 0, position: 'absolute' });

            item.addEventListener('mouseenter', () => {
                gsap.to(mainText, { y: '-100%', autoAlpha: 0, duration: 0.3, overwrite: 'auto' });
                gsap.to(hoverText, { y: '0%', autoAlpha: 1, duration: 0.3, overwrite: 'auto' });
            });
            item.addEventListener('mouseleave', () => {
                gsap.to(mainText, { y: '0%', autoAlpha: 1, duration: 0.3, overwrite: 'auto' });
                gsap.to(hoverText, { y: '100%', autoAlpha: 0, duration: 0.3, overwrite: 'auto' });
            });
        });


        // ANIMASI HERO SECTION
        gsap.fromTo('.navbar', { y: -100, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: "power2.out", delay: 0.5 });
        gsap.from('.navbar nav ul li', { y: -50, opacity: 0, duration: 0.8, ease: "power2.out", stagger: 0.1, delay: 0.8 });

        // Animasi overlay boxes (pastikan CSS box-nya benar)
        const overlayBoxes = document.querySelectorAll('.overlay-boxes .box');
        gsap.from(overlayBoxes, {
            y: (i, target) => { // Fungsi untuk mengacak posisi Y awal
                const speed = parseFloat(target.dataset.scrollSpeed) || 1;
                return -100 * speed;
            },
            opacity: 0,
            duration: 1.5,
            ease: "power3.out",
            stagger: 0.15,
            delay: 1.5,
            onComplete: function() {
                // Setelah animasi masuk, animasikan mereka keluar atau ke posisi normal jika tidak sepenuhnya hilang
                gsap.to(overlayBoxes, {
                    opacity: 0,
                    y: (i, target) => {
                        const speed = parseFloat(target.dataset.scrollSpeed) || 1;
                        return 100 * speed;
                    },
                    duration: 1,
                    ease: "power2.out",
                    delay: 0.5,
                    onComplete: () => {
                        overlayBoxes.forEach(box => box.style.display = 'none'); // Sembunyikan setelah selesai
                    }
                });
            }
        });

        gsap.fromTo(".ui-ux-label", { x: 50, opacity: 0 }, {
            x: 0,
            opacity: 1,
            duration: 1,
            ease: "power2.out",
            delay: 1.8,
            scrollTrigger: {
                trigger: ".hero-section",
                start: "top center",
                toggleActions: "play none none reverse",
                scroller: mainContent
            }
        });

        gsap.fromTo(".hero-cta-button", { y: 50, opacity: 0 }, {
            y: 0,
            opacity: 1,
            duration: 1,
            ease: "power2.out",
            delay: 2.0,
            scrollTrigger: {
                trigger: ".hero-section",
                start: "bottom bottom",
                toggleActions: "play none none reverse",
                scroller: mainContent
            }
        });

        // ANIMASI UNTUK SEMUA SECTION (generic reveal)
        gsap.utils.toArray(".page").forEach(section => {
            gsap.from(section, {
                opacity: 0,
                y: 100,
                duration: 1,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: section,
                    start: "top bottom-=150", // Mulai animasi saat section masuk 150px dari bawah viewport
                    toggleActions: "play none none reverse",
                    scroller: mainContent // Penting untuk Locomotive Scroll
                }
            });
        });

        // Animasi untuk elemen swap-effect dan p-swap-effect
        gsap.utils.toArray(".swap-effect, .p-swap-effect").forEach(element => {
            // Kita sudah menerapkan animasi masuk di generic section reveal,
            // jadi ini mungkin tidak perlu lagi kecuali Anda ingin animasi yang lebih spesifik
            // atau delay antar elemen di dalam section.
        });

        // Animasi untuk LI dalam ul (seperti di about atau process skills)
        gsap.utils.toArray(".dual-content-section ul li").forEach(li => {
            gsap.from(li, {
                x: -50,
                opacity: 0,
                duration: 0.8,
                ease: "power2.out",
                stagger: 0.1,
                scrollTrigger: {
                    trigger: li,
                    start: "top bottom-=50",
                    toggleActions: "play none none reverse",
                    scroller: mainContent
                }
            });
        });

        // Animasi untuk visual element seperti image di about atau process
        gsap.utils.toArray(".visual-element-about img, .visual-element-process img, .full-width-visual img").forEach(img => {
            gsap.from(img, {
                scale: 0.8,
                opacity: 0,
                duration: 1.2,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: img,
                    start: "top bottom-=150",
                    toggleActions: "play none none reverse",
                    scroller: mainContent
                }
            });
        });

        // Animasi untuk setiap .process-steps li
        gsap.utils.toArray(".process-steps li").forEach(step => {
            gsap.from(step, {
                y: 50,
                opacity: 0,
                duration: 0.8,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: step,
                    start: "top bottom-=100",
                    toggleActions: "play none none reverse",
                    scroller: mainContent
                }
            });
        });

        // Panggil refresh sekali lagi setelah semua inisialisasi animasi selesai
        ScrollTrigger.refresh(true);
    }
});