// I-import ang mga kailangang gamitin mula sa package.json
const express = require('express');
const cors = require('cors');
const path = require('path');

// Gawin ang app
const app = express();
const PORT = process.env.PORT || 3000;

// Mga setting para gumana nang tama
app.use(cors()); // Payagan ang pagtanggap ng datos mula sa ibang pinagmulan
app.use(express.json());
app.use(express.static(path.join(__dirname))); // Ipakita ang lahat ng files sa folder

// Kapag binuksan ang website, ilabas ang iyong index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Simulan ang server
app.listen(PORT, () => {
  console.log(`✅ Server tumatakbo nang maayos sa port ${PORT}`);
  console.log(`🌐 Website handa na!`);
});
