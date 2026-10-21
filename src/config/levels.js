/**
 * Level layouts and object configurations for Echoes of Tomorrow.
 * Exactly two distinct, handcrafted levels with real physical boundaries and calibrated jumps.
 */

export const LEVELS = {
  1: {
    id: 1,
    title: 'The Lost Wilderness',
    subtitle: 'Where nature reclaims the forgotten signals',
    worldWidth: 3200,
    worldHeight: 720,
    bgColor: 0x16202c,
    bgKey: 'bg-level-1',
    groundKey: 'plat-l1-ground',
    platformKey: 'plat-l1-piece',
    musicKey: 'bgm-track',
    
    // Spawn position
    playerStart: { x: 120, y: 520 },

    // Tutorial prompts for level 1
    tutorial: [
      { x: 180, y: 440, text: 'Use A / D or Arrow Keys to Move' },
      { x: 500, y: 440, text: 'Press Space, W, or Up to Jump over gaps' },
      { x: 920, y: 380, text: 'Collect Energy Fragments to power the path' },
      { x: 1450, y: 420, text: 'Danger! Jump over spikes and watch patrol routes' },
      { x: 1950, y: 420, text: 'Ancient Checkpoint: Touch to attune your respawn' },
      { x: 2950, y: 380, text: 'Step into the Finish Beacon to proceed' }
    ],

    // Platforms (Solid physics bodies)
    // Note: y is top-left or center based on setup; here we specify x, y, width, height
    platforms: [
      // Starting safe plateau
      { x: 0, y: 600, width: 600, height: 120, isGround: true },
      
      // Step jump over pit 1
      { x: 700, y: 560, width: 220, height: 48 },
      { x: 1000, y: 500, width: 260, height: 48 },
      
      // Main middle meadow
      { x: 1340, y: 600, width: 750, height: 120, isGround: true },
      
      // Elevated upper route
      { x: 1540, y: 440, width: 200, height: 40 },
      { x: 1800, y: 380, width: 220, height: 40 },

      // Checkpoint zone ground
      { x: 2160, y: 600, width: 440, height: 120, isGround: true },

      // Final crossing platforms
      { x: 2680, y: 540, width: 180, height: 40 },
      { x: 2920, y: 480, width: 280, height: 240, isGround: true }
    ],

    // Energy Fragments (+100 score each)
    collectibles: [
      { id: 'c1_1', x: 380, y: 540 },
      { id: 'c1_2', x: 790, y: 490 },
      { id: 'c1_3', x: 1100, y: 430 },
      { id: 'c1_4', x: 1420, y: 540 },
      { id: 'c1_5', x: 1640, y: 370 }, // Upper ledge
      { id: 'c1_6', x: 1900, y: 310 }, // High bonus
      { id: 'c1_7', x: 2350, y: 540 },
      { id: 'c1_8', x: 2770, y: 470 },
      { id: 'c1_9', x: 3050, y: 410 }
    ],

    // Hazards (Spikes & thorny brambles)
    hazards: [
      { x: 1700, y: 576, width: 96, height: 32 },
      { x: 2420, y: 576, width: 80, height: 32 }
    ],

    // Patrolling Enemies
    enemies: [
      {
        id: 'e1_1',
        x: 1550,
        y: 560,
        patrolLeft: 1400,
        patrolRight: 1680,
        speed: 70
      }
    ],

    // Checkpoint
    checkpoint: {
      x: 2250,
      y: 536
    },

    // Goal
    finishGate: {
      x: 3080,
      y: 384
    },

    // Non-solid atmospheric decorations
    decorations: [
      { key: 'env-tree', x: 260, y: 604, scale: 1.4 },
      { key: 'env-bush', x: 420, y: 604, scale: 0.8 },
      { key: 'env-tree', x: 500, y: 604, scale: 1.2 },
      { key: 'env-rock', x: 1380, y: 604, scale: 1.0 },
      { key: 'env-tree', x: 1480, y: 604, scale: 1.5 },
      { key: 'env-tree', x: 2020, y: 604, scale: 1.4 },
      { key: 'env-bush', x: 2320, y: 604, scale: 0.8 },
      { key: 'env-tree', x: 2420, y: 604, scale: 1.3 },
      { key: 'env-rock', x: 2950, y: 484, scale: 0.9 },
      { key: 'env-tree', x: 3140, y: 484, scale: 1.3 }
    ]
  },

  2: {
    id: 2,
    title: 'The Broken Frontier',
    subtitle: 'Echoes among ancient machines and forgotten spires',
    worldWidth: 3800,
    worldHeight: 720,
    bgColor: 0x1f141d,
    bgKey: 'bg-level-2',
    groundKey: 'plat-l2-ground',
    platformKey: 'plat-l2-piece',
    musicKey: 'bgm-track',

    // Spawn position
    playerStart: { x: 140, y: 500 },

    tutorial: [
      { x: 260, y: 440, text: 'Frontier Sector: Elevated walkways ahead' },
      { x: 1200, y: 380, text: 'Patience: Watch enemy patrol boundaries' },
      { x: 2200, y: 340, text: 'Check the lower conduits for bonus fragments' }
    ],

    // Solid Platforms
    platforms: [
      // Starting ramp
      { x: 0, y: 580, width: 500, height: 140, isGround: true },

      // Ascending stepped structure
      { x: 580, y: 510, width: 180, height: 40 },
      { x: 840, y: 440, width: 220, height: 40 },
      { x: 1140, y: 380, width: 260, height: 40 },

      // Lower conduit bridge (alternative risky path)
      { x: 920, y: 620, width: 340, height: 50 },

      // Middle fortress terrace
      { x: 1480, y: 490, width: 580, height: 230, isGround: true },

      // High vantage walkway
      { x: 1650, y: 340, width: 240, height: 40 },

      // Chasm crossing steps
      { x: 2140, y: 460, width: 170, height: 40 },
      { x: 2380, y: 400, width: 180, height: 40 },

      // Checkpoint haven
      { x: 2640, y: 480, width: 380, height: 240, isGround: true },

      // Final elevated ruin assault
      { x: 3100, y: 420, width: 190, height: 40 },
      { x: 3360, y: 360, width: 200, height: 40 },

      // Final terminal summit
      { x: 3620, y: 440, width: 300, height: 280, isGround: true }
    ],

    // Energy Fragments
    collectibles: [
      { id: 'c2_1', x: 320, y: 510 },
      { id: 'c2_2', x: 670, y: 440 },
      { id: 'c2_3', x: 950, y: 370 },
      { id: 'c2_4', x: 1080, y: 550 }, // Lower bonus
      { id: 'c2_5', x: 1560, y: 420 },
      { id: 'c2_6', x: 1770, y: 270 }, // High walkway
      { id: 'c2_7', x: 2220, y: 390 },
      { id: 'c2_8', x: 2470, y: 330 },
      { id: 'c2_9', x: 2780, y: 410 },
      { id: 'c2_10', x: 3200, y: 350 },
      { id: 'c2_11', x: 3460, y: 290 },
      { id: 'c2_12', x: 3720, y: 370 }
    ],

    // Hazards
    hazards: [
      { x: 1750, y: 464, width: 110, height: 32 },
      { x: 2800, y: 454, width: 90, height: 32 }
    ],

    // Two patrolling enemies
    enemies: [
      {
        id: 'e2_1',
        x: 1600,
        y: 450,
        patrolLeft: 1500,
        patrolRight: 1720,
        speed: 85
      },
      {
        id: 'e2_2',
        x: 1900,
        y: 450,
        patrolLeft: 1840,
        patrolRight: 2020,
        speed: 95
      }
    ],

    // Checkpoint
    checkpoint: {
      x: 2720,
      y: 416
    },

    // Final Goal
    finishGate: {
      x: 3760,
      y: 344
    },

    // Non-solid atmospheric decorations
    decorations: [
      { key: 'env-ruin', x: 380, y: 530, scale: 1.0 },
      { key: 'env-machinery', x: 740, y: 480, scale: 0.9 },
      { key: 'env-broken-pillar', x: 1520, y: 440, scale: 1.0 },
      { key: 'env-machinery', x: 2000, y: 450, scale: 0.8 },
      { key: 'env-ruin', x: 2880, y: 430, scale: 1.1 },
      { key: 'env-broken-pillar', x: 3660, y: 390, scale: 1.0 }
    ]
  }
};
