export const CONFIG = {
    PLAYER_SHOOT_DELAY: Number(import.meta.env.VITE_PLAYER_SHOOT_DELAY ?? 30),
    BASE_BULLET_SPEED: Number(import.meta.env.VITE_BULLET_SPEED ?? 0.2),
    BASE_MOVE_SPEED: Number(import.meta.env.VITE_BASE_MOVE_SPEED ?? 0.017),
    ROT_SPEED: Number(import.meta.env.VITE_ROT_SPEED ?? 0.02),
    MOUSE_FINE_AIM_EXPONENT: Number(import.meta.env.VITE_MOUSE_FINE_AIM_EXPONENT ?? 1.6),
    MOUSE_FINE_AIM_REFERENCE: Number(import.meta.env.VITE_MOUSE_FINE_AIM_REFERENCE ?? 10),
    BASE_BULLET_SPREAD: Number(import.meta.env.VITE_BASE_BULLET_SPREAD ?? 0.15),
    FOV: Number(import.meta.env.VITE_FOV ?? Math.PI / 2),

    MINIMAP_SIZE: Number(import.meta.env.VITE_MINIMAP_SIZE ?? 400),
    STARTING_LIVES: Number(import.meta.env.VITE_STARTING_LIVES ?? 3),

    STARTING_ENEMIES: Number(import.meta.env.VITE_STARTING_ENEMIES ?? 1),
    ENEMY_MIN_DISTANCE: Number(import.meta.env.VITE_ENEMY_MIN_DISTANCE ?? 5),
    ENEMY_SIZE: Number(import.meta.env.VITE_ENEMY_SIZE ?? 0.4),
    ENEMY_REACTION_TIME: Number(import.meta.env.VITE_ENEMY_REACTION_TIME ?? 1),

    MONEY_PER_KILL: Number(import.meta.env.VITE_MONEY_PER_KILL ?? 100),
    DEBUG: import.meta.env.VITE_DEBUG ?? "true",

    HQ: import.meta.env.VITE_HQ ?? "false",
};
