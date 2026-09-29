-- Flyway Migration: Insert initial users
-- Passwords are hashed with BCrypt

INSERT INTO user (username, password) VALUES ('Isabela', '$2a$10$vfuUZRQnn.wJBr2L2.CZ1u3V8f0RdnS6mDGUyT9O/rkQqdS/c2JJK');
INSERT INTO user (username, password) VALUES ('Alcides', '$2a$10$.IzdXr.5wXZEpRnPAnr7Q.kJG0sNl/geBGoRX7aQNjiP9dn5SdZ8m');
INSERT INTO user (username, password) VALUES ('Malu', '$2a$10$rlVTnFqznXg0ZEm23CSDXOo90GBXu60SmjCG8dZKLGjJbNCmnMqlW');
INSERT INTO user (username, password) VALUES ('Teste', '$2a$10$EAg5FaHueBmvjyFa/lHPSO1YWuv8IpaaSGNwhA3ct4ghTub9O0VPC');
INSERT INTO user (username, password) VALUES ('Mateus', '$2a$10$8cwIu2j5HXPqx9TfTr4loO2Xe91qrK.DPu4kjaa.LTRmYqq28c9NG');
