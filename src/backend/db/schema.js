/**
 * Este arquivo documenta apenas o schema do banco de dados para referência
 * Ele não executa nenhuma operação no banco de dados
 * 
 * SQL Server Schema for the database:
 * 
 * CREATE TABLE TESTE..users (
 * id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
 * name NVARCHAR(100) NOT NULL,
 * funcional NVARCHAR(20) NOT NULL UNIQUE,
 * password NVARCHAR(100) NOT NULL, 
 * role NVARCHAR(20) NOT NULL CHECK (role IN ('supervisor', 'coordenador', 'gerente', 'admin')),
 * email NVARCHAR(100)
 * );
 *  
 * 
 * CREATE TABLE TESTE..hierarchy (
 *   id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
 *   subordinate_id UNIQUEIDENTIFIER NOT NULL,
 *   superior_id UNIQUEIDENTIFIER NOT NULL,
 *   FOREIGN KEY (subordinate_id) REFERENCES users(id),
 *   FOREIGN KEY (superior_id) REFERENCES users(id)
 * );
 * 
 * CREATE TABLE TESTE..EVENTOS (
 *   id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
 *   title NVARCHAR(200) NOT NULL,
 *   description NVARCHAR(MAX),
 *   start_date DATETIME NOT NULL,
 *   end_date DATETIME NOT NULL,
 *   event_type NVARCHAR(50) NOT NULL,
 *   location NVARCHAR(100),
 *   subcategory NVARCHAR(100),
 *   other_description NVARCHAR(200),
 *   inform_agency BIT DEFAULT 0,
 *   agency_number NVARCHAR(50),
 *   is_pa BIT DEFAULT 0,
 *   municipality NVARCHAR(100),
 *   state NVARCHAR(2),
 *   feedback NVARCHAR(MAX),
 *   supervisor_id UNIQUEIDENTIFIER NOT NULL,
 *   created_at DATETIME DEFAULT GETDATE(),
 *   updated_at DATETIME DEFAULT GETDATE(),
 *   FOREIGN KEY (supervisor_id) REFERENCES users(id)
 * );
 * 
 * -- Sample data:
  INSERT INTO teste..users (name, funcional, password, role, email) VALUES
    ('João Silva', '12345', 'hashed_password', 'supervisor', 'joao.silva@example.com'),
    ('Maria Santos', '67890', 'hashed_password', 'coordenador', 'maria.santos@example.com'),
    ('Carlos Oliveira', '54321', 'hashed_password', 'gerente', 'carlos.oliveira@example.com'),
    ('Ana Costa', '98765', 'hashed_password', 'supervisor', 'ana.costa@example.com'),
    ('Igor Alencar', '9444168', 'hashed_password', 'admin', 'igor.alencar@example.com');
  
 * -- Create relationships: João and Ana report to Maria, Maria reports to Carlos
  INSERT INTO teste..hierarchy (subordinate_id, superior_id) VALUES
    ((SELECT id FROM TESTE..users WHERE funcional = '12345'), (SELECT id FROM TESTE..users WHERE funcional = '67890')),
    ((SELECT id FROM TESTE..users WHERE funcional = '98765'), (SELECT id FROM TESTE..users WHERE funcional = '67890')),
    ((SELECT id FROM TESTE..users WHERE funcional = '67890'), (SELECT id FROM TESTE..users WHERE funcional = '54321'));
 */

module.exports = {}; 