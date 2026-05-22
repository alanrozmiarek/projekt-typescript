import type { Upgrade } from "./upgrades";
import { ALL_UPGRADES } from "./upgrades";
import type { GameState } from "./gameState";
import { CONFIG } from "../config.ts";

export type ShopUpgrade = Upgrade & {
    price: number;
    shopExclusive?: boolean;
};

export type Shop = {
    x: number;
    y: number;
    upgrades: ShopUpgrade[];
};
export function refreshShopPrices(
    shop: Shop,
    purchaseCount: number,
    moneyMultiplier: number
) {
    for (const item of shop.upgrades) {
        item.price = randomPrice(item.rarity, purchaseCount, moneyMultiplier);
    }
}
const SHOP_EXCLUSIVE: ShopUpgrade[] = [
    {
        id: "shop_super_speed",
        name: "Adrenaline",
        description: "+100% movement speed",
        rarity: "legendary",
        price: 250,
        shopExclusive: true,
        apply: (gameState: GameState) => {
            gameState.stats.playerSpeedMultiplier *= 2;
        },
    },
    {
        id: "shop_quad_shot",
        name: "Quad Shot",
        description: "+2 bullets",
        rarity: "epic",
        price: 180,
        shopExclusive: true,
        apply: (gameState: GameState) => {
            gameState.stats.bulletCount += 2;
        },
    },
    {
        id: "shop_ultra_reflex",
        name: "Ultra Reflexes",
        description: "+65% fire rate",
        rarity: "legendary",
        price: 300,
        shopExclusive: true,
        apply: (gameState: GameState) => {
            gameState.stats.playerShootDelayMultiplier *= 0.35;
        },
    },
];

const PRICE_RULES = {
    common: {
        baseKills: 8,
        linearGrowth: 1.5,
        curveGrowth: 0.35,
    },
    rare: {
        baseKills: 16,
        linearGrowth: 2.2,
        curveGrowth: 0.55,
    },
    epic: {
        baseKills: 32,
        linearGrowth: 3.4,
        curveGrowth: 0.9,
    },
    legendary: {
        baseKills: 60,
        linearGrowth: 5,
        curveGrowth: 1.4,
    },
};

function randomPrice(rarity: string, purchaseCount: number, moneyMultiplier: number) {
    const rule = PRICE_RULES[rarity as keyof typeof PRICE_RULES] ?? PRICE_RULES.rare;
    const economyScale = Math.max(1, CONFIG.MONEY_PER_KILL);
    const incomeScale = Math.sqrt(Math.max(1, moneyMultiplier));
    const curve = Math.pow(purchaseCount, 1.45);
    const priceInKills =
        rule.baseKills +
        purchaseCount * rule.linearGrowth +
        curve * rule.curveGrowth;

    return Math.max(1, Math.round(priceInKills * economyScale * incomeScale));
}

function getRandomShopUpgrades(
    count: number,
    purchaseCount: number,
    moneyMultiplier: number
): ShopUpgrade[] {

    const normal = ALL_UPGRADES
        .filter(u => u.rarity !== "curse")
        .map(u => ({
            ...u,
            price: randomPrice(u.rarity, purchaseCount, moneyMultiplier),
        }));

    const exclusives = SHOP_EXCLUSIVE.map(u => ({
        ...u,
        price: randomPrice(u.rarity, purchaseCount, moneyMultiplier),
    }));

    const pool = [...normal, ...exclusives];

    const result: ShopUpgrade[] = [];

    while (result.length < count) {
        const upg = pool[Math.floor(Math.random() * pool.length)];

        if (!result.find(r => r.id === upg.id)) {
            result.push(upg);
        }
    }

    return result;
}

export function createShop(
    map: number[][],
    purchaseCount: number,
    moneyMultiplier: number
): Shop {

    while (true) {
        const x = Math.floor(Math.random() * (map[0].length - 2)) + 1;
        const y = Math.floor(Math.random() * (map.length - 2)) + 1;

        if (map[y][x] === 0) {
            return {
                x: x + 0.5,
                y: y + 0.5,
                upgrades: getRandomShopUpgrades(3, purchaseCount, moneyMultiplier),
            };
        }
    }
}

export function rerollShop(
    shop: Shop,
    purchaseCount: number,
    moneyMultiplier: number
) {
    shop.upgrades = getRandomShopUpgrades(3, purchaseCount, moneyMultiplier);
}
