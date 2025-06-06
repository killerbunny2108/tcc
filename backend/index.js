const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// Importações
const usuarioRoutes = require('./routes/usuario');
const dicasRoutes = require('./routes/dicas');
const connection = require('./db'); // Conexão com banco de dados

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// Rotas de usuário
app.use('/api/usuario', usuarioRoutes);
app.use('/', dicasRoutes);



// Rota para listar pacientes (para o combo box)
// Versão corrigida com melhor tratamento de erros
app.get('/api/pacientes', (req, res) => {
    console.log("Endpoint /api/pacientes chamado");
    
    connection.query(
        `SELECT p.id_paciente, u.id_usuario, u.nome 
         FROM Paciente p
         JOIN Usuario u ON p.id_paciente = u.id_usuario
         WHERE u.email != "nunescleusa1974@gmail.com"`, 
        (err, results) => {
            if (err) {
                console.error("Erro ao buscar pacientes:", err);
                return res.status(500).json({ 
                  mensagem: 'Erro ao buscar pacientes.', 
                  erro: err.message 
                });
            }
            
            console.log("Pacientes encontrados:", results);
            
            // Garantir que estamos enviando um array mesmo que vazio
            const pacientes = Array.isArray(results) ? results : [];
            res.json(pacientes);
        }
    );
});

