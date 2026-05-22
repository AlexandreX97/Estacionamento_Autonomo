CREATE DATABASE estacionamento;

USE estacionamento;

CREATE TABLE vagas (
    id INT PRIMARY KEY,
    descricao VARCHAR(50)
);

CREATE TABLE ocupacao (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vaga_id INT,
    data_entrada DATETIME,
    data_saida DATETIME,
    tempo_total_segundos INT,
    FOREIGN KEY (vaga_id) REFERENCES vagas(id)
);

CREATE TABLE logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mensagem TEXT,
    data_log DATETIME DEFAULT CURRENT_TIMESTAMP
);

SHOW TABLES;
