const cloudinary = require("cloudinary").v2;

const isCloudinaryConfigured =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

exports.uploadToCloudinary = async (filePath, folder = "billing") => {
  if (!isCloudinaryConfigured) {
    return { url: filePath, public_id: null, provider: "local" };
  }

  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: "auto",
  });

  return {
    url: result.secure_url,
    public_id: result.public_id,
    provider: "cloudinary",
  };
};

exports.deleteFromCloudinary = async (publicId) => {
  if (!isCloudinaryConfigured || !publicId) return null;
  return cloudinary.uploader.destroy(publicId);
};

exports.cloudinary = cloudinary;
