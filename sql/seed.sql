USE geoschools;

-- Departments
INSERT INTO departments (name) VALUES
('Guatemala'),
('Sacatepéquez');

-- Municipalities (subset)
INSERT INTO municipalities (department_id, name) VALUES
((SELECT department_id FROM departments WHERE name='Guatemala'), 'Guatemala'),
((SELECT department_id FROM departments WHERE name='Guatemala'), 'Mixco'),
((SELECT department_id FROM departments WHERE name='Sacatepéquez'), 'Antigua Guatemala');

-- Schools (sample coords around Guatemala City / Antigua)
INSERT INTO schools (municipality_id, name, sector, level_name, address_text, lat, lng) VALUES
((SELECT municipality_id FROM municipalities WHERE name='Guatemala'),'Colegio Centro Histórico','privado','Primaria','Zona 1, 4a calle 7-12',14.640000,-90.513000),
((SELECT municipality_id FROM municipalities WHERE name='Guatemala'),'Instituto Público La Reforma','publico','Básico','Zona 10, Av Reforma 12-34',14.593800,-90.515600),
((SELECT municipality_id FROM municipalities WHERE name='Mixco'),'Escuela Cooperativa El Encinal','cooperativa','Primaria','Mixco, Calzada San Juan',14.632000,-90.595000),
((SELECT municipality_id FROM municipalities WHERE name='Antigua Guatemala'),'Escuela Privada Colonial','privado','Preprimaria','Antigua, 5a Avenida Norte',14.561100,-90.734000);

-- Reviews
INSERT INTO reviews (school_id, user_full_name, rating, comment, cost) VALUES
(1, 'María López', 5, 'Muy buen nivel académico', 350.00),
(1, 'Carlos Pérez', 4, 'Infraestructura adecuada', NULL),
(2, 'Ana García', 3, 'Necesita mejoras', NULL);

-- Favorites for user 1
-- Crea un usuario por defecto para pruebas (email: demo@example.com, password: demo)
INSERT INTO users (first_name, last_name, email, password_hash)
VALUES ('Demo','User','demo@example.com', '$2a$10$7grD4Q0XnqK8f6k2V0cS3eQ8iX9X5P5sR0gO5vO3cYVDF3JvSPFby');

-- Favorites for user 1
INSERT INTO favorites (user_id, school_id) VALUES (1,1),(1,3);
