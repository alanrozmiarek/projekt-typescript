import type { GameState } from "./gameState.ts";
import { gameState } from "./gameState.ts";

export type Upgrade = {
    id: string;
    name: string;
    description: string;
    rarity: "common" | "rare" | "epic" | "legendary" | "curse";
    price?: number;
    canAppear?: (gameState: GameState) => boolean;
    apply: (gameState: GameState) => void;
};
const hasMissingHealth = () =>
    gameState.stats.lives.some((l) => !l);
const hasEnoughLives = (amount: number) =>
    gameState.stats.lives.length > amount;
const hasMultiShot = () =>
    gameState.stats.bulletCount > 1;
export const ALL_UPGRADES: Upgrade[] = [
    // COMMON
    {
        id: "heal_1",
        name: "Bandages",
        description: "Heal 1 life",
        rarity: "common",
        canAppear: () => hasMissingHealth(),
        apply: () => {
            for (let i = gameState.stats.lives.length - 1; i >= 0; i--) {
                if (!gameState.stats.lives[i]) {
                    gameState.stats.lives[i] = true;
                    break;
                }
            }
        },
    },
    {
        id: "cooldown_small",
        name: "Quick Hands",
        description: "+10% fire rate",
        rarity: "common",
        apply: () => {
            gameState.stats.playerShootDelayMultiplier *= 0.9;
        },
    },
    {
        id: "speed_up_small",
        name: "Running Shoes",
        description: "+10% movement speed",
        rarity: "common",
        apply: () => {
            gameState.stats.playerSpeedMultiplier *= 1.1;
        },
    },
    {
        id: "bullet_speed_small",
        name: "Polished Ammo",
        description: "+10% bullet speed",
        rarity: "common",
        apply: () => {
            gameState.stats.playerBulletSpeedMultiplier *= 1.1;
        },
    },
    // RARE
    {
        id: "life_1",
        name: "Extra Heart",
        description: "+1 life",
        rarity: "rare",
        apply: () => {
            gameState.stats.lives.push(true);
        },
    },
    {
        id: "double_money",
        name: "Golden Ammo",
        description: "x2 money",
        rarity: "rare",
        apply: () => {
            gameState.stats.moneyMultiplier *= 2;
        },
    },
    {
        id: "bullet_speed",
        name: "Silver Bullets",
        description: "+25% bullet speed",
        rarity: "rare",
        apply: () => {
            gameState.stats.playerBulletSpeedMultiplier *= 1.25;
        },
    },
    {
        id: "enemy_less",
        name: "Fear Aura",
        description: "-2 enemies per round",
        rarity: "rare",
        apply: () => {
            gameState.stats.enemyModifier -= 2;
        },
    },
    {
        id: "cooldown_big",
        name: "Overclock",
        description: "+25% fire rate",
        rarity: "rare",
        apply: () => {
            gameState.stats.playerShootDelayMultiplier *= 0.75;
        },
    },
    {
        id: "multishot",
        name: "Dual Shot",
        description: "+1 bullet, -35% fire rate",
        rarity: "rare",
        apply: () => {
            gameState.stats.bulletCount += 1;
            gameState.stats.playerShootDelayMultiplier *= 1.35;
        },
    },
    {
        id: "speed_up",
        name: "Turbo Boots",
        description: "+20% movement speed",
        rarity: "rare",
        apply: () => {
            gameState.stats.playerSpeedMultiplier *= 1.2;
        },
    },
    {
        id: "spread_down",
        name: "Steady Aim",
        description: "-20% bullet spread",
        rarity: "rare",
        canAppear: () => hasMultiShot(),
        apply: () => {
            gameState.stats.playerBulletSpreadMultiplier *= 0.8;
        },
    },

    {
        id: "minus_bullet",
        name: "Focused Barrel",
        description: "-1 bullet, +35% fire rate",
        rarity: "rare",
        canAppear: () => hasMultiShot(),
        apply: () => {
            gameState.stats.bulletCount -= 1;
            gameState.stats.playerShootDelayMultiplier *= 0.65;
        },
    },
    // EPIC
    {
        id: "enemy_less_5",
        name: "Incredible Gassy",
        description: "-5 enemies per round",
        rarity: "epic",
        apply: () => {
            gameState.stats.enemyModifier -= 5;
        },
    },
    {
        id: "chaos_spread",
        name: "Chaos Spread",
        description: "+3 bullets, -50% fire rate, +50% spread",
        rarity: "epic",
        apply: () => {
            gameState.stats.bulletCount += 3;
            gameState.stats.playerShootDelayMultiplier *= 1.5;
            gameState.stats.playerBulletSpreadMultiplier *= 1.5;
        },
    },
    {
        id: "sniper",
        name: "Sniper",
        description: "-50% bullet spread",
        rarity: "epic",
        canAppear: () => hasMultiShot(),
        apply: () => {
            gameState.stats.playerBulletSpreadMultiplier *= 0.5;
        },
    },
    {
        id: "machine_gun",
        name: "Machine Gun",
        description: "+50% fire rate",
        rarity: "epic",
        apply: () => {
            gameState.stats.playerShootDelayMultiplier *= 0.5;
        },
    },
    {
        id: "gotta_go_fast",
        name: "Sonic Speed",
        description: "+50% movement speed",
        rarity: "epic",
        apply: () => {
            gameState.stats.playerSpeedMultiplier *= 1.5;
        },
    },
    {
        id: "immortality",
        name: "Second Wind",
        description: "Restore all lives",
        rarity: "epic",
        canAppear: () => hasMissingHealth(),
        apply: () => {
            for (let i = 0; i < gameState.stats.lives.length; i++) {
                gameState.stats.lives[i] = true;
            }
        },
    },
    {
        id: "glass_cannon",
        name: "Glass Cannon",
        description: "-2 lives, +70% fire rate",
        rarity: "epic",
        canAppear: () => hasEnoughLives(2),
        apply: () => {
            gameState.stats.lives.pop();
            gameState.stats.lives.pop();
            gameState.stats.playerShootDelayMultiplier *= 0.3;
        },
    },
    {
        id: "money_3",
        name: "Treasure Protocol",
        description: "x3 money",
        rarity: "epic",
        apply: () => {
            gameState.stats.moneyMultiplier *= 3;
        },
    },
    // LEGENDARY
    {
        id: "minigun",
        name: "Minigun",
        description: "+4 bullets, +100% fire rate",
        rarity: "legendary",
        apply: () => {
            gameState.stats.bulletCount += 4;
            gameState.stats.playerShootDelayMultiplier *= 0.45;
        },
    },
    {
        id: "one_man_army",
        name: "One Man Army",
        description: "+2 lives, +2 bullets, +25% fire rate",
        rarity: "legendary",
        apply: () => {
            gameState.stats.lives.push(true);
            gameState.stats.lives.push(true);
            gameState.stats.bulletCount += 2;
            gameState.stats.playerShootDelayMultiplier *= 0.75;
        },
    },
    {
        id: "precision_master",
        name: "Precision Master",
        description: "-75% spread, +50% bullet speed",
        rarity: "legendary",
        canAppear: () => hasMultiShot(),
        apply: () => {
            gameState.stats.playerBulletSpreadMultiplier *= 0.25;
            gameState.stats.playerBulletSpeedMultiplier *= 1.5;
        },
    },
    {
        id: "godlike_reflexes",
        name: "Godlike Reflexes",
        description: "+70% movement speed, +40% fire rate",
        rarity: "legendary",
        apply: () => {
            gameState.stats.playerSpeedMultiplier *= 1.7;
            gameState.stats.playerShootDelayMultiplier *= 0.6;
        },
    },
    // CURSES
    {
        id: "nightmare",
        name: "Nightmare",
        description: "+5 enemies per round",
        rarity: "curse",
        apply: () => {
            gameState.stats.enemyModifier += 5;
        },
    },
    {
        id: "enemy_more",
        name: "Bounty",
        description: "+2 enemies per round",
        rarity: "curse",
        apply: () => {
            gameState.stats.enemyModifier += 2;
        },
    },
    {
        id: "up_cooldown",
        name: "Faulty Bullets",
        description: "-10% fire rate",
        rarity: "curse",
        apply: () => {
            gameState.stats.playerShootDelayMultiplier *= 1.1;
        },
    },
    {
        id: "up_cooldown_2",
        name: "Rusty Gun",
        description: "-35% fire rate",
        rarity: "curse",
        apply: () => {
            gameState.stats.playerShootDelayMultiplier *= 1.35;
        },
    },
    {
        id: "minus_life_3",
        name: "Heart Attack",
        description: "-3 lives",
        rarity: "curse",
        canAppear: () => hasEnoughLives(3),
        apply: () => {
            gameState.stats.lives.pop();
            gameState.stats.lives.pop();
            gameState.stats.lives.pop();
        },
    },
    {
        id: "minus_life",
        name: "Diabetes",
        description: "-1 life",
        rarity: "curse",
        canAppear: () => hasEnoughLives(1),
        apply: () => {
            gameState.stats.lives.pop();
        },
    },
    {
        id: "speed_down",
        name: "Heavy Boots",
        description: "-20% movement speed",
        rarity: "curse",
        apply: () => {
            gameState.stats.playerSpeedMultiplier *= 0.8;
        },
    },
    {
        id: "blood_tax",
        name: "Blood Tax",
        description: "-3 lives, x4 money",
        rarity: "curse",
        canAppear: () => hasEnoughLives(3),
        apply: () => {
            gameState.stats.lives.pop();
            gameState.stats.lives.pop();
            gameState.stats.lives.pop();
            gameState.stats.moneyMultiplier *= 4;
        },
    },
    {
        id: "jammed_mag",
        name: "Jammed Magazine",
        description: "-1 bullet",
        rarity: "curse",
        canAppear: () => hasMultiShot(),
        apply: () => {
            gameState.stats.bulletCount -= 1;
        },
    },
    {
        id: "blindfire",
        name: "Blindfire",
        description: "+100% bullet spread",
        rarity: "curse",
        canAppear: () => hasMultiShot(),
        apply: () => {
            gameState.stats.playerBulletSpreadMultiplier *= 2;
        },
    },
];
// RARITY WEIGHTS
const RARITY_WEIGHTS = {
    common: 60,
    rare: 25,
    epic: 10,
    legendary: 3,
    curse: 3,
};
export function getRandomUpgrades(count: number): Upgrade[] {
    const weighted: Upgrade[] = [];
    for (const upg of ALL_UPGRADES) {
        if (upg.canAppear && !upg.canAppear(gameState)) {
            continue;
        }
        const weight = RARITY_WEIGHTS[upg.rarity];
        for (let i = 0; i < weight; i++) {
            weighted.push(upg);
        }
    }
    const result: Upgrade[] = [];
    while (result.length < count && weighted.length > 0) {
        const random =
            weighted[Math.floor(Math.random() * weighted.length)];
        if (!result.includes(random)) {
            result.push(random);
        }
    }
    return result;
}
export function getRandomCurse(count: number): Upgrade[] {
    const available = ALL_UPGRADES.filter(
        (u) => u.rarity === "curse" && (!u.canAppear || u.canAppear(gameState))
    );
    const result: Upgrade[] = [];
    while (result.length < count && available.length > 0) {
        const random =
            available[Math.floor(Math.random() * available.length)];
        if (!result.includes(random)) {
            result.push(random);
        }
    }
    return result;
}