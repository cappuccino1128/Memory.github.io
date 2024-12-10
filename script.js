document.addEventListener('DOMContentLoaded', function() {
    const timelineItems = document.querySelectorAll('.timeline-item');
    const imagePreview = document.getElementById('imagePreview');
    const previewImage = document.getElementById('previewImage');
    const closeBtn = document.querySelector('.close-btn');

    // 预加载所有图片
    function preloadImages() {
        const imagePromises = Array.from(timelineItems).map(item => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error(`Failed to load ${img.src}`));
                img.src = item.dataset.image;
            });
        });

        Promise.all(imagePromises)
            .then(() => console.log('所有图片预加载完成'))
            .catch(error => console.warn('部分图片预加载失败:', error));
    }

    // 初始化
    preloadImages();
    initializeTimeline();

    function initializeTimeline() {
        // 设置时间线项目的动画延迟
        timelineItems.forEach((item, index) => {
            item.style.animationDelay = `${index * 0.2}s`;
        });

        // 为所有预览图片添加点击事件
        document.querySelectorAll('.preview-trigger').forEach(img => {
            img.addEventListener('click', handleImageClick);
        });
    }

    function handleImageClick(e) {
        e.preventDefault();
        const timelineItem = this.closest('.timeline-item');
        const imagePath = timelineItem.dataset.image;
        showImage(imagePath);
    }

    function showImage(imagePath) {
        // 显示预览容器和加载状态
        imagePreview.style.display = 'block';
        imagePreview.classList.add('loading');
        previewImage.style.opacity = '0';

        // 加载图片
        const img = new Image();
        img.onload = () => {
            previewImage.src = imagePath;
            imagePreview.classList.remove('loading');
            
            // 添加淡入效果
            requestAnimationFrame(() => {
                previewImage.style.opacity = '1';
            });
        };

        img.onerror = () => {
            console.error('图片加载失败:', imagePath);
            imagePreview.classList.remove('loading');
            alert('图片加载失败，请确保图片存在且路径正确');
            closeImagePreview();
        };

        img.src = imagePath;
        
        // 添加键盘事件监听
        document.addEventListener('keydown', handleKeyPress);
    }

    function handleKeyPress(e) {
        if (e.key === 'Escape') {
            closeImagePreview();
        }
    }

    function closeImagePreview() {
        previewImage.style.opacity = '0';
        
        setTimeout(() => {
            imagePreview.style.display = 'none';
            imagePreview.classList.remove('loading');
            previewImage.src = '';
            document.removeEventListener('keydown', handleKeyPress);
        }, 300);
    }

    // 事件监听器设置
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeImagePreview();
    });

    imagePreview.addEventListener('click', (e) => {
        if (e.target === imagePreview) {
            closeImagePreview();
        }
    });

    // 修改 handleScroll 函数
    function handleScroll() {
        timelineItems.forEach(item => {
            const rect = item.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            
            // 调整显示和隐藏的阈值
            const showThreshold = windowHeight * 0.85;
            const hideThreshold = windowHeight * 0.15;
            
            // 计算元素位置
            const elementMiddle = rect.top + (rect.height / 2);
            const isVisible = elementMiddle < showThreshold && elementMiddle > hideThreshold;
            
            if (isVisible) {
                if (!item.classList.contains('animate')) {
                    item.classList.add('animate');
                    item.classList.remove('fade-out');
                    
                    // 添加图片动画
                    const thumbnail = item.querySelector('.timeline-thumbnail');
                    if (thumbnail) {
                        setTimeout(() => {
                            thumbnail.style.opacity = '1';
                            thumbnail.style.transform = 'translateY(0)';
                        }, 300);
                    }
                }
            } else {
                if (item.classList.contains('animate')) {
                    item.classList.remove('animate');
                    item.classList.add('fade-out');
                    
                    // 重置图片状态
                    const thumbnail = item.querySelector('.timeline-thumbnail');
                    if (thumbnail) {
                        thumbnail.style.opacity = '0';
                        thumbnail.style.transform = 'translateY(20px)';
                    }
                }
            }
        });
    }

    // 优化滚动处理函数，使用 RAF 和防抖
    function debounceScroll(func, wait) {
        let timeout;
        return function executedFunction() {
            const later = () => {
                clearTimeout(timeout);
                func();
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // 使用优化后的滚动处理
    const debouncedScroll = debounceScroll(handleScroll, 10);
    window.addEventListener('scroll', () => {
        requestAnimationFrame(debouncedScroll);
    });

    // 初始检查和窗口大小改变时的处理
    handleScroll();
    window.addEventListener('resize', debouncedScroll);

    // 触摸支持
    let touchStartX = 0;
    imagePreview.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
    });

    imagePreview.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        const swipeDistance = touchEndX - touchStartX;
        
        if (Math.abs(swipeDistance) > 50) {
            closeImagePreview();
        }
    });

    // 阻止图片拖动
    previewImage.addEventListener('dragstart', (e) => e.preventDefault());

    // 添加时间更新功能
    function updateDateTime() {
        const now = new Date();
        const dateTimeString = now.getFullYear() + '年' +
            String(now.getMonth() + 1).padStart(2, '0') + '月' +
            String(now.getDate()).padStart(2, '0') + '日 ' +
            String(now.getHours()).padStart(2, '0') + ':' +
            String(now.getMinutes()).padStart(2, '0') + ':' +
            String(now.getSeconds()).padStart(2, '0');
        
        document.getElementById('dateTime').textContent = dateTimeString;
    }

    // 初始更新
    updateDateTime();
    // 每秒更新一次
    setInterval(updateDateTime, 1000);

    // 音乐播放器控制
    const audio = document.getElementById('bgMusic');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const progress = document.querySelector('.progress');
    const playIcon = playPauseBtn.querySelector('.play-icon');

    // 设置音频属性
    audio.loop = true;        // 循环播放
    audio.volume = 0.5;       // 设置音量为50%
    audio.muted = false;      // 确保不是静音的

    // 尝试自动播放
    function tryAutoplay() {
        // 创建上下文
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // 解锁音频上下文
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }

        // 播放音频
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    playIcon.textContent = '⏸';
                    console.log('自动播放成功');
                })
                .catch(error => {
                    console.log('需要用户交互才能播放:', error);
                    // 添加一次性点击事件来启动播放
                    const startAudio = () => {
                        audio.play()
                            .then(() => {
                                playIcon.textContent = '⏸';
                                document.removeEventListener('click', startAudio);
                            });
                    };
                    document.addEventListener('click', startAudio);
                });
        }
    }

    // 页面加载完成后尝试自动播放
    tryAutoplay();

    // 播放/暂停按钮点击事件
    playPauseBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        if (audio.paused) {
            audio.play().then(() => {
                playIcon.textContent = '⏸';
            });
        } else {
            audio.pause();
            playIcon.textContent = '▶';
        }
    });

    // 更新进度条
    audio.addEventListener('timeupdate', function() {
        if (audio.duration) {
            const percentage = (audio.currentTime / audio.duration) * 100;
            progress.style.width = percentage + '%';
        }
    });

    // 音频结束事件（如果没有设置循环）
    audio.addEventListener('ended', function() {
        if (!audio.loop) {
            playIcon.textContent = '▶';
            progress.style.width = '0%';
        }
    });

    // 页面可见性变化处理
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            audio.pause();
            playIcon.textContent = '▶';
        } else if (!audio.paused) {
            audio.play();
            playIcon.textContent = '⏸';
        }
    });

    // 处理页面加载状态
    window.addEventListener('load', function() {
        tryAutoplay();
    });

    // 处理用户首次交互
    const handleFirstInteraction = () => {
        audio.play().then(() => {
            playIcon.textContent = '⏸';
            // 移除所有首次交互的监听器
            ['click', 'touchstart', 'keydown'].forEach(event => {
                document.removeEventListener(event, handleFirstInteraction);
            });
        });
    };

    // 添加多个事件监听器来捕获首次交互
    ['click', 'touchstart', 'keydown'].forEach(event => {
        document.addEventListener(event, handleFirstInteraction);
    });
}); 