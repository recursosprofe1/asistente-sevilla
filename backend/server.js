import express from 'express';
import cors from 'cors';
import puppeteer from 'puppeteer';

const app = express();
app.use(cors());

// IDs estables para no duplicar el mismo evento en cada scraping.
// Solo herramienta de desarrollo: el frontend consume el feed validado.
function stableId(titulo, enlace, resumen) {
  const base = `${titulo}|${enlace}|${resumen}`.toLowerCase();
  let h = 5381;
  for (let i = 0; i < base.length; i += 1) h = ((h << 5) + h + base.charCodeAt(i)) >>> 0;
  return 'p-pup-' + h.toString(36);
}
// Función de scraping para Planes (solo desarrollo)
async function scrapePlanes() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Vamos a OnSevilla a su agenda
  await page.goto('https://onsevilla.com/agenda/hoy', { waitUntil: 'networkidle2' });

  const planes = await page.evaluate(() => {
    const posts = document.querySelectorAll('article.post');
    const resultados = [];
    
    posts.forEach((post, index) => {
      if (index >= 8) return; // Limitar a 8 planes reales

      const titulo = post.querySelector('h2.entry-title a')?.innerText || 'Plan en Sevilla';
      const enlace = post.querySelector('h2.entry-title a')?.href || '';
      const resumen = post.querySelector('.entry-summary p')?.innerText || 'Evento en Sevilla.';
      
      let category = 'Ocio';
      const textLower = titulo.toLowerCase() + ' ' + resumen.toLowerCase();
      if (textLower.includes('concierto') || textLower.includes('música')) category = 'Música';
      else if (textLower.includes('teatro') || textLower.includes('obra')) category = 'Teatro';
      else if (textLower.includes('exposición') || textLower.includes('arte')) category = 'Arte';

      resultados.push({
        title: titulo,
        summary: resumen.substring(0, 50) + '...',
        municipality: 'Sevilla',
        travelMinutes: 15,
        priceText: 'Ver web',
        category: category,
        startsAt: 'Próximamente',
        venue: 'Sevilla',
        whyMatch: 'Encontrado en vivo mediante scraping de OnSevilla.',
        longDescription: resumen,
        sourceUrl: enlace
      });
    });
    
    return resultados;
  });

  await browser.close();
  const withIds = planes.map((p) => ({ ...p, id: stableId(p.title, p.sourceUrl, p.longDescription) }));
  return { planes: withIds };
}

app.get('/api/planes', async (req, res) => {
  try {
    console.log('Scrapeando planes reales con Puppeteer...');
    const data = await scrapePlanes();
    res.json(data);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Fallo scraping' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✅ Servidor Puppeteer corriendo en http://localhost:${PORT}`);
});