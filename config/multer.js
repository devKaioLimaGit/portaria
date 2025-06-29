const crypto = require('crypto');
const multer = require('multer');
const { extname, resolve } = require('path');

module.exports = {
  upload(folder) {
    return {
      storage: multer.diskStorage({
        destination: resolve(__dirname, '..', folder),
        filename: (request, file, callback) => {
          const originalName = file.originalname;
          const fileHash = crypto.randomBytes(16).toLocaleString("hex");
          const fileExtension = extname(file.originalname); // Extensão do arquivo
          const newFileName = `${fileHash}-${originalName}`; // Usa o CPF como nome do arquivo
          callback(null, newFileName); // Define o novo nome do arquivo
        }
      })
    };
  }
};