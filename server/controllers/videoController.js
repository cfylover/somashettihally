// Video functionality removed per request.
// Stubbed exports to avoid runtime errors if required elsewhere.

const notSupported = (req, res) => res.status(410).json({ message: "Video uploads are not supported" });

module.exports = {
  uploadSingle: (req, res, next) => next(),
  uploadVideo: notSupported,
  getVideos: notSupported,
  deleteVideo: notSupported,
};
