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
            // 初始化时添加动画类
            setTimeout(() => {
                item.classList.add('animate');
            }, index * 300); // 300ms的间隔
        });

        // 为所有预览图片添加点击事件
        document.querySelectorAll('.preview-trigger').forEach(img => {
            img.addEventListener('click', handleImageClick);
        });
    }

    function handleImageClick(e) {
        e.preventDefault();
        const timelineItem = this.closest('.timeline-item');
        const imagePath = this.getAttribute('src');
        showImage(imagePath);
    }

    function showImage(imagePath) {
        // 显示预览容器
        imagePreview.style.display = 'block';
        imagePreview.classList.add('loading');
        
        // 使用 RAF 确保过渡效果生效
        requestAnimationFrame(() => {
            imagePreview.classList.add('show');
        });

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
        // 移除显示类
        imagePreview.classList.remove('show');
        
        // 等待过渡效果完成后隐藏容器
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

    // 修改滚动处理函数
    function handleScroll() {
        const items = Array.from(timelineItems);
        
        items.forEach((item, index) => {
            const rect = item.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            
            // 调整显示阈值
            const showThreshold = windowHeight * 0.85;
            const hideThreshold = windowHeight * 0.1;
            
            const elementMiddle = rect.top + (rect.height / 2);
            const isVisible = elementMiddle < showThreshold && elementMiddle > hideThreshold;
            
            if (isVisible) {
                // 如果上一个元素存在且正在显示，先让它淡出
                if (index > 0) {
                    const prevItem = items[index - 1];
                    if (prevItem.classList.contains('animate')) {
                        prevItem.classList.add('fade-out');
                        setTimeout(() => {
                            prevItem.classList.remove('animate');
                        }, 800); // 与CSS过渡时间匹配
                    }
                }
                
                // 显示当前元素
                if (!item.classList.contains('animate')) {
                    item.classList.remove('fade-out');
                    item.classList.add('animate');
                }
            } else if (elementMiddle > showThreshold) {
                // 如果元素在视口上方，保持初始状态
                item.classList.remove('animate', 'fade-out');
            } else if (elementMiddle < hideThreshold) {
                // 如果元素在视口下方，确保下一个元素已经显示后再隐藏
                const nextItem = items[index + 1];
                if (!nextItem || nextItem.classList.contains('animate')) {
                    if (item.classList.contains('animate')) {
                        item.classList.add('fade-out');
                        setTimeout(() => {
                            item.classList.remove('animate');
                        }, 800);
                    }
                }
            }
        });
    }

    // 优化防抖函数
    function debounceScroll(func, wait) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                func.apply(context, args);
            }, wait);
        };
    }

    // 使用 RAF 和防抖优化滚动处理
    const debouncedScroll = debounceScroll(handleScroll, 16); // 约60fps
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