const express = require('express');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');
const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const Jimp = require('jimp');

const path = require('path');

const app = express();

// Defina um limite maior para o tamanho do payload
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

const port = 3333;

// Configurar o middleware para processar o corpo da requisição como JSON
app.use(bodyParser.json());

app.get('/', (request, response) => {
  return response.json({ message: 'Server is UP' });
});

async function detectImageType(bytes) {//Detecta tipo imagem
  //bytes[0] === 0xFF && bytes[1] === 0xD8
  if (bytes[0] === -1 && bytes[1] === -40) {//bytes[0] === -1 && bytes[1] === -40
    return 'JPEG';

  } else {
    return 'PNG';

  }
}

// Função para remover o fundo branco da imagem
async function removeWhiteBackgroundIMG(jpegBuffer, redX, redY, tipoIMG) {
  const image = await Jimp.read(jpegBuffer);

  // Redimensionar a imagem
  if (redX != null, redY != null) {
    image.resize(redX, redY);

  }

  image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
    const red = this.bitmap.data[idx + 0];
    const green = this.bitmap.data[idx + 1];
    const blue = this.bitmap.data[idx + 2];
    // Se o pixel for quase branco, tornar transparente
    if (red > 240 && green > 240 && blue > 240) {
      this.bitmap.data[idx + 3] = 0; // Define alpha como 0 (transparente)
    }
  });

  // Converte a imagem para PNG para manter a transparência
  let buffer = null;

  console.log(`tipo IMG:` + tipoIMG);
  if (tipoIMG == "JPEG") {
    buffer = await image.getBufferAsync(Jimp.MIME_PNG);

  } else if (tipoIMG == "PNG") {
    buffer = await image.getBufferAsync(Jimp.MIME_PNG);

  } else {
    buffer = await image.getBufferAsync(Jimp.MIME_PNG);

  }

  return buffer;
}

app.post('/tratar-JPEG', async (request, response) => {
  try {
    //const dados = request.body;
    const brasao = request.body;

    // Decodificar a imagem base64 para buffer

    console.log(" Imagem: " + brasao)
    const tipoIMG = await detectImageType(brasao);
    console.log("Tipo Imagem 1.0:  " + tipoIMG);
    const brasaoBuffer = Buffer.from(brasao, 'base64');

    const brasaoBufferPng = await removeWhiteBackgroundIMG(brasaoBuffer, null, null, tipoIMG);

    console.log("Tipo Imagem 2.0:  " + await detectImageType(brasaoBufferPng));
    response.send(brasaoBufferPng);

  } catch (error) {
    console.error('Erro ao gerar o PDF:', error);
    response.status(500).send('Erro ao gerar o PDF');
  }
});

