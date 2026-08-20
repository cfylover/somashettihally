// Gallery functionality removed per request.
// This file remains as a stub so requiring it won't crash other modules.

const notSupported = (req, res) => res.status(410).json({ message: "Photo uploads are not supported" });

module.exports = {
  uploadSingle: (req, res, next) => next(),
  uploadPhoto: notSupported,
  getPhotos: notSupported,
  deletePhoto: notSupported,
};
