document.addEventListener('DOMContentLoaded', function() {
    // 获取游戏元素
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const startButton = document.getElementById('start-btn');
    const pauseButton = document.getElementById('pause-btn');
    
    // 获取触屏控制按钮
    const btnUp = document.getElementById('btn-up');
    const btnDown = document.getElementById('btn-down');
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');

    // 调整画布大小以适应移动设备
    function resizeCanvas() {
        // 获取父容器宽度
        const containerWidth = canvas.parentElement.clientWidth - 40; // 减去padding
        // 确保canvas尺寸在移动设备上适配良好
        if (window.innerWidth <= 480) {
            const size = Math.min(320, containerWidth);
            canvas.width = size;
            canvas.height = size;
        } else {
            canvas.width = 400;
            canvas.height = 400;
        }
    }
    
    // 页面加载和窗口大小改变时调整画布
    resizeCanvas();
    window.addEventListener('resize', function() {
        resizeCanvas();
        if (gameRunning) {
            draw(); // 重新绘制游戏
        } else {
            draw(); // 重新绘制初始画面
        }
    });

    // 游戏变量
    const gridSize = 20;
    let gridWidth, gridHeight;
    
    let snake = [];
    let food = {};
    let direction = 'right';
    let nextDirection = 'right';
    let gameRunning = false;
    let gamePaused = false;
    let score = 0;
    let gameSpeed = 150; // 毫秒
    let gameLoop;

    // 初始化游戏
    function initGame() {
        // 根据画布大小计算网格数量
        gridWidth = Math.floor(canvas.width / gridSize);
        gridHeight = Math.floor(canvas.height / gridSize);
        
        // 初始化蛇
        snake = [
            {x: Math.floor(gridWidth / 4), y: Math.floor(gridHeight / 2)},
            {x: Math.floor(gridWidth / 4) - 1, y: Math.floor(gridHeight / 2)},
            {x: Math.floor(gridWidth / 4) - 2, y: Math.floor(gridHeight / 2)}
        ];
        
        // 生成食物
        generateFood();
        
        // 重置游戏状态
        direction = 'right';
        nextDirection = 'right';
        score = 0;
        scoreElement.textContent = score;
        gameSpeed = 150;
        
        // 绘制游戏
        draw();
    }

    // 生成食物
    function generateFood() {
        food = {
            x: Math.floor(Math.random() * gridWidth),
            y: Math.floor(Math.random() * gridHeight)
        };
        
        // 确保食物不会生成在蛇身上
        for (let i = 0; i < snake.length; i++) {
            if (snake[i].x === food.x && snake[i].y === food.y) {
                generateFood();
                break;
            }
        }
    }

    // 绘制游戏
    function draw() {
        // 清空画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 绘制蛇
        snake.forEach((segment, index) => {
            ctx.fillStyle = index === 0 ? '#388E3C' : '#4CAF50';
            ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize);
            
            // 绘制边框
            ctx.strokeStyle = '#E8F5E9';
            ctx.strokeRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize);
            
            // 绘制蛇头眼睛
            if (index === 0) {
                ctx.fillStyle = 'white';
                
                // 根据方向调整眼睛位置
                if (direction === 'right' || direction === 'left') {
                    const eyeY = segment.y * gridSize + gridSize / 3;
                    const eyeSize = gridSize / 6;
                    
                    if (direction === 'right') {
                        ctx.fillRect(segment.x * gridSize + gridSize - eyeSize * 2, eyeY, eyeSize, eyeSize);
                    } else {
                        ctx.fillRect(segment.x * gridSize + eyeSize, eyeY, eyeSize, eyeSize);
                    }
                } else {
                    const eyeX = segment.x * gridSize + gridSize / 3;
                    const eyeSize = gridSize / 6;
                    
                    if (direction === 'down') {
                        ctx.fillRect(eyeX, segment.y * gridSize + gridSize - eyeSize * 2, eyeSize, eyeSize);
                    } else {
                        ctx.fillRect(eyeX, segment.y * gridSize + eyeSize, eyeSize, eyeSize);
                    }
                }
            }
        });
        
        // 绘制食物
        ctx.fillStyle = '#F44336';
        ctx.beginPath();
        ctx.arc(
            food.x * gridSize + gridSize / 2, 
            food.y * gridSize + gridSize / 2, 
            gridSize / 2, 
            0, 
            Math.PI * 2
        );
        ctx.fill();
    }

    // 移动蛇
    function moveSnake() {
        if (gamePaused) return;
        
        // 更新方向
        direction = nextDirection;
        
        // 获取蛇头
        const head = {x: snake[0].x, y: snake[0].y};
        
        // 根据方向移动蛇头
        switch (direction) {
            case 'up':
                head.y--;
                break;
            case 'down':
                head.y++;
                break;
            case 'left':
                head.x--;
                break;
            case 'right':
                head.x++;
                break;
        }
        
        // 检查是否吃到食物
        if (head.x === food.x && head.y === food.y) {
            // 增加分数
            score += 10;
            scoreElement.textContent = score;
            
            // 加速（每100分加速一次）
            if (score % 100 === 0 && gameSpeed > 50) {
                gameSpeed -= 10;
                clearInterval(gameLoop);
                gameLoop = setInterval(gameUpdate, gameSpeed);
            }
            
            // 生成新食物
            generateFood();
        } else {
            // 如果没吃到食物，移除蛇尾
            snake.pop();
        }
        
        // 检查游戏是否结束
        if (isGameOver(head)) {
            endGame();
            return;
        }
        
        // 在蛇头前添加新的头部
        snake.unshift(head);
        
        // 绘制游戏
        draw();
    }

    // 检查游戏是否结束
    function isGameOver(head) {
        // 撞墙
        if (head.x < 0 || head.x >= gridWidth || head.y < 0 || head.y >= gridHeight) {
            return true;
        }
        
        // 撞到自己
        for (let i = 0; i < snake.length; i++) {
            if (snake[i].x === head.x && snake[i].y === head.y) {
                return true;
            }
        }
        
        return false;
    }

    // 游戏更新
    function gameUpdate() {
        moveSnake();
    }

    // 开始游戏
    function startGame() {
        if (gameRunning) return;
        
        initGame();
        gameRunning = true;
        gamePaused = false;
        gameLoop = setInterval(gameUpdate, gameSpeed);
        startButton.textContent = '重新开始';
        pauseButton.textContent = '暂停';
    }

    // 暂停游戏
    function togglePause() {
        if (!gameRunning) return;
        
        gamePaused = !gamePaused;
        pauseButton.textContent = gamePaused ? '继续' : '暂停';
    }

    // 结束游戏
    function endGame() {
        clearInterval(gameLoop);
        gameRunning = false;
        
        // 显示游戏结束消息
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('游戏结束!', canvas.width / 2, canvas.height / 2 - 20);
        ctx.fillText('最终得分: ' + score, canvas.width / 2, canvas.height / 2 + 20);
        
        startButton.textContent = '再玩一次';
    }
    
    // 设置蛇的移动方向
    function setDirection(newDirection) {
        if (!gameRunning || gamePaused) return;
        
        // 防止蛇反向移动
        if (newDirection === 'up' && direction !== 'down') {
            nextDirection = 'up';
        } else if (newDirection === 'down' && direction !== 'up') {
            nextDirection = 'down';
        } else if (newDirection === 'left' && direction !== 'right') {
            nextDirection = 'left';
        } else if (newDirection === 'right' && direction !== 'left') {
            nextDirection = 'right';
        }
    }

    // 键盘控制
    document.addEventListener('keydown', function(event) {
        switch (event.key) {
            case 'ArrowUp':
                setDirection('up');
                break;
            case 'ArrowDown':
                setDirection('down');
                break;
            case 'ArrowLeft':
                setDirection('left');
                break;
            case 'ArrowRight':
                setDirection('right');
                break;
        }
    });
    
    // 触屏控制按钮事件
    btnUp.addEventListener('click', function() {
        setDirection('up');
    });
    
    btnDown.addEventListener('click', function() {
        setDirection('down');
    });
    
    btnLeft.addEventListener('click', function() {
        setDirection('left');
    });
    
    btnRight.addEventListener('click', function() {
        setDirection('right');
    });
    
    // 触摸屏滑动控制
    let touchStartX = 0;
    let touchStartY = 0;
    
    // 监听触摸开始事件
    canvas.addEventListener('touchstart', function(event) {
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
        event.preventDefault(); // 防止页面滚动
    }, { passive: false });
    
    // 监听触摸结束事件
    canvas.addEventListener('touchend', function(event) {
        if (!gameRunning || gamePaused) return;
        
        const touchEndX = event.changedTouches[0].clientX;
        const touchEndY = event.changedTouches[0].clientY;
        
        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;
        
        // 判断滑动方向
        if (Math.abs(diffX) > Math.abs(diffY)) {
            // 水平滑动
            if (diffX > 30) { // 向右滑动
                setDirection('right');
            } else if (diffX < -30) { // 向左滑动
                setDirection('left');
            }
        } else {
            // 垂直滑动
            if (diffY > 30) { // 向下滑动
                setDirection('down');
            } else if (diffY < -30) { // 向上滑动
                setDirection('up');
            }
        }
        
        event.preventDefault(); // 防止页面滚动
    }, { passive: false });

    // 按钮事件
    startButton.addEventListener('click', startGame);
    pauseButton.addEventListener('click', togglePause);

    // 初始显示
    draw();
}); 