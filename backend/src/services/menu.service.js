const menuRepository = require("../repositories/menu.repository");
const CloudinaryStorage = require("./image/CloudinaryStorage");

const uniqueCategoryIds = (categoryIds) => [...new Set(categoryIds)];
const imageStorage = new CloudinaryStorage();

async function listMenu(restaurantId) {
  const [categories, items] = await Promise.all([menuRepository.findCategories(restaurantId), menuRepository.findItemsWithCategories(restaurantId)]);
  return { categories, items };
}

async function createMenuItem(restaurantId, data, imageFile) {
  let image;
  try {
    image = await imageStorage.upload(imageFile, { restaurantId });
    return await menuRepository.createMenuItem({
      ...data,
      restaurantId,
      categoryIds: uniqueCategoryIds(data.categoryIds),
      imageUrl: image?.url || null,
      imagePublicId: image?.publicId || null,
    });
  } catch (error) {
    if (image?.publicId) await imageStorage.remove(image.publicId).catch(() => {});
    throw error;
  }
}

async function updateMenuItem(restaurantId, id, data, imageFile) {
  const existing = await menuRepository.findItemById(restaurantId, id);
  if (!existing) throw Object.assign(new Error("Menu item not found"), { status: 404 });

  let image;
  try {
    image = await imageStorage.upload(imageFile, { restaurantId });
    await menuRepository.updateMenuItem(id, {
      ...data,
      restaurantId,
      categoryIds: uniqueCategoryIds(data.categoryIds),
      imageUrl: image?.url || existing.imageUrl,
      imagePublicId: image?.publicId || existing.imagePublicId,
    });
  } catch (error) {
    if (image?.publicId) await imageStorage.remove(image.publicId).catch(() => {});
    throw error;
  }

  if (image && existing.imagePublicId) await imageStorage.remove(existing.imagePublicId).catch(() => {});
}

async function getMenuItem(restaurantId, id) {
  return menuRepository.findItemById(restaurantId, id);
}

async function deleteMenuItem(restaurantId, id) {
  const deleted = await menuRepository.deleteMenuItem(restaurantId, id);
  if (!deleted) throw Object.assign(new Error("Menu item not found"), { status: 404 });
  if (deleted.imagePublicId) await imageStorage.remove(deleted.imagePublicId).catch(() => {});
}

module.exports = { listMenu, createMenuItem, updateMenuItem, getMenuItem, deleteMenuItem, getPublicMenu: menuRepository.findPublicMenu };
