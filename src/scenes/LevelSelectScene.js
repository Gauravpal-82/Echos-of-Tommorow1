import Phaser from 'phaser';
import { saveManager } from '../systems/SaveManager.js';
import { audioManager } from '../systems/AudioManager.js';
import { LEVELS } from '../config/levels.js';

export class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super('LevelSelectScene');
  }

  create() {
    const { width, height } = this.cameras.main;

    // Background
    this.add.rectangle(0, 0, width, height, 0x090d16).setOrigin(0);

    // Decorative gradient overlay
    const overlay = this.add.graphics();
    overlay.fillGradientStyle(0x020617, 0x020617, 0x0f172a, 0x0f172a, 0.8, 0.8, 0.9, 0.9);
    overlay.fillRect(0, 0, width, height);

    // Title
    this.add.text(width / 2, height * 0.16, 'EXPEDITION LOG', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#38bdf8',
      letterSpacing: 2
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.22, 'Select a destination to continue your journey', {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '14px',
      color: '#94a3b8'
    }).setOrigin(0.5);

    // Cards layout (Exactly two levels)
    const cardWidth = Math.min(260, (width - 60) / 2);
    const cardHeight = 240;
    const cardY = height * 0.54;

    const spacing = cardWidth + 30;
    const startX = width / 2 - spacing / 2;

    [1, 2].forEach((lvlId, index) => {
      const cardX = startX + index * spacing;
      this.createLevelCard(cardX, cardY, cardWidth, cardHeight, lvlId);
    });

    // Back Button
    const backBtn = this.add.container(width / 2, height * 0.88);
    const backBg = this.add.rectangle(0, 0, 140, 36, 0x1e293b).setInteractive({ useHandCursor: true });
    backBg.setStrokeStyle(1, 0x475569);
    const backTxt = this.add.text(0, 0, '◀ BACK', {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#e2e8f0'
    }).setOrigin(0.5);

    backBg.on('pointerover', () => {
      backBg.setFillStyle(0x334155);
      backBtn.setScale(1.04);
    });
    backBg.on('pointerout', () => {
      backBg.setFillStyle(0x1e293b);
      backBtn.setScale(1.0);
    });
    backBg.on('pointerdown', () => {
      audioManager.playSfx(this, 'sfx-button-click');
      this.scene.start('MenuScene');
    });

    backBtn.add([backBg, backTxt]);
  }

  createLevelCard(x, y, w, h, levelId) {
    const config = LEVELS[levelId];
    const isUnlocked = saveManager.isLevelUnlocked(levelId);
    const isCompleted = saveManager.isLevelCompleted(levelId);
    const highScore = saveManager.getHighScore(levelId);
    const bestFrags = saveManager.getBestFragments(levelId);

    const card = this.add.container(x, y);

    // Card background
    const bgCol = isUnlocked ? 0x0f172a : 0x080c14;
    const borderCol = isCompleted ? 0x10b981 : (isUnlocked ? 0x38bdf8 : 0x334155);
    const cardBg = this.add.rectangle(0, 0, w, h, bgCol, 0.95);
    cardBg.setStrokeStyle(2, borderCol);

    // Level Header badge
    const badgeText = isCompleted ? 'COMPLETED' : (isUnlocked ? 'READY' : 'LOCKED');
    const badgeColor = isCompleted ? '#34d399' : (isUnlocked ? '#38bdf8' : '#64748b');
    const badge = this.add.text(0, -h / 2 + 24, badgeText, {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: badgeColor,
      letterSpacing: 1.5
    }).setOrigin(0.5);

    // Level Number & Title
    const lvlNum = this.add.text(0, -h / 2 + 50, `LEVEL 0${levelId}`, {
      fontFamily: 'Cinzel, serif',
      fontSize: '13px',
      color: '#94a3b8'
    }).setOrigin(0.5);

    const title = this.add.text(0, -h / 2 + 82, config.title, {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
      color: isUnlocked ? '#ffffff' : '#475569',
      align: 'center',
      wordWrap: { width: w - 24 }
    }).setOrigin(0.5);

    // Stats or Locked description
    let infoText;
    if (isUnlocked) {
      infoText = this.add.text(0, 20, [
        `High Score: ${highScore}`,
        `Fragments: ${bestFrags}/${config.collectibles.length}`
      ].join('\n'), {
        fontFamily: 'Nunito, sans-serif',
        fontSize: '12px',
        color: '#94a3b8',
        align: 'center',
        lineSpacing: 4
      }).setOrigin(0.5);
    } else {
      infoText = this.add.text(0, 20, 'Complete Level 1\nto unlock this sector', {
        fontFamily: 'Nunito, sans-serif',
        fontSize: '12px',
        color: '#475569',
        align: 'center',
        fontStyle: 'italic'
      }).setOrigin(0.5);
    }

    // Action button
    const actionBtn = this.add.container(0, h / 2 - 32);
    const btnBg = this.add.rectangle(
      0, 0, w - 40, 32,
      isUnlocked ? 0x0284c7 : 0x1e293b
    );
    btnBg.setStrokeStyle(1, isUnlocked ? 0x38bdf8 : 0x334155);

    const btnTxt = this.add.text(0, 0, isUnlocked ? 'ENTER' : '🔒 LOCKED', {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: isUnlocked ? '#ffffff' : '#64748b'
    }).setOrigin(0.5);

    actionBtn.add([btnBg, btnTxt]);

    if (isUnlocked) {
      cardBg.setInteractive({ useHandCursor: true });
      btnBg.setInteractive({ useHandCursor: true });

      const onEnter = () => {
        audioManager.playSfx(this, 'sfx-button-click');
        this.scene.start('GameScene', { levelId });
      };

      cardBg.on('pointerover', () => {
        card.setScale(1.03);
        cardBg.setStrokeStyle(2, 0x67e8f9);
      });
      cardBg.on('pointerout', () => {
        card.setScale(1.0);
        cardBg.setStrokeStyle(2, borderCol);
      });
      cardBg.on('pointerdown', onEnter);
      btnBg.on('pointerdown', onEnter);
    }

    card.add([cardBg, badge, lvlNum, title, infoText, actionBtn]);
    return card;
  }
}