// Rota para salvar ficha de anamnese
app.post('/api/ficha', (req, res) => {
    const {
        id_administrador, // Este é o id_usuario do administrador
        id_paciente,
        tipo_atendimento,
        data_atendimento,
        motivo_consulta,
        relacao_pais,
        fato_marcante,
        incomodo_atual,
        estado_civil,
        filhos,
        profissao,
        fumante,
        consome_alcool,
        acompanhamento_medico,
        doencas,
        medicacoes,
        cirurgias,
        observacoes
    } = req.body;

    // Validação simples
    if (!id_administrador || !id_paciente) {
        return res.status(400).json({ mensagem: 'Administrador e Paciente são obrigatórios.' });
    }

    // Primeiro, verificar se o id_usuario corresponde ao email do administrador
    connection.query(
        'SELECT * FROM Usuario WHERE id_usuario = ? AND email = "nunescleusa1974@gmail.com"',
        [id_administrador],
        (err, results) => {
            if (err) {
                console.error('Erro ao verificar administrador:', err);
                return res.status(500).json({ mensagem: 'Erro ao verificar administrador.' });
            }

            if (results.length === 0) {
                return res.status(400).json({ mensagem: 'Usuário não é um administrador válido.' });
            }

            // Agora, buscar o ID correto na tabela Administrador
            connection.query(
                'SELECT id_administrador FROM Administrador WHERE id_usuario = ?',
                [id_administrador],
                (err, adminResults) => {
                    if (err) {
                        console.error('Erro ao buscar ID de administrador:', err);
                        return res.status(500).json({ mensagem: 'Erro ao buscar ID de administrador.' });
                    }

                    if (adminResults.length === 0) {
                        return res.status(400).json({ mensagem: 'ID de administrador não encontrado.' });
                    }

                    const admin_id = adminResults[0].id_administrador;

                    // Inserir na tabela FichaPaciente com o ID correto
                    connection.query(
                        `INSERT INTO FichaPaciente (
                            id_administrador, 
                            id_paciente, 
                            tipo_atendimento, 
                            data_atendimento, 
                            motivo_consulta, 
                            relacao_pais, 
                            fato_marcante, 
                            incomodo_atual, 
                            estado_civil, 
                            filhos, 
                            profissao, 
                            fumante, 
                            consome_alcool, 
                            acompanhamento_medico, 
                            doencas, 
                            medicacoes, 
                            cirurgias, 
                            observacoes, 
                            data_criacao
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                        [
                            admin_id, // Usando o ID da tabela Administrador
                            id_paciente, 
                            tipo_atendimento, 
                            data_atendimento, 
                            motivo_consulta, 
                            relacao_pais, 
                            fato_marcante, 
                            incomodo_atual, 
                            estado_civil, 
                            filhos, 
                            profissao, 
                            fumante, 
                            consome_alcool, 
                            acompanhamento_medico, 
                            doencas, 
                            medicacoes, 
                            cirurgias, 
                            observacoes
                        ],
                        (err, result) => {
                            if (err) {
                                console.error('Erro ao salvar ficha:', err);
                                return res.status(500).json({ mensagem: 'Erro ao salvar ficha.' });
                            }

                            res.status(201).json({ mensagem: 'Ficha salva com sucesso!' });
                        }
                    );
                }
            );
        }
    );
});

// ====================

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});

// Rota para salvar uma dica geral
app.post('/api/dica', (req, res) => {
    const { titulo, descricao } = req.body;

    if (!titulo || !descricao) {
        return res.status(400).json({ mensagem: 'Título e descrição são obrigatórios.' });
    }

    connection.query(
        'INSERT INTO dica (titulo, descricao) VALUES (?, ?)',
        [titulo, descricao],
        (err, result) => {
            if (err) {
                console.error('Erro ao salvar dica:', err);
                return res.status(500).json({ mensagem: 'Erro ao salvar dica.' });
            }
            res.status(201).json({ mensagem: 'Dica salva com sucesso!' });
        }
    );
});



// Adicione estas novas rotas ao arquivo backend/index.js

// Rota para listar todas as fichas dos pacientes
app.get('/api/fichas', (req, res) => {
    connection.query(
        `SELECT f.id, u.nome AS nome_paciente, f.tipo_atendimento, f.data_atendimento, f.data_criacao
         FROM FichaPaciente f
         JOIN Paciente p ON f.id_paciente = p.id_paciente
         JOIN Usuario u ON p.id_paciente = u.id_usuario
         ORDER BY f.data_criacao DESC`,
        (err, results) => {
            if (err) {
                console.error('Erro ao buscar fichas:', err);
                return res.status(500).json({ mensagem: 'Erro ao buscar fichas.' });
            }
            res.json(results);
        }
    );
});

// Rota para pesquisar fichas por nome do paciente
app.get('/api/fichas/pesquisa', (req, res) => {
    const termoPesquisa = req.query.termo || '';
    
    connection.query(
        `SELECT f.id, u.nome AS nome_paciente, f.tipo_atendimento, f.data_atendimento, f.data_criacao
         FROM FichaPaciente f
         JOIN Paciente p ON f.id_paciente = p.id_paciente
         JOIN Usuario u ON p.id_paciente = u.id_usuario
         WHERE u.nome LIKE ?
         ORDER BY f.data_criacao DESC`,
        [`%${termoPesquisa}%`],
        (err, results) => {
            if (err) {
                console.error('Erro ao pesquisar fichas:', err);
                return res.status(500).json({ mensagem: 'Erro ao pesquisar fichas.' });
            }
            res.json(results);
        }
    );
});

// Rota para obter detalhes de uma ficha específica
app.get('/api/fichas/:id', (req, res) => {
    const fichaId = req.params.id;
    
    connection.query(
        `SELECT f.*, u.nome AS nome_paciente
         FROM FichaPaciente f
         JOIN Paciente p ON f.id_paciente = p.id_paciente
         JOIN Usuario u ON p.id_paciente = u.id_usuario
         WHERE f.id = ?`,
        [fichaId],
        (err, results) => {
            if (err) {
                console.error('Erro ao buscar detalhes da ficha:', err);
                return res.status(500).json({ mensagem: 'Erro ao buscar detalhes da ficha.' });
            }
            
            if (results.length === 0) {
                return res.status(404).json({ mensagem: 'Ficha não encontrada.' });
            }
            
            res.json(results[0]);
        }
    );
});

// Rota para atualizar uma ficha existente
app.put('/api/fichas/:id', (req, res) => {
    const fichaId = req.params.id;
    const {
        tipo_atendimento,
        data_atendimento,
        motivo_consulta,
        relacao_pais,
        fato_marcante,
        incomodo_atual,
        estado_civil,
        filhos,
        profissao,
        fumante,
        consome_alcool,
        acompanhamento_medico,
        doencas,
        medicacoes,
        cirurgias,
        observacoes
    } = req.body;

    connection.query(
        `UPDATE FichaPaciente SET
            tipo_atendimento = ?,
            data_atendimento = ?,
            motivo_consulta = ?,
            relacao_pais = ?,
            fato_marcante = ?,
            incomodo_atual = ?,
            estado_civil = ?,
            filhos = ?,
            profissao = ?,
            fumante = ?,
            consome_alcool = ?,
            acompanhamento_medico = ?,
            doencas = ?,
            medicacoes = ?,
            cirurgias = ?,
            observacoes = ?
         WHERE id = ?`,
        [
            tipo_atendimento,
            data_atendimento,
            motivo_consulta,
            relacao_pais,
            fato_marcante,
            incomodo_atual,
            estado_civil,
            filhos,
            profissao,
            fumante ? 1 : 0,
            consome_alcool ? 1 : 0,
            acompanhamento_medico,
            doencas,
            medicacoes,
            cirurgias,
            observacoes,
            fichaId
        ],
        (err, result) => {
            if (err) {
                console.error('Erro ao atualizar ficha:', err);
                return res.status(500).json({ mensagem: 'Erro ao atualizar ficha.' });
            }
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ mensagem: 'Ficha não encontrada.' });
            }
            
            res.json({ mensagem: 'Ficha atualizada com sucesso!' });
        }
    );
});

// Rota para excluir uma ficha
app.delete('/api/fichas/:id', (req, res) => {
    const fichaId = req.params.id;
    
    connection.query(
        'DELETE FROM FichaPaciente WHERE id = ?',
        [fichaId],
        (err, result) => {
            if (err) {
                console.error('Erro ao excluir ficha:', err);
                return res.status(500).json({ mensagem: 'Erro ao excluir ficha.' });
            }
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ mensagem: 'Ficha não encontrada.' });
            }
            
            res.json({ mensagem: 'Ficha excluída com sucesso!' });
        }
    );
});


