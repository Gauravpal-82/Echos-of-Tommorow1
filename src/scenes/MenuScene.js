import Phaser from 'phaser';
import { audioManager } from '../systems/AudioManager.js';
import { saveManager } from '../systems/SaveManager.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    const { width, height } = this.cameras.main;

    // Atmospheric illustrated backdrop
    if (this.textures.exists('bg-level-1')) {
      const bg = this.add.image(width / 2, height / 2, 'bg-level-1');
      bg.setDisplaySize(width, height);
      bg.setTint(0x8899aa);
    } else {
      this.add.rectangle(0, 0, width, height, 0x0f172a).setOrigin(0);
    }

    // Vignette overlay
    const overlay = this.add.graphics();
    overlay.fillGradientStyle(0x020617, 0x020617, 0x0f172a, 0x0f172a, 0.75, 0.75, 0.85, 0.85);
    overlay.fillRect(0, 0, width, height);

    // Subtle atmospheric floating dust / ember particles
    this.createAtmosphericEmbers(width, height);

    // Title & Branding
    const title = this.add.text(width / 2, height * 0.22, 'ECHOES OF TOMORROW', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: width < 600 ? '28px' : '42px',
      fontStyle: 'bold',
      color: '#f8fafc',
      stroke: '#0369a1',
      strokeThickness: 3,
      letterSpacing: 3
    }).setOrigin(0.5);

    // Gentle pulsating glow for title
    this.tweens.add({
      targets: title,
      scaleX: 1.03,
      scaleY: 1.03,
      duration: 2500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.add.text(width / 2, height * 0.29, 'A Hand-Drawn 2D Adventure', {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '17px',
      fontStyle: '600',
      color: '#38bdf8',
      letterSpacing: 1.5
    }).setOrigin(0.5);

    // Team credits pill
    this.add.text(width / 2, height * 0.35, 'Developed by Team Zeronix', {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '13px',
      color: '#94a3b8'
    }).setOrigin(0.5);

    // Menu Buttons Container
    const btnStartY = height * 0.44;
    const btnSpacing = 44;

    const buttons = [
      {
        text: 'PLAY ADVENTURE',
        primary: true,
        action: () => {
          // Start level 1 or highest unlocked
          this.scene.start('GameScene', { levelId: 1 });
        }
      },
      {
        text: 'LEVEL SELECTION',
        primary: false,
        action: () => {
          this.scene.start('LevelSelectScene');
        }
      },
      {
        text: 'HOW TO PLAY',
        primary: false,
        action: () => {
          this.showHowToPlayModal();
        }
      },
      {
        text: 'SETTINGS',
        primary: false,
        action: () => {
          this.showSettingsModal();
        }
      },
      {
        text: 'CREDITS',
        primary: false,
        action: () => {
          this.scene.start('CreditsScene');
        }
      },
      {
        text: 'ASSET GUIDE',
        primary: false,
        isSecondary: true,
        action: () => {
          this.showAssetGuideModal();
        }
      }
    ];

    buttons.forEach((btn, index) => {
      this.createMenuButton(
        width / 2,
        btnStartY + index * btnSpacing,
        btn.text,
        btn.primary,
        btn.isSecondary,
        btn.action
      );
    });

    // Version label
    this.add.text(width - 16, height - 14, 'v1.0.0 • Hand-Drawn Edition', {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '11px',
      color: '#64748b'
    }).setOrigin(1, 1);
  }

  createMenuButton(x, y, text, isPrimary, isSecondary, onClick) {
    const btnWidth = isSecondary ? 180 : 250;
    const btnHeight = isSecondary ? 30 : 36;
    const container = this.add.container(x, y);

    const normalBg = isPrimary ? 0x0284c7 : (isSecondary ? 0x1e293b : 0x0f172a);
    const hoverBg = isPrimary ? 0x0ea5e9 : (isSecondary ? 0x334155 : 0x1e293b);
    const strokeCol = isPrimary ? 0x38bdf8 : (isSecondary ? 0x475569 : 0x334155);

    const bg = this.add.rectangle(0, 0, btnWidth, btnHeight, normalBg, 0.9);
    bg.setStrokeStyle(isPrimary ? 2 : 1, strokeCol);

    const label = this.add.text(0, 0, text, {
      fontFamily: 'Nunito, sans-serif',
      fontSize: isSecondary ? '12px' : '15px',
      fontStyle: 'bold',
      color: isPrimary ? '#ffffff' : (isSecondary ? '#94a3b8' : '#e2e8f0'),
      letterSpacing: 1
    }).setOrigin(0.5);

    container.add([bg, label]);

    bg.setInteractive({ useHandCursor: true });

    bg.on('pointerover', () => {
      bg.setFillStyle(hoverBg, 1.0);
      container.setScale(1.03);
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(normalBg, 0.9);
      container.setScale(1.0);
    });

    bg.on('pointerdown', () => {
      audioManager.playSfx(this, 'sfx-button-click');
      container.setScale(0.97);
      this.time.delayedCall(120, () => {
        container.setScale(1.0);
        onClick();
      });
    });

    return container;
  }

  createAtmosphericEmbers(w, h) {
    for (let i = 0; i < 25; i++) {
      const ember = this.add.circle(
        Phaser.Math.Between(0, w),
        Phaser.Math.Between(0, h),
        Phaser.Math.FloatBetween(1, 2.5),
        0x38bdf8,
        Phaser.Math.FloatBetween(0.2, 0.7)
      );

      this.tweens.add({
        targets: ember,
        y: ember.y - Phaser.Math.Between(40, 100),
        x: ember.x + Phaser.Math.Between(-30, 30),
        alpha: 0,
        duration: Phaser.Math.Between(3000, 7000),
        repeat: -1,
        yoyo: true,
        ease: 'Sine.easeInOut'
      });
    }
  }

  showHowToPlayModal() {
    const { width, height } = this.cameras.main;
    const modal = this.add.container(0, 0).setDepth(200);

    const blocker = this.add.rectangle(0, 0, width, height, 0x000000, 0.75).setOrigin(0).setInteractive();
    const panel = this.add.rectangle(width / 2, height / 2, Math.min(520, width - 40), 380, 0x0f172a);
    panel.setStrokeStyle(2, 0x38bdf8);

    const title = this.add.text(width / 2, height / 2 - 145, 'HOW TO PLAY', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#38bdf8'
    }).setOrigin(0.5);

    const instructions = [
      '• DESKTOP: A / D or Left / Right Arrows to Move',
      '• JUMP: Spacebar, W, or Up Arrow (Single Grounded Jump)',
      '• MOBILE: On-screen responsive Left / Right / Jump buttons',
      '• PAUSE / RESUME: Esc or P key',
      '• RESTART LEVEL: R key',
      '',
      'OBJECTIVES:',
      '1. Cross treacherous terrain without falling into deep chasms.',
      '2. Collect glowing Energy Fragments (+100 score each).',
      '3. Attune Ancient Checkpoints to safeguard your progress.',
      '4. Evade patrol crawlers and sharp brambles.',
      '5. Reach the mysterious Finish Gate to complete the level!'
    ].join('\n');

    const body = this.add.text(width / 2, height / 2 - 15, instructions, {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '13px',
      color: '#cbd5e1',
      lineSpacing: 5,
      align: 'left'
    }).setOrigin(0.5);

    // Close button
    const closeBtn = this.add.rectangle(width / 2, height / 2 + 145, 120, 34, 0x0284c7).setInteractive({ useHandCursor: true });
    closeBtn.setStrokeStyle(1, 0x38bdf8);
    const closeTxt = this.add.text(width / 2, height / 2 + 145, 'GOT IT', {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    closeBtn.on('pointerdown', () => {
      audioManager.playSfx(this, 'sfx-button-click');
      modal.destroy();
    });

    modal.add([blocker, panel, title, body, closeBtn, closeTxt]);
  }

  showSettingsModal() {
    const { width, height } = this.cameras.main;
    const modal = this.add.container(0, 0).setDepth(200);

    const blocker = this.add.rectangle(0, 0, width, height, 0x000000, 0.75).setOrigin(0).setInteractive();
    const panel = this.add.rectangle(width / 2, height / 2, Math.min(480, width - 40), 360, 0x0f172a);
    panel.setStrokeStyle(2, 0x38bdf8);

    const title = this.add.text(width / 2, height / 2 - 135, 'SETTINGS', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#38bdf8'
    }).setOrigin(0.5);

    // Master Sound Toggle
    const soundToggle = this.createSettingToggle(
      width / 2,
      height / 2 - 70,
      'Master Audio',
      !audioManager.isMuted,
      (newVal) => {
        audioManager.toggleMasterMute();
      }
    );

    // SFX Toggle
    const sfxToggle = this.createSettingToggle(
      width / 2,
      height / 2 - 20,
      'Sound Effects',
      !audioManager.isSfxMuted,
      (newVal) => {
        audioManager.toggleSfxMute();
      }
    );

    // Reset Progress Button with Confirmation
    const resetBtn = this.add.rectangle(width / 2, height / 2 + 45, 260, 36, 0x991b1b).setInteractive({ useHandCursor: true });
    resetBtn.setStrokeStyle(1, 0xf87171);
    const resetTxt = this.add.text(width / 2, height / 2 + 45, 'RESET PROGRESS', {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    resetBtn.on('pointerdown', () => {
      audioManager.playSfx(this, 'sfx-button-click');
      if (confirm('Are you sure you want to reset all game progression and high scores?')) {
        saveManager.resetProgress();
        resetTxt.setText('PROGRESS CLEARED!');
        this.time.delayedCall(1200, () => resetTxt.setText('RESET PROGRESS'));
      }
    });

    // Close Button
    const closeBtn = this.add.rectangle(width / 2, height / 2 + 130, 120, 34, 0x0284c7).setInteractive({ useHandCursor: true });
    closeBtn.setStrokeStyle(1, 0x38bdf8);
    const closeTxt = this.add.text(width / 2, height / 2 + 130, 'CLOSE', {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    closeBtn.on('pointerdown', () => {
      audioManager.playSfx(this, 'sfx-button-click');
      modal.destroy();
    });

    modal.add([blocker, panel, title, soundToggle, sfxToggle, resetBtn, resetTxt, closeBtn, closeTxt]);
  }

  createSettingToggle(x, y, label, initialValue, onToggle) {
    const container = this.add.container(x, y);

    const txt = this.add.text(-120, 0, label, {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '16px',
      color: '#e2e8f0'
    }).setOrigin(0, 0.5);

    let state = initialValue;
    const btn = this.add.rectangle(110, 0, 75, 28, state ? 0x059669 : 0x475569).setInteractive({ useHandCursor: true });
    btn.setStrokeStyle(1, state ? 0x34d399 : 0x94a3b8);

    const btnTxt = this.add.text(110, 0, state ? 'ON' : 'OFF', {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    btn.on('pointerdown', () => {
      audioManager.playSfx(this, 'sfx-button-click');
      state = !state;
      btn.setFillStyle(state ? 0x059669 : 0x475569);
      btn.setStrokeStyle(1, state ? 0x34d399 : 0x94a3b8);
      btnTxt.setText(state ? 'ON' : 'OFF');
      onToggle(state);
    });

    container.add([txt, btn, btnTxt]);
    return container;
  }

  showAssetGuideModal() {
    const { width, height } = this.cameras.main;
    const modal = this.add.container(0, 0).setDepth(200);

    const blocker = this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0).setInteractive();
    const panel = this.add.rectangle(width / 2, height / 2, Math.min(560, width - 30), 420, 0x0b1120);
    panel.setStrokeStyle(2, 0x38bdf8);

    const title = this.add.text(width / 2, height / 2 - 170, 'ASSET CUSTOMIZATION GUIDE', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#38bdf8'
    }).setOrigin(0.5);

    const guideText = [
      'To replace placeholder graphics with your own hand-drawn artwork,',
      'simply upload PNG files directly into these folders in public/assets/:',
      '',
      '• Player: public/assets/player/ (idle, run, jump, damage, death)',
      '• Backgrounds: public/assets/backgrounds/level-1/ & level-2/',
      '• Platforms: public/assets/platforms/level-1/ & level-2/',
      '• Enemies: public/assets/enemies/ (idle, move)',
      '• Collectibles: public/assets/collectibles/energy-fragment.png',
      '• Hazards: public/assets/hazards/spikes.png',
      '• Checkpoint: public/assets/checkpoints/checkpoint.png',
      '• Finish Gate: public/assets/goals/finish-gate.png',
      '',
      'All folders are pre-created. See ASSET_GUIDE.md for recommended resolutions!'
    ].join('\n');

    const body = this.add.text(width / 2, height / 2 - 15, guideText, {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '12px',
      color: '#cbd5e1',
      lineSpacing: 4,
      align: 'center'
    }).setOrigin(0.5);

    const closeBtn = this.add.rectangle(width / 2, height / 2 + 165, 120, 32, 0x0284c7).setInteractive({ useHandCursor: true });
    closeBtn.setStrokeStyle(1, 0x38bdf8);
    const closeTxt = this.add.text(width / 2, height / 2 + 165, 'UNDERSTOOD', {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    closeBtn.on('pointerdown', () => {
      audioManager.playSfx(this, 'sfx-button-click');
      modal.destroy();
    });

    modal.add([blocker, panel, title, body, closeBtn, closeTxt]);
  }
}
