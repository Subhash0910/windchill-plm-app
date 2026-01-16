-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'VIEWER',
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_email_verified BOOLEAN DEFAULT false,
    phone_number VARCHAR(20),
    department VARCHAR(100),
    profile_image_url VARCHAR(500),
    last_login_at VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    is_deleted BOOLEAN DEFAULT false,
    version BIGINT DEFAULT 0,
    INDEX idx_username (username),
    INDEX idx_email (email)
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    product_code VARCHAR(50) NOT NULL UNIQUE,
    product_name VARCHAR(255) NOT NULL,
    description LONGTEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    version_number VARCHAR(20) DEFAULT '1.0',
    category VARCHAR(100),
    manufacturer VARCHAR(100),
    cost DECIMAL(10, 2),
    selling_price DECIMAL(10, 2),
    unit_of_measure VARCHAR(10) DEFAULT 'EA',
    quantity_on_hand INT DEFAULT 0,
    reorder_level INT DEFAULT 10,
    owner_id BIGINT,
    project_id BIGINT,
    maturity_level VARCHAR(50) DEFAULT 'NEW',
    lifecycle_state VARCHAR(50) DEFAULT 'DRAFT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    is_deleted BOOLEAN DEFAULT false,
    version BIGINT DEFAULT 0,
    INDEX idx_product_code (product_code),
    INDEX idx_product_status (status),
    CONSTRAINT fk_product_owner FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    document_number VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description LONGTEXT,
    document_type VARCHAR(50),
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    version_number VARCHAR(20) DEFAULT '1.0',
    file_path VARCHAR(500),
    file_name VARCHAR(255),
    file_size BIGINT,
    mime_type VARCHAR(100),
    owner_id BIGINT,
    project_id BIGINT,
    related_product_id BIGINT,
    approval_status VARCHAR(50) DEFAULT 'PENDING',
    reviewer_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    is_deleted BOOLEAN DEFAULT false,
    version BIGINT DEFAULT 0,
    INDEX idx_doc_number (document_number),
    INDEX idx_doc_status (status),
    CONSTRAINT fk_doc_owner FOREIGN KEY (owner_id) REFERENCES users(id),
    CONSTRAINT fk_doc_product FOREIGN KEY (related_product_id) REFERENCES products(id),
    CONSTRAINT fk_doc_reviewer FOREIGN KEY (reviewer_id) REFERENCES users(id)
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    project_code VARCHAR(50) NOT NULL UNIQUE,
    project_name VARCHAR(255) NOT NULL,
    description LONGTEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    manager_id BIGINT,
    start_date DATE,
    end_date DATE,
    budget DECIMAL(12, 2),
    department VARCHAR(100),
    priority VARCHAR(50) DEFAULT 'MEDIUM',
    progress_percentage INT DEFAULT 0,
    is_confidential BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    is_deleted BOOLEAN DEFAULT false,
    version BIGINT DEFAULT 0,
    INDEX idx_project_code (project_code),
    INDEX idx_project_status (status),
    CONSTRAINT fk_project_manager FOREIGN KEY (manager_id) REFERENCES users(id)
);

-- Insert default admin user (password: admin123)
INSERT INTO users (username, email, first_name, last_name, password_hash, role, is_active, is_email_verified, department)
VALUES ('admin', 'admin@windchill.local', 'Admin', 'User', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/f0G', 'ADMIN', true, true, 'IT');