app.post('/gerar-pdf', async (req, res) => {
  try {

    const dados = req.body;
    const nmMunicipio = dados.nomeMunicipio;
    const dtDiario = dados.dataDiario;
    const nDiario = dados.numDiario;
    const lOrgao = dados.orgaos;
    const brasao = dados.brasao;

    let escalXLogo = '0.8';
    let escalYLogo = '3.0';
    let tmFonte = '140px';
    let spacBrasao = '-240px';
    if (nmMunicipio.length == 9) {// Altera Estrutura da fonte do LOGO
      escalXLogo = '0.8';
      escalYLogo = '2.0';
      tmFonte = '143px';
      spacBrasao = '-240px';

    } else if (nmMunicipio.length >= 10 && nmMunicipio.length <= 12) {
      escalXLogo = '0.8';
      escalYLogo = '2.0';
      tmFonte = '140px';
      spacBrasao = '-240px';

    } else if (nmMunicipio.length > 12 && nmMunicipio.length <= 15) {
      escalXLogo = '0.8';
      escalYLogo = '2.5';
      tmFonte = '137px';
      spacBrasao = '-240px';

    } else if (nmMunicipio.length > 15 && nmMunicipio.length <= 18) {
      escalXLogo = '0.7';
      escalYLogo = '3.0';
      tmFonte = '127px';
      spacBrasao = '-340px';

    } else if (nmMunicipio.length > 18 && nmMunicipio.length <= 21) {
      escalXLogo = '0.7';
      escalYLogo = '3.0';
      tmFonte = '123px';
      spacBrasao = '-380px';

    } else if (nmMunicipio.length > 21 && nmMunicipio.length <= 24) {
      escalXLogo = '0.7';
      escalYLogo = '3.0';
      tmFonte = '108px';
      spacBrasao = '-465px';

    } else if (nmMunicipio.length > 24 && nmMunicipio.length <= 27) {
      escalXLogo = '0.7';
      escalYLogo = '3.0';
      tmFonte = '100px';
      spacBrasao = '-495px';

    } else if (nmMunicipio.length > 27) {
      escalXLogo = '0.7';
      escalYLogo = '3.0';
      tmFonte = '80px';
      spacBrasao = '-495px';

    } else {
      escalXLogo = '0.9';
      escalYLogo = '2.0';
      tmFonte = '140px';
      spacBrasao = '-240px';

    }

    function convertToBase64String(input) {
      // Verifica se 'input' é uma string ou array de números
      if (Array.isArray(input)) {
        return input.map(num => String.fromCharCode(num)).join('');
      } else if (typeof input === 'string') {
        return input;
      } else {
        throw new Error('Formato de entrada inválido');
      }
    }

    const tipoIMG = await detectImageType(brasao);
    let brasaoDataURL1 = null;
    let brasaoDataURL2 = null;
    if (tipoIMG == "PNG") {
      const brasaoBase64 = convertToBase64String(brasao);

      // Decodificar a imagem base64 para buffer
      const brasaoBuffer = Buffer.from(brasaoBase64, 'base64');

      const image = await Jimp.read(brasaoBuffer);
      const imageSecond = await Jimp.read(brasaoBuffer);

      // Redimensionar a imagem
      image.resize(370, 370);
      
      imageSecond.resize(115, 115);


      buffer = await image.getBufferAsync(Jimp.MIME_PNG);
      brasaoDataURL1 = `data:image/png;base64,${buffer.toString('base64')}`;

      
      bufferSecond = await imageSecond.getBufferAsync(Jimp.MIME_PNG);
      brasaoDataURL2 = `data:image/png;base64,${bufferSecond.toString('base64')}`;

    } else {
      const brasaoBuffer = Buffer.from(brasao, 'base64');
      const brasaoBufferPng = await removeWhiteBackgroundIMG(brasaoBuffer, 370, 370, tipoIMG);
      const brasaoBufferPng2 = await removeWhiteBackgroundIMG(brasaoBuffer, 170, 170, tipoIMG);
      brasaoDataURL1 = `data:image/png;base64,${brasaoBufferPng.toString('base64')}`;
      brasaoDataURL2 = `data:image/png;base64,${brasaoBufferPng2.toString('base64')}`;
    }


    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    // Função para converter fonte em base64
    const encodeFontToBase64 = (fontPath) => {
      const font = fs.readFileSync(fontPath);
      return font.toString('base64');
    };
    
// Caminhos das fontes

const boldoniNormalPath = path.join(__dirname, '../diario-gerador/fonts/BOD_R.ttf');
const boldoniBPath = path.join(__dirname, '../diario-gerador/fonts/BOD_B.ttf');
const arialNormalPath = path.join(__dirname, '../diario-gerador/fonts/arial.ttf');
const arialBPath = path.join(__dirname, '../diario-gerador/fonts/arialbd.ttf');
///Users/SI09/vs-workspace-geradorPDF/diario-gerador/fonts/arialbd.ttf
// C:\Users\SI09\vs-workspace-geradorPDF\diario-gerador
// C:\Users\SI09\vs-workspace-geradorPDF\fonts\BOD_R.ttf


console.log("AKI Diretorio ; " +__dirname);

const boldoniNormal = encodeFontToBase64(boldoniNormalPath);
const boldoniBold = encodeFontToBase64(boldoniBPath);
const arialNormal = encodeFontToBase64(arialNormalPath);
const arialBold = encodeFontToBase64(arialBPath);

    // Carregar a fonte personalizada
    //const byteFTimes = fs.readFileSync(path.join(__dirname, 'fonts', 'times.ttf'));

    //const byteFSerif = fs.readFileSync(path.join(__dirname, 'fonts', 'serife.ttf'));
    // const byteFSSerif = fs.readFileSync(path.join(__dirname, 'fonts', 'sserife.ttf'));
    //const byteFMonospace = fs.readFileSync(path.join(__dirname, 'fonts', 'cour.ttf'));

    // Definir o CSS para o cabeçalho
    const headerCss = `
        <style>
        header {
          padding: 0px;
          text-align: left;
          margin-top: -50px;
          margin-bottom: -30px;
        }

        @font-face {
          font-family: 'FontTimes';
          src: url('/fonts/times.ttf') format('truetype');
          font-weight: normal;
          font-style: normal;
        }
        
        @font-face {
          font-family: 'FontTimes';
          src: url('/fonts/timesbd.ttf') format('truetype');
          font-weight: bold;
          font-style: normal;
        }

        @font-face {
          font-family: 'Century';
          src: url('/fonts/CENSCBK.ttf') format('truetype');
          font-weight: normal;
          font-style: normal;
        }
        
        @font-face {
          font-family: 'Century';
          src: url('/fonts/SCHLBKB.ttf') format('truetype');
          font-weight: bold;
          font-style: normal;
        }

        @font-face {
          font-family: 'Boldoni';
          src: url('data:font/truetype;base64,${boldoniNormal}') format('truetype');
          font-weight: normal;
          font-style: normal;
        }
        
        @font-face {
          font-family: 'Boldoni';
          src: url('data:font/truetype;base64,${boldoniBold}') format('truetype');
          font-weight: bold;
          font-style: normal;
        }

        @font-face {
          font-family: 'Arial';
          src: url('data:font/truetype;base64,${arialNormal}') format('truetype');
          font-weight: normal;
          font-style: normal;
        }
        
        @font-face {
          font-family: 'Arial';
          src: url('data:font/truetype;base64,${arialBold}') format('truetype');
          font-weight: bold;
          font-style: normal;
        }

        @font-face {
          font-family: 'FontCour';
          src: url('/fonts/cour.ttf') format('truetype');
          font-weight: normal;
          font-style: normal;
        }
        
        @font-face {
          font-family: 'FontCour';
          src: url('/fonts/courbd.ttf') format('truetype');
          font-weight: bold;
          font-style: normal;
        }
                
        .logo-container {
          display: flex;
          justify-content: flex-start; /* Alinha os itens à esquerda */
          align-items: center; /* Centraliza os itens verticalmente */
          padding: 0; /* Remove padding adicional */
      }
      

        span.pageNumber::after {
          content: counter(page);
          counter-increment: page;
          }
        
        .logo {
          color: #050505;
          font-size: ${tmFonte};
          line-height: ${escalYLogo};
          text-decoration: none;
          font-family: 'Boldoni';
          font-weight: bold !important;
          display: inline-block;
          transform-origin: left; /* Define a origem da transformação */
          transform: scaleX(${escalXLogo}) scaleY(${escalYLogo}); /* Ajuste conforme necessário */
          margin-right: ${spacBrasao}; 
          position: relative; /* Adicionado */
          top: -10px;
          white-space: nowrap;
          flex-grow: 1;
          padding-left: -10px; /* Adiciona um padding para manter a distância da borda */
          flex-basis: 70%; /* Define a largura da logo */
        }
        
        brasao {
          max-width: 100px; /* Ajuste conforme necessário */
          margin-top: 100px;
        }

        .pag-h5 {
          font-size: 20px;
          text-decoration: none;
          width: 8%;
          font-family: 'Arial', sans-serif;
          font-weight: bold !important;
          color: #050505;
          display: flex; /* Use flexbox para posicionar os campos */
          justify-content: space-between; /* Distribuir o espaço entre os campos */
          padding: 0px; /* Opcional: Adicione espaço interno para separar os campos da borda da faixa */
          text-align: left;
          clear: both; /* Limpe o flutuador para que o conteúdo abaixo não seja afetado */
          border-bottom: 30px solid #c9c9c9;
          border-top: 10px solid #c9c9c9;
          position: relative;
        }
    
        .nome-h5 {
          font-size: 20px;
          text-decoration: none;
          width: 48%;
          font-family: 'Arial', sans-serif;
          font-weight: bold !important;
          color: #050505;
          display: flex; /* Use flexbox para posicionar os campos */
          justify-content: space-between; /* Distribuir o espaço entre os campos */
          width: 100%; /* Opcional: ajuste a largura conforme necessário */
          padding: 0px; /* Opcional: Adicione espaço interno para separar os campos da borda da faixa */
          text-align: left;
          clear: both; /* Limpe o flutuador para que o conteúdo abaixo não seja afetado */
          border-bottom: 30px solid #c9c9c9;
          border-top: 10px solid #c9c9c9;
          position: relative;
        }
    
        .data-h5 {
          font-size: 20px;
          text-decoration: none;
          width: 48%;
          font-family: 'Arial', sans-serif !important;
          font-weight: bold !important;
          color: #050505;
          display: flex; /* Use flexbox para posicionar os campos */
          justify-content: space-between; /* Distribuir o espaço entre os campos */
          width: 100%; /* Opcional: ajuste a largura conforme necessário */
          padding: 0px; /* Opcional: Adicione espaço interno para separar os campos da borda da faixa */
          text-align: right;
          clear: both; /* Limpe o flutuador para que o conteúdo abaixo não seja afetado */
          border-bottom: 30px solid #c9c9c9;
          border-top: 10px solid #c9c9c9;
          position: relative;
        }
    
        .linha {
          display: flex; /* Use flexbox para posicionar os campos */
          justify-content: space-between; /* Distribuir o espaço entre os campos */
          width: 100%; /* Opcional: ajuste a largura conforme necessário */
          padding: 0px; /* Opcional: Adicione espaço interno para separar os campos da borda da faixa */
          clear: both; /* Limpe o flutuador para que o conteúdo abaixo não seja afetado */
          border-bottom: 2px;
          border-top: 2px;
          margin-top: -40px;
          margin-bottom: -25px;

        }

        .linhaOrgao {
          display: flex; /* Use flexbox para posicionar os campos */
          justify-content: space-between; /* Distribuir o espaço entre os campos */
          width: 100%; /* Opcional: ajuste a largura conforme necessário */
          background-color: #c9c9c9 !important; /* Cor de fundo da faixa */
          padding: 0px; /* Opcional: Adicione espaço interno para separar os campos da borda da faixa */
          clear: both; /* Limpe o flutuador para que o conteúdo abaixo não seja afetado */
          border-bottom: 55px solid #c9c9c9;
          border-top: 35px solid #c9c9c9;
          position: relative;          
          margin-left: -10px; /* Define a indentação desejada */

        }

        .sobrepostoNM {
          position: absolute;
          z-index: 1; /* Traz o texto para frente */
          background-color: transparent; /* Certifica que o fundo do texto é transparente */
          margin: 0; /* Remove a margem padrão do h2 */
          margin-left: 20px; /* Define a indentação desejada */
      }

      .sobrepostoDT {
        position: absolute;
        z-index: 1; /* Traz o texto para frente */
        background-color: transparent; /* Certifica que o fundo do texto é transparente */
        margin: 0; /* Remove a margem padrão do h2 */
        margin-left: 150px; /* Define a indentação desejada */
        margin-right: 10px; /* Define a indentação desejada */
        white-space: nowrap;
    }

    .ementa {
      font-weight: bold !important; 
      text-align: center;
    }

    .centraliza {
      text-align: center;
    }

        .coluna {
          width: 50% !important;
          float: left !important;
          box-sizing: border-box !important; /* Inclui a largura da borda e do preenchimento na largura total da coluna */
          padding: 10px !important; /* Adiciona espaço interno entre a borda e o conteúdo */
          border-right: 3px solid #c9c9c9; /* Adicione uma borda à direita de uma das colunas */
          color: #c9c9c9 !important;
          
        }
                
        .coluna-container {
          column-count: 2; /* Define duas colunas */
          column-gap: 20px; /* Define o espaço entre as colunas */
          padding: 10px; /* Adiciona espaço interno ao contêiner */
      }

        .coluna .elemento {
          margin-top: 0; /* Remova a margem superior */
          padding-top: 0; /* Remova o padding superior */
      }

        .ql-font-monospace {
          font-family: 'FontCour', monospace;
      }

      .ql-font-serif{
        font-family: 'FontTimes', serif;
      }

      .ql-font-SSerif{
        font-family: 'Arial';
      }

      .separa-materia {
        margin-top: 20px;
    }

      ul {
        list-style-type: none; /* Remove os marcadores padrão */
        margin: 0; /* Remove a margem padrão */
        padding: 0; /* Remove o padding padrão */
    }
    
    .ql-indent-1 {
      margin-left: 20px; /* Define a indentação desejada */
    }

    .ql-indent-2 {
      margin-left: 30px; /* Define a indentação desejada */
    }
    
    .ql-indent-3 {
      margin-left: 40px; /* Define a indentação desejada */
    }
    
    .ql-indent-4 {
      margin-left: 50px; /* Define a indentação desejada */
    }
    
    .ql-indent-5 {
      margin-left: 60px; /* Define a indentação desejada */
    }
    
    .ql-indent-6 {
      margin-left: 70px; /* Define a indentação desejada */
    }
    
    .ql-indent-7 {
      margin-left: 80px; /* Define a indentação desejada */
    }
    
    .ql-indent-8 {
      margin-left: 90px; /* Define a indentação desejada */
    }

    .ql-align-center {
      text-align: center; /* Alinhamento justificado */
    }

    .ql-align-right {
    text-align: right; /* Alinhamento justificado */
    }

    .ql-align-justify {
    text-align: justify; /* Alinhamento justificado */
    }

    p {
        margin: 0; /* Remove a margem padrão */
    }
            
      </style>
      `;

// Adicione o script JavaScript ao headerCss
const headerWithScript = headerCss;

    // <img class="brasao" src="${brasaoDataURL}" />
    // Configurando o cabeçalho da página PDF
    let headerTemplate = `
   <html>         
   <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    ${headerWithScript}
 </head> 
  <body class="ql-font-SSerif" >
    <div class="logo-container">
      <a class="logo" href="#">${nmMunicipio}</a>
      <img class="brasao" src="${brasaoDataURL1}" alt="Brasão"/>
      </div>
      <div class="linha">
      <h5 class="nome-h5"><span class="sobrepostoNM">DIÁRIO OFICIAL DO MUNICÍPIO • DOM</span></h5>
      <h5 class="data-h5"><span class="sobrepostoDT">${dtDiario}  • N° ${nDiario}</span></h5>
  </div>
  <div class="coluna-container" >
`;

    // Aqui você pode definir o HTML que será convertido para PDF
    let html = headerTemplate;
    let colunaAtual = 1; // Inicia na primeira coluna
    let alturaMaxima = 500; // Altura máxima da primeira coluna em pixels

    lOrgao.forEach((item, index) => {
      /*
      codOrgao;
  private String nomeOrgao, infComplementar
      */
      html += `<h2 class="linhaOrgao"><span class="sobrepostoNM">${item.nomeOrgao}</span></h2>`;
      html += `<h3>${item.infComplementar}</h3>`;

      html += '<ul>';

      if (item.materias && Array.isArray(item.materias)) {
        //Loop da Matéria
        let iMat = 0;
        item.materias.forEach(itemMateria => {
          iMat++;
          /*
          private Integer numAto;
    private String ementa, preambulo, textoNormativo;
          */
          console.log("Index : " + iMat);
          if (iMat > 1) {
            html += '<ul class="separa-materia">';

          }

          html += '<a class="ementa">';
          html += itemMateria.ementa;
          html += '</a>';
          html += '<ul class="separa-materia">';
          //    html += '<table style=\'border:2px solid black;\'><tr><th>coluna 1</th><th>coluna 2</th></tr><tr><td>Result 1</td><td>Result 2</td></tr></table>';
          html += '<ul>';
          html += itemMateria.preambulo;
          html += '<ul>';
          html += itemMateria.textoNormativo;
          html += '<ul>';
          html += '<a class="centraliza">';
          html += '<p>';
          html += itemMateria.dataMateria;
          html += '</p>';
          html += '</a>';
          html += '<ul class="separa-materia">';
          html += '<a class="centraliza">';
          html += '<p>';
          html += itemMateria.signatario;
          html += '</p>';
          html += '</a>';
          html += '<ul>';
          html += '<a class="ementa">';
          html += '<p>';
          html += itemMateria.cargo;
          html += '</p>';
          html += '</a>';
          html += '<ul>';

          /*
                        console.log("Tamanho do texto EMENTA:" + itemMateria.ementa.length);
                        console.log("Tamanho do texto PREAMBULO:" + itemMateria.preambulo.length);
                        console.log("Tamanho do texto TEXTONORMATIVO:" + itemMateria.textoNormativo.length);
                        */

        });
      } else {
        //  console.error('Array de matérias indefinido ou inválido');
      }
    });

    html += `</div>`; // Fechar a primeira coluna e abrir a segunda

    //console.log(html); // Aqui estamos imprimindo o HTML gerado no console

    await page.setContent(html);



    
    // Obtenha a quantidade de páginas abertas
    const pages = await browser.pages();
    console.log('Quantidade de páginas abertas:', pages.length);
      console.log("n pag: "+pages.length)

      const primeiraPagina = pages[0];

    const opcoesPupp = {
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `
        <head class="first-page-header">
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @font-face {
              font-family: 'Boldoni';
              src: url('data:font/truetype;base64,${boldoniNormal}') format('truetype');
              font-weight: normal;
              font-style: normal;
            }
            
            @font-face {
              font-family: 'Boldoni';
              src: url('data:font/truetype;base64,${boldoniBold}') format('truetype');
              font-weight: bold;
              font-style: normal;
            }
            
            @font-face {
              font-family: 'Arial';
              src: url('data:font/truetype;base64,${arialNormal}') format('truetype');
              font-weight: normal;
              font-style: normal;
            }
            
            @font-face {
              font-family: 'Arial';
              src: url('data:font/truetype;base64,${arialBold}') format('truetype');
              font-weight: bold;
              font-style: normal;
            }

            .logo-containerS {
              display: flex;
              justify-content: flex-start;
              align-items: center;
              padding: 0;
              margin-left: 50px;
            }

            .logo-containerS .logoSecond,
            .logo-container {
              margin: 0 10px;
            }
            
            .logoSecond {
              color: #050505;
              font-size: 70px;
              line-height: 1.0;
              text-decoration: none;
              font-family: 'Boldoni';
              font-weight: bold !important;
              display: inline-block;
              transform-origin: left;
              transform: scaleX(0.9) scaleY(1.0);
              margin-right: ${spacBrasao};
              position: relative;
              top: -10px;
              white-space: nowrap;
              flex-grow: 1;
              padding-left: -10px;
              flex-basis: 70%;
            }

            .linha2 {
              display: flex;
              justify-content: space-between;
              width: 127%;
              margin-left: 50px;
              margin-right: 65px;
              clear: both;
              margin-top: -5px;
              margin-bottom: -25px;
            }

            .nome-h5S, .data-h5S {
              font-size: 20px;
              text-decoration: none;
              font-family: 'Arial', sans-serif;
              font-weight: bold !important;
              color: #050505;
              display: flex;
              justify-content: space-between;
              width: 100%;
              padding: 0;
              clear: both;
              border-bottom: 14px solid #c9c9c9;
              border-top: 4px solid #c9c9c9;
              position: relative;
              margin: 0;
            }

            .data-h5S {
              text-align: right;
              margin: 0;
            }

            .sobrepostoNMS, .sobrepostoDTS {
              position: absolute;
              z-index: 1;
              background-color: transparent;
              margin: 0;
              white-space: nowrap;        
              font-size: 10px;
            }

            .sobrepostoNMS {
              margin-left: 20px;
            }

            .sobrepostoDTS {
              margin-left: 150px;
              margin-right: 10px;
            }

            .div-oculta {
              position: absolute;
              top: 20px;
            }
            
          </style>
        </head>

        <body>
          <div class="div-oculta">
            <div class="logo-containerS">
              <a class="logoSecond" href="#">${nmMunicipio}</a>
              <img class="brasao" src="${brasaoDataURL2}" alt="Brasão"/>
            </div>
            <div class="linha2">
              <h5 class="nome-h5S">
                <span class="sobrepostoNMS">DIÁRIO OFICIAL DO MUNICÍPIO • DOM</span>
              </h5>
              <h5 class="data-h5S">
                <span class="sobrepostoDTS">${dtDiario} • N° ${nDiario}</span>
              </h5>
            </div>
          </div>
        </body>
      `,
      
      footerTemplate: `
      <div style="display: flex;
        justify-content: space-between;
        width: 100%; 
        padding: 0px; 
        clear: both; 
        border-bottom: 2px;
        border-top: 2px;
        margin-top: -150px;
        margin-bottom: -25px;
        margin-left: 50px;
        margin-right: 50px;">
        
        <h5 style="font-size: 20px;
          width: 10%;
          color: #050505;
          display: flex; 
          justify-content: space-between;
          padding: 0px; 
          text-align: left;
          clear: both; 
          border-bottom: 11px solid #c9c9c9;
          border-top: 5px solid #c9c9c9;
          position: relative;">
          
          <span style="position: absolute;
            z-index: 1; 
            background-color: #c9c9c9; 
            margin: 0; 
            margin-left: 20px;">
            <span class="pageNumber"></span>
          </span>
        </h5>
        
        <h5 style="font-size: 20px;
          width: 48%;
          color: #050505;
          display: flex; 
          justify-content: space-between;
          width: 100%; 
          padding: 0px; 
          text-align: left;
          clear: both; 
          border-bottom: 11px solid #c9c9c9;
          border-top: 5px solid #c9c9c9;
          position: relative;">
        </h5>
        
      </div>      
      `,
      pageRanges: '2-',
      margin: { top: '165px', bottom: '42px', right: '50px', left: '50px' },
      scale: 0.6
    };

    const opcoesPuppPg1 = {
      format: 'A4',
      printBackground: true,
      pageRanges: '1',
      margin: { top: '42px', bottom: '42px', right: '50px', left: '50px' },
      scale: 0.6
    };

    //console.log(html);
    const pdfBufferPg1 = await page.pdf(opcoesPuppPg1);
    const pdfBuffer = await page.pdf(opcoesPupp);

    console.log("AKI :conbina1");
    // Combina os PDFs
    const firstPagePdf = await PDFDocument.load(pdfBufferPg1);
    console.log("AKI :conbina2");
    const otherPagesPdf = await PDFDocument.load(pdfBuffer);
    console.log("AKI :conbina3");
    const mergedPdf = await PDFDocument.create();
    console.log("AKI :conbina4");

  const copiedFirstPage = await mergedPdf.copyPages(firstPagePdf, [0]);
  copiedFirstPage.forEach((page) => mergedPdf.addPage(page));
  console.log("AKI :gerou");

  const copiedOtherPages = await mergedPdf.copyPages(otherPagesPdf, otherPagesPdf.getPageIndices());
  copiedOtherPages.forEach((page) => mergedPdf.addPage(page));
    
  const mergedPdfBuffer = await mergedPdf.save();

  // Salva o PDF combinado
  //fs.writeFileSync('output.pdf', mergedPdfBuffer);

    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    
    res.setHeader('Content-Disposition', 'inline; filename=output.pdf');
    res.send(Buffer.from(mergedPdfBuffer));
    
    //res.send(mergedPdfBuffer);

  } catch (error) {
    console.error('Erro ao gerar o PDF:', error);
    res.status(500).send('Erro ao gerar o PDF');
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://serverAWS versão 14:22:${port}`);
});
