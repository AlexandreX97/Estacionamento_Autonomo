// MySQL
const mysql = require('mysql2');

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'estacionamento',
    waitForConnections: true,
    connectionLimit: 10
});

db.getConnection((err) => {
    if (err) console.error("Erro MySQL:", err);
    else console.log("MySQL conectado!");
});



// IMPORTS
const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

// NOVOS IMPORTS (PDF)
const PDFDocument = require('pdfkit');

const app = express();
app.use(cors());
app.use(express.json());




// FILTRO DE DIAS DISPONÍVEIS
app.get('/relatorio/dias', (req, res) => {

    db.query(`
        SELECT DISTINCT DATE(data_entrada) AS dia
        FROM ocupacao
        ORDER BY dia DESC
    `, (err, results) => {

        if (err) {
            console.error(err);
            return res.status(500).json({ erro: "Erro ao buscar dias" });
        }

        res.json(results);
    });
});



// ROTA PARA DOWNLOAD DO PDF
app.get('/relatorio/pdf/:dia', (req, res) => {

    // PEGA O DIA DA URL
    const dia = req.params.dia;

    db.query(`
    SELECT 
        vaga_id,
        COUNT(*) AS total_usos,
        SUM(tempo_total_segundos) AS tempo_total
    FROM ocupacao
    WHERE tempo_total_segundos IS NOT NULL
    AND DATE(data_entrada) = ?
    GROUP BY vaga_id
    ORDER BY total_usos DESC
`, [dia], (err, results) => {

        if (err) {
            console.error(err);
            return res.status(500).send("Erro ao gerar PDF");
        }

        const doc = new PDFDocument();

        // FORÇA DOWNLOAD
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=relatorio_estacionamento.pdf');

        doc.pipe(res);

        // TÍTULO
        doc.fontSize(18).text("Relatório de Estacionamento", { align: 'center' });


        // DATA DO RELATÓRIO
        const dataFormatada = new Date(dia + "T00:00:00").toLocaleDateString('pt-BR');

        doc.fontSize(11).text(
            `Data dos Dados do Relatório: ${dataFormatada}`,
            { align: 'right' }
        );


        // DATA DE GERAÇÃO
        doc.fontSize(10).text(
            `Relatório Gerado em: ${new Date().toLocaleString('pt-BR')}`,
            { align: 'right' }
        );

        doc.moveDown(2);


        // CONFIGURAÇÃO TABELA
        // Largura da tabela
        const pageWidth = doc.page.width;

        // Largura das colunas
        const col1 = 80;
        const col2 = 120;
        const col3 = 150;

        // Largura total da tabela
        const tableWidth = col1 + col2 + col3;

        // CENTRALIZA A TABELA
        const startX = (pageWidth - tableWidth) / 2;

        let startY = doc.y;
        const rowHeight = 25;

    
        // CABEÇALHO (FUNDO CINZA)
        doc.rect(startX, startY, tableWidth, rowHeight).fill('#eeeeee');

        doc.fillColor('black').fontSize(12);

        doc.text("Vaga", startX, startY + 7, { width: col1, align: 'center' });
        doc.text("Total de Usos", startX + col1, startY + 7, { width: col2, align: 'center' });
        doc.text("Tempo Total (s)", startX + col1 + col2, startY + 7, { width: col3, align: 'center' });


        // LINHAS + DADOS
        let y = startY + rowHeight;

        results.forEach((r) => {

            // Linha horizontal
            doc.moveTo(startX, y).lineTo(startX + tableWidth, y).stroke();

            // Dados centralizados
            doc.text(String(r.vaga_id), startX, y + 7, { width: col1, align: 'center' });
            doc.text(String(r.total_usos), startX + col1, y + 7, { width: col2, align: 'center' });
            doc.text(String(r.tempo_total), startX + col1 + col2, y + 7, { width: col3, align: 'center' });

            y += rowHeight;
        });

        // Linha final
        doc.moveTo(startX, y).lineTo(startX + tableWidth, y).stroke();


        // LINHAS VERTICAIS
        doc.moveTo(startX, startY).lineTo(startX, y).stroke();
        doc.moveTo(startX + col1, startY).lineTo(startX + col1, y).stroke();
        doc.moveTo(startX + col1 + col2, startY).lineTo(startX + col1 + col2, y).stroke();
        doc.moveTo(startX + col1 + col2 + col3, startY).lineTo(startX + col1 + col2 + col3, y).stroke();

        // FINALIZA
        doc.end();
    });
});




// VARIÁVEIS
let vagas = new Array(20).fill(false);
let entrada = new Array(20).fill(null);



// SERIAL
const port = new SerialPort({
  path: '\\\\.\\COM4',
  baudRate: 9600
});

const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));



// WEBSOCKET
const wss = new WebSocket.Server({ port: 3001 });

function broadcast(payload) {
    const data = JSON.stringify(payload);

    wss.clients.forEach(client => {
        if (client.readyState === 1) {
            client.send(data);
        }
    });
}



// PROCESSAMENTO
parser.on('data', (line) => {
    try {
        console.log("Recebido:", line);

        const data = JSON.parse(line);
        const novas = data.vagas;

        novas.forEach((ocupada, i) => {

            console.log(`Vaga ${i+1} -> atual:${ocupada} | anterior:${vagas[i]}`);

            // ENTRADA
            if (ocupada === true && vagas[i] === false) {
                console.log(`ENTRADA detectada na vaga ${i+1}`);

                entrada[i] = Date.now();

                db.query(
                    "INSERT INTO ocupacao (vaga_id, data_entrada) VALUES (?, NOW())",
                    [i + 1]
                );

                db.query(
                    "INSERT INTO logs (mensagem) VALUES (?)",
                    [`Vaga ${i+1} ocupada`]
                );
            }

            // SAÍDA
            if (ocupada === false && vagas[i] === true && entrada[i] !== null) {
                console.log(`SAÍDA detectada na vaga ${i+1}`);

                const tempo = Math.floor((Date.now() - entrada[i]) / 1000);

                db.query(
                    `UPDATE ocupacao 
                     SET data_saida = NOW(), tempo_total_segundos = ?
                     WHERE id = (
                        SELECT id FROM (
                            SELECT id FROM ocupacao 
                            WHERE vaga_id = ? AND data_saida IS NULL
                            ORDER BY data_entrada DESC
                            LIMIT 1
                        ) AS tmp
                     )`,
                    [tempo, i + 1]
                );

                db.query(
                    "INSERT INTO logs (mensagem) VALUES (?)",
                    [`Vaga ${i+1} liberada`]
                );

                entrada[i] = null;
            }
        });

        vagas = novas;

        const tempo = vagas.map((v, i) => {
            if (v && entrada[i]) {
                return Math.floor((Date.now() - entrada[i]) / 1000);
            }
            return 0;
        });

        broadcast({ vagas, tempo });

    } catch (e) {
        console.log("Erro JSON:", line);
    }
});



// SERVER
app.listen(3000, () => {
    console.log("HTTP rodando na porta 3000");
});

// Mantido por último para não sobrescrever a rota '/'
app.use(express.static('public'));

console.log("WebSocket rodando na porta 3001");