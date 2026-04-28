CREATE DATABASE estacionamento;

USE estacionamento;
SHOW TABLES;

CREATE TABLE vagas (
    id INT PRIMARY KEY,
    descricao VARCHAR(50)
);

CREATE TABLE ocupacao (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vaga_id INT,
    data_entrada DATETIME,
    data_saida DATETIME,
    tempo_total INT,
    FOREIGN KEY (vaga_id) REFERENCES vagas(id)
);

CREATE TABLE logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mensagem TEXT,
    data_log DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO vagas (id, descricao) VALUES
(1,'Vaga 1'),(2,'Vaga 2'),(3,'Vaga 3'),(4,'Vaga 4'),(5,'Vaga 5'),
(6,'Vaga 6'),(7,'Vaga 7'),(8,'Vaga 8'),(9,'Vaga 9'),(10,'Vaga 10'),
(11,'Vaga 11'),(12,'Vaga 12'),(13,'Vaga 13'),(14,'Vaga 14'),(15,'Vaga 15'),
(16,'Vaga 16'),(17,'Vaga 17'),(18,'Vaga 18'),(19,'Vaga 19'),(20,'Vaga 20');

SELECT * FROM ocupacao;

INSERT INTO logs (mensagem) VALUES ('Teste funcionando');

SELECT * FROM logs;

