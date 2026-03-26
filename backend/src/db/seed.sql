-- ============================================
-- JoinEazy Seed Data (Development Only)
-- ============================================

-- Admin (professor) account: admin@joineazy.com / admin123
INSERT INTO users (full_name, email, password_hash, role) VALUES
('Prof. Sharma', 'admin@joineazy.com', '$2a$12$LJ3SmFoVDCPApVG9YfZwXeR7qZ5RiE8.VGmfFcH6NVXz.Kj8YlYvq', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Student accounts: password is student123 for all
INSERT INTO users (full_name, email, password_hash, role) VALUES
('Aarav Patel',    'aarav@student.edu',   '$2a$12$vQqRsLo2z7J6Y8BcMn7K4e8F1uJ5rCdHm9oNkPx0zS3yW4tBv6Ezi', 'student'),
('Priya Verma',    'priya@student.edu',   '$2a$12$vQqRsLo2z7J6Y8BcMn7K4e8F1uJ5rCdHm9oNkPx0zS3yW4tBv6Ezi', 'student'),
('Rohan Gupta',    'rohan@student.edu',   '$2a$12$vQqRsLo2z7J6Y8BcMn7K4e8F1uJ5rCdHm9oNkPx0zS3yW4tBv6Ezi', 'student'),
('Sneha Joshi',    'sneha@student.edu',   '$2a$12$vQqRsLo2z7J6Y8BcMn7K4e8F1uJ5rCdHm9oNkPx0zS3yW4tBv6Ezi', 'student'),
('Karthik Nair',   'karthik@student.edu', '$2a$12$vQqRsLo2z7J6Y8BcMn7K4e8F1uJ5rCdHm9oNkPx0zS3yW4tBv6Ezi', 'student')
ON CONFLICT (email) DO NOTHING;
