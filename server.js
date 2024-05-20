const express = require('express');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');
const Jimp = require('jimp');

const app = express();
const port = 3000;

// Configurar o middleware para processar o corpo da requisição como JSON
app.use(bodyParser.json());

app.post('/gerar-pdf', async (req, res) => {
  try {

    const dados = req.body;
    const nmMunicipio = dados.nomeMunicipio;
    const dtDiario = dados.dataDiario;
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

    console.log("tm M: " + nmMunicipio.length)

    function detectImageType(bytes) {//Detecta tipo imagem
      if (bytes[0] === -1 && bytes[1] === -40) {
        return 'JPEG';
      } else {
        return 'Desconhecido';
      }
    }

    // Decodificar a imagem base64 para buffer
    const brasaoBuffer = Buffer.from(brasao, 'base64');

    // Função para remover o fundo branco da imagem
    async function removeWhiteBackground(jpegBuffer) {
      const image = await Jimp.read(jpegBuffer);


      // Redimensionar a imagem
      image.resize(370, 370);

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
      const buffer = await image.getBufferAsync(Jimp.MIME_PNG);
      return buffer;
    }

    const brasaoBufferPng = await removeWhiteBackground(brasaoBuffer);
    const brasaoDataURL1 = `data:image/png;base64,${brasaoBufferPng.toString('base64')}`;

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Convertendo bytes da imagem para uma URL de dados (data URL)
    const brasaoDataURL = `data:image/jpeg;base64,${brasao.toString('base64')}`;

    // Definir o CSS para o cabeçalho
    const headerCss = `
        <style>
        header {
          background-color: #f0f0f0;
          padding: 0px;
          text-align: left;
        }
       
        .logo-container {
          display: flex;
          justify-content: flex-start; /* Alinha os itens à esquerda */
          align-items: center; /* Centraliza os itens verticalmente */
          padding: 0; /* Remove padding adicional */
      }

        .logo {
          color: #333;
          font-size: ${tmFonte};
          line-height: ${escalYLogo};
          text-decoration: none;
          font-family: Times, Arial, sans-serif;
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
    
        .nome-h5 {
          background-color: #b3b3b3 !important;
          padding: 0px;
          text-align: left;
          color: #333;
          font-size: 20px;
          text-decoration: none;
          width: 48%;
          font-family: Arial, sans-serif;
        }
    
        .data-h5 {
          background-color: #b3b3b3 !important;
          padding: 0px;
          text-align: right;
          color: #333;
          font-size: 20px;
          text-decoration: none;
          width: 48%;
          font-family: 'Arial', sans-serif !important;
        }
    
        .linha {
          display: flex; /* Use flexbox para posicionar os campos */
          justify-content: space-between; /* Distribuir o espaço entre os campos */
          width: 100%; /* Opcional: ajuste a largura conforme necessário */
          background-color: #b3b3b3 !important; /* Cor de fundo da faixa */
          padding: 10px; /* Opcional: Adicione espaço interno para separar os campos da borda da faixa */
          clear: both; /* Limpe o flutuador para que o conteúdo abaixo não seja afetado */
          border-bottom: 2px solid #b3b3b3;
          border-top: 2px solid #b3b3b3;

        }

        .coluna {
          width: 50% !important;
          float: left !important;
          box-sizing: border-box !important; /* Inclui a largura da borda e do preenchimento na largura total da coluna */
          padding: 10px !important; /* Adiciona espaço interno entre a borda e o conteúdo */
          border-right: 2px solid #000; /* Adicione uma borda à direita de uma das colunas */
          color: #b3b3b3 !important;
        }
      </style>
      `;

    // <img class="brasao" src="${brasaoDataURL}" />
    // Configurando o cabeçalho da página PDF
    let headerTemplate = `
    <html>
         
   <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    ${headerCss}
 </head> 
  <body>
    <header>
      <div class="logo-container">
        <a class="logo" href="#">${nmMunicipio}</a>
        <img class="brasao" src="${brasaoDataURL1}" alt="Brasão"/>
      </div>
      <div class="linha">
        <h5 class="nome-h5">DIÁRIO OFICIAL DO MUNICÍPIO • DOM</h5>
        <h5 class="data-h5">${dtDiario}</h5> 
      </div>
    </header>
   
    <div class="coluna" >
`;

    // Aqui você pode definir o HTML que será convertido para PDF
    let html = headerTemplate;
    let colunaAtual = 1; // Inicia na primeira coluna
    let alturaMaxima = 500; // Altura máxima da primeira coluna em pixels

    lOrgao.forEach((item, index) => {
      if (colunaAtual === 1) {
        if (index < lOrgao.length / 2) {

          /*
          codOrgao;
      private String nomeOrgao, infComplementar
          */
          html += '<ul>';
          html += `<h2>${item.nomeOrgao}</h2>`;
          html += `<h3>${item.infComplementar}</h3>`;

          html += '<ul>';

          if (item.materias && Array.isArray(item.materias)) {
            //Loop da Matéria
            item.materias.forEach(itemMateria => {
              /*
              private Integer numAto;
        private String ementa, preambulo, textoNormativo;
              */

              html += itemMateria.ementa;
              html += '<table style=\'border:2px solid black;\'><tr><th>coluna 1</th><th>coluna 2</th></tr><tr><td>Result 1</td><td>Result 2</td></tr></table>';
              html += '<ul>';
              html += itemMateria.preambulo;
              html += '<ul>';
              html += itemMateria.textoNormativo;
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
        }

      } else { // Se estiver na segunda coluna, adicione conteúdo diretamente à segunda coluna
        html += `<h2>${item.nomeOrgao}</h2>`;
        html += `<h3>${item.infComplementar}</h3>`;
        if (item.materias && Array.isArray(item.materias)) {
          item.materias.forEach(itemMateria => {
            html += `<p>${itemMateria.ementa}</p>`;
            html += `<p>${itemMateria.preambulo}</p>`;
            html += `<p>${itemMateria.textoNormativo}</p>`;
            /*
                        console.log("2 tamanho do texto EMENTA:" + itemMateria.ementa.length);
                        console.log("2 tamanho do texto PREAMBULO:" + itemMateria.preambulo.length);
                        console.log("2 tamanho do texto TEXTONORMATIVO:" + itemMateria.textoNormativo.length);
                        */
          });
        } else {
          // console.error('Array de matérias indefinido ou inválido');
        }

      }
    });

    html += `</div><div class="coluna" id="coluna2">`; // Fechar a primeira coluna e abrir a segunda

    // console.log(html); // Aqui estamos imprimindo o HTML gerado no console

    await page.setContent(html);


    //console.log(html);
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: '50px', bottom: '50px', right: '70px', left: '70px' },
      scale: 0.6,
    });

    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Erro ao gerar o PDF:', error);
    res.status(500).send('Erro ao gerar o PDF');
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});