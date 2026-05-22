-- Selecionar os dados da tabela
SELECT * FROM ocupacao;

SELECT * FROM logs;

SELECT 
    vaga_id,
    COUNT(*) AS total_usos,
    SUM(tempo_total_segundos) AS tempo_total_segundos
FROM ocupacao
WHERE tempo_total_segundos IS NOT NULL
GROUP BY vaga_id
ORDER BY total_usos DESC;

-- Verificar todas as datas registradas
SELECT DISTINCT DATE(data_entrada) AS dia
FROM ocupacao;