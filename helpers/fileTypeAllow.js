const mimetypeEnum = ["image/gif", "image/jpeg", "image/png"];

module.exports = (mimetype) => {
  return mimetypeEnum.includes(mimetype);
};
