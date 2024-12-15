document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    const closeBtn = document.getElementsByClassName('close')[0];
    const photoWall = document.querySelector('.photo-wall');
    
    // 动画效果类数组
    const effectClasses = ['zoom', 'rotate', 'blur', 'scale', 'grayscale', 'sepia'];
    
    // 预定义图片数组
    const images = [
        // jpg格式图片
        ...Array.from({length: 100}, (_, i) => `./images/${i + 1}.jpg`),
        // webp格式图片
        ...Array.from({length: 100}, (_, i) => `./images/${i + 1}.webp`),
        // 其他格式图片
        './images/w.jpg',
        './images/x.jpg',
        './images/o1.jpg',
        './images/o2.jpg'
    ];

    // 检查单个图片是否存在
    function checkImage(imagePath) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(imagePath);
            img.onerror = () => reject(imagePath);
            img.src = imagePath;
        });
    }

    // 创建照片元素
    function createPhotoItem(imagePath, index) {
        const photoItem = document.createElement('div');
        const effectClass = effectClasses[Math.floor(Math.random() * effectClasses.length)];
        photoItem.className = `photo-item ${effectClass}`;
        
        photoItem.style.opacity = '0';
        photoItem.style.transform = 'translateY(20px)';
        photoItem.style.transition = 'all 0.5s ease';
        
        photoItem.innerHTML = `
            <img src="${imagePath}" alt="照片${index + 1}">
            <div class="overlay">
                <p>点击查看大图</p>
            </div>
        `;
        
        return photoItem;
    }

    // 并行检查所有图片并加载
    Promise.allSettled(images.map(checkImage))
        .then(results => {
            const validImages = results
                .filter(result => result.status === 'fulfilled')
                .map(result => result.value);

            validImages.forEach((imagePath, index) => {
                const photoItem = createPhotoItem(imagePath, index);
                photoWall.appendChild(photoItem);
                
                // 使用requestAnimationFrame来优化动画性能
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        photoItem.style.opacity = '1';
                        photoItem.style.transform = 'translateY(0)';
                    }, index * 100); // 减少延迟时间
                });
            });
        });
    
    // 图片点击事件
    photoWall.addEventListener('click', function(e) {
        const photoItem = e.target.closest('.photo-item');
        if (photoItem) {
            const img = photoItem.querySelector('img');
            modal.style.display = "block";
            modalImg.src = img.src;
        }
    });
    
    // 关闭模态框
    closeBtn.addEventListener('click', function() {
        modal.style.display = "none";
    });
    
    // 点击模态框外部关闭
    window.addEventListener('click', function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    });

    // 添加音乐自动播放功能
    const audio = document.querySelector('audio');
    
    // 尝试自动播放
    function playAudio() {
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                // 自动播放失败时（浏览器政策限制），添加点击事件监听
                document.addEventListener('click', () => {
                    audio.play();
                }, { once: true }); // once: true 表示事件只触发一次
            });
        }
    }

    // 页面加载时尝试播放
    playAudio();

    // 当音频结束时重新播放
    audio.addEventListener('ended', () => {
        playAudio();
    });
}); 