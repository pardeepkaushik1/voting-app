const cloudinary = require("../config/cloudinary");

const uploadImage = async (fileBuffer) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: "voting-app",
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      )
      .end(fileBuffer);
  });
};

module.exports = uploadImage;