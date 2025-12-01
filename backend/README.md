Backend (Node.js) for PDF conversion
===================================

How to run locally:
1. Install Node.js (14+) and npm.
2. Install LibreOffice if you want Word -> PDF conversion:
   - On Ubuntu/Debian: sudo apt install libreoffice
   - On macOS: install LibreOffice app and ensure soffice is on PATH
3. In backend folder run:
   npm install
   node server.js
4. API endpoints:
   - POST /word-to-pdf  (form field name: file)
   - POST /image-to-pdf (form field name: file)
