const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    }
};

const game = new Phaser.Game(config);

let car;
let cacti;
let boosters;
let background;
let backgroundY = 0;
let backgroundSpeed = 2;
let lineY = 0;
let lineHeight = 40;
let lineWidth = 10;
let lineSpacing = 20;
let score = 0;
let scoreText;
let dustParticles;
let dustTimer = 0;
let dustSpawnRate = 5;
let paused = false;
let pauseText;
let finalText;

function preload() {
    this.load.image('car', 'assets/car.png');
    this.load.image('cactus', 'assets/cactus.png');
    this.load.image('background', 'assets/desert_background.png');
}

function create() {
    background = this.add.tileSprite(400, 300, 800, 1200, 'background');
    background.setOrigin(0.5, 0.5);

    car = this.physics.add.sprite(400, 600 - 140, 'car');
    car.setDisplaySize(120, 72);
    car.setCollideWorldBounds(true);

    cacti = this.physics.add.group();
    boosters = this.physics.add.group();
    dustParticles = this.add.group();

    scoreText = this.add.text(10, 10, 'Score: 0', { fontSize: '32px', fill: '#fff' });

    pauseText = this.add.text(400, 300, 'Paused', { fontSize: '48px', fill: '#fff' });
    pauseText.setOrigin(0.5, 0.5);
    pauseText.setVisible(false);

    finalText = this.add.text(400, 300, '', { fontSize: '48px', fill: '#fff' });
    finalText.setOrigin(0.5, 0.5);
    finalText.setVisible(false);

    this.keys = this.input.keyboard.addKeys({
        left: Phaser.Input.Keyboard.KeyCodes.LEFT,
        right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
        pause: Phaser.Input.Keyboard.KeyCodes.P
    });

    this.time.addEvent({
        delay: 1000 / 25,
        callback: spawnCactus,
        callbackScope: this,
        loop: true
    });

    this.time.addEvent({
        delay: 1000 / 50,
        callback: spawnBooster,
        callbackScope: this,
        loop: true
    });
}

function update() {
    if (Phaser.Input.Keyboard.JustDown(this.keys.pause)) {
        paused = !paused;
        pauseText.setVisible(paused);
    }

    if (!paused) {
        backgroundY += backgroundSpeed;
        if (backgroundY >= 600) {
            backgroundY = 0;
        }
        background.tilePositionY = backgroundY;
        lineY += backgroundSpeed;
        if (lineY >= 600) {
            lineY = 0;
        }

        if (this.keys.left.isDown && car.x > 60) {
            car.x -= 5;
        }
        if (this.keys.right.isDown && car.x < 740) {
            car.x += 5;
        }

        if (this.keys.left.isDown || this.keys.right.isDown) {
            dustTimer++;
            if (dustTimer >= dustSpawnRate) {
                spawnDust(this, car.x, car.y + 72);
                dustTimer = 0;
            }
        }

        dustParticles.getChildren().forEach(dust => {
            dust.y += backgroundSpeed;
            dust.life--;
            if (dust.life <= 0) {
                dust.destroy();
            }
        });

        cacti.getChildren().forEach(cactus => {
            cactus.y += 4;
            if (cactus.y > 600) {
                cactus.destroy();
                score += 10;
                scoreText.setText('Score: ' + score);
            }
            if (Phaser.Geom.Intersects.RectangleToRectangle(car.getBounds(), cactus.getBounds())) {
                for (let i = 0; i < 20; i++) {
                    spawnDust(this, car.x + random(-30, 30), car.y + 36 + random(-30, 30), 15, 30, 40);
                }
                finalText.setText('Game Over! Final Score: ' + score);
                finalText.setVisible(true);
                this.time.delayedCall(3000, () => {
                    this.scene.pause();
                });
            }
        });

        boosters.getChildren().forEach(booster => {
            booster.y += 4;
            if (booster.y > 600) {
                booster.destroy();
            }
            if (Phaser.Geom.Intersects.RectangleToRectangle(car.getBounds(), booster.getBounds())) {
                score += 50;
                scoreText.setText('Score: ' + score);
                booster.destroy();
            }
        });
    }

    this.children.list.forEach(child => {
        if (child.name === 'roadLine') {
            child.destroy();
        }
    });
    for (let i = -600; i < 1200; i += lineHeight + lineSpacing) {
        let yPos = lineY + i - 600;
        if (yPos >= 0 && yPos <= 600) {
            let line = this.add.rectangle(400, yPos, lineWidth, lineHeight, 0xffffff);
            line.name = 'roadLine';
        }
    }
}

function spawnCactus() {
    if (!paused) {
        let cactus = this.physics.add.sprite(random(0, 750), -80, 'cactus');
        cactus.setDisplaySize(50, 80);
        cacti.add(cactus);
    }
}

function spawnBooster() {
    if (!paused) {
        let booster = this.physics.add.sprite(random(0, 770), -30, null);
        booster.setSize(30, 30);
        booster.setDisplaySize(30, 30);
        booster.setTint(0xffffff);
        boosters.add(booster);
    }
}

function spawnDust(scene, x, y, minSize = 10, maxSize = 20, life = 30) {
    let size = random(minSize, maxSize);
    let dust = scene.add.circle(x, y, size / 2, 0xc2b280, 0.4);
    dust.life = life;
    dustParticles.add(dust);
}

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}     