/**
 * PlayerController handles physics, movement, ground checks, health, and animations.
 */
import { audioManager } from './AudioManager.js';

export class PlayerController {
  constructor(scene, x, y) {
    this.scene = scene;

    // Movement configuration
    this.speed = 220;
    this.jumpForce = -510;
    this.acceleration = 1200;
    this.drag = 900;
    
    // Health and state
    this.maxHealth = 3;
    this.health = 3;
    this.isInvulnerable = false;
    this.invulnerabilityDuration = 1500; // ms
    this.isDead = false;

    // Create player physics sprite
    this.sprite = scene.physics.add.sprite(x, y, 'player-idle');
    this.sprite.setCollideWorldBounds(true);
    
    // Exact physics hit-box configured to exclude transparent margins
    // Visual: 128x128, Hitbox: 38px width, 84px height, centered at bottom
    this.sprite.body.setSize(38, 84);
    this.sprite.body.setOffset(45, 44);
    this.sprite.setBounce(0);
    this.sprite.setDepth(20);

    // Track spawn point and active checkpoint
    this.spawnPoint = { x, y };
    this.activeCheckpoint = null;

    this.setupAnimations();
  }

  setupAnimations() {
    const anims = this.scene.anims;

    // Create safe fallback animations if textures exist
    if (!anims.exists('player_idle') && this.scene.textures.exists('player-idle')) {
      anims.create({
        key: 'player_idle',
        frames: [{ key: 'player-idle' }],
        frameRate: 1,
        repeat: -1
      });
    }

    if (!anims.exists('player_run') && this.scene.textures.exists('player-run')) {
      anims.create({
        key: 'player_run',
        frames: [{ key: 'player-run' }],
        frameRate: 8,
        repeat: -1
      });
    }

    if (!anims.exists('player_jump') && this.scene.textures.exists('player-jump')) {
      anims.create({
        key: 'player_jump',
        frames: [{ key: 'player-jump' }],
        frameRate: 1,
        repeat: 0
      });
    }

    if (!anims.exists('player_fall') && this.scene.textures.exists('player-fall')) {
      anims.create({
        key: 'player_fall',
        frames: [{ key: 'player-fall' }],
        frameRate: 1,
        repeat: 0
      });
    }

    if (!anims.exists('player_damage') && this.scene.textures.exists('player-damage')) {
      anims.create({
        key: 'player_damage',
        frames: [{ key: 'player-damage' }],
        frameRate: 1,
        repeat: 0
      });
    }
  }

  update(inputManager) {
    if (this.isDead) return;

    const body = this.sprite.body;
    const isGrounded = body.blocked.down || body.touching.down;

    // Horizontal movement
    if (inputManager.state.left) {
      body.setVelocityX(-this.speed);
      this.sprite.setFlipX(true);
    } else if (inputManager.state.right) {
      body.setVelocityX(this.speed);
      this.sprite.setFlipX(false);
    } else {
      body.setVelocityX(0);
    }

    // Jump logic (strictly grounded, single consumption)
    const wantsJump = inputManager.consumeJumpPress();
    if (wantsJump && isGrounded) {
      body.setVelocityY(this.jumpForce);
      audioManager.playSfx(this.scene, 'sfx-jump');

      // Small jump dust / ripple
      this.createJumpEffect();
    }

    // Animation state selection
    this.updateAnimation(isGrounded);

    // Fall out of world check
    if (this.sprite.y > this.scene.physics.world.bounds.height + 40) {
      this.takeDamage(this.health, true); // instant death on pit fall
    }
  }

  updateAnimation(isGrounded) {
    if (this.isInvulnerable && this.scene.textures.exists('player-damage')) {
      this.sprite.setTexture('player-damage');
      return;
    }

    if (!isGrounded) {
      if (this.sprite.body.velocity.y < 0 && this.scene.textures.exists('player-jump')) {
        this.sprite.setTexture('player-jump');
      } else if (this.scene.textures.exists('player-fall')) {
        this.sprite.setTexture('player-fall');
      }
    } else if (Math.abs(this.sprite.body.velocity.x) > 10) {
      if (this.scene.textures.exists('player-run')) {
        this.sprite.setTexture('player-run');
      }
    } else {
      if (this.scene.textures.exists('player-idle')) {
        this.sprite.setTexture('player-idle');
      }
    }
  }

  createJumpEffect() {
    const fx = this.scene.add.ellipse(this.sprite.x, this.sprite.y + 42, 28, 8, 0xffffff, 0.5);
    this.scene.tweens.add({
      targets: fx,
      scaleX: 1.6,
      scaleY: 0.2,
      alpha: 0,
      duration: 220,
      onComplete: () => fx.destroy()
    });
  }

  setCheckpoint(x, y) {
    this.activeCheckpoint = { x, y };
  }

  takeDamage(amount = 1, forceRespawn = false) {
    if (this.isInvulnerable || this.isDead) return false;

    this.health = Math.max(0, this.health - amount);
    audioManager.playSfx(this.scene, 'sfx-damage');

    // Camera micro-shake
    this.scene.cameras.main.shake(180, 0.008);

    if (this.health <= 0) {
      this.die();
      return true;
    }

    // Invulnerability flashing
    this.isInvulnerable = true;
    
    // Knockback
    const knockDir = this.sprite.flipX ? 1 : -1;
    this.sprite.body.setVelocity(knockDir * 160, -220);

    // Flicker tween
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: 6,
      onComplete: () => {
        this.sprite.setAlpha(1);
        this.isInvulnerable = false;
      }
    });

    if (forceRespawn) {
      this.respawnAtLastSafePoint();
    }

    return true;
  }

  respawnAtLastSafePoint() {
    const target = this.activeCheckpoint || this.spawnPoint;
    this.sprite.setPosition(target.x, target.y);
    this.sprite.body.setVelocity(0, 0);
  }

  die() {
    this.isDead = true;
    this.sprite.body.setVelocity(0, 0);
    this.sprite.body.setAllowGravity(false);

    if (this.scene.textures.exists('player-death')) {
      this.sprite.setTexture('player-death');
    }

    // Death fade & trigger Game Over scene
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      scale: 1.3,
      y: this.sprite.y - 20,
      duration: 600,
      onComplete: () => {
        this.scene.onPlayerDied();
      }
    });
  }

  respawn() {
    this.isDead = false;
    this.health = this.maxHealth;
    this.sprite.setAlpha(1);
    this.sprite.setScale(1);
    this.sprite.body.setAllowGravity(true);
    this.respawnAtLastSafePoint();
  }
}
