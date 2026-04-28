// MySQL 
const mysql = require('mysql2');

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '1234', // ajuste se necessário
    database: 'estacionamento',
    waitForConnections: true,
    connectionLimit: 10
});

db.getConnection((err) => {
    if (err) {
        console.error("Erro ao conectar no MySQL:", err);
    } else {
        console.log("MySQL conectado!");
    }
});

// IMPORTS
const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const app = express();
app.use(cors());
app.use(express.json());


// VARIÁVEIS
let vagas = new Array(20).fill(false);
let entrada = new Array(20).fill(null);

// SERIAL (ARDUINO)
const port = new SerialPort({
    path: '\\\\.\\COM5',
    baudRate: 9600
});

const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

// WEBSOCKET
const wss = new WebSocket.Server({ port: 3001 });

function broadcast(payload) {
    const data = JSON.stringify(payload);

    console.log("Enviando:", data);

    wss.clients.forEach(client => {
        if (client.readyState === 1) {
            client.send(data);
        }
    });
}


// PROCESSAMENTO PRINCIPAL
parser.on('data', (line) => {
    try {
        console.log("Recebido do Arduino:", line);

        const data = JSON.parse(line);
        const novas = data.vagas;

        novas.forEach((ocupada, i) => {

            // ENTRADA (vaga ocupada)
            if (ocupada && !vagas[i]) {
                entrada[i] = Date.now();

                db.query(
                    "INSERT INTO ocupacao (vaga_id, data_entrada) VALUES (?, NOW())",
                    [i + 1],
                    (err) => {
                        if (err) console.error("Erro INSERT ocupacao:", err);
                    }
                );

                db.query(
                    "INSERT INTO logs (mensagem) VALUES (?)",
                    [`Vaga ${i + 1} ocupada`],
                    (err) => {
                        if (err) console.error("Erro INSERT log:", err);
                    }
                );
            }

            // SAÍDA (vaga liberada)
            if (!ocupada && vagas[i] && entrada[i]) {

                const tempo = Math.floor((Date.now() - entrada[i]) / 1000);

                db.query(
                    `UPDATE ocupacao 
                     SET data_saida = NOW(), tempo_total = ?
                     WHERE vaga_id = ? AND data_saida IS NULL`,
                    [tempo, i + 1],
                    (err) => {
                        if (err) console.error("Erro UPDATE ocupacao:", err);
                    }
                );

                db.query(
                    "INSERT INTO logs (mensagem) VALUES (?)",
                    [`Vaga ${i + 1} liberada`],
                    (err) => {
                        if (err) console.error("Erro INSERT log:", err);
                    }
                );

                entrada[i] = null;
            }
        });

        // Atualiza estado atual
        vagas = novas;

        // Calcula tempo em tempo real
        const tempo = vagas.map((v, i) => {
            if (v && entrada[i]) {
                return Math.floor((Date.now() - entrada[i]) / 1000);
            }
            return 0;
        });

        // Envia pro frontend
        broadcast({ vagas, tempo });

    } catch (e) {
        console.log("Erro no parse:", line);
    }
});


// HTTP SERVER
app.listen(3000, () => {
    console.log("HTTP rodando na porta 3000");
});

app.use(express.static('public'));

console.log("WebSocket rodando na porta 3001");