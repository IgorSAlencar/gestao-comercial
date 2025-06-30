-- Tabela de Categorias de Eventos
CREATE TABLE TESTE.dbo.EventCategories (
    CategoryId INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(255),
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);

-- Tabela de Subcategorias de Eventos
CREATE TABLE TESTE.dbo.EventSubcategories (
    SubcategoryId INT IDENTITY(1,1) PRIMARY KEY,
    CategoryId INT NOT NULL,
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(255),
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (CategoryId) REFERENCES TESTE.dbo.EventCategories(CategoryId)
);

-- Inserir dados iniciais de categorias
INSERT INTO TESTE.dbo.EventCategories (Name, Description) VALUES
('Prospecção', 'Eventos relacionados a prospecção de clientes'),
('Visitas Operacionais', 'Eventos relacionados a visitas operacionais'),
('Visitas de Negociação', 'Eventos relacionados a visitas de negociação'),
('Outros', 'Outros tipos de eventos');

-- Inserir dados iniciais de subcategorias
INSERT INTO TESTE.dbo.EventSubcategories (CategoryId, Name, Description) VALUES
-- Subcategorias de Prospecção
(1, 'Prospecção Habitual', 'Prospecção regular de clientes'),
(1, 'Prospecção em Praça Presença', 'Prospecção em locais com presença estabelecida'),

-- Subcategorias de Visitas Operacionais
(2, 'Treinamento', 'Visitas para treinamento'),
(2, 'Apoio Operacional', 'Visitas para apoio operacional'),
(2, 'Incentivo e Engajamento', 'Visitas para incentivo e engajamento'),

-- Subcategorias de Visitas de Negociação
(3, 'Alinhamento com AG/PA', 'Visitas para alinhamento com agências/PAs'),
(3, 'Proposta Comercial', 'Visitas para propostas comerciais');

-- Adicionar nova categoria
INSERT INTO TESTE.dbo.EventCategories (Name, Description) 
VALUES ('Nova Categoria', 'Descrição da nova categoria');

-- Adicionar nova subcategoria (usando o ID da categoria)
INSERT INTO TESTE.dbo.EventSubcategories (CategoryId, Name, Description)
VALUES (1, 'Nova Subcategoria', 'Descrição da nova subcategoria'); 