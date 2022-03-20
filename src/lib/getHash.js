import crypto from 'crypto';

/**
 *  Returns the hash value of the text.
 *
 * @param {string} text - Text to hash
 * @param {number} limit - The length of the string to return.
 * @returns {string} Hashed text
 */
function getHash(text, limit = 7) {
  const shasum = crypto.createHash('sha1');
  shasum.update(text);
  return shasum.digest('hex').substr(0, limit);
}

export { getHash };
