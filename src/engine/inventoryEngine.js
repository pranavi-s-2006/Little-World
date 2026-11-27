// inventoryEngine.js
export function consumeItem(inventory, itemId, qty = 1) {
  const current = inventory[itemId] ?? 0;
  if (current <= 0) return { inventory, success: false };
  return {
    inventory: { ...inventory, [itemId]: Math.max(0, current - qty) },
    success: true,
  };
}

export function hasItem(inventory, itemId) {
  return (inventory[itemId] ?? 0) > 0;
}

export function restockItem(inventory, itemId, qty) {
  return { ...inventory, [itemId]: (inventory[itemId] ?? 0) + qty };
}
