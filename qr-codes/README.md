# Folio card QR codes

Made by `node tools/make-qr-pngs.js` (run it again after any card change). Every file was decoded after writing to check it.

- Encodes: `https://jtq03.github.io/Folio/card/?t=<card token>&via=qr`. Any phone camera opens the care team view. The Folio app's "Scan your card" logs in as that person.
- `FO-1001_Sam-Orr.png` to `FO-1004_Jake-Querin.png`: black on white, 1200 x 1200 px, error correction Q, quiet zone (4 modules) included. Use these for printing.
- `brand/`: the same codes in Green 900 on Beige 100, for screens and mockups.
- `samples/`: the sample patients (Maya, Theo, Priya, Jordan, Sam W., Ana). Eli has no card yet.
- `print-sheet.pdf` / `.png` / `.html`: the four pilot codes at exactly 28 mm, 600 dpi, labels outside the code, with a 50 mm check bar.

Printing:
- Print 28 mm square, white margin included. Never shrink below 22 mm and never crop into the white margin.
- Print at 100% (actual size) and measure the 50 mm check bar.
- Matte finish: gloss and laminate glare stop phones reading the code.
- Test scan every code with an iPhone camera before printing more.

Replace card in the portal makes a new token, so a printed code for that card stops working. Reprint after a replace.
