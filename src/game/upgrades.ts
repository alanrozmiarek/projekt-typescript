import type {GameState} from "./gameState.ts";
import {gameState} from "./gameState.ts";

export type Upgrade = {
    id: string;
    name: string;
    description: string;
    rarity: "common" | "rare" | "epic" | "curse";
    price?: number;
    apply: (gameState: GameState) => void;
};
export const ALL_UPGRADES: Upgrade[] = [
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
        id: "heal_1",
        name: "Bandages",
        description: "Heal 1 life",
        rarity: "common",
        apply: () => {
            for (let i = gameState.stats.lives.length - 1; i >= 0; i--) {//heal 1 lfe
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
            gameState.stats.playerShootDelay *= 0.9;
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
        description: "-2 enemy per round",
        rarity: "rare",
        apply: () => {
            gameState.stats.enemyModifier -= 2;
        },
    },
    {
        id: "enemy_less_5",
        name: "Incredible Gassy",
        description: "-5 enemy per round",
        rarity: "epic",
        apply: () => {
            gameState.stats.enemyModifier -= 5;
        },
    },
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
        description: "+2 enemy per round",
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
            gameState.stats.playerShootDelay*=1.1;
        },
    },
    {
        id: "up_cooldown_2",
        name: "Rusty Gun",
        description: "-35% fire rate",
        rarity: "curse",
        apply: () => {
            gameState.stats.playerShootDelay *= 1.35;
        },
    },
    {
        id: "minus_life_3",
        name: "Heart Attack",
        description: "-3 lives",
        rarity: "curse",
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
        apply: () => {
            gameState.stats.lives.pop();
        },
    },
    {
        id: "cooldown_big",
        name: "Overclock",
        description: "+25% fire rate",
        rarity: "rare",
        apply: () => {
            gameState.stats.playerShootDelay *= 0.75;
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
    {
        id: "multishot",
        name: "Dual Shot",
        description: "+1 bullet, -50% fire rate",
        rarity: "rare",
        apply: () => {
            gameState.stats.bulletCount += 1;
            gameState.stats.playerShootDelay *= 1.5;
        },
    },
    {
        id: "chaos_spread",
        name: "Chaos Spread",
        description: "+3 bullets, -100% fire rate",
        rarity: "epic",
        apply: () => {
            gameState.stats.bulletCount += 3;
            gameState.stats.playerShootDelay *= 2;
        },
    },
    {
        id: "machine_gun",
        name: "Machine Gun",
        description: "+50% fire rate",
        rarity: "epic",
        apply: () => {
            gameState.stats.playerShootDelay *= 0.5;
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
        id: "speed_down",
        name: "Heavy Armor",
        description: "-20% movement speed",
        rarity: "curse",
        apply: () => {
            gameState.stats.playerSpeedMultiplier *= 0.8;
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
        apply: () => {
            gameState.stats.lives.pop();
            gameState.stats.lives.pop();
            gameState.stats.playerShootDelay *= 0.3;
        },
    },
    {
        id: "blood_tax",
        name: "Blood Tax",
        description: "-3 life, x4 money",
        rarity: "epic",
        apply: () => {
            gameState.stats.lives.pop();
            gameState.stats.lives.pop();
            gameState.stats.lives.pop();
            gameState.stats.moneyMultiplier *= 4;
        },
    },
    {
        id: "lottery",
        name: "Lottery",
        description: "Random effect",
        rarity: "rare",
        apply: () => {
            const roll = Math.random();
            if (roll < 0.1) {
                gameState.stats.lives.pop();
                gameState.stats.lives.pop();
            } else if (roll < 0.2) {
                gameState.stats.enemyModifier += 3;
            } else if (roll < 0.3) {
                gameState.stats.enemyModifier += 1;
            } else if (roll < 0.4) {
                gameState.stats.playerSpeedMultiplier *= 0.9;
            } else if (roll < 0.5) {
                gameState.stats.playerSpeedMultiplier *= 1.1;
            } else if (roll < 0.6) {
                gameState.stats.enemyModifier -= 1;
            } else if (roll < 0.7) {
                gameState.stats.enemyModifier -= 3;
            } else if (roll < 0.8) {
                gameState.stats.playerShootDelay *= 0.9;
            } else if (roll < 0.9) {
                gameState.stats.playerShootDelay *= 0.8;
                gameState.stats.moneyMultiplier *= 2;
            } else {
                gameState.stats.playerShootDelay *= 0.7;
                gameState.stats.moneyMultiplier *= 2;
            }
        },
    },
];
export function getRandomUpgrades(count: number): Upgrade[] {
    const weighted: Upgrade[] = [];
    for (const upg of ALL_UPGRADES) {
        if (upg.rarity === "common") {
            weighted.push(upg, upg, upg, upg, upg);
        }
        if (upg.rarity === "rare") {
            weighted.push(upg, upg);
        }
        if (upg.rarity === "epic") {
            weighted.push(upg);
        }
        if (upg.rarity === "curse") {
            weighted.push(upg, upg);
        }
    }
    const result: Upgrade[] = [];
    while (result.length < count) {
        const random =
            weighted[Math.floor(Math.random() * weighted.length)];
        if (!result.includes(random)) {
            result.push(random);
        }
    }
    return result;
}
