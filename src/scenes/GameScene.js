import Phaser from 'phaser';
import { LEVELS } from '../config/levels.js';
import { PlayerController } from '../systems/PlayerController.js';
import { InputManager } from '../systems/InputManager.js';
import { audioManager } from '../systems/AudioManager.js';
import { saveManager } from '../systems/SaveManager.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init(data) {
    this.levelId = data.levelId || 1;
    this.levelConfig = LEVELS[this.levelId];
    this.score = 0;
    this.fragmentsCollected = 0;
    this.isPaused = false;
    this.levelFinished = false;
    this.collectedIds = new Set();
    this.isCheckpointActive = false;
  }

  create() {
    const config = this.levelConfig;

    // Set world physics bounds
    this.physics.world.setBounds(0, 0, config.worldWidth, config.worldHeight);
    this.cameras.main.setBounds(0, 0, config.worldWidth, config.worldHeight);

    // 1. Layered Parallax Backgrounds
    this.createBackgrounds(config);

    // 2. Non-solid Scenery / Decorations (Background Layer)
    this.createDecorations(config);

    // 3. Static Platforms & Ground
    this.createPlatforms(config);

    // 4. Checkpoint
    this.createCheckpoint(config);

    // 5. Finish Goal Gate
    this.createFinishGate(config);

    // 6. Hazards
    this.createHazards(config);

    // 7. Collectibles
    this.createCollectibles(config);

    // 8. Enemies
    this.createEnemies(config);

    // 9. Player Controller
    this.player = new PlayerController(this, config.playerStart.x, config.playerStart.y);

    // 10. Platform Collisions
    this.physics.add.collider(this.player.sprite, this.platformsGroup);
    this.physics.add.collider(this.enemiesGroup, this.platformsGroup);

    // 11. Overlaps
    this.physics.add.overlap(this.player.sprite, this.collectiblesGroup, this.onCollectFragment, null, this);
    this.physics.add.overlap(this.player.sprite, this.hazardsGroup, this.onHitHazard, null, this);
    this.physics.add.overlap(this.player.sprite, this.enemiesGroup, this.onHitEnemy, null, this);
    this.physics.add.overlap(this.player.sprite, this.checkpointSprite, this.onReachCheckpoint, null, this);
    this.physics.add.overlap(this.player.sprite, this.finishGateSprite, this.onReachFinishGate, null, this);

    // 12. Camera Setup
    this.cameras.main.startFollow(this.player.sprite, true, 0.08, 0.08);
    this.cameras.main.setDeadzone(100, 50);

    // 13. Input Manager (Unified keyboard and touch)
    this.inputManager = new InputManager(this);

    // 14. HUD (Pinned to screen)
    this.createHUD();

    // 15. Level 1 Tutorial markers
    if (this.levelId === 1 && config.tutorial) {
      this.createTutorialMarkers(config.tutorial);
    }

    // 16. Start Background Audio
    audioManager.playMusic(this, config.musicKey);

    // Pause overlay container
    this.createPauseMenu();

    // Listen for resize
    this.scale.on('resize', this.onResize, this);
  }

  createBackgrounds(config) {
    const { width, height } = this.scale;
    
    // Pinned panoramic parallax background scaled to fit the view without repeating vertically
    const bgKey = config.bgKey;
    const bg = this.add.tileSprite(0, 0, width, height, bgKey);
    bg.setOrigin(0, 0);
    bg.setScrollFactor(0);
    bg.setDepth(-10);

    // Increase background size so it covers the full viewport without vertical tiling
    if (this.textures.exists(bgKey)) {
      const tex = this.textures.get(bgKey);
      const img = tex ? tex.getSourceImage() : null;
      if (img && img.height > 0) {
        const scale = Math.max((height + 40) / img.height, width / img.width);
        bg.setTileScale(scale, scale);
      }
    }
    this.bgLayer = bg;

    // Atmospheric sky color gradient tint (soft, preserving art clarity)
    const skyTint = this.add.graphics();
    skyTint.fillGradientStyle(config.bgColor, config.bgColor, 0x050811, 0x050811, 0.15, 0.15, 0.4, 0.4);
    skyTint.fillRect(0, 0, width, height);
    skyTint.setScrollFactor(0);
    skyTint.setDepth(-9);
    this.skyTint = skyTint;
  }

  createDecorations(config) {
    this.decorationsGroup = this.add.group();
    if (!config.decorations) return;

    config.decorations.forEach(item => {
      if (this.textures.exists(item.key)) {
        const deco = this.add.image(item.x, item.y, item.key);
        deco.setOrigin(0.5, 1.0);
        deco.setScale(item.scale || 1.0);
        deco.setDepth(5);
        this.decorationsGroup.add(deco);
      }
    });
  }

  createPlatforms(config) {
    this.platformsGroup = this.physics.add.staticGroup();

    config.platforms.forEach(plat => {
      const texKey = plat.isGround ? config.groundKey : config.platformKey;
      
      let imgH = 47;
      if (this.textures.exists(texKey)) {
        const tex = this.textures.get(texKey);
        const img = tex ? tex.getSourceImage() : null;
        if (img && img.height > 0) {
          imgH = img.height;
        }
      }

      if (plat.isGround && plat.height > imgH) {
        // Top surface with grass: exactly 1 slice high, repeating horizontally seamlessly
        const surfaceTile = this.add.tileSprite(plat.x, plat.y, plat.width, imgH, texKey);
        surfaceTile.setOrigin(0, 0);
        surfaceTile.setDepth(10);

        // Subsurface filling down to the bottom of the ground with matching deep earth color
        const subHeight = plat.height - imgH;
        const subRect = this.add.rectangle(
          plat.x,
          plat.y + imgH,
          plat.width,
          subHeight,
          0x1f110b // deep organic soil/rock tone matching the bottom of the platform
        );
        subRect.setOrigin(0, 0);
        subRect.setDepth(9);
      } else {
        // Floating platform: tile across width, matching the height
        const tile = this.add.tileSprite(plat.x, plat.y, plat.width, plat.height, texKey);
        tile.setOrigin(0, 0);
        tile.setDepth(10);

        if (plat.height !== imgH) {
          const s = plat.height / imgH;
          tile.setTileScale(s, s);
        }
      }

      // Dedicated solid collision body matching walkable surface
      const collider = this.platformsGroup.create(plat.x + plat.width / 2, plat.y + plat.height / 2);
      collider.setSize(plat.width, plat.height);
      collider.setVisible(false);
    });
  }

  createCheckpoint(config) {
    const cp = config.checkpoint;
    this.checkpointSprite = this.physics.add.sprite(cp.x, cp.y, 'checkpoint-monolith');
    this.checkpointSprite.setOrigin(0.5, 1.0);
    this.checkpointSprite.body.setAllowGravity(false);
    this.checkpointSprite.body.setImmovable(true);
    this.checkpointSprite.body.setSize(48, 100);
    this.checkpointSprite.setDepth(12);

    // Floating rune indicator
    this.checkpointGlow = this.add.circle(cp.x, cp.y - 80, 10, 0x38bdf8, 0.4);
    this.checkpointGlow.setDepth(13);
    this.tweens.add({
      targets: this.checkpointGlow,
      scale: 1.4,
      alpha: 0.1,
      duration: 1500,
      yoyo: true,
      repeat: -1
    });
  }

  createFinishGate(config) {
    const gate = config.finishGate;
    this.finishGateSprite = this.physics.add.sprite(gate.x, gate.y, 'finish-gate');
    this.finishGateSprite.setOrigin(0.5, 1.0);
    this.finishGateSprite.body.setAllowGravity(false);
    this.finishGateSprite.body.setImmovable(true);
    this.finishGateSprite.body.setSize(64, 160);
    this.finishGateSprite.setDepth(12);

    // Swirling portal light
    this.tweens.add({
      targets: this.finishGateSprite,
      alpha: 0.85,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  createHazards(config) {
    this.hazardsGroup = this.physics.add.staticGroup();

    if (!config.hazards) return;

    config.hazards.forEach(hz => {
      const tile = this.add.tileSprite(hz.x, hz.y, hz.width, hz.height, 'hazard-spikes');
      tile.setOrigin(0, 0);
      tile.setDepth(11);

      const collider = this.hazardsGroup.create(hz.x + hz.width / 2, hz.y + hz.height / 2);
      collider.setSize(hz.width, hz.height);
      collider.setVisible(false);
    });
  }

  createCollectibles(config) {
    this.collectiblesGroup = this.physics.add.staticGroup();

    config.collectibles.forEach(item => {
      const frag = this.collectiblesGroup.create(item.x, item.y, 'energy-fragment');
      frag.id = item.id;
      frag.body.setSize(28, 52);
      frag.setDepth(15);

      // Idle hovering animation
      this.tweens.add({
        targets: frag,
        y: item.y - 8,
        duration: 1200 + Phaser.Math.Between(0, 400),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });
  }

  createEnemies(config) {
    this.enemiesGroup = this.physics.add.group();

    if (!config.enemies) return;

    config.enemies.forEach(item => {
      const enemy = this.enemiesGroup.create(item.x, item.y, 'enemy-idle');
      enemy.setOrigin(0.5, 0.5);
      enemy.body.setSize(48, 48);
      enemy.body.setOffset(24, 28);
      enemy.body.setCollideWorldBounds(true);
      enemy.patrolLeft = item.patrolLeft;
      enemy.patrolRight = item.patrolRight;
      enemy.patrolSpeed = item.speed || 70;
      enemy.direction = 1;
      enemy.body.setVelocityX(enemy.patrolSpeed);
      enemy.setDepth(14);
    });
  }

  createTutorialMarkers(tutorials) {
    tutorials.forEach(tut => {
      const banner = this.add.container(tut.x, tut.y);
      banner.setDepth(15);

      const text = this.add.text(0, 0, tut.text, {
        fontFamily: 'Nunito, sans-serif',
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#e2e8f0',
        backgroundColor: '#0f172ae0',
        padding: { x: 12, y: 6 }
      }).setOrigin(0.5);

      text.setStroke('#38bdf8', 1);
      banner.add(text);
      banner.triggerX = tut.x;
      banner.dismissed = false;

      // Add to list for proximity check
      if (!this.tutorialBanners) this.tutorialBanners = [];
      this.tutorialBanners.push(banner);
    });
  }

  createHUD() {
    const { width } = this.scale;

    this.hudContainer = this.add.container(0, 0);
    this.hudContainer.setScrollFactor(0);
    this.hudContainer.setDepth(110);

    // Top HUD Bar background
    const bar = this.add.graphics();
    bar.fillGradientStyle(0x020617, 0x020617, 0x000000, 0x000000, 0.7, 0.7, 0.0, 0.0);
    bar.fillRect(0, 0, width, 54);
    this.hudContainer.add(bar);

    // Hearts (Health)
    this.heartSprites = [];
    for (let i = 0; i < 3; i++) {
      const heart = this.add.image(28 + i * 32, 26, 'ui-heart');
      heart.setScale(0.65);
      this.hudContainer.add(heart);
      this.heartSprites.push(heart);
    }

    // Energy Fragments Counter
    const fragIcon = this.add.image(150, 26, 'ui-energy-icon');
    fragIcon.setScale(0.5);
    this.hudContainer.add(fragIcon);

    this.fragText = this.add.text(172, 26, `0 / ${this.levelConfig.collectibles.length}`, {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#38bdf8'
    }).setOrigin(0, 0.5);
    this.hudContainer.add(this.fragText);

    // Score Counter
    this.scoreText = this.add.text(width / 2, 26, 'SCORE: 0', {
      fontFamily: 'Cinzel, monospace',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#fbbf24'
    }).setOrigin(0.5);
    this.hudContainer.add(this.scoreText);

    // Level Title badge
    this.levelBadgeText = this.add.text(width - 80, 26, `LVL ${this.levelId}`, {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#94a3b8'
    }).setOrigin(1, 0.5);
    this.hudContainer.add(this.levelBadgeText);

    // Pause Button
    const pauseBtn = this.add.rectangle(width - 32, 26, 32, 32, 0x1e293b).setInteractive({ useHandCursor: true });
    pauseBtn.setStrokeStyle(1, 0x475569);
    const pauseIcon = this.add.text(width - 32, 26, '❚❚', {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '12px',
      color: '#e2e8f0'
    }).setOrigin(0.5);

    pauseBtn.on('pointerdown', () => {
      audioManager.playSfx(this, 'sfx-button-click');
      this.togglePause();
    });

    this.hudContainer.add([pauseBtn, pauseIcon]);
    this.pauseButton = pauseBtn;
    this.pauseButtonIcon = pauseIcon;
  }

  createPauseMenu() {
    const { width, height } = this.scale;

    this.pauseMenu = this.add.container(0, 0);
    this.pauseMenu.setScrollFactor(0);
    this.pauseMenu.setDepth(150);
    this.pauseMenu.setVisible(false);

    const blocker = this.add.rectangle(0, 0, width, height, 0x000000, 0.75).setOrigin(0).setInteractive();
    const panel = this.add.rectangle(width / 2, height / 2, 300, 310, 0x0f172a);
    panel.setStrokeStyle(2, 0x38bdf8);

    const title = this.add.text(width / 2, height / 2 - 110, 'PAUSED', {
      fontFamily: 'Cinzel, serif',
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#38bdf8'
    }).setOrigin(0.5);

    // Buttons: Resume, Restart, Menu
    const buttons = [
      { text: 'RESUME', action: () => this.togglePause() },
      { text: 'RESTART LEVEL', action: () => this.scene.restart({ levelId: this.levelId }) },
      { text: 'MAIN MENU', action: () => {
        audioManager.stopMusic(this, this.levelConfig.musicKey);
        this.scene.start('MenuScene');
      }}
    ];

    const pauseBtns = buttons.map((btn, idx) => {
      const y = height / 2 - 40 + idx * 52;
      const b = this.add.rectangle(width / 2, y, 220, 36, 0x1e293b).setInteractive({ useHandCursor: true });
      b.setStrokeStyle(1, 0x38bdf8);
      const t = this.add.text(width / 2, y, btn.text, {
        fontFamily: 'Nunito, sans-serif',
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#ffffff'
      }).setOrigin(0.5);

      b.on('pointerdown', () => {
        audioManager.playSfx(this, 'sfx-button-click');
        btn.action();
      });

      return [b, t];
    }).flat();

    this.pauseMenu.add([blocker, panel, title, ...pauseBtns]);
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    this.pauseMenu.setVisible(this.isPaused);

    if (this.isPaused) {
      this.physics.pause();
    } else {
      this.physics.resume();
    }
  }

  onCollectFragment(playerSprite, frag) {
    if (!frag.active || this.collectedIds.has(frag.id)) return;

    this.collectedIds.add(frag.id);
    this.fragmentsCollected++;
    this.score += 100;

    audioManager.playSfx(this, 'sfx-collect');

    // Sparkle pickup animation
    this.createSparkleEffect(frag.x, frag.y);

    // Collect tween
    this.tweens.add({
      targets: frag,
      scaleX: 1.6,
      scaleY: 1.6,
      alpha: 0,
      y: frag.y - 24,
      duration: 250,
      onComplete: () => {
        frag.destroy();
      }
    });

    // Update HUD
    this.fragText.setText(`${this.fragmentsCollected} / ${this.levelConfig.collectibles.length}`);
    this.scoreText.setText(`SCORE: ${this.score}`);
  }

  createSparkleEffect(x, y) {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const spark = this.add.circle(x, y, 3, 0x38bdf8, 1);
      spark.setDepth(25);
      this.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * 35,
        y: y + Math.sin(angle) * 35,
        alpha: 0,
        scale: 0.1,
        duration: 350,
        onComplete: () => spark.destroy()
      });
    }
  }

  onHitHazard(playerSprite, hazard) {
    if (this.player.isInvulnerable || this.player.isDead) return;
    this.player.takeDamage(1, true);
    this.updateHealthHUD();
  }

  onHitEnemy(playerSprite, enemy) {
    if (this.player.isInvulnerable || this.player.isDead) return;
    this.player.takeDamage(1, false);
    this.updateHealthHUD();
  }

  onReachCheckpoint(playerSprite, checkpoint) {
    if (this.isCheckpointActive) return;

    this.isCheckpointActive = true;
    this.player.setCheckpoint(checkpoint.x, checkpoint.y - 40);

    audioManager.playSfx(this, 'sfx-checkpoint');

    // Visual activation
    checkpoint.setTint(0x38bdf8);
    this.checkpointGlow.setFillStyle(0x34d399, 0.8);

    // Floating text notification
    const msg = this.add.text(checkpoint.x, checkpoint.y - 120, 'CHECKPOINT ATTUNED', {
      fontFamily: 'Cinzel, serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#34d399',
      backgroundColor: '#020617e0',
      padding: { x: 10, y: 4 }
    }).setOrigin(0.5);
    msg.setDepth(30);

    this.tweens.add({
      targets: msg,
      y: msg.y - 30,
      alpha: 0,
      duration: 1600,
      onComplete: () => msg.destroy()
    });
  }

  onReachFinishGate(playerSprite, gate) {
    if (this.levelFinished) return;

    this.levelFinished = true;
    this.physics.pause();

    audioManager.playSfx(this, 'sfx-level-complete');
    audioManager.stopMusic(this, this.levelConfig.musicKey);

    // Finish swirl celebration
    this.tweens.add({
      targets: this.player.sprite,
      alpha: 0,
      scale: 0.1,
      y: gate.y - 60,
      x: gate.x,
      duration: 700,
      onComplete: () => {
        // Save progress
        saveManager.completeLevel(this.levelId, this.score, this.fragmentsCollected);

        if (this.levelId === 1) {
          this.scene.start('LevelCompleteScene', {
            levelId: 1,
            score: this.score,
            fragments: this.fragmentsCollected,
            totalFragments: this.levelConfig.collectibles.length
          });
        } else {
          // Level 2 complete -> Victory Scene
          this.scene.start('VictoryScene', {
            levelId: 2,
            score: this.score,
            fragments: this.fragmentsCollected,
            totalFragments: this.levelConfig.collectibles.length
          });
        }
      }
    });
  }

  updateHealthHUD() {
    const hp = this.player.health;
    this.heartSprites.forEach((heart, idx) => {
      if (idx < hp) {
        heart.setTint(0xffffff);
        heart.setAlpha(1.0);
      } else {
        heart.setTint(0x475569);
        heart.setAlpha(0.35);
      }
    });
  }

  onPlayerDied() {
    audioManager.stopMusic(this, this.levelConfig.musicKey);
    this.scene.start('GameOverScene', {
      levelId: this.levelId,
      score: this.score,
      fragments: this.fragmentsCollected
    });
  }

  update(time, delta) {
    if (this.isPaused || this.levelFinished) return;

    // Update Unified Input
    this.inputManager.update();

    // Check Pause & Restart keys
    if (this.inputManager.state.pauseJustPressed) {
      this.togglePause();
      return;
    }

    if (this.inputManager.state.restartJustPressed) {
      this.scene.restart({ levelId: this.levelId });
      return;
    }

    // Update Player Physics and Movement
    this.player.update(this.inputManager);

    // Update Enemy Patrol Behavior
    this.enemiesGroup.getChildren().forEach(enemy => {
      if (enemy.x <= enemy.patrolLeft) {
        enemy.direction = 1;
        enemy.setFlipX(false);
      } else if (enemy.x >= enemy.patrolRight) {
        enemy.direction = -1;
        enemy.setFlipX(true);
      }
      enemy.body.setVelocityX(enemy.direction * enemy.patrolSpeed);
    });

    // Update Tutorial dismissals
    if (this.tutorialBanners) {
      this.tutorialBanners.forEach(banner => {
        if (!banner.dismissed && this.player.sprite.x > banner.triggerX + 160) {
          banner.dismissed = true;
          this.tweens.add({
            targets: banner,
            alpha: 0,
            y: banner.y - 20,
            duration: 400,
            onComplete: () => banner.destroy()
          });
        }
      });
    }

    // Smooth panoramic parallax for the enlarged background (zero vertical seam)
    if (this.bgLayer) {
      this.bgLayer.tilePositionX = this.cameras.main.scrollX * 0.12;
      this.bgLayer.tilePositionY = this.cameras.main.scrollY * 0.03;
    }
  }

  onResize(gameSize) {
    const { width, height } = gameSize;
    if (this.scoreText) this.scoreText.setPosition(width / 2, 26);
    if (this.levelBadgeText) this.levelBadgeText.setPosition(width - 80, 26);
    if (this.pauseButton) {
      this.pauseButton.setPosition(width - 32, 26);
      this.pauseButtonIcon.setPosition(width - 32, 26);
    }
    if (this.bgLayer) {
      this.bgLayer.setSize(width, height);
      const tex = this.textures.get(this.levelConfig.bgKey);
      const img = tex ? tex.getSourceImage() : null;
      if (img && img.height > 0) {
        const scale = Math.max((height + 40) / img.height, width / img.width);
        this.bgLayer.setTileScale(scale, scale);
      }
    }
    if (this.skyTint) {
      this.skyTint.clear();
      this.skyTint.fillGradientStyle(this.levelConfig.bgColor, this.levelConfig.bgColor, 0x050811, 0x050811, 0.15, 0.15, 0.4, 0.4);
      this.skyTint.fillRect(0, 0, width, height);
    }
  }

  shutdown() {
    audioManager.stopMusic(this, this.levelConfig.musicKey);
    if (this.inputManager) {
      this.inputManager.destroy();
    }
  }
}
