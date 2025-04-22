# Migrations para Estruturas de Usuários

Este diretório contém os scripts SQL para criar e gerenciar as tabelas que armazenam informações sobre estruturas (agências, PAs, UNs e praças) associadas a cada usuário do sistema.

## Arquivos

1. **01_create_estruturas_user.sql**
   - Cria a tabela `ESTRUTURAS_USER` que armazena as contagens agregadas de estruturas por usuário
   - Inclui campos para contagens de estruturas com e sem BE (Banco Eletrônico)

2. **02_create_usuario_estrutura_relacao.sql**
   - Cria a tabela `USUARIO_ESTRUTURA_RELACAO` que armazena as relações entre usuários e estruturas
   - Cada linha representa uma estrutura associada a um usuário

3. **03_create_estruturas_procedures.sql**
   - Contém procedures para atualizar e consultar dados de estruturas
   - `atualizar_contagem_estruturas`: Calcula contagens atualizadas para um usuário
   - `get_estruturas_por_usuario`: Obtém estatísticas adequadas com base no papel do usuário (admin, gerente, coordenador, supervisor)

4. **04_create_estruturas_view.sql**
   - Cria a view `vw_estruturas_equipe` para visualizar estatísticas por equipe
   - Útil para relatórios gerenciais

5. **05_insert_sample_data.sql**
   - Contém dados de exemplo para teste

## Como executar

Os scripts devem ser executados na seguinte ordem:

```bash
mysql -u [usuário] -p [banco_de_dados] < 01_create_estruturas_user.sql
mysql -u [usuário] -p [banco_de_dados] < 02_create_usuario_estrutura_relacao.sql
mysql -u [usuário] -p [banco_de_dados] < 03_create_estruturas_procedures.sql
mysql -u [usuário] -p [banco_de_dados] < 04_create_estruturas_view.sql
mysql -u [usuário] -p [banco_de_dados] < 05_insert_sample_data.sql
```

## Como usar no front-end

Para integrar com o front-end, crie um endpoint na API que chama a procedure `get_estruturas_por_usuario`. Por exemplo:

```javascript
// Exemplo de endpoint na API
app.get('/api/estruturas', async (req, res) => {
  try {
    const userId = req.user.id; // Obtém o ID do usuário autenticado
    const [results] = await db.query('CALL TESTE.get_estruturas_por_usuario(?)', [userId]);
    
    // results[0] contém as estatísticas de estruturas
    return res.json(results[0][0]);
  } catch (error) {
    console.error('Erro ao buscar estruturas:', error);
    return res.status(500).json({ error: 'Erro ao buscar estruturas' });
  }
});
```

E no componente React:

```jsx
// Exemplo de componente React
const EstruturasCard = () => {
  const [estruturas, setEstruturas] = useState({
    qtd_total: 0,
    qtd_agencias: 0,
    qtd_pas: 0,
    qtd_uns: 0,
    qtd_pracas: 0
  });
  
  useEffect(() => {
    fetch('/api/estruturas')
      .then(res => res.json())
      .then(data => setEstruturas(data))
      .catch(err => console.error('Erro ao carregar estruturas:', err));
  }, []);
  
  return (
    <Card>
      <CardContent>
        <p>Estruturas</p>
        <h3>{estruturas.qtd_total} total</h3>
        <div>
          <div>Agências: {estruturas.qtd_agencias}</div>
          <div>PAs: {estruturas.qtd_pas}</div>
          <div>UNs: {estruturas.qtd_uns}</div>
          <div>Praças: {estruturas.qtd_pracas}</div>
        </div>
      </CardContent>
    </Card>
  );
};
```

## Manutenção

Para adicionar novas estruturas para um usuário:

```sql
INSERT INTO TESTE.USUARIO_ESTRUTURA_RELACAO 
(user_id, estrutura_id, tipo_estrutura, tem_be, ativo) 
VALUES ('user_id', 'estrutura_id', 'tipo', TRUE/FALSE, TRUE);

-- Em seguida, atualize as contagens
CALL TESTE.atualizar_contagem_estruturas('user_id');
```

Para desativar uma estrutura (em vez de excluir):

```sql
UPDATE TESTE.USUARIO_ESTRUTURA_RELACAO 
SET ativo = FALSE
WHERE user_id = 'user_id' AND estrutura_id = 'estrutura_id';

-- Em seguida, atualize as contagens
CALL TESTE.atualizar_contagem_estruturas('user_id');
``` 