const User = require('../models/User');
const { encryptText, decryptText } = require('./tokenEncryption');

async function updateGithubAuth({ userId, githubUserId, githubUsername, accessToken }) {
  if (!userId) {
    throw new Error('user_id_required');
  }

  const update = {
    github: {
      userId: githubUserId,
      username: githubUsername,
      accessTokenEncrypted: encryptText(accessToken),
    },
  };

  return User.findByIdAndUpdate(userId, { $set: update }, { new: true });
}

async function getGithubAccessToken(userId) {
  const user = await User.findById(userId).lean();
  if (!user?.github?.accessTokenEncrypted) {
    return null;
  }
  return decryptText(user.github.accessTokenEncrypted);
}

async function getGithubProfile(userId) {
  const user = await User.findById(userId).lean();
  if (!user?.github?.userId) return null;
  return {
    userId: user.github.userId,
    username: user.github.username,
  };
}

async function disconnectGithubAuth(userId) {
  if (!userId) {
    throw new Error('user_id_required');
  }

  return User.findByIdAndUpdate(
    userId,
    {
      $set: {
        'github.userId': null,
        'github.username': '',
        'github.accessTokenEncrypted': '',
      },
    },
    { new: true },
  );
}

module.exports = {
  updateGithubAuth,
  disconnectGithubAuth,
  getGithubAccessToken,
  getGithubProfile,
};
