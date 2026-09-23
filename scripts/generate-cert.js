const { generateCredentials, CERT_DIR, PFX_PATH, PASSPHRASE_PATH } = require('../src/certs');

function generate() {
  generateCredentials(CERT_DIR);
  console.log(`Generated ${PFX_PATH}`);
  console.log(`Generated ${PASSPHRASE_PATH}`);
}

if (require.main === module) generate();

module.exports = { generate, PFX_PATH, PASSPHRASE_PATH };
