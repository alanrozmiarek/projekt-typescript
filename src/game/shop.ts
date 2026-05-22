import type { Upgrade } from "./upgrades";
import { ALL_UPGRADES } from "./upgrades";
import type { GameState } from "./gameState";

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
    purchaseCount: number
) {
    for (const item of shop.upgrades) {
        item.price = randomPrice(item.rarity, purchaseCount);
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

function randomPrice(rarity: string, purchaseCount: number) {
    switch (rarity) {
        case "common":
            return 30 + (purchaseCount * 5);

        case "rare":
            return 70 + (purchaseCount * 8);

        case "epic":
            return 140 + (purchaseCount * 12);

        case "legendary":
            return 250 + (purchaseCount * 20);

        default:
            return 100 + (purchaseCount * 10);
    }
}

function getRandomShopUpgrades(count: number, purchaseCount: number): ShopUpgrade[] {

    const normal = ALL_UPGRADES
        .filter(u => u.rarity !== "curse")
        .map(u => ({
            ...u,
            price: randomPrice(u.rarity, purchaseCount),
        }));

    const exclusives = SHOP_EXCLUSIVE.map(u => ({
        ...u,
        price: randomPrice(u.rarity, purchaseCount),
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
    purchaseCount: number
): Shop {

    while (true) {
        const x = Math.floor(Math.random() * (map[0].length - 2)) + 1;
        const y = Math.floor(Math.random() * (map.length - 2)) + 1;

        if (map[y][x] === 0) {
            return {
                x: x + 0.5,
                y: y + 0.5,
                upgrades: getRandomShopUpgrades(3, purchaseCount),
            };
        }
    }
}

export function rerollShop(
    shop: Shop,
    purchaseCount: number
) {
    shop.upgrades = getRandomShopUpgrades(3, purchaseCount);
}