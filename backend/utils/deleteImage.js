const cloudinary = require("../config/cloudinary");

const deleteImage = async (publicId) => {
  return await cloudinary.uploader.destroy(publicId);
};

module.exports = deleteImage;