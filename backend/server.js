// server.js
// Node.js backend for converting Word (doc/docx) and Images to PDF.
// Note: For Word->PDF conversion this uses libreoffice-convert which requires LibreOffice installed on the server.
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const libre = require('libreoffice-convert');
const { PDFDocument } = require('pdf-lib');
const cors = require('cors');

const app = express();
app.use(cors());

const upload = multer({ dest: 'uploads/' });

// helper to remove files
function safeUnlink(p){
  fs.unlink(p, ()=>{});
}

app.get('/', (req, res) => res.send('PDF Converter API is running'));

// Word -> PDF
app.post('/word-to-pdf', upload.single('file'), (req, res) => {
  if(!req.file) return res.status(400).send('No file uploaded');
  const ext = path.extname(req.file.originalname).toLowerCase();
  if(!['.doc','.docx'].includes(ext)) {
    safeUnlink(req.file.path);
    return res.status(400).send('Unsupported file type');
  }

  const inputPath = req.file.path;
  const input = fs.readFileSync(inputPath);

  libre.convert(input, '.pdf', undefined, (err, done) => {
    if(err){
      console.error('Libre convert error', err);
      safeUnlink(inputPath);
      return res.status(500).send('Conversion failed (libreoffice)');
    }
    const outPath = inputPath + '.pdf';
    fs.writeFileSync(outPath, done);
    res.download(outPath, path.basename(req.file.originalname, ext) + '.pdf', (err) => {
      safeUnlink(inputPath);
      safeUnlink(outPath);
    });
  });
});

// Image -> PDF
app.post('/image-to-pdf', upload.single('file'), async (req, res) => {
  if(!req.file) return res.status(400).send('No file uploaded');
  const mime = req.file.mimetype || '';
  if(!mime.startsWith('image')){
    safeUnlink(req.file.path);
    return res.status(400).send('Unsupported file type');
  }

  try{
    const imageBytes = fs.readFileSync(req.file.path);
    const pdfDoc = await PDFDocument.create();

    let image;
    if(mime === 'image/png') image = await pdfDoc.embedPng(imageBytes);
    else image = await pdfDoc.embedJpg(imageBytes);

    const page = pdfDoc.addPage([image.width, image.height]);
    page.drawImage(image, { x:0, y:0, width: image.width, height: image.height });

    const pdfBytes = await pdfDoc.save();
    const outPath = req.file.path + '.pdf';
    fs.writeFileSync(outPath, pdfBytes);

    res.download(outPath, path.basename(req.file.originalname, path.extname(req.file.originalname)) + '.pdf', (err) => {
      safeUnlink(req.file.path);
      safeUnlink(outPath);
    });
  } catch(err){
    console.error(err);
    safeUnlink(req.file.path);
    res.status(500).send('Conversion failed (image processing)');
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log('Server running on port', PORT));
