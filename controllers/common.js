const notification = (path, type, content) => {
  return {
    path,
    type,
    content,
    sendedAt: Date.now(),
  };
};

module.exports = {
  notification,
};
