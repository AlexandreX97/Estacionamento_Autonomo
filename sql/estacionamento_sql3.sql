-- Selecionar os dados da tabela

SELECT * FROM ocupacao;

SELECT * FROM logs;

SELECT * FROM vagas_mais_usadas
ORDER BY total_usos DESC;


-- Apagar os Dados da Tabela
TRUNCATE TABLE ocupacao;

TRUNCATE TABLE logs;