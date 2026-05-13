import { CONFIG } from "../config";
import type {Enemy, EnemyBullet, Bullet, Particle} from "../App.tsx";
import type {Upgrade} from "./upgrades.ts";

export type Player = {
    x: number;
    y: number;
    angle: number;
};

export type GameState = {
    player: Player;
    enemies: Enemy[];
    bullets: Bullet[];
    enemyBullets: EnemyBullet[];
    particles: Particle[];

    world: {
        map: number[][];
        wave: number;
    };

    ui: {
        pauseMenuOpen: boolean;
        upgradeMenuOpen: boolean;
        selectedUpgrade: number;
        currentUpgrades: Upgrade[];
    };

    stats: {
        lives: boolean[];
        money: number;
        moneyMultiplier: number;
        enemyModifier: number;
        playerSpeedMultiplier: number;
        playerShootDelay: number;
        bulletCount: number;
        FOV: number;
    };

    effects: {
        damageFlash: number;
    };
};

export const gameState: GameState = {
    player: {
        x: 0,
        y: 0,
        angle: 0,
    },

    enemies: [],
    bullets: [],
    enemyBullets: [],
    particles: [],

    world: {
        map: [],
        wave: 1,
    },

    ui: {
        pauseMenuOpen: false,
        upgradeMenuOpen: false,
        selectedUpgrade: 0,
        currentUpgrades: [],
    },

    stats: {
        lives: Array(CONFIG.STARTING_LIVES).fill(true),
        money: 0,
        moneyMultiplier: 1,
        enemyModifier: 0,
        playerSpeedMultiplier: 1,
        playerShootDelay: CONFIG.PLAYER_SHOOT_DELAY,
        bulletCount: 1,
        FOV: CONFIG.FOV,
    },

    effects: {
        damageFlash: 0,
    },
};